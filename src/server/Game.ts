import {BoardEngine, DeckEngine, DisputeEngine, PowerUpEngine, TimerEngine, TurnManager,} from '../core/index.js';
import {
    DisputeResolution,
    DisputeState,
    GameSettings,
    GameSetup,
    GameState,
    GameSummary,
    Player,
    PowerUp,
    PowerUpType,
    TeamId,
    TurnState,
} from '../core/types.js';
import {ServerToClientEvents} from './protocol.js';

import {GameError} from '../core/errors.js';

/** Lo que la partida necesita de la sala que la contiene. */
export interface GameHost {
  /** Emite un evento a todos los sockets de la sala. */
  emit: <E extends keyof ServerToClientEvents>(event: E, ...args: Parameters<ServerToClientEvents[E]>) => void;
  /** Jugadores actuales de la sala, en orden de asiento y con su estado de conexión. */
  getRoomPlayers: () => Player[];
  /** Algo ha cambiado: la sala difunde la foto completa. */
  onStateChanged: () => void;
  /** La partida ha llegado al podio. */
  onGameOver: (game: Game) => void;
}

export interface GameOptions {
  gameNumber: number;
  setup: GameSetup;
  participantIds: string[];
  deckEngine: DeckEngine;
  host: GameHost;
}

/** Una partida dentro de una sala: de la primera ronda al podio. Los ajustes no cambian durante ella. */
export class Game {
  public readonly gameNumber: number;
  private host: GameHost;
  private settings: GameSettings;
  private sessionDeck: ReturnType<DeckEngine['createSessionDeck']>;
  private boardEngine: BoardEngine;
  private powerUpEngine: PowerUpEngine;
  private turnManager: TurnManager;
  private disputeEngine: DisputeEngine;
  private timerEngine: TimerEngine;
  private gameState: GameState;
  private startingSeatTracker: number = 0;
  private isDestroyed: boolean = false;
  /** Esperas de gracia de artificieros desconectados, por playerId. */
  private disconnectTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();

  constructor(options: GameOptions) {
    this.gameNumber = options.gameNumber;
    this.host = options.host;

    const s = options.setup.settings;
    this.settings = { ...s, enabledPowerUps: [...s.enabledPowerUps] };
    const packIds = [...options.setup.packIds];

    // Primero el mazo: si algún pack ya no existe, la partida no llega a crearse.
    this.sessionDeck = options.deckEngine.createSessionDeck(packIds);

    this.boardEngine = new BoardEngine({ targetScore: s.targetScore });
    this.powerUpEngine = new PowerUpEngine({
      fastGuessThresholdSec: s.fastGuessThresholdSec,
      enabledTypes: [...s.enabledPowerUps],
      maxPerTeam: s.maxPowerUpsPerTeam,
    });
    this.turnManager = new TurnManager([], s.fastGuessThresholdSec);
    this.disputeEngine = new DisputeEngine([]);
    this.timerEngine = new TimerEngine({
      minDurationSec: s.minRoundDurationSec,
      maxDurationSec: s.maxRoundDurationSec,
      onTick: (elapsedMs, remainingMs, intervalMs) => {
        this.handleTimerTick(elapsedMs, remainingMs, intervalMs);
      },
      onExplode: () => {
        this.handleExplosion();
      },
    });

    this.gameState = {
      gameNumber: this.gameNumber,
      // Hasta que la sala arranca la primera ronda (justo después de crearla), está "entre rondas".
      status: 'ROUND_OVER',
      scores: { A: 0, B: 0 },
      targetScore: s.targetScore,
      roundNumber: 0,
      teamInventory: { A: [], B: [] },
      boardTiles: this.boardEngine.getBoardTiles(),
      packIds,
      settings: { ...this.settings, enabledPowerUps: [...this.settings.enabledPowerUps] },
      participantIds: [...options.participantIds],
    };

    this.refreshPlayers();
  }

  get status(): GameState['status'] {
    return this.gameState.status;
  }

  getState(): GameState {
    return {
      ...this.gameState,
      scores: { ...this.gameState.scores },
      packIds: [...this.gameState.packIds],
      participantIds: [...this.gameState.participantIds],
      teamInventory: {
        A: this.powerUpEngine.getTeamInventory('A'),
        B: this.powerUpEngine.getTeamInventory('B'),
      },
    };
  }

  isParticipant(playerId: string): boolean {
    return this.gameState.participantIds.includes(playerId);
  }

  /** Resultado para el historial de la sala. */
  getSummary(finished: boolean): GameSummary {
    return {
      gameNumber: this.gameNumber,
      packIds: [...this.gameState.packIds],
      scores: { ...this.gameState.scores },
      ...(finished && this.gameState.winningTeam && { winningTeam: this.gameState.winningTeam }),
      finished,
      roundsPlayed: this.gameState.roundNumber,
      endedAt: Date.now(),
    };
  }

  /** Lleva a los motores de turnos y disputas los participantes con su conexión actual. */
  refreshPlayers(): void {
    const participants = this.getParticipants();
    this.turnManager.updatePlayers(participants);
    this.disputeEngine.updatePlayers(participants);
  }

  /** Un participante ha abandonado la sala: sale de la rotación. */
  removeParticipant(playerId: string): void {
    if (!this.isParticipant(playerId)) return;

    this.clearDisconnectTimer(playerId);
    this.gameState.participantIds = this.gameState.participantIds.filter((id) => id !== playerId);
    this.refreshPlayers();

    // Si se lleva la bomba, pasa ya a otro (no va a volver).
    if (
      this.gameState.status === 'PLAYING' &&
      this.gameState.currentTurn?.activePlayerId === playerId &&
      this.getParticipants().length > 0
    ) {
      this.handOverBomb();
    }
  }

  handleParticipantDisconnect(playerId: string): void {
    this.refreshPlayers();
    if (!this.isParticipant(playerId)) return;

    // Si el artificiero se desconecta, se le espera un poco (p. ej. un F5) antes de
    // pasar la bomba a un compañero. La bomba sigue corriendo mientras tanto.
    if (
      this.gameState.status === 'PLAYING' &&
      this.gameState.currentTurn?.activePlayerId === playerId
    ) {
      this.clearDisconnectTimer(playerId);
      this.disconnectTimers.set(
        playerId,
        setTimeout(() => this.reassignBombFrom(playerId), this.settings.disconnectGraceSec * 1000)
      );
    }
  }

  handleParticipantReconnect(playerId: string): void {
    this.clearDisconnectTimer(playerId);
    this.refreshPlayers();
  }

  destroy(): void {
    this.isDestroyed = true;
    this.timerEngine.stop();
    this.disconnectTimers.forEach((timer) => clearTimeout(timer));
    this.disconnectTimers.clear();
  }

  /** Empieza la siguiente ronda (también la primera). */
  startRound(): { game: GameState; currentTurn: TurnState } {
    if (this.gameState.status !== 'ROUND_OVER') {
      throw new GameError('INVALID_STATE', `Cannot start round from state ${this.gameState.status}`);
    }
    if (this.getParticipants().length === 0) {
      throw new GameError('NOT_ENOUGH_PLAYERS', `No participants left in game ${this.gameNumber}`);
    }

    this.refreshPlayers();

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

    this.host.emit('game:round_started', {
      roundNumber: this.gameState.roundNumber,
      currentTurn,
      game: this.getState(),
    });

    this.host.onStateChanged();
    return { game: this.getState(), currentTurn };
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

    this.host.emit('turn:changed', {
      currentTurn: nextTurn,
      lastGuessFast: guessResult.isFastGuess,
      awardedPowerUp,
    });

    this.host.onStateChanged();
    return { isFastGuess: guessResult.isFastGuess, currentTurn: nextTurn };
  }

  triggerFoul(playerId: string): DisputeState {
    if (this.gameState.status !== 'PLAYING') {
      throw new GameError('INVALID_STATE', `Cannot trigger foul when game status is ${this.gameState.status}`);
    }

    // Validar antes de pausar el temporizador, para no dejarlo parado si se rechaza.
    const newGameState = this.disputeEngine.triggerFoul(this.gameState, playerId);

    const remainingMs = this.timerEngine.getRemainingMs();
    this.timerEngine.pause();
    if (newGameState.currentDispute) {
      newGameState.currentDispute.remainingTimeMsAtPause = remainingMs;
    }

    this.gameState = newGameState;

    this.host.emit('game:dispute_started', {
      dispute: this.gameState.currentDispute!,
      game: this.getState(),
    });

    this.host.onStateChanged();
    return this.gameState.currentDispute!;
  }

  /** La sala ya ha comprobado que quien resuelve es el anfitrión. */
  resolveDispute(resolution: DisputeResolution): GameState {
    if (this.gameState.status !== 'DISPUTE_PAUSED') {
      throw new GameError('INVALID_STATE', `Cannot resolve dispute when game is not paused for dispute`);
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
        this.finishGame(advanceResult.winner!);
      } else {
        this.gameState.status = 'ROUND_OVER';
      }

      this.host.emit('game:dispute_resolved', {
        resolution,
        game: this.getState(),
      });

      this.host.onStateChanged();
      return this.getState();
    }

    if (resolution === 'RESTART_ROUND') {
      const freshCard = this.sessionDeck.drawNextWord();
      this.gameState = this.disputeEngine.applyResolution(this.gameState, resolution, freshCard);
      this.timerEngine.reset();
      this.timerEngine.start();

      this.host.emit('game:dispute_resolved', {
        resolution,
        game: this.getState(),
      });

      this.host.onStateChanged();
      return this.getState();
    }

    throw new GameError('INTERNAL', `Unknown dispute resolution: ${resolution}`);
  }

  usePowerUp(playerId: string, powerUpId: string): { powerUpType: PowerUpType } {
    if (this.gameState.status !== 'PLAYING') {
      throw new GameError('INVALID_STATE', `Cannot use power-up when game is not in PLAYING state`);
    }

    const player = this.getParticipants().find((p) => p.id === playerId);
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
        this.gameState.currentTurn = this.powerUpEngine.applyDoubleBurden(team, powerUpId, currentTurn);
        break;
      }
      case 'FREEZE': {
        this.gameState.currentTurn = this.powerUpEngine.applyFreeze(
          team,
          powerUpId,
          currentTurn,
          this.settings.freezeDurationSec * 1000
        );
        break;
      }
      case 'SKIP': {
        const nextCard = this.sessionDeck.drawNextWord();
        this.gameState.currentTurn = this.powerUpEngine.applySkip(team, powerUpId, currentTurn, nextCard);
        break;
      }
    }

    this.host.emit('powerup:activated', {
      powerUp,
      activatedByTeam: team,
      currentTurn: this.gameState.currentTurn,
    });

    this.host.onStateChanged();
    return { powerUpType: powerUp.type };
  }

  /** Participantes con su estado actual en la sala (equipo, asiento, conexión). */
  private getParticipants(): Player[] {
    const ids = new Set(this.gameState.participantIds);
    return this.host.getRoomPlayers().filter((p) => ids.has(p.id));
  }

  private reassignBombFrom(playerId: string): void {
    this.disconnectTimers.delete(playerId);
    if (this.isDestroyed || this.gameState.status !== 'PLAYING') return;
    if (this.gameState.currentTurn?.activePlayerId !== playerId) return;
    if (this.getParticipants().find((p) => p.id === playerId)?.isConnected) return;

    this.handOverBomb();
  }

  private handOverBomb(): void {
    const nextTurn = this.turnManager.reassignTurn(this.sessionDeck.drawNextWord());
    this.gameState.currentTurn = nextTurn;
    this.host.emit('turn:changed', {
      currentTurn: nextTurn,
      lastGuessFast: false,
    });
    this.host.onStateChanged();
  }

  private clearDisconnectTimer(playerId: string): void {
    const timer = this.disconnectTimers.get(playerId);
    if (timer) {
      clearTimeout(timer);
      this.disconnectTimers.delete(playerId);
    }
  }

  /** Podio: avisa a todos y deja que la sala lo apunte en el historial. */
  private finishGame(winner: TeamId): void {
    this.gameState.status = 'GAME_OVER';
    this.gameState.winningTeam = winner;
    this.disconnectTimers.forEach((timer) => clearTimeout(timer));
    this.disconnectTimers.clear();

    this.host.onGameOver(this);
    this.host.emit('game:over', {
      winner,
      finalScores: { ...this.gameState.scores },
      game: this.getState(),
    });
  }

  private handleTimerTick(elapsedMs: number, remainingMs: number, intervalMs: number): void {
    if (this.isDestroyed || this.gameState.status !== 'PLAYING') return;

    const activePlayerId = this.gameState.currentTurn?.activePlayerId || '';
    this.host.emit('timer:tick', {
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
      this.finishGame(advanceResult.winner!);
    } else {
      this.gameState.status = 'ROUND_OVER';
    }

    this.host.emit('timer:exploded', {
      explodedPlayerId,
      losingTeam,
      winningTeam,
      scores: { ...this.gameState.scores },
      isGameOver: advanceResult.isGameOver,
      winner: advanceResult.winner,
    });

    this.host.onStateChanged();
  }
}
