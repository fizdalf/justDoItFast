import {
  BoardEngine,
  canUsePowerUp,
  DeckEngine,
  DisputeEngine,
  PowerUpEngine,
  SECRET_POWER_UPS,
  TimerEngine,
  TurnManager,
  XRAY_THRESHOLDS_SEC,
} from '../core/index.js';
import {
  DisputeResolution,
  DisputeState,
  GameSettings,
  GameSetup,
  GameState,
  GameSummary,
  Player,
  PowerUpType,
  TeamId,
  TileType,
  TurnChangeReason,
  TurnState,
  XrayReading,
} from '../core/types.js';
import {ServerToClientEvents} from './protocol.js';

import {GameError} from '../core/errors.js';

type EmitArgs<E extends keyof ServerToClientEvents> = Parameters<ServerToClientEvents[E]>;

/** Lo que la partida necesita de la sala que la contiene. */
export interface GameHost {
  /** Emite un evento a todos los sockets de la sala. */
  emit: <E extends keyof ServerToClientEvents>(event: E, ...args: EmitArgs<E>) => void;
  /** Emite un evento solo a los participantes de un equipo (información secreta). */
  emitToTeam: <E extends keyof ServerToClientEvents>(team: TeamId, event: E, ...args: EmitArgs<E>) => void;
  /** Jugadores actuales de la sala, en orden de asiento y con su estado de conexión. */
  getRoomPlayers: () => Player[];
  /** Algo ha cambiado: la sala difunde a cada jugador su foto filtrada. */
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

const otherTeam = (team: TeamId): TeamId => (team === 'A' ? 'B' : 'A');
const randomBetween = (min: number, max: number): number => min + Math.random() * (max - min);

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
  /** Casilla Doble Tiempo: multiplica la duración de la próxima ronda. */
  private nextRoundDurationFactor: number = 1;
  /** Esperas de gracia de artificieros desconectados, por playerId. */
  private disconnectTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();
  /** Aviso a los clientes cuando termina el Inhibidor. */
  private freezeTimer: ReturnType<typeof setTimeout> | null = null;

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
      onTick: (_elapsedMs, _remainingMs, intervalMs) => this.handleTimerTick(intervalMs),
      onExplode: () => this.handleExplosion(),
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

  /** Estado completo, sin filtrar (uso interno y tests). Lo que ve cada jugador sale de `getViewFor`. */
  getState(): GameState {
    return {
      ...this.gameState,
      scores: { ...this.gameState.scores },
      packIds: [...this.gameState.packIds],
      participantIds: [...this.gameState.participantIds],
      ...(this.gameState.currentTurn && { currentTurn: { ...this.gameState.currentTurn } }),
      teamInventory: {
        A: this.powerUpEngine.getTeamInventory('A'),
        B: this.powerUpEngine.getTeamInventory('B'),
      },
    };
  }

  /**
   * Lo que puede ver un jugador concreto (o un espectador): solo las herramientas de su
   * equipo; el cable solo el artificiero y los saboteadores; y el Doble detonador oculto
   * al equipo portador hasta que lo descubre.
   */
  getViewFor(viewerId: string | null): GameState {
    const state = this.getState();
    const viewer = viewerId ? this.getParticipants().find((p) => p.id === viewerId) : undefined;
    const team = viewer?.team;

    state.teamInventory = {
      A: team === 'A' ? state.teamInventory.A : [],
      B: team === 'B' ? state.teamInventory.B : [],
    };

    if (state.currentTurn) {
      const turn = state.currentTurn;
      const isHolder = !!viewer && viewer.id === turn.activePlayerId;
      const isSaboteur = !!team && team !== turn.activeTeam;

      if (!isHolder && !isSaboteur) turn.currentWord = '';
      if (!isSaboteur && !turn.doubleRevealed) turn.requiredGuesses = 1;

      const frozenMs = (turn.freezeExpiresAt ?? 0) - Date.now();
      turn.isFrozen = frozenMs > 0;
      if (frozenMs > 0) turn.freezeRemainingMs = frozenMs;
      delete turn.freezeExpiresAt;
    }

    return state;
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
    if (this.freezeTimer) clearTimeout(this.freezeTimer);
  }

  /** Empieza la siguiente ronda (también la primera). */
  startRound(): void {
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

    if (this.nextRoundDurationFactor !== 1) {
      const baseSec = randomBetween(this.settings.minRoundDurationSec, this.settings.maxRoundDurationSec);
      this.timerEngine.restartWithDuration(baseSec * this.nextRoundDurationFactor * 1000);
      this.nextRoundDurationFactor = 1;
    } else {
      this.timerEngine.reset();
      this.timerEngine.start();
    }

    this.gameState.status = 'PLAYING';
    this.gameState.roundNumber += 1;
    this.gameState.currentTurn = currentTurn;
    this.gameState.currentDispute = undefined;
    this.gameState.lastRoundResult = undefined;

    this.host.emit('game:round_started', { roundNumber: this.gameState.roundNumber });
    this.host.onStateChanged();
  }

  /** El artificiero corta el cable: si quedan cables (Doble detonador) sigue con otro; si no, pasa la bomba. */
  recordGuessSuccess(playerId: string): { passed: boolean } {
    const turn = this.requirePlayingTurn('record a guess');
    if (turn.activePlayerId !== playerId) {
      throw new GameError('NOT_ACTIVE_PLAYER', `Only active player can submit guess success`);
    }
    if ((turn.freezeExpiresAt ?? 0) > Date.now()) {
      throw new GameError('FROZEN', `The defuser's button is jammed`);
    }

    const guess = this.turnManager.recordGuessSuccess(playerId);

    if (turn.successfulGuesses < turn.requiredGuesses) {
      const wasSecret = !turn.doubleRevealed;
      this.turnManager.swapWire(this.sessionDeck.drawNextWord());
      turn.doubleRevealed = true;
      if (wasSecret) {
        this.host.emit('powerup:double_revealed', { requiredGuesses: turn.requiredGuesses, bounced: false, holderTeam: turn.activeTeam });
      }
      this.notifyTurnChanged('EXTRA_WIRE');
      return { passed: false };
    }

    const team = turn.activeTeam;
    const awarded =
      this.settings.allowPowerUps && guess.isFastGuess && !turn.rewardForfeited
        ? this.powerUpEngine.evaluateGuessSpeed(guess.durationSec, team)
        : undefined;

    this.gameState.currentTurn = this.turnManager.passTurn(playerId, this.sessionDeck.drawNextWord());
    if (awarded) this.host.emitToTeam(team, 'powerup:awarded', { powerUp: awarded, source: 'FAST_GUESS' });

    this.notifyTurnChanged('PASS');
    return { passed: true };
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

    this.host.emit('game:dispute_started', { dispute: this.gameState.currentDispute! });
    this.host.onStateChanged();
    return this.gameState.currentDispute!;
  }

  /** La sala ya ha comprobado que quien resuelve es el anfitrión. */
  resolveDispute(resolution: DisputeResolution): void {
    if (this.gameState.status !== 'DISPUTE_PAUSED') {
      throw new GameError('INVALID_STATE', `Cannot resolve dispute when game is not paused for dispute`);
    }

    if (resolution === 'AWARD_TEAM_A' || resolution === 'AWARD_TEAM_B') {
      this.timerEngine.stop();
      const winningTeam: TeamId = resolution === 'AWARD_TEAM_A' ? 'A' : 'B';
      this.gameState.currentDispute = undefined;
      this.gameState.lastRoundResult = { reason: 'DISPUTE', winningTeam, losingTeam: otherTeam(winningTeam) };
      this.scorePoint(winningTeam);

      this.host.emit('game:dispute_resolved', { resolution });
      this.host.onStateChanged();
      return;
    }

    if (resolution === 'RESTART_ROUND') {
      const freshCard = this.sessionDeck.drawNextWord();
      this.gameState = this.disputeEngine.applyResolution(this.gameState, resolution, freshCard);
      if (this.gameState.currentTurn) {
        this.turnManager.replaceCurrentTurn(this.gameState.currentTurn);
      }
      this.timerEngine.reset();
      this.timerEngine.start();

      this.host.emit('game:dispute_resolved', { resolution });
      this.host.onStateChanged();
      return;
    }

    throw new GameError('INTERNAL', `Unknown dispute resolution: ${resolution}`);
  }

  usePowerUp(playerId: string, powerUpId: string): { powerUpType: PowerUpType } {
    const turn = this.requirePlayingTurn('use a tool');
    const player = this.getParticipants().find((p) => p.id === playerId);
    if (!player) {
      throw new GameError('PLAYER_NOT_FOUND', `Player ${playerId} not found`);
    }

    const team = player.team;
    const powerUp = this.powerUpEngine.getTeamInventory(team).find((p) => p.id === powerUpId);
    if (!powerUp) {
      throw new GameError('POWERUP_NOT_FOUND', `Power-up ${powerUpId} not found in team ${team} inventory`);
    }

    const allowed = canUsePowerUp(powerUp.type, {
      status: this.gameState.status,
      myPlayerId: playerId,
      myTeam: team,
      holderId: turn.activePlayerId,
      holderTeam: turn.activeTeam,
    });
    if (!allowed) {
      throw new GameError('POWERUP_NOT_ALLOWED', `${powerUp.type} cannot be used by ${playerId} right now`);
    }

    this.powerUpEngine.consume(team, powerUpId);

    const activation = { type: powerUp.type, team, byPlayerId: playerId };
    if (SECRET_POWER_UPS.includes(powerUp.type)) {
      this.host.emitToTeam(team, 'powerup:activated', activation);
    } else {
      this.host.emit('powerup:activated', activation);
    }

    let turnChange: TurnChangeReason | undefined;
    switch (powerUp.type) {
      case 'REVERSE': {
        // El Doble detonador viaja con la bomba a pleno rendimiento (como un +4) y ya es público.
        const extraWires = turn.requiredGuesses - 1;
        const next = this.turnManager.bounce(this.sessionDeck.drawNextWord());
        this.gameState.currentTurn = next;
        if (extraWires > 0) {
          next.requiredGuesses = 1 + extraWires;
          next.doubleRevealed = true;
          this.host.emit('powerup:double_revealed', { requiredGuesses: next.requiredGuesses, bounced: true, holderTeam: next.activeTeam });
        }
        turnChange = 'BOUNCE';
        break;
      }
      case 'SKIP': {
        this.turnManager.swapWire(this.sessionDeck.drawNextWord());
        turn.rewardForfeited = true;
        turnChange = 'SKIP';
        break;
      }
      case 'DOUBLE_BURDEN': {
        turn.requiredGuesses += 1;
        // Si el portador ya lo sabía, el cable extra también se ve.
        if (turn.doubleRevealed) {
          this.host.emit('powerup:double_revealed', { requiredGuesses: turn.requiredGuesses, bounced: false, holderTeam: turn.activeTeam });
        }
        break;
      }
      case 'FREEZE': {
        const now = Date.now();
        turn.freezeExpiresAt = Math.max(now, turn.freezeExpiresAt ?? 0) + this.settings.freezeDurationSec * 1000;
        this.scheduleFreezeEnd(turn.freezeExpiresAt - now);
        break;
      }
      case 'XRAY': {
        this.host.emitToTeam(team, 'powerup:xray', { reading: this.readBomb() });
        break;
      }
      case 'REWIRE': {
        const seconds = randomBetween(this.settings.rewireMinSec, this.settings.rewireMaxSec);
        this.timerEngine.setRemainingMs(seconds * 1000);
        break;
      }
    }

    if (turnChange) {
      this.notifyTurnChanged(turnChange);
    } else {
      this.host.onStateChanged();
    }
    return { powerUpType: powerUp.type };
  }

  /** Participantes con su estado actual en la sala (equipo, asiento, conexión). */
  private getParticipants(): Player[] {
    const ids = new Set(this.gameState.participantIds);
    return this.host.getRoomPlayers().filter((p) => ids.has(p.id));
  }

  private requirePlayingTurn(action: string): TurnState {
    if (this.gameState.status !== 'PLAYING' || !this.gameState.currentTurn) {
      throw new GameError('INVALID_STATE', `Cannot ${action}: game status is ${this.gameState.status}`);
    }
    return this.gameState.currentTurn;
  }

  private notifyTurnChanged(reason: TurnChangeReason): void {
    this.host.emit('turn:changed', { reason });
    this.host.onStateChanged();
  }

  private readBomb(): XrayReading {
    const remainingSec = this.timerEngine.getRemainingMs() / 1000;
    if (remainingSec < XRAY_THRESHOLDS_SEC.SHORT) return 'SHORT';
    if (remainingSec < XRAY_THRESHOLDS_SEC.MEDIUM) return 'MEDIUM';
    return 'LONG';
  }

  private scheduleFreezeEnd(delayMs: number): void {
    if (this.freezeTimer) clearTimeout(this.freezeTimer);
    this.freezeTimer = setTimeout(() => {
      this.freezeTimer = null;
      if (!this.isDestroyed) this.host.onStateChanged();
    }, delayMs + 50);
  }

  private reassignBombFrom(playerId: string): void {
    this.disconnectTimers.delete(playerId);
    if (this.isDestroyed || this.gameState.status !== 'PLAYING') return;
    if (this.gameState.currentTurn?.activePlayerId !== playerId) return;
    if (this.getParticipants().find((p) => p.id === playerId)?.isConnected) return;

    this.handOverBomb();
  }

  private handOverBomb(): void {
    this.gameState.currentTurn = this.turnManager.reassignTurn(this.sessionDeck.drawNextWord());
    this.notifyTurnChanged('REASSIGN');
  }

  private clearDisconnectTimer(playerId: string): void {
    const timer = this.disconnectTimers.get(playerId);
    if (timer) {
      clearTimeout(timer);
      this.disconnectTimers.delete(playerId);
    }
  }

  /** Suma un punto (avanza en el tablero) y aplica la casilla; termina la partida si llega a la meta. */
  private scorePoint(team: TeamId): { isGameOver: boolean; winner?: TeamId } {
    const advance = this.boardEngine.advanceTeam(team, this.gameState.scores);
    this.gameState.scores[team] = advance.newScore;

    if (advance.isGameOver) {
      this.finishGame(advance.winner!);
    } else {
      this.gameState.status = 'ROUND_OVER';
      this.applyTile(team, advance.tileEffect);
    }
    return { isGameOver: advance.isGameOver, winner: advance.winner };
  }

  private applyTile(team: TeamId, tile: TileType | undefined): void {
    if (tile === 'MYSTERY_POWERUP' && this.settings.allowPowerUps) {
      const gift = this.powerUpEngine.grantRandom(team);
      if (gift) this.host.emitToTeam(team, 'powerup:awarded', { powerUp: gift, source: 'TILE' });
    } else if (tile === 'DOUBLE_TIME') {
      this.nextRoundDurationFactor = 2;
    }
  }

  /** Podio: avisa a todos y deja que la sala lo apunte en el historial. */
  private finishGame(winner: TeamId): void {
    this.gameState.status = 'GAME_OVER';
    this.gameState.winningTeam = winner;
    this.disconnectTimers.forEach((timer) => clearTimeout(timer));
    this.disconnectTimers.clear();

    this.host.onGameOver(this);
    this.host.emit('game:over', { winner, finalScores: { ...this.gameState.scores } });
  }

  private handleTimerTick(intervalMs: number): void {
    if (this.isDestroyed || this.gameState.status !== 'PLAYING') return;

    const activePlayerId = this.gameState.currentTurn?.activePlayerId || '';
    this.host.emit('timer:tick', { intervalMs, activePlayerId });
  }

  private handleExplosion(): void {
    if (this.isDestroyed || this.gameState.status !== 'PLAYING') return;

    const currentTurn = this.gameState.currentTurn;
    if (!currentTurn) return;

    const explodedPlayerId = currentTurn.activePlayerId;
    const losingTeam = currentTurn.activeTeam;

    // Traje antiexplosivos: se gasta solo, la bomba se rearma con mecha corta y pasa al rival.
    const suit = this.settings.allowPowerUps
      ? this.powerUpEngine.consumeFirstOfType(losingTeam, 'SHIELD')
      : undefined;
    if (suit) {
      this.gameState.currentTurn = this.turnManager.passTurn(explodedPlayerId, this.sessionDeck.drawNextWord());
      const fuseSec = randomBetween(this.settings.shieldFuseSec / 2, this.settings.shieldFuseSec);
      this.timerEngine.restartWithDuration(fuseSec * 1000);
      this.host.emit('bomb:shielded', { playerId: explodedPlayerId, team: losingTeam });
      this.notifyTurnChanged('SHIELD');
      return;
    }

    const winningTeam = otherTeam(losingTeam);
    this.gameState.lastRoundResult = {
      reason: 'EXPLOSION',
      winningTeam,
      losingTeam,
      explodedPlayerId,
      explodedWord: currentTurn.currentWord,
    };
    const result = this.scorePoint(winningTeam);

    this.host.emit('timer:exploded', {
      explodedPlayerId,
      losingTeam,
      winningTeam,
      scores: { ...this.gameState.scores },
      isGameOver: result.isGameOver,
      winner: result.winner,
    });

    this.host.onStateChanged();
  }
}
