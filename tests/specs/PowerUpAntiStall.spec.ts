import {beforeEach, describe, expect, it} from 'vitest';
import {PowerUpEngine} from '../../src/core/PowerUpEngine.js';
import {TurnState} from '../../src/core/types.js';

describe('Specification: Anti-Stall Speed Rewards & Tactical Power-Ups', () => {
  let powerUpEngine: PowerUpEngine;

  beforeEach(() => {
    powerUpEngine = new PowerUpEngine({ fastGuessThresholdSec: 5.0 });
  });

  it('GIVEN a guess completed in under 5 seconds WHEN evaluated THEN it awards a tactical power-up to the team inventory', () => {
    const reward = powerUpEngine.evaluateGuessSpeed(3.8, 'A');

    expect(reward).toBeDefined();
    expect(['REVERSE', 'DOUBLE_BURDEN', 'FREEZE', 'SKIP']).toContain(reward?.type);

    const inventory = powerUpEngine.getTeamInventory('A');
    expect(inventory).toHaveLength(1);
    expect(inventory[0].id).toBe(reward?.id);
  });

  it('GIVEN a slow guess (>= 5 seconds) WHEN evaluated THEN no power-up is awarded', () => {
    const reward = powerUpEngine.evaluateGuessSpeed(6.1, 'A');

    expect(reward).toBeUndefined();
    expect(powerUpEngine.getTeamInventory('A')).toHaveLength(0);
  });

  it('GIVEN a team activating REVERSE WHEN applied THEN direction is inverted and potato rebounds to previous player', () => {
    const reversePowerUp = powerUpEngine.grantPowerUp('A', 'REVERSE');

    const result = powerUpEngine.applyPowerUp('A', reversePowerUp.id, {
      currentDirection: 1, // normal clockwise
    });

    expect(result.newDirection).toBe(-1); // reversed
    expect(powerUpEngine.getTeamInventory('A')).toHaveLength(0); // consumed
  });

  it('GIVEN a team activating DOUBLE_BURDEN against rival WHEN applied THEN target turn requires 2 correct guesses before passing', () => {
    const doublePowerUp = powerUpEngine.grantPowerUp('A', 'DOUBLE_BURDEN');

    const turnState: TurnState = {
      activePlayerId: 'p2',
      activeTeam: 'B',
      currentWord: 'SOL',
      category: 'General',
      turnStartTime: Date.now(),
      requiredGuesses: 1,
      successfulGuesses: 0,
      isFrozen: false,
    };

    const modifiedTurn = powerUpEngine.applyDoubleBurden('A', doublePowerUp.id, turnState);

    expect(modifiedTurn.requiredGuesses).toBe(2);
    expect(powerUpEngine.getTeamInventory('A')).toHaveLength(0);
  });

  it('GIVEN a team activating FREEZE against active rival WHEN applied THEN rival is temporarily frozen', () => {
    const freezePowerUp = powerUpEngine.grantPowerUp('A', 'FREEZE');

    const turnState: TurnState = {
      activePlayerId: 'p2',
      activeTeam: 'B',
      currentWord: 'LUNA',
      category: 'General',
      turnStartTime: Date.now(),
      requiredGuesses: 1,
      successfulGuesses: 0,
      isFrozen: false,
    };

    const frozenTurn = powerUpEngine.applyFreeze('A', freezePowerUp.id, turnState, 3000);

    expect(frozenTurn.isFrozen).toBe(true);
    expect(frozenTurn.freezeExpiresAt).toBeGreaterThan(Date.now() + 2500);
    expect(powerUpEngine.getTeamInventory('A')).toHaveLength(0);
  });

  it('GIVEN an active player with SKIP power-up WHEN activated THEN current word is discarded and replaced with a fresh word', () => {
    const skipPowerUp = powerUpEngine.grantPowerUp('A', 'SKIP');

    const turnState: TurnState = {
      activePlayerId: 'p1',
      activeTeam: 'A',
      currentWord: 'DIFÍCIL',
      category: 'General',
      turnStartTime: Date.now(),
      requiredGuesses: 1,
      successfulGuesses: 0,
      isFrozen: false,
    };

    const updatedTurn = powerUpEngine.applySkip('A', skipPowerUp.id, turnState, {
      word: 'FÁCIL',
      category: 'General',
    });

    expect(updatedTurn.currentWord).toBe('FÁCIL');
    expect(powerUpEngine.getTeamInventory('A')).toHaveLength(0);
  });
});
