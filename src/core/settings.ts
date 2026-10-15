import {GameError} from './errors.js';
import {GameSettings, PowerUpType} from './types.js';

export const ALL_POWER_UPS: PowerUpType[] = ['REVERSE', 'SKIP', 'DOUBLE_BURDEN', 'FREEZE'];

export const DEFAULT_SETTINGS: GameSettings = {
  targetScore: 5,
  minRoundDurationSec: 35,
  maxRoundDurationSec: 65,
  fastGuessThresholdSec: 5,
  allowPowerUps: true,
  enabledPowerUps: [...ALL_POWER_UPS],
  maxPowerUpsPerTeam: 2,
  freezeDurationSec: 3,
  disconnectGraceSec: 5,
};

type NumericSetting = {
  [K in keyof GameSettings]: GameSettings[K] extends number ? K : never;
}[keyof GameSettings];

/**
 * Límites de cordura que valida el servidor (evitan valores absurdos o maliciosos).
 * La interfaz ofrece rangos más estrechos y jugables.
 */
export const SETTINGS_LIMITS: Record<NumericSetting, { min: number; max: number; integer?: boolean }> = {
  targetScore: { min: 1, max: 30, integer: true },
  minRoundDurationSec: { min: 2, max: 600 },
  maxRoundDurationSec: { min: 2, max: 600 },
  fastGuessThresholdSec: { min: 0.5, max: 60 },
  maxPowerUpsPerTeam: { min: 1, max: 20, integer: true },
  freezeDurationSec: { min: 0.5, max: 60 },
  disconnectGraceSec: { min: 0, max: 120 },
};

function invalid(message: string): never {
  throw new GameError('INVALID_SETTINGS', message);
}

/** Combina cambios parciales con los ajustes actuales y valida el resultado completo. */
export function resolveSettings(changes: Partial<GameSettings> = {}, base: GameSettings = DEFAULT_SETTINGS): GameSettings {
  if (typeof changes !== 'object' || changes === null) invalid('Settings must be an object');

  const next: GameSettings = { ...base, enabledPowerUps: [...base.enabledPowerUps] };

  for (const [key, value] of Object.entries(changes) as [keyof GameSettings, unknown][]) {
    if (value === undefined) continue;

    if (key in SETTINGS_LIMITS) {
      const limits = SETTINGS_LIMITS[key as NumericSetting];
      if (typeof value !== 'number' || !Number.isFinite(value)) invalid(`${key} must be a number`);
      if (value < limits.min || value > limits.max) invalid(`${key} must be between ${limits.min} and ${limits.max}`);
      if (limits.integer && !Number.isInteger(value)) invalid(`${key} must be an integer`);
      (next as any)[key] = value;
    } else if (key === 'allowPowerUps') {
      if (typeof value !== 'boolean') invalid('allowPowerUps must be a boolean');
      next.allowPowerUps = value;
    } else if (key === 'enabledPowerUps') {
      if (!Array.isArray(value) || value.some((type) => !ALL_POWER_UPS.includes(type))) {
        invalid('enabledPowerUps must be a list of known power-up types');
      }
      next.enabledPowerUps = ALL_POWER_UPS.filter((type) => value.includes(type));
    } else {
      invalid(`Unknown setting ${String(key)}`);
    }
  }

  if (next.minRoundDurationSec > next.maxRoundDurationSec) {
    invalid('minRoundDurationSec cannot be greater than maxRoundDurationSec');
  }

  return next;
}
