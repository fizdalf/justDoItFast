import {randomUUID} from 'node:crypto';
import {Server} from 'socket.io';
import {DeckEngine, RoomManager} from '../core/index.js';
import {
    DisputeResolution,
    DisputeState,
    GameSetup,
    GameSummary,
    Player,
    PowerUpType,
    RoomState,
    TeamId,
    TurnState,
} from '../core/types.js';
import {ClientToServerEvents, RoomSnapshot, ServerToClientEvents, SocketData, UpdateSetupPayload,} from './protocol.js';
import {Game} from './Game.js';

import {GameError} from '../core/errors.js';
import {DEFAULT_SETTINGS, resolveSettings} from '../core/settings.js';

export const DEFAULT_PACK_ID = 'classic-1996';

/**
 * Una sala: el grupo de gente reunida durante toda la sesión. Guarda jugadores, equipos,
 * tokens de sesión, la preparación de la próxima partida y el historial; dentro se juegan
 * partidas (`Game`) una detrás de otra.
 */
export class RoomSession {
  public readonly roomCode: string;
  private io: Server<ClientToServerEvents, ServerToClientEvents, any, SocketData>;
  private roomManager: RoomManager;
  private deckEngine: DeckEngine;
  private setup: GameSetup;
  private history: GameSummary[] = [];
  private currentGame: Game | null = null;
  private gameCounter: number = 0;
  private isDestroyed: boolean = false;
  /** Token secreto de sesión → playerId. Solo lo conoce el dispositivo del jugador. */
  private sessionTokens: Map<string, string> = new Map();

  constructor(
    roomCode: string,
    hostPlayerId: string,
    hostPlayerName: string,
    deckEngine: DeckEngine,
    io: Server<ClientToServerEvents, ServerToClientEvents, any, SocketData>
  ) {
    this.roomCode = roomCode;
    this.deckEngine = deckEngine;
    this.io = io;
    this.setup = {
      settings: { ...DEFAULT_SETTINGS, enabledPowerUps: [...DEFAULT_SETTINGS.enabledPowerUps] },
      packIds: [DEFAULT_PACK_ID],
    };

    this.roomManager = new RoomManager();
    this.roomManager.createRoom(hostPlayerId, hostPlayerName, roomCode);
  }

  // --- Consultas ---

  getRoomState(): RoomState {
    const s = this.setup.settings;
    return {
      roomCode: this.roomCode,
      hostPlayerId: this.getHostPlayerId(),
      players: this.getPlayers(),
      setup: {
        settings: { ...s, enabledPowerUps: [...s.enabledPowerUps] },
        packIds: [...this.setup.packIds],
      },
      history: this.history.map((h) => ({ ...h, scores: { ...h.scores }, packIds: [...h.packIds] })),
    };
  }

  getSnapshot(): RoomSnapshot {
    return {
      room: this.getRoomState(),
      game: this.currentGame ? this.currentGame.getState() : null,
    };
  }

  getCurrentGame(): Game | null {
    return this.currentGame;
  }

  getHistory(): GameSummary[] {
    return this.getRoomState().history;
  }

  getPlayers(): Player[] {
    return this.roomManager.getSeatOrder(this.roomCode).map((p) => ({ ...p }));
  }

  getPlayer(playerId: string): Player | undefined {
    const player = this.roomManager.getPlayer(this.roomCode, playerId);
    return player ? { ...player } : undefined;
  }

  joinPlayer(playerId: string, playerName: string): Player {
    // Quien entra con una partida en curso queda en la sala como espectador hasta la siguiente.
    const player = this.roomManager.joinRoom(this.roomCode, playerId, playerName);
    this.currentGame?.refreshPlayers();
    this.broadcastState();
    return { ...player };
  }

  // --- Jugadores y conexiones ---

  issueSessionToken(playerId: string): string {
    const token = randomUUID();
    this.sessionTokens.set(token, playerId);
    return token;
  }

  resolveSessionToken(token: string): string | undefined {
    const playerId = this.sessionTokens.get(token);
    return playerId && this.getPlayer(playerId) ? playerId : undefined;
  }

  reconnectPlayer(playerId: string): Player {
    const player = this.getPlayer(playerId);
    if (!player) {
      throw new GameError('SESSION_EXPIRED', `Player ${playerId} is no longer in room ${this.roomCode}`);
    }
    const reconnected = this.roomManager.joinRoom(this.roomCode, playerId, player.name);
    this.currentGame?.handleParticipantReconnect(playerId);
    this.broadcastState();
    return { ...reconnected };
  }

  handlePlayerDisconnect(playerId: string): void {
    this.roomManager.setConnectionStatus(this.roomCode, playerId, false);
    this.currentGame?.handleParticipantDisconnect(playerId);
    this.broadcastState();
  }

  removePlayer(playerId: string): void {
    for (const [token, owner] of this.sessionTokens) {
      if (owner === playerId) this.sessionTokens.delete(token);
    }

    this.roomManager.removePlayer(this.roomCode, playerId);
    this.currentGame?.removeParticipant(playerId);
    this.currentGame?.refreshPlayers();

    this.broadcastState();
  }

  destroy(): void {
    this.isDestroyed = true;
    this.currentGame?.destroy();
  }

  switchTeam(playerId: string, targetTeam: TeamId): Player {
    this.assertNoGame('switch teams');

    this.roomManager.switchTeam(this.roomCode, playerId, targetTeam);
    const player = this.getPlayer(playerId)!;
    this.broadcastState();
    return player;
  }

  // --- Preparación (sin partida en curso) ---

  updateSetup(playerId: string, changes: UpdateSetupPayload): void {
    this.assertHost(playerId, 'update the game setup');
    this.assertNoGame('update the game setup');

    // Validar todo antes de aplicar nada.
    const settings = resolveSettings(changes?.settings ?? {}, this.setup.settings);
    let packIds = this.setup.packIds;
    if (changes?.packIds !== undefined) {
      if (!Array.isArray(changes.packIds) || changes.packIds.length === 0) {
        throw new GameError('NO_PACKS_SELECTED', `At least one word pack is required`);
      }
      packIds = [...new Set(changes.packIds)];
      for (const packId of packIds) {
        if (typeof packId !== 'string' || !this.deckEngine.getPack(packId)) {
          throw new GameError('PACK_NOT_FOUND', `Word pack ${packId} not found`);
        }
      }
    }

    this.setup = { settings, packIds: [...packIds] };
    this.broadcastState();
  }

  /** Crea una partida con la preparación actual y arranca la primera ronda. */
  startGame(playerId: string): RoomSnapshot {
    this.assertHost(playerId, 'start a game');
    this.assertNoGame('start a new game');

    if (!this.roomManager.canStartGame(this.roomCode)) {
      throw new GameError('NOT_ENOUGH_PLAYERS', `Cannot start game: at least 4 players (2 per team) required`);
    }

    const game = new Game({
      gameNumber: this.gameCounter + 1,
      setup: this.setup,
      participantIds: this.roomManager.getSeatOrder(this.roomCode).map((p) => p.id),
      deckEngine: this.deckEngine,
      host: {
        emit: (event, ...args) => {
          if (this.isDestroyed || this.currentGame !== game) return;
          (this.io.to(this.roomCode).emit as any)(event, ...args);
        },
        getRoomPlayers: () => this.roomManager.getSeatOrder(this.roomCode),
        onStateChanged: () => {
          if (this.currentGame === game) this.broadcastState();
        },
        onGameOver: (finished) => {
          if (this.currentGame === finished) this.history.push(finished.getSummary(true));
        },
      },
    });

    this.currentGame = game;
    try {
      game.startRound();
    } catch (err) {
      game.destroy();
      this.currentGame = null;
      throw err;
    }
    this.gameCounter++;
    return this.getSnapshot();
  }

  // --- Partidas ---

  startRound(playerId: string): RoomSnapshot {
    this.assertHost(playerId, 'start a round');
    this.requireGame().startRound();
    return this.getSnapshot();
  }

  /**
   * Vuelve a la sala. Tras el podio solo lo cierra (ya está en el historial);
   * antes, abandona la partida y la apunta como no terminada.
   */
  endGame(playerId: string): RoomSnapshot {
    this.assertHost(playerId, 'end the game');
    const game = this.requireGame();

    if (game.status !== 'GAME_OVER') {
      this.history.push(game.getSummary(false));
    }
    game.destroy();
    this.currentGame = null;

    this.broadcastState();
    return this.getSnapshot();
  }

  recordGuessSuccess(playerId: string): { isFastGuess: boolean; currentTurn: TurnState } {
    return this.requireParticipant(playerId).recordGuessSuccess(playerId);
  }

  triggerFoul(playerId: string, reason?: string): DisputeState {
    return this.requireParticipant(playerId).triggerFoul(playerId, reason);
  }

  resolveDispute(playerId: string, resolution: DisputeResolution): RoomSnapshot {
    this.assertHost(playerId, 'resolve disputes');
    this.requireGame().resolveDispute(resolution);
    return this.getSnapshot();
  }

  usePowerUp(playerId: string, powerUpId: string): { powerUpType: PowerUpType } {
    return this.requireParticipant(playerId).usePowerUp(playerId, powerUpId);
  }

  private getHostPlayerId(): string {
    return this.roomManager.getRoom(this.roomCode)?.hostPlayerId ?? '';
  }

  // --- Comprobaciones ---

  private assertHost(playerId: string, action: string): void {
    if (this.getHostPlayerId() !== playerId) {
      throw new GameError('NOT_HOST', `Only the host can ${action}`);
    }
  }

  private assertNoGame(action: string): void {
    if (this.currentGame) {
      throw new GameError('INVALID_STATE', `Cannot ${action} while game ${this.currentGame.gameNumber} is in progress`);
    }
  }

  private requireGame(): Game {
    if (!this.currentGame) {
      throw new GameError('INVALID_STATE', `There is no game in progress in room ${this.roomCode}`);
    }
    return this.currentGame;
  }

  private requireParticipant(playerId: string): Game {
    const game = this.requireGame();
    if (!game.isParticipant(playerId)) {
      throw new GameError('NOT_A_PARTICIPANT', `Player ${playerId} is not playing game ${game.gameNumber}`);
    }
    return game;
  }

  private broadcastState(): void {
    if (this.isDestroyed) return;
    this.io.to(this.roomCode).emit('room:state_updated', this.getSnapshot());
  }
}
