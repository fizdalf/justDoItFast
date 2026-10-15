import {beforeEach, describe, expect, it} from 'vitest';
import {BoardEngine} from '../../src/core/BoardEngine.js';

describe('Specification: Game Board Track, Special Tiles & Victory State', () => {
  let boardEngine: BoardEngine;

  beforeEach(() => {
    boardEngine = new BoardEngine({ targetScore: 5 });
  });

  it('GIVEN a target score WHEN board is generated THEN it includes normal tiles, special tiles, and a goal tile at target score', () => {
    const tiles = boardEngine.getBoardTiles();

    expect(tiles).toHaveLength(6); // index 0 (Start) to index 5 (Goal)
    expect(tiles[0].label).toBe('Salida');
    expect(tiles[5].type).toBe('GOAL');

    const specialTiles = tiles.filter((t) => t.type !== 'NORMAL' && t.type !== 'GOAL');
    expect(specialTiles.length).toBeGreaterThanOrEqual(1);
  });

  it('GIVEN scores WHEN a team scores a point THEN team position advances and tile bonus is evaluated', () => {
    const result = boardEngine.advanceTeam('A', { A: 0, B: 0 });

    expect(result.newScore).toBe(1);
    expect(result.isGameOver).toBe(false);
  });

  it('GIVEN a team reaching the target score WHEN evaluated THEN status is marked as GAME_OVER and winning team is assigned', () => {
    const result = boardEngine.advanceTeam('B', { A: 3, B: 4 });

    expect(result.newScore).toBe(5);
    expect(result.isGameOver).toBe(true);
    expect(result.winner).toBe('B');
  });

  it('GIVEN a team landing on a MYSTERY_POWERUP tile WHEN evaluated THEN a bonus powerup event is emitted', () => {
    // Generate a fixed board with tile 2 as MYSTERY_POWERUP
    const customEngine = new BoardEngine({
      targetScore: 5,
      customTiles: [
        { index: 0, type: 'NORMAL', label: 'Salida' },
        { index: 1, type: 'NORMAL', label: 'Casilla 1' },
        { index: 2, type: 'MYSTERY_POWERUP', label: 'Comodín Sorpresa' },
        { index: 3, type: 'NORMAL', label: 'Casilla 3' },
        { index: 4, type: 'DOUBLE_TIME', label: 'Doble Tiempo' },
        { index: 5, type: 'GOAL', label: 'Meta Final' },
      ],
    });

    const step1 = customEngine.advanceTeam('A', { A: 0, B: 0 }); // Score 1
    const step2 = customEngine.advanceTeam('A', { A: step1.newScore, B: 0 }); // Score 2 (Mystery tile)

    expect(step2.tileEffect).toBe('MYSTERY_POWERUP');
  });
});
