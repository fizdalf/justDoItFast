import {PowerUp, PowerUpType, TeamId, TurnState} from './types.js';
import {CardPayload} from './TurnManager.js';

import {GameError} from './errors.js';

export interface PowerUpEngineOptions {
  fastGuessThresholdSec?: number;
  /** Tipos que pueden salir como recompensa (por defecto, todos). */
  enabledTypes?: PowerUpType[];
  /** Máximo por equipo; con el inventario lleno no se gana ninguna (por defecto, sin límite). */
  maxPerTeam?: number;
}

const ALL_TYPES: PowerUpType[] = ['REVERSE', 'DOUBLE_BURDEN', 'FREEZE', 'SKIP'];

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
    if (this.enabledTypes.length === 0) return undefined;
    if (this.teamInventories[team].length >= this.maxPerTeam) return undefined;

    const randomType = this.enabledTypes[Math.floor(Math.random() * this.enabledTypes.length)];
    return this.grantPowerUp(team, randomType);
  }

  applyPowerUp(
    team: TeamId,
    powerUpId: string,
    context: { currentDirection: 1 | -1 }
  ): { newDirection: 1 | -1 } {
    this.consumePowerUp(team, powerUpId, 'REVERSE');
    const newDirection = (context.currentDirection * -1) as 1 | -1;
    return { newDirection };
  }

  applyDoubleBurden(team: TeamId, powerUpId: string, turnState: TurnState): TurnState {
    this.consumePowerUp(team, powerUpId, 'DOUBLE_BURDEN');
    return {
      ...turnState,
      requiredGuesses: 2,
    };
  }

  applyFreeze(
    team: TeamId,
    powerUpId: string,
    turnState: TurnState,
    durationMs: number = 3000
  ): TurnState {
    this.consumePowerUp(team, powerUpId, 'FREEZE');
    return {
      ...turnState,
      isFrozen: true,
      freezeExpiresAt: Date.now() + durationMs,
    };
  }

  applySkip(
    team: TeamId,
    powerUpId: string,
    turnState: TurnState,
    nextCard: CardPayload
  ): TurnState {
    this.consumePowerUp(team, powerUpId, 'SKIP');
    return {
      ...turnState,
      currentWord: nextCard.word,
      category: nextCard.category,
      turnStartTime: Date.now(),
      successfulGuesses: 0,
    };
  }

  private consumePowerUp(team: TeamId, powerUpId: string, expectedType: PowerUpType): void {
    const index = this.teamInventories[team].findIndex((p) => p.id === powerUpId);
    if (index === -1) {
      throw new GameError('POWERUP_NOT_FOUND', `Power-up ${powerUpId} not found in team ${team} inventory`);
    }

    const item = this.teamInventories[team][index];
    if (item.type !== expectedType) {
      throw new GameError('INTERNAL', `Expected power-up of type ${expectedType}, found ${item.type}`);
    }

    this.teamInventories[team].splice(index, 1);
  }
}
