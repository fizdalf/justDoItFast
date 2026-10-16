import {Player, TeamId, TurnState} from './types.js';

import {GameError} from './errors.js';

export interface CardPayload {
  word: string;
  category: string;
}

export interface GuessResult {
  durationSec: number;
  isFastGuess: boolean;
}

const otherTeam = (team: TeamId): TeamId => (team === 'A' ? 'B' : 'A');

export class TurnManager {
  private players: Player[] = [];
  private currentTurn?: TurnState;
  private currentSeatIndex: number = 0;
  private direction: 1 | -1 = 1;
  private fastGuessThresholdSec: number;

  constructor(players: Player[], fastGuessThresholdSec: number = 5.0) {
    this.players = [...players].sort((a, b) => a.seatIndex - b.seatIndex);
    this.fastGuessThresholdSec = fastGuessThresholdSec;
  }

  updatePlayers(players: Player[]): void {
    this.players = [...players].sort((a, b) => a.seatIndex - b.seatIndex);
  }

  setFastGuessThreshold(seconds: number): void {
    this.fastGuessThresholdSec = seconds;
  }

  setDirection(direction: 1 | -1): void {
    this.direction = direction;
    if (this.currentTurn) this.currentTurn.direction = direction;
  }

  getDirection(): 1 | -1 {
    return this.direction;
  }

  startRound(startingSeatIndex: number = 0, card: CardPayload, customStartTime?: number): TurnState {
    this.direction = 1;
    this.currentSeatIndex = startingSeatIndex % this.players.length;

    const initialPlayer = this.players[this.currentSeatIndex] || this.players[0];
    this.currentTurn = this.buildTurn(initialPlayer, card, undefined);
    if (customStartTime !== undefined) this.currentTurn.turnStartTime = customStartTime;

    return this.currentTurn;
  }

  getActiveTurn(): TurnState | undefined {
    return this.currentTurn;
  }

  /** Replaces the active turn object after an external state transition. */
  replaceCurrentTurn(turn: TurnState): void {
    this.currentTurn = turn;
    this.direction = turn.direction;
    const seatIndex = this.players.findIndex((player) => player.id === turn.activePlayerId);
    if (seatIndex >= 0) this.currentSeatIndex = seatIndex;
  }

  recordGuessSuccess(actingPlayerId: string): GuessResult {
    if (!this.currentTurn || this.currentTurn.activePlayerId !== actingPlayerId) {
      throw new GameError('NOT_ACTIVE_PLAYER', `Only active player can submit a guess`);
    }

    // Se mide desde que recibió la bomba: con Doble detonador cuenta el turno entero.
    const elapsedMs = Math.max(0, Date.now() - this.currentTurn.turnStartTime);
    const durationSec = elapsedMs / 1000;
    const isFastGuess = durationSec < this.fastGuessThresholdSec;

    this.currentTurn.successfulGuesses += 1;

    return { durationSec, isFastGuess };
  }

  passTurn(actingPlayerId: string, nextCard: CardPayload): TurnState {
    if (!this.currentTurn || this.currentTurn.activePlayerId !== actingPlayerId) {
      throw new GameError('NOT_ACTIVE_PLAYER', `Only active player can pass the turn`);
    }

    return this.handOver(otherTeam(this.currentTurn.activeTeam), nextCard, actingPlayerId);
  }

  /**
   * Quita la bomba al artificiero actual (p. ej. porque se ha desconectado) y la da
   * al siguiente compañero conectado de su equipo; si no queda ninguno, al rival.
   */
  reassignTurn(nextCard: CardPayload): TurnState {
    if (!this.currentTurn) {
      throw new GameError('INVALID_STATE', `No active turn to reassign`);
    }

    const { activePlayerId, activeTeam, passedByPlayerId } = this.currentTurn;
    const hasConnectedTeammate = this.players.some(
      (p) => p.team === activeTeam && p.isConnected && p.id !== activePlayerId
    );
    const targetTeam: TeamId = hasConnectedTeammate ? activeTeam : otherTeam(activeTeam);

    // Quien la recibe "hereda" el remitente: puede devolvérsela a quien la pasó.
    return this.handOver(targetTeam, nextCard, passedByPlayerId);
  }

  /**
   * Devolver al remitente: la bomba vuelve a quien se la acaba de pasar al artificiero y el
   * sentido de los pases se invierte. Si el remitente ya no está (o no lo hay, al empezar la
   * ronda), va al siguiente rival conectado en el nuevo sentido.
   */
  bounce(nextCard: CardPayload): TurnState {
    if (!this.currentTurn) {
      throw new GameError('INVALID_STATE', `No active turn to bounce`);
    }

    const { activePlayerId, activeTeam, passedByPlayerId } = this.currentTurn;
    this.direction = this.direction === 1 ? -1 : 1;

    const sender = this.players.find(
      (p) => p.id === passedByPlayerId && p.isConnected && p.team !== activeTeam
    );
    if (sender) {
      this.currentSeatIndex = this.players.indexOf(sender);
      this.currentTurn = this.buildTurn(sender, nextCard, activePlayerId);
      return this.currentTurn;
    }

    return this.handOver(otherTeam(activeTeam), nextCard, activePlayerId);
  }

  /** Cambia el cable del turno actual sin pasar la bomba. */
  swapWire(nextCard: CardPayload): TurnState {
    if (!this.currentTurn) {
      throw new GameError('INVALID_STATE', `No active turn`);
    }
    this.currentTurn.currentWord = nextCard.word;
    this.currentTurn.category = nextCard.category;
    return this.currentTurn;
  }

  private handOver(targetTeam: TeamId, nextCard: CardPayload, passedByPlayerId: string | undefined): TurnState {
    // Las posiciones son índices de la lista de jugadores de la rotación (que puede ser un
    // subconjunto de la sala), no el asiento de la sala. Si el portador ya no está en la
    // rotación (se fue), se parte del hueco que dejó.
    const activeIdx = this.players.findIndex((p) => p.id === this.currentTurn?.activePlayerId);
    const fromIdx = activeIdx >= 0 ? activeIdx : this.currentSeatIndex - this.direction;
    const nextPlayer = this.findNextConnectedRival(fromIdx, targetTeam, this.direction);
    this.currentSeatIndex = this.players.indexOf(nextPlayer);

    this.currentTurn = this.buildTurn(nextPlayer, nextCard, passedByPlayerId);
    return this.currentTurn;
  }

  private buildTurn(player: Player, card: CardPayload, passedByPlayerId: string | undefined): TurnState {
    return {
      activePlayerId: player.id,
      activeTeam: player.team,
      currentWord: card.word,
      category: card.category,
      turnStartTime: Date.now(),
      requiredGuesses: 1,
      successfulGuesses: 0,
      doubleRevealed: false,
      isFrozen: false,
      rewardForfeited: false,
      ...(passedByPlayerId && { passedByPlayerId }),
      direction: this.direction,
    };
  }

  private findNextConnectedRival(fromSeatIndex: number, targetTeam: TeamId, step: 1 | -1): Player {
    const total = this.players.length;
    if (total === 0) throw new GameError('INTERNAL', 'No players available in TurnManager');

    let idx = (((fromSeatIndex + step) % total) + total) % total;

    for (let attempts = 0; attempts < total * 2; attempts++) {
      const candidate = this.players[idx];
      if (candidate && candidate.team === targetTeam && candidate.isConnected) {
        return candidate;
      }
      idx = (idx + step + total) % total;
    }

    // Fallback: any candidate on target team
    const fallback = this.players.find((p) => p.team === targetTeam);
    if (fallback) return fallback;

    return this.players[((fromSeatIndex % total) + total) % total];
  }
}
