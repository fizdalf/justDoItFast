import {beforeEach, describe, expect, it} from 'vitest';
import {PowerUpEngine} from '../../src/core/PowerUpEngine.js';
import {ALL_POWER_UPS} from '../../src/core/settings.js';
import {canUsePowerUp, POWER_UP_USAGE} from '../../src/core/powerUpRules.js';
import {GameError} from '../../src/core/errors.js';

describe('Specification: Anti-Stall Speed Rewards & Tool Inventory', () => {
  let powerUpEngine: PowerUpEngine;

  beforeEach(() => {
    powerUpEngine = new PowerUpEngine({ fastGuessThresholdSec: 5.0 });
  });

  it('GIVEN a guess completed in under 5 seconds WHEN evaluated THEN it awards a tool to the team inventory', () => {
    const reward = powerUpEngine.evaluateGuessSpeed(3.8, 'A');

    expect(reward).toBeDefined();
    expect(ALL_POWER_UPS).toContain(reward?.type);

    const inventory = powerUpEngine.getTeamInventory('A');
    expect(inventory).toHaveLength(1);
    expect(inventory[0].id).toBe(reward?.id);
  });

  it('GIVEN a slow guess (>= 5 seconds) WHEN evaluated THEN no tool is awarded', () => {
    const reward = powerUpEngine.evaluateGuessSpeed(6.1, 'A');

    expect(reward).toBeUndefined();
    expect(powerUpEngine.getTeamInventory('A')).toHaveLength(0);
  });

  it('GIVEN a tool in the inventory WHEN consumed THEN it is removed and returned; unknown ids are rejected', () => {
    const tool = powerUpEngine.grantPowerUp('A', 'FREEZE');

    expect(powerUpEngine.consume('A', tool.id)).toEqual(tool);
    expect(powerUpEngine.getTeamInventory('A')).toHaveLength(0);
    expect(() => powerUpEngine.consume('A', tool.id)).toThrow(GameError);
    // Las herramientas son del equipo: el rival no puede gastarlas
    const other = powerUpEngine.grantPowerUp('A', 'SKIP');
    expect(() => powerUpEngine.consume('B', other.id)).toThrow(GameError);
  });

  it('GIVEN a team with a bomb suit WHEN the bomb explodes THEN the first suit of that type is spent', () => {
    powerUpEngine.grantPowerUp('A', 'XRAY');
    const suit = powerUpEngine.grantPowerUp('A', 'SHIELD');

    expect(powerUpEngine.consumeFirstOfType('B', 'SHIELD')).toBeUndefined();
    expect(powerUpEngine.consumeFirstOfType('A', 'SHIELD')).toEqual(suit);
    expect(powerUpEngine.getTeamInventory('A').map((p) => p.type)).toEqual(['XRAY']);
  });

  it('GIVEN the usage rules THEN defensive tools are for the holder, offensive ones for rivals, info/gamble tools for anyone and the suit is passive', () => {
    expect(POWER_UP_USAGE).toMatchObject({
      REVERSE: 'HOLDER', SKIP: 'HOLDER', DOUBLE_BURDEN: 'RIVALS', FREEZE: 'RIVALS',
      XRAY: 'TEAM', REWIRE: 'TEAM', SHIELD: 'PASSIVE',
    });

    const playing = { status: 'PLAYING' as const, holderId: 'a1', holderTeam: 'A' as const };
    const holder = { ...playing, myPlayerId: 'a1', myTeam: 'A' as const };
    const helper = { ...playing, myPlayerId: 'a2', myTeam: 'A' as const };
    const saboteur = { ...playing, myPlayerId: 'b1', myTeam: 'B' as const };

    expect(canUsePowerUp('REVERSE', holder)).toBe(true);
    expect(canUsePowerUp('REVERSE', helper)).toBe(false);
    expect(canUsePowerUp('FREEZE', saboteur)).toBe(true);
    expect(canUsePowerUp('FREEZE', helper)).toBe(false);
    expect(canUsePowerUp('XRAY', helper)).toBe(true);
    expect(canUsePowerUp('REWIRE', saboteur)).toBe(true);
    expect(canUsePowerUp('SHIELD', holder)).toBe(false);
    expect(canUsePowerUp('XRAY', { ...helper, status: 'ROUND_OVER' })).toBe(false);
  });
});
