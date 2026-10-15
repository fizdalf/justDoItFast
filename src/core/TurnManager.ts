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

  setDirection(direction: 1 | -1): void {
    this.direction = direction;
  }

  getDirection(): 1 | -1 {
    return this.direction;
  }

  startRound(startingSeatIndex: number = 0, card: CardPayload, customStartTime?: number): TurnState {
    this.direction = 1;
    this.currentSeatIndex = startingSeatIndex % this.players.length;

    const initialPlayer = this.players[this.currentSeatIndex] || this.players[0];

    this.currentTurn = {
      activePlayerId: initialPlayer.id,
      activeTeam: initialPlayer.team,
      currentWord: card.word,
      category: card.category,
      turnStartTime: customStartTime ?? Date.now(),
      requiredGuesses: 1,
      successfulGuesses: 0,
      isFrozen: false,
    };

    return this.currentTurn;
  }

  getActiveTurn(): TurnState | undefined {
    return this.currentTurn;
  }

  recordGuessSuccess(actingPlayerId: string): GuessResult {
    if (!this.currentTurn || this.currentTurn.activePlayerId !== actingPlayerId) {
      throw new GameError('NOT_ACTIVE_PLAYER', `Only active player can submit a guess`);
    }

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

    const currentTeam = this.currentTurn.activeTeam;
    const targetTeam: TeamId = currentTeam === 'A' ? 'B' : 'A';

    return this.handOver(targetTeam, nextCard);
  }

  /**
   * Quita la bomba al artificiero actual (p. ej. porque se ha desconectado) y la da
   * al siguiente compañero conectado de su equipo; si no queda ninguno, al rival.
   */
  reassignTurn(nextCard: CardPayload): TurnState {
    if (!this.currentTurn) {
      throw new GameError('INVALID_STATE', `No active turn to reassign`);
    }

    const { activePlayerId, activeTeam } = this.currentTurn;
    const hasConnectedTeammate = this.players.some(
      (p) => p.team === activeTeam && p.isConnected && p.id !== activePlayerId
    );
    const targetTeam: TeamId = hasConnectedTeammate ? activeTeam : activeTeam === 'A' ? 'B' : 'A';

    return this.handOver(targetTeam, nextCard);
  }

  private handOver(targetTeam: TeamId, nextCard: CardPayload): TurnState {
    const nextPlayer = this.findNextConnectedRival(this.currentSeatIndex, targetTeam, this.direction);
    this.currentSeatIndex = nextPlayer.seatIndex;

    this.currentTurn = {
      activePlayerId: nextPlayer.id,
      activeTeam: nextPlayer.team,
      currentWord: nextCard.word,
      category: nextCard.category,
      turnStartTime: Date.now(),
      requiredGuesses: 1,
      successfulGuesses: 0,
      isFrozen: false,
    };

    return this.currentTurn;
  }

  private findNextConnectedRival(fromSeatIndex: number, targetTeam: TeamId, step: 1 | -1): Player {
    const total = this.players.length;
    if (total === 0) throw new GameError('INTERNAL', 'No players available in TurnManager');

    let idx = (fromSeatIndex + step + total) % total;

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

    return this.players[fromSeatIndex % total];
  }
}
