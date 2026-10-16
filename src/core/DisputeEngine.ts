import {DisputeResolution, DisputeState, GameState, Player} from './types.js';
import {CardPayload} from './TurnManager.js';

import {GameError} from './errors.js';

export class DisputeEngine {
  private players: Player[];

  constructor(players: Player[]) {
    this.players = players;
  }

  updatePlayers(players: Player[]): void {
    this.players = players;
  }

  triggerFoul(gameState: GameState, callingPlayerId: string): GameState {
    if (gameState.status !== 'PLAYING') {
      throw new GameError('INVALID_STATE', `Cannot trigger foul when game is in state ${gameState.status}`);
    }

    const callingPlayer = this.players.find((p) => p.id === callingPlayerId);
    if (!callingPlayer) {
      throw new GameError('PLAYER_NOT_FOUND', `Player ${callingPlayerId} not found`);
    }

    const currentTurn = gameState.currentTurn;
    if (!currentTurn) {
      throw new GameError('INVALID_STATE', `No active turn to foul`);
    }

    // Foul must be called by an opponent team member
    if (callingPlayer.team === currentTurn.activeTeam) {
      throw new GameError('ONLY_OPPONENTS_CAN_FOUL', `Only opponent team can trigger a foul`);
    }

    const dispute: DisputeState = {
      triggeredByPlayerId: callingPlayer.id,
      triggeredByTeam: callingPlayer.team,
      timestamp: Date.now(),
      remainingTimeMsAtPause: 0,
    };

    return {
      ...gameState,
      status: 'DISPUTE_PAUSED',
      currentDispute: dispute,
    };
  }

  resolveDispute(
    gameState: GameState,
    resolvingPlayerId: string,
    resolution: DisputeResolution,
    freshCard?: CardPayload
  ): GameState {
    if (gameState.status !== 'DISPUTE_PAUSED') {
      throw new GameError('INVALID_STATE', `Cannot resolve dispute when game is in state ${gameState.status}`);
    }

    const resolvingPlayer = this.players.find((p) => p.id === resolvingPlayerId);
    if (!resolvingPlayer || !resolvingPlayer.isHost) {
      throw new GameError('NOT_HOST', `Only host can resolve disputes`);
    }

    return this.applyResolution(gameState, resolution, freshCard);
  }

  /**
   * Aplica la resolución sin comprobar quién la pide. Lo usa la sala, que valida al
   * anfitrión por su cuenta (el anfitrión puede ser espectador y no estar en la rotación).
   */
  applyResolution(gameState: GameState, resolution: DisputeResolution, freshCard?: CardPayload): GameState {
    if (gameState.status !== 'DISPUTE_PAUSED') {
      throw new GameError('INVALID_STATE', `Cannot resolve dispute when game is in state ${gameState.status}`);
    }

    if (resolution === 'AWARD_TEAM_A') {
      return {
        ...gameState,
        status: 'ROUND_OVER',
        scores: {
          ...gameState.scores,
          A: gameState.scores.A + 1,
        },
        currentDispute: undefined,
      };
    }

    if (resolution === 'AWARD_TEAM_B') {
      return {
        ...gameState,
        status: 'ROUND_OVER',
        scores: {
          ...gameState.scores,
          B: gameState.scores.B + 1,
        },
        currentDispute: undefined,
      };
    }

    if (resolution === 'RESTART_ROUND') {
      if (!freshCard) {
        throw new GameError('INTERNAL', `freshCard is required to restart round`);
      }

      return {
        ...gameState,
        status: 'PLAYING',
        currentDispute: undefined,
        currentTurn: gameState.currentTurn
          ? {
              ...gameState.currentTurn,
              currentWord: freshCard.word,
              category: freshCard.category,
              turnStartTime: Date.now(),
              requiredGuesses: 1,
              successfulGuesses: 0,
              doubleRevealed: false,
              isFrozen: false,
              freezeExpiresAt: undefined,
              freezeRemainingMs: undefined,
              rewardForfeited: false,
            }
          : undefined,
      };
    }

    throw new GameError('INTERNAL', `Unknown dispute resolution: ${resolution}`);
  }
}
