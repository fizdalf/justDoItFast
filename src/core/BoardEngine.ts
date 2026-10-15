import {BoardTile, TeamId, TileType} from './types.js';

export interface BoardEngineOptions {
  targetScore?: number;
  customTiles?: BoardTile[];
}

export interface AdvanceResult {
  newScore: number;
  isGameOver: boolean;
  winner?: TeamId;
  tileEffect?: TileType;
}

export class BoardEngine {
  private targetScore: number;
  private tiles: BoardTile[];

  constructor(options: BoardEngineOptions = {}) {
    this.targetScore = options.targetScore ?? 5;
    this.tiles = options.customTiles ?? this.generateDefaultBoard(this.targetScore);
  }

  getBoardTiles(): BoardTile[] {
    return [...this.tiles];
  }

  advanceTeam(team: TeamId, currentScores: Record<TeamId, number>): AdvanceResult {
    const newScore = (currentScores[team] || 0) + 1;
    const isGameOver = newScore >= this.targetScore;
    const winner: TeamId | undefined = isGameOver ? team : undefined;

    const tileIndex = Math.min(newScore, this.tiles.length - 1);
    const tile = this.tiles[tileIndex];
    const tileEffect = tile ? tile.type : undefined;

    return {
      newScore,
      isGameOver,
      winner,
      tileEffect,
    };
  }

  private generateDefaultBoard(target: number): BoardTile[] {
    const list: BoardTile[] = [];

    // Tile 0: Start
    list.push({ index: 0, type: 'NORMAL', label: 'Salida' });

    for (let i = 1; i < target; i++) {
      let type: TileType = 'NORMAL';
      let label = `Casilla ${i}`;

      if (i % 3 === 2) {
        type = 'MYSTERY_POWERUP';
        label = 'Comodín Sorpresa';
      } else if (i % 4 === 0) {
        type = 'DOUBLE_TIME';
        label = 'Doble Tiempo';
      }

      list.push({ index: i, type, label });
    }

    // Goal tile at target score
    list.push({ index: target, type: 'GOAL', label: 'Meta Final' });

    return list;
  }
}
