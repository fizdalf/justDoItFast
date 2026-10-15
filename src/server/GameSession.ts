import {Server} from 'socket.io';
import {
  BoardEngine,
  DeckEngine,
  DisputeEngine,
  PowerUpEngine,
  RoomManager,
  TimerEngine,
  TurnManager,
} from '../core/index.js';
import {
  DisputeResolution,
  DisputeState,
  GameSettings,
  GameState,
  Player,
  PowerUp,
  PowerUpType,
  TeamId,
  TurnState,
} from '../core/types.js';
import {ClientToServerEvents, ServerToClientEvents, SocketData,} from './protocol.js';

import {GameError} from '../core/errors.js';

export interface GameSessionOptions {
  settings?: Partial<GameSettings>;
  selectedPackId?: string;
  customTimerDurations?: {
    minSec: number;
    maxSec: number;
  };
}

export class GameSession {
  public readonly roomCode: string;
  private io: Server<ClientToServerEvents, ServerToClientEvents, any, SocketData>;
  private roomManager: RoomManager;
  private deckEngine: DeckEngine;
  private sessionDeck: ReturnType<DeckEngine['createSessionDeck']>;
  private boardEngine: BoardEngine;
  private powerUpEngine: PowerUpEngine;
  private turnManager: TurnManager;
  private disputeEngine: DisputeEngine;
  private timerEngine: TimerEngine;
  private gameState: GameState;
  private settings: GameSettings;
  private startingSeatTracker: number = 0;
  private isDestroyed: boolean = false;

  constructor(
    roomCode: string,
    hostPlayerId: string,
    hostPlayerName: string,
    deckEngine: DeckEngine,
    io: Server<ClientToServerEvents, ServerToClientEvents, any, SocketData>,
    options: GameSessionOptions = {}
  ) {
    this.roomCode = roomCode;
    this.deckEngine = deckEngine;
    this.io = io;

    this.settings = {
      targetScore: 5,
      minRoundDurationSec: 35,
      maxRoundDurationSec: 65,
      fastGuessThresholdSec: 5.0,
      allowPowerUps: true,
      ...options.settings,
    };

    if (options.customTimerDurations) {
      this.settings.minRoundDurationSec = options.customTimerDurations.minSec;
      this.settings.maxRoundDurationSec = options.customTimerDurations.maxSec;
    }

    const selectedPackId = options.selectedPackId || 'classic-1996';
    this.sessionDeck = this.deckEngine.createSessionDeck(selectedPackId);

    this.roomManager = new RoomManager();
    this.roomManager.createRoom(hostPlayerId, hostPlayerName, roomCode);

    this.boardEngine = new BoardEngine({ targetScore: this.settings.targetScore });
    this.powerUpEngine = new PowerUpEngine({
      fastGuessThresholdSec: this.settings.fastGuessThresholdSec,
    });
    this.turnManager = new TurnManager(
      this.roomManager.getSeatOrder(roomCode),
      this.settings.fastGuessThresholdSec
    );
    this.disputeEngine = new DisputeEngine(this.roomManager.getSeatOrder(roomCode));

    this.timerEngine = new TimerEngine({
      minDurationSec: this.settings.minRoundDurationSec,
      maxDurationSec: this.settings.maxRoundDurationSec,
      onTick: (elapsedMs, remainingMs, intervalMs) => {
        this.handleTimerTick(elapsedMs, remainingMs, intervalMs);
      },
      onExplode: () => {
        this.handleExplosion();
      },
    });

    this.gameState = {
      roomCode: this.roomCode,
      status: 'LOBBY',
      scores: { A: 0, B: 0 },
      targetScore: this.settings.targetScore,
      roundNumber: 0,
      teamInventory: { A: [], B: [] },
      boardTiles: this.boardEngine.getBoardTiles(),
      selectedPackId,
    };
  }

  getGameState(): GameState {
    return {
      ...this.gameState,
      teamInventory: {
        A: this.powerUpEngine.getTeamInventory('A'),
        B: this.powerUpEngine.getTeamInventory('B'),
      },
    };
  }

  getPlayers(): Player[] {
    return this.roomManager.getSeatOrder(this.roomCode);
  }

  getPlayer(playerId: string): Player | undefined {
    return this.roomManager.getPlayer(this.roomCode, playerId);
  }

  getSettings(): GameSettings {
    return { ...this.settings };
  }

  joinPlayer(playerId: string, playerName: string): Player {
    const existing = this.roomManager.getPlayer(this.roomCode, playerId);
    const player = this.roomManager.joinRoom(this.roomCode, playerId, playerName);

    const players = this.roomManager.getSeatOrder(this.roomCode);
    this.turnManager.updatePlayers(players);
    this.disputeEngine.updatePlayers(players);

    if (existing) {
      this.io.to(this.roomCode).emit('room:player_reconnected', {
        player,
        players,
      });
    } else {
      this.io.to(this.roomCode).emit('room:player_joined', {
        player,
        players,
      });
    }

    this.broadcastState();
    return player;
  }

  handlePlayerDisconnect(playerId: string): void {
    this.roomManager.setConnectionStatus(this.roomCode, playerId, false);
    const players = this.roomManager.getSeatOrder(this.roomCode);
    this.turnManager.updatePlayers(players);
    this.disputeEngine.updatePlayers(players);

    // Si el jugador desconectado es el jugador activo durante una ronda en curso
    if (
      this.gameState.status === 'PLAYING' &&
      this.gameState.currentTurn?.activePlayerId === playerId
    ) {
      // Reasignar la bomba al siguiente rival conectado
      try {
        const nextCard = this.sessionDeck.drawNextWord();
        const nextTurn = this.turnManager.passTurn(playerId, nextCard);
        this.gameState.currentTurn = nextTurn;
        this.io.to(this.roomCode).emit('turn:changed', {
          currentTurn: nextTurn,
          lastGuessFast: false,
        });
      } catch (e) {
        // En caso de que no queden más jugadores
      }
    }

    this.broadcastState();
  }

  removePlayer(playerId: string): void {
    const room = this.roomManager.getRoom(this.roomCode);
    const wasHost = room?.hostPlayerId === playerId;

    this.roomManager.removePlayer(this.roomCode, playerId);
    const players = this.roomManager.getSeatOrder(this.roomCode);
    this.turnManager.updatePlayers(players);
    this.disputeEngine.updatePlayers(players);

    const newHostId = wasHost ? this.roomManager.getRoom(this.roomCode)?.hostPlayerId : undefined;

    this.io.to(this.roomCode).emit('room:player_left', {
      playerId,
      newHostId,
      players,
    });

    this.broadcastState();
  }

  switchTeam(playerId: string, targetTeam: TeamId): Player {
    if (this.gameState.status !== 'LOBBY') {
      throw new GameError('INVALID_STATE', `Cannot switch teams while game is in state ${this.gameState.status}`);
    }

    this.roomManager.switchTeam(this.roomCode, playerId, targetTeam);
    const player = this.roomManager.getPlayer(this.roomCode, playerId)!;
    const players = this.roomManager.getSeatOrder(this.roomCode);
    this.turnManager.updatePlayers(players);
    this.disputeEngine.updatePlayers(players);

    this.broadcastState();
    return player;
  }

  selectPack(playerId: string, packId: string): void {
    if (this.gameState.status !== 'LOBBY') {
      throw new GameError('INVALID_STATE', `Cannot change word pack while game is in state ${this.gameState.status}`);
    }

    const player = this.roomManager.getPlayer(this.roomCode, playerId);
    if (!player || !player.isHost) {
      throw new GameError('NOT_HOST', `Only the host can change the word pack`);
    }

    const pack = this.deckEngine.getPack(packId);
    if (!pack) {
      throw new GameError('PACK_NOT_FOUND', `Word pack ${packId} not found`);
    }

    this.gameState.selectedPackId = packId;
    this.sessionDeck = this.deckEngine.createSessionDeck(packId);
    this.broadcastState();
  }

  updateSettings(playerId: string, newSettings: Partial<GameSettings>): void {
    if (this.gameState.status !== 'LOBBY') {
      throw new GameError('INVALID_STATE', `Cannot update settings while game is in state ${this.gameState.status}`);
    }

    const player = this.roomManager.getPlayer(this.roomCode, playerId);
    if (!player || !player.isHost) {
      throw new GameError('NOT_HOST', `Only the host can update game settings`);
    }

    this.settings = {
      ...this.settings,
      ...newSettings,
    };

    if (newSettings.targetScore) {
      this.boardEngine = new BoardEngine({ targetScore: newSettings.targetScore });
      this.gameState.targetScore = newSettings.targetScore;
      this.gameState.boardTiles = this.boardEngine.getBoardTiles();
    }

    this.broadcastState();
  }

  startRound(playerId: string): { gameState: GameState; currentTurn: TurnState } {
    const player = this.roomManager.getPlayer(this.roomCode, playerId);
    if (!player || !player.isHost) {
      throw new GameError('NOT_HOST', `Only the host can start a round`);
    }

    if (this.gameState.status !== 'LOBBY' && this.gameState.status !== 'ROUND_OVER') {
      throw new GameError('INVALID_STATE', `Cannot start round from state ${this.gameState.status}`);
    }

    if (this.gameState.status === 'LOBBY' && !this.roomManager.canStartGame(this.roomCode)) {
      throw new GameError('NOT_ENOUGH_PLAYERS', `Cannot start game: at least 4 players (2 per team) required`);
    }

    const players = this.roomManager.getSeatOrder(this.roomCode);
    this.turnManager.updatePlayers(players);
    this.disputeEngine.updatePlayers(players);

    const initialCard = this.sessionDeck.drawNextWord();
    const currentTurn = this.turnManager.startRound(this.startingSeatTracker, initialCard);
    this.startingSeatTracker++;

    this.timerEngine.reset();
    this.timerEngine.start();

    this.gameState.status = 'PLAYING';
    this.gameState.roundNumber += 1;
    this.gameState.currentTurn = currentTurn;
    this.gameState.currentDispute = undefined;
    this.gameState.lastRoundResult = undefined;

    this.io.to(this.roomCode).emit('game:round_started', {
      roundNumber: this.gameState.roundNumber,
      currentTurn,
      gameState: this.getGameState(),
    });

    this.broadcastState();
    return { gameState: this.getGameState(), currentTurn };
  }

  recordGuessSuccess(playerId: string): { isFastGuess: boolean; currentTurn: TurnState } {
    if (this.gameState.status !== 'PLAYING') {
      throw new GameError('INVALID_STATE', `Cannot record guess: game status is ${this.gameState.status}`);
    }

    if (!this.gameState.currentTurn || this.gameState.currentTurn.activePlayerId !== playerId) {
      throw new GameError('NOT_ACTIVE_PLAYER', `Only active player can submit guess success`);
    }

    const activeTeam = this.gameState.currentTurn.activeTeam;
    const guessResult = this.turnManager.recordGuessSuccess(playerId);

    let awardedPowerUp: PowerUp | undefined;
    if (this.settings.allowPowerUps && guessResult.isFastGuess) {
      awardedPowerUp = this.powerUpEngine.evaluateGuessSpeed(guessResult.durationSec, activeTeam);
    }

    const nextCard = this.sessionDeck.drawNextWord();
    const nextTurn = this.turnManager.passTurn(playerId, nextCard);
    this.gameState.currentTurn = nextTurn;

    this.io.to(this.roomCode).emit('turn:changed', {
      currentTurn: nextTurn,
      lastGuessFast: guessResult.isFastGuess,
      awardedPowerUp,
    });

    this.broadcastState();
    return { isFastGuess: guessResult.isFastGuess, currentTurn: nextTurn };
  }

  triggerFoul(playerId: string, reason?: string): DisputeState {
    if (this.gameState.status !== 'PLAYING') {
      throw new GameError('INVALID_STATE', `Cannot trigger foul when game status is ${this.gameState.status}`);
    }

    const remainingMs = this.timerEngine.getRemainingMs();
    this.timerEngine.pause();

    const newGameState = this.disputeEngine.triggerFoul(this.gameState, playerId, reason);
    if (newGameState.currentDispute) {
      newGameState.currentDispute.remainingTimeMsAtPause = remainingMs;
    }

    this.gameState = newGameState;

    this.io.to(this.roomCode).emit('game:dispute_started', {
      dispute: this.gameState.currentDispute!,
      gameState: this.getGameState(),
    });

    this.broadcastState();
    return this.gameState.currentDispute!;
  }

  resolveDispute(playerId: string, resolution: DisputeResolution): GameState {
    if (this.gameState.status !== 'DISPUTE_PAUSED') {
      throw new GameError('INVALID_STATE', `Cannot resolve dispute when game is not paused for dispute`);
    }

    const player = this.roomManager.getPlayer(this.roomCode, playerId);
    if (!player || !player.isHost) {
      throw new GameError('NOT_HOST', `Only host can resolve disputes`);
    }

    if (resolution === 'AWARD_TEAM_A' || resolution === 'AWARD_TEAM_B') {
      this.timerEngine.stop();
      const winningTeam: TeamId = resolution === 'AWARD_TEAM_A' ? 'A' : 'B';
      const advanceResult = this.boardEngine.advanceTeam(winningTeam, this.gameState.scores);

      this.gameState.scores[winningTeam] = advanceResult.newScore;
      this.gameState.currentDispute = undefined;
      this.gameState.lastRoundResult = {
        reason: 'DISPUTE',
        winningTeam,
        losingTeam: winningTeam === 'A' ? 'B' : 'A',
      };

      if (advanceResult.isGameOver) {
        this.gameState.status = 'GAME_OVER';
        this.gameState.winningTeam = advanceResult.winner;

        this.io.to(this.roomCode).emit('game:over', {
          winner: advanceResult.winner!,
          finalScores: { ...this.gameState.scores },
          gameState: this.getGameState(),
        });
      } else {
        this.gameState.status = 'ROUND_OVER';
      }

      this.io.to(this.roomCode).emit('game:dispute_resolved', {
        resolution,
        gameState: this.getGameState(),
      });

      this.broadcastState();
      return this.getGameState();
    }

    if (resolution === 'RESTART_ROUND') {
      const freshCard = this.sessionDeck.drawNextWord();
      const updatedState = this.disputeEngine.resolveDispute(
        this.gameState,
        playerId,
        resolution,
        freshCard
      );

      this.gameState = updatedState;
      this.timerEngine.reset();
      this.timerEngine.start();

      this.io.to(this.roomCode).emit('game:dispute_resolved', {
        resolution,
        gameState: this.getGameState(),
      });

      this.broadcastState();
      return this.getGameState();
    }

    throw new GameError('INTERNAL', `Unknown dispute resolution: ${resolution}`);
  }

  usePowerUp(playerId: string, powerUpId: string): { powerUpType: PowerUpType } {
    if (this.gameState.status !== 'PLAYING') {
      throw new GameError('INVALID_STATE', `Cannot use power-up when game is not in PLAYING state`);
    }

    const player = this.roomManager.getPlayer(this.roomCode, playerId);
    if (!player) {
      throw new GameError('PLAYER_NOT_FOUND', `Player ${playerId} not found`);
    }

    const team = player.team;
    const inventory = this.powerUpEngine.getTeamInventory(team);
    const powerUp = inventory.find((p) => p.id === powerUpId);
    if (!powerUp) {
      throw new GameError('POWERUP_NOT_FOUND', `Power-up ${powerUpId} not found in team ${team} inventory`);
    }

    const currentTurn = this.gameState.currentTurn!;

    switch (powerUp.type) {
      case 'REVERSE': {
        const { newDirection } = this.powerUpEngine.applyPowerUp(team, powerUpId, {
          currentDirection: this.turnManager.getDirection(),
        });
        this.turnManager.setDirection(newDirection);
        break;
      }
      case 'DOUBLE_BURDEN': {
        this.gameState.currentTurn = this.powerUpEngine.applyDoubleBurden(
          team,
          powerUpId,
          currentTurn
        );
        break;
      }
      case 'FREEZE': {
        this.gameState.currentTurn = this.powerUpEngine.applyFreeze(
          team,
          powerUpId,
          currentTurn,
          3000
        );
        break;
      }
      case 'SKIP': {
        const nextCard = this.sessionDeck.drawNextWord();
        this.gameState.currentTurn = this.powerUpEngine.applySkip(
          team,
          powerUpId,
          currentTurn,
          nextCard
        );
        break;
      }
    }

    this.io.to(this.roomCode).emit('powerup:activated', {
      powerUp,
      activatedByTeam: team,
      currentTurn: this.gameState.currentTurn,
    });

    this.broadcastState();
    return { powerUpType: powerUp.type };
  }

  returnToLobby(playerId: string): GameState {
    const player = this.roomManager.getPlayer(this.roomCode, playerId);
    if (!player || !player.isHost) {
      throw new GameError('NOT_HOST', `Only the host can return the room to the lobby`);
    }

    if (this.gameState.status !== 'GAME_OVER' && this.gameState.status !== 'ROUND_OVER') {
      throw new GameError('INVALID_STATE', `Cannot return to lobby from state ${this.gameState.status}`);
    }

    this.timerEngine.stop();
    this.powerUpEngine.resetInventories();
    this.sessionDeck = this.deckEngine.createSessionDeck(this.gameState.selectedPackId);
    this.startingSeatTracker = 0;

    this.gameState = {
      ...this.gameState,
      status: 'LOBBY',
      scores: { A: 0, B: 0 },
      roundNumber: 0,
      currentTurn: undefined,
      currentDispute: undefined,
      winningTeam: undefined,
      lastRoundResult: undefined,
    };

    this.broadcastState();
    return this.getGameState();
  }

  destroy(): void {
    this.isDestroyed = true;
    this.timerEngine.stop();
  }

  private handleTimerTick(elapsedMs: number, remainingMs: number, intervalMs: number): void {
    if (this.isDestroyed || this.gameState.status !== 'PLAYING') return;

    const activePlayerId = this.gameState.currentTurn?.activePlayerId || '';
    this.io.to(this.roomCode).emit('timer:tick', {
      elapsedMs,
      remainingMs,
      intervalMs,
      activePlayerId,
    });
  }

  private handleExplosion(): void {
    if (this.isDestroyed || this.gameState.status !== 'PLAYING') return;

    const currentTurn = this.gameState.currentTurn;
    if (!currentTurn) return;

    const explodedPlayerId = currentTurn.activePlayerId;
    const losingTeam = currentTurn.activeTeam;
    const winningTeam: TeamId = losingTeam === 'A' ? 'B' : 'A';

    const advanceResult = this.boardEngine.advanceTeam(winningTeam, this.gameState.scores);
    this.gameState.scores[winningTeam] = advanceResult.newScore;
    this.gameState.lastRoundResult = {
      reason: 'EXPLOSION',
      winningTeam,
      losingTeam,
      explodedPlayerId,
      explodedWord: currentTurn.currentWord,
    };

    if (advanceResult.isGameOver) {
      this.gameState.status = 'GAME_OVER';
      this.gameState.winningTeam = advanceResult.winner;

      this.io.to(this.roomCode).emit('game:over', {
        winner: advanceResult.winner!,
        finalScores: { ...this.gameState.scores },
        gameState: this.getGameState(),
      });
    } else {
      this.gameState.status = 'ROUND_OVER';
    }

    this.io.to(this.roomCode).emit('timer:exploded', {
      explodedPlayerId,
      losingTeam,
      winningTeam,
      scores: { ...this.gameState.scores },
      isGameOver: advanceResult.isGameOver,
      winner: advanceResult.winner,
    });

    this.broadcastState();
  }

  private broadcastState(): void {
    if (this.isDestroyed) return;

    const players = this.roomManager.getSeatOrder(this.roomCode);
    this.io.to(this.roomCode).emit('room:state_updated', {
      gameState: this.getGameState(),
      players,
    });
  }
}
