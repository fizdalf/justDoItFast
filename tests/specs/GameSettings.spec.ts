import {describe, expect, it} from 'vitest';
import {DEFAULT_SETTINGS, resolveSettings} from '../../src/core/settings.js';
import {GameError} from '../../src/core/errors.js';
import {PowerUpEngine} from '../../src/core/PowerUpEngine.js';
import {TimerEngine} from '../../src/core/TimerEngine.js';

function expectInvalid(fn: () => unknown) {
  try {
    fn();
  } catch (err) {
    expect(err).toBeInstanceOf(GameError);
    expect((err as GameError).code).toBe('INVALID_SETTINGS');
    return;
  }
  throw new Error('Expected INVALID_SETTINGS');
}

describe('Specification: Configurable game settings', () => {
  it('GIVEN no changes THEN the defaults apply (2 tools per team, 3 s jammer, all tools enabled)', () => {
    const settings = resolveSettings();
    expect(settings).toEqual(DEFAULT_SETTINGS);
    expect(settings.maxPowerUpsPerTeam).toBe(2);
    expect(settings.freezeDurationSec).toBe(3);
    expect(settings.enabledPowerUps).toHaveLength(4);
  });

  it('GIVEN partial changes THEN they are merged over the current settings', () => {
    const base = resolveSettings({ targetScore: 8 });
    const next = resolveSettings({ freezeDurationSec: 5 }, base);
    expect(next.targetScore).toBe(8);
    expect(next.freezeDurationSec).toBe(5);
  });

  it('GIVEN out-of-range, non-numeric, non-integer or unknown values THEN they are rejected', () => {
    expectInvalid(() => resolveSettings({ targetScore: 0 }));
    expectInvalid(() => resolveSettings({ targetScore: 2.5 }));
    expectInvalid(() => resolveSettings({ freezeDurationSec: Number.NaN }));
    expectInvalid(() => resolveSettings({ maxPowerUpsPerTeam: '3' as any }));
    expectInvalid(() => resolveSettings({ enabledPowerUps: ['NUKE'] as any }));
    expectInvalid(() => resolveSettings({ allowPowerUps: 'yes' as any }));
    expectInvalid(() => resolveSettings({ hack: true } as any));
  });

  it('GIVEN a minimum round duration above the maximum THEN it is rejected', () => {
    expectInvalid(() => resolveSettings({ minRoundDurationSec: 70, maxRoundDurationSec: 40 }));
  });

  it('GIVEN a team at its tool limit WHEN it guesses fast THEN it earns nothing more', () => {
    const engine = new PowerUpEngine({ fastGuessThresholdSec: 5, maxPerTeam: 2 });
    expect(engine.evaluateGuessSpeed(1, 'A')).toBeDefined();
    expect(engine.evaluateGuessSpeed(1, 'A')).toBeDefined();
    expect(engine.evaluateGuessSpeed(1, 'A')).toBeUndefined();
    expect(engine.getTeamInventory('A')).toHaveLength(2);
    expect(engine.evaluateGuessSpeed(1, 'B')).toBeDefined();
  });

  it('GIVEN only some tools enabled THEN only those are awarded', () => {
    const engine = new PowerUpEngine({ fastGuessThresholdSec: 5, enabledTypes: ['SKIP'] });
    for (let i = 0; i < 10; i++) {
      expect(engine.evaluateGuessSpeed(1, 'A')?.type).toBe('SKIP');
    }

    engine.configure({ enabledTypes: [] });
    expect(engine.evaluateGuessSpeed(1, 'B')).toBeUndefined();
  });

  it('GIVEN a new duration range THEN the next secret duration is drawn from it', () => {
    const timer = new TimerEngine({ minDurationSec: 35, maxDurationSec: 65 });
    timer.setDurationRange(10, 12);
    timer.reset();
    expect(timer.getTargetDurationSec()).toBeGreaterThanOrEqual(10);
    expect(timer.getTargetDurationSec()).toBeLessThanOrEqual(12);
  });
});
