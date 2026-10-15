import {beforeEach, describe, expect, it} from 'vitest';
import {DisputeEngine} from '../../src/core/DisputeEngine.js';
import {GameState, Player} from '../../src/core/types.js';

describe('Specification: Foul Triggering, Social Mediation & Host Resolution', () => {
  let disputeEngine: DisputeEngine;
  let mockGameState: GameState;
  let players: Player[];

  beforeEach(() => {
    players = [
      { id: 'host-1', name: 'Ana (Host)', team: 'A', isHost: true, isConnected: true, seatIndex: 0 },
      { id: 'rival-1', name: 'Bob', team: 'B', isHost: false, isConnected: true, seatIndex: 1 },
      { id: 'mate-1', name: 'Carlos', team: 'A', isHost: false, isConnected: true, seatIndex: 2 },
      { id: 'rival-2', name: 'Diana', team: 'B', isHost: false, isConnected: true, seatIndex: 3 },
    ];

    mockGameState = {
      roomCode: 'TEST',
      status: 'PLAYING',
      scores: { A: 2, B: 1 },
      targetScore: 5,
      roundNumber: 3,
      teamInventory: { A: [], B: [] },
      boardTiles: [],
      selectedPackId: 'classic-1996',
      currentTurn: {
        activePlayerId: 'host-1',
        activeTeam: 'A',
        currentWord: 'GUITARRA',
        category: 'Música',
        turnStartTime: Date.now() - 4000,
        requiredGuesses: 1,
        successfulGuesses: 0,
        isFrozen: false,
      },
    };

    disputeEngine = new DisputeEngine(players);
  });

  it('GIVEN an active round WHEN a rival player signals a foul THEN the game status transitions to DISPUTE_PAUSED and dispute state is recorded', () => {
    const result = disputeEngine.triggerFoul(mockGameState, 'rival-1', 'Dijo parte de la palabra');

    expect(result.status).toBe('DISPUTE_PAUSED');
    expect(result.currentDispute).toBeDefined();
    expect(result.currentDispute?.triggeredByPlayerId).toBe('rival-1');
    expect(result.currentDispute?.triggeredByTeam).toBe('B');
    expect(result.currentDispute?.foulReason).toBe('Dijo parte de la palabra');
  });

  it('GIVEN an active player trying to call foul on themselves WHEN attempted THEN error is thrown preventing self-fouls', () => {
    expect(() => {
      disputeEngine.triggerFoul(mockGameState, 'host-1', 'Falta propia');
    }).toThrow(/Only opponent team can trigger a foul/);
  });

  it('GIVEN a game in DISPUTE_PAUSED WHEN a non-host tries to resolve it THEN it is rejected with permission error', () => {
    const pausedState = disputeEngine.triggerFoul(mockGameState, 'rival-1');

    expect(() => {
      disputeEngine.resolveDispute(pausedState, 'rival-1', 'AWARD_TEAM_B');
    }).toThrow(/Only host can resolve disputes/);
  });

  it('GIVEN a game in DISPUTE_PAUSED WHEN host chooses AWARD_TEAM_A THEN Team A receives a point and round ends in ROUND_OVER', () => {
    const pausedState = disputeEngine.triggerFoul(mockGameState, 'rival-1');
    const resolvedState = disputeEngine.resolveDispute(pausedState, 'host-1', 'AWARD_TEAM_A');

    expect(resolvedState.status).toBe('ROUND_OVER');
    expect(resolvedState.scores.A).toBe(3); // 2 + 1
    expect(resolvedState.scores.B).toBe(1);
    expect(resolvedState.currentDispute).toBeUndefined();
  });

  it('GIVEN a game in DISPUTE_PAUSED WHEN host chooses AWARD_TEAM_B THEN Team B receives a point and round ends in ROUND_OVER', () => {
    const pausedState = disputeEngine.triggerFoul(mockGameState, 'rival-1');
    const resolvedState = disputeEngine.resolveDispute(pausedState, 'host-1', 'AWARD_TEAM_B');

    expect(resolvedState.status).toBe('ROUND_OVER');
    expect(resolvedState.scores.A).toBe(2);
    expect(resolvedState.scores.B).toBe(2); // 1 + 1
    expect(resolvedState.currentDispute).toBeUndefined();
  });

  it('GIVEN a game in DISPUTE_PAUSED WHEN host chooses RESTART_ROUND THEN round status resets to PLAYING with same scores and fresh word', () => {
    const pausedState = disputeEngine.triggerFoul(mockGameState, 'rival-1');
    const freshWord = { word: 'PIANO', category: 'Música' };

    const resolvedState = disputeEngine.resolveDispute(
      pausedState,
      'host-1',
      'RESTART_ROUND',
      freshWord
    );

    expect(resolvedState.status).toBe('PLAYING');
    expect(resolvedState.scores.A).toBe(2);
    expect(resolvedState.scores.B).toBe(1);
    expect(resolvedState.currentTurn?.currentWord).toBe('PIANO');
    expect(resolvedState.currentDispute).toBeUndefined();
  });
});
