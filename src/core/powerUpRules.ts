import {GameStatus, PowerUpType, TeamId} from './types.js';

/**
 * Quién puede usar cada herramienta y cuándo. Lo comparten servidor (valida) y cliente
 * (solo muestra activos los botones utilizables).
 * - HOLDER: el artificiero, sobre su propio turno (defensivas).
 * - RIVALS: el equipo que NO tiene la bomba, mientras la tiene el rival (ofensivas).
 * - TEAM: cualquier miembro del equipo, en cualquier momento de la ronda.
 * - PASSIVE: no se pulsa; se gasta sola cuando toca (Traje antiexplosivos al explotar).
 */
export type PowerUpUsage = 'HOLDER' | 'RIVALS' | 'TEAM' | 'PASSIVE';

export const POWER_UP_USAGE: Record<PowerUpType, PowerUpUsage> = {
  REVERSE: 'HOLDER',
  SKIP: 'HOLDER',
  DOUBLE_BURDEN: 'RIVALS',
  FREEZE: 'RIVALS',
  XRAY: 'TEAM',
  REWIRE: 'TEAM',
  SHIELD: 'PASSIVE',
};

/** Umbrales de la lectura de Rayos X (tiempo restante). */
export const XRAY_THRESHOLDS_SEC = { SHORT: 10, MEDIUM: 20 } as const;

/** Las herramientas cuyo uso solo conoce el equipo que la usa (Doble detonador hasta revelarse). */
export const SECRET_POWER_UPS: PowerUpType[] = ['DOUBLE_BURDEN'];

export interface PowerUpUseContext {
  status: GameStatus;
  myPlayerId: string;
  myTeam: TeamId;
  holderId?: string;
  holderTeam?: TeamId;
}

export function canUsePowerUp(type: PowerUpType, ctx: PowerUpUseContext): boolean {
  if (ctx.status !== 'PLAYING' || !ctx.holderId || !ctx.holderTeam) return false;
  switch (POWER_UP_USAGE[type]) {
    case 'HOLDER':
      return ctx.myPlayerId === ctx.holderId;
    case 'RIVALS':
      return ctx.myTeam !== ctx.holderTeam;
    case 'TEAM':
      return true;
    case 'PASSIVE':
      return false;
  }
}
