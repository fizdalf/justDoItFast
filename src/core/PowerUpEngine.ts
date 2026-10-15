import {PowerUp, PowerUpType, TeamId} from './types.js';

import {GameError} from './errors.js';

export interface PowerUpEngineOptions {
  fastGuessThresholdSec?: number;
  /** Tipos que pueden salir como recompensa (por defecto, todos). */
  enabledTypes?: PowerUpType[];
  /** Máximo por equipo; con el inventario lleno no se gana ninguna (por defecto, sin límite). */
  maxPerTeam?: number;
}

const ALL_TYPES: PowerUpType[] = ['REVERSE', 'SKIP', 'DOUBLE_BURDEN', 'FREEZE', 'SHIELD', 'XRAY', 'REWIRE'];

export class PowerUpEngine {
  private fastGuessThresholdSec: number;
  private enabledTypes: PowerUpType[];
  private maxPerTeam: number;
  private teamInventories: Record<TeamId, PowerUp[]> = {
    A: [],
    B: [],
  };

  constructor(options: PowerUpEngineOptions = {}) {
    this.fastGuessThresholdSec = options.fastGuessThresholdSec ?? 5.0;
    this.enabledTypes = options.enabledTypes ?? ALL_TYPES;
    this.maxPerTeam = options.maxPerTeam ?? Infinity;
  }

  configure(options: PowerUpEngineOptions): void {
    if (options.fastGuessThresholdSec !== undefined) this.fastGuessThresholdSec = options.fastGuessThresholdSec;
    if (options.enabledTypes !== undefined) this.enabledTypes = options.enabledTypes;
    if (options.maxPerTeam !== undefined) this.maxPerTeam = options.maxPerTeam;
  }

  resetInventories(): void {
    this.teamInventories = { A: [], B: [] };
  }

  getTeamInventory(team: TeamId): PowerUp[] {
    return [...this.teamInventories[team]];
  }

  grantPowerUp(team: TeamId, type: PowerUpType): PowerUp {
    const powerUp: PowerUp = {
      id: `pw_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      type,
    };

    this.teamInventories[team].push(powerUp);
    return powerUp;
  }

  evaluateGuessSpeed(durationSec: number, team: TeamId): PowerUp | undefined {
    if (durationSec >= this.fastGuessThresholdSec) return undefined;
    return this.grantRandom(team);
  }

  /** Herramienta aleatoria entre las permitidas, si el equipo no tiene el inventario lleno. */
  grantRandom(team: TeamId): PowerUp | undefined {
    if (this.enabledTypes.length === 0) return undefined;
    if (this.teamInventories[team].length >= this.maxPerTeam) return undefined;

    const randomType = this.enabledTypes[Math.floor(Math.random() * this.enabledTypes.length)];
    return this.grantPowerUp(team, randomType);
  }

  /** Gasta una herramienta concreta del inventario del equipo. */
  consume(team: TeamId, powerUpId: string): PowerUp {
    const index = this.teamInventories[team].findIndex((p) => p.id === powerUpId);
    if (index === -1) {
      throw new GameError('POWERUP_NOT_FOUND', `Power-up ${powerUpId} not found in team ${team} inventory`);
    }
    return this.teamInventories[team].splice(index, 1)[0];
  }

  /** Gasta la primera herramienta de un tipo, si el equipo la tiene (p. ej. el Traje al explotar). */
  consumeFirstOfType(team: TeamId, type: PowerUpType): PowerUp | undefined {
    const index = this.teamInventories[team].findIndex((p) => p.type === type);
    return index === -1 ? undefined : this.teamInventories[team].splice(index, 1)[0];
  }
}
