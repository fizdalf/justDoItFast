import {beforeEach, describe, expect, it} from 'vitest';
import {TurnManager} from '../../src/core/TurnManager.js';
import {Player} from '../../src/core/types.js';

describe('Specification: Circular Turn Rotation & Hot Potato Passing', () => {
  let turnManager: TurnManager;
  let players: Player[];

  beforeEach(() => {
    players = [
      { id: 'p1', name: 'Ana', team: 'A', isHost: true, isConnected: true, seatIndex: 0 },
      { id: 'p2', name: 'Bob', team: 'B', isHost: false, isConnected: true, seatIndex: 1 },
      { id: 'p3', name: 'Carlos', team: 'A', isHost: false, isConnected: true, seatIndex: 2 },
      { id: 'p4', name: 'Diana', team: 'B', isHost: false, isConnected: true, seatIndex: 3 },
    ];
    turnManager = new TurnManager(players);
  });

  it('GIVEN a newly started round WHEN initialized THEN turn starts with the designated first player (A1)', () => {
    const turn = turnManager.startRound(0, { word: 'BICICLETA', category: 'Objetos' });

    expect(turn.activePlayerId).toBe('p1');
    expect(turn.activeTeam).toBe('A');
    expect(turn.currentWord).toBe('BICICLETA');
    expect(turn.category).toBe('Objetos');
    expect(turn.requiredGuesses).toBe(1);
    expect(turn.successfulGuesses).toBe(0);
  });

  it('GIVEN player A1 holding potato WHEN guess is successful THEN potato passes immediately to B1, then A2, then B2, then back to A1', () => {
    turnManager.startRound(0, { word: 'PALABRA_1', category: 'General' });

    // P1 (A1) succeeds -> Next is P2 (B1)
    const turn1 = turnManager.passTurn('p1', { word: 'PALABRA_2', category: 'General' });
    expect(turn1.activePlayerId).toBe('p2');
    expect(turn1.activeTeam).toBe('B');

    // P2 (B1) succeeds -> Next is P3 (A2)
    const turn2 = turnManager.passTurn('p2', { word: 'PALABRA_3', category: 'General' });
    expect(turn2.activePlayerId).toBe('p3');
    expect(turn2.activeTeam).toBe('A');

    // P3 (A2) succeeds -> Next is P4 (B2)
    const turn3 = turnManager.passTurn('p3', { word: 'PALABRA_4', category: 'General' });
    expect(turn3.activePlayerId).toBe('p4');
    expect(turn3.activeTeam).toBe('B');

    // P4 (B2) succeeds -> Next is P1 (A1)
    const turn4 = turnManager.passTurn('p4', { word: 'PALABRA_5', category: 'General' });
    expect(turn4.activePlayerId).toBe('p1');
    expect(turn4.activeTeam).toBe('A');
  });

  it('GIVEN a non-active player trying to pass the potato WHEN attempted THEN error is thrown preventing unauthorized turn passes', () => {
    turnManager.startRound(0, { word: 'AUTO', category: 'General' });

    expect(() => {
      turnManager.passTurn('p2', { word: 'MOTO', category: 'General' });
    }).toThrow(/Only active player can pass the turn/);
  });

  it('GIVEN a disconnected player in the circle WHEN turn passes THEN disconnected player is skipped to next active player', () => {
    // Disconnect P2 (B1)
    players[1].isConnected = false;
    turnManager.updatePlayers(players);

    turnManager.startRound(0, { word: 'SOL', category: 'General' });

    // P1 passes -> should skip P2 and land on P4 (the next available B team member, or next connected)
    const nextTurn = turnManager.passTurn('p1', { word: 'LUNA', category: 'General' });
    expect(nextTurn.activePlayerId).toBe('p4'); // B2
    expect(nextTurn.activeTeam).toBe('B');
  });

  it('GIVEN a guess made WHEN recorded THEN guess duration is accurately measured in seconds', () => {
    const startTime = Date.now() - 3200; // 3.2 seconds ago
    turnManager.startRound(0, { word: 'TEST', category: 'Test' }, startTime);

    const result = turnManager.recordGuessSuccess('p1');
    expect(result.durationSec).toBeCloseTo(3.2, 0.5);
    expect(result.isFastGuess).toBe(true); // < 5.0s
  });

  it('GIVEN the defuser disconnected WHEN the bomb is reassigned THEN it goes to the next connected teammate with a new wire', () => {
    turnManager.startRound(0, { word: 'PALABRA_1', category: 'General' });
    turnManager.updatePlayers(players.map((p) => (p.id === 'p1' ? { ...p, isConnected: false } : p)));

    const turn = turnManager.reassignTurn({ word: 'PALABRA_2', category: 'General' });

    expect(turn.activePlayerId).toBe('p3');
    expect(turn.activeTeam).toBe('A');
    expect(turn.currentWord).toBe('PALABRA_2');
  });

  it('GIVEN the defuser has no connected teammates WHEN the bomb is reassigned THEN it goes to the rival team', () => {
    turnManager.startRound(0, { word: 'PALABRA_1', category: 'General' });
    turnManager.updatePlayers(
      players.map((p) => (p.id === 'p1' || p.id === 'p3' ? { ...p, isConnected: false } : p))
    );

    const turn = turnManager.reassignTurn({ word: 'PALABRA_2', category: 'General' });

    expect(turn.activeTeam).toBe('B');
    expect(['p2', 'p4']).toContain(turn.activePlayerId);
  });

  it('GIVEN only some room players take part (seat indexes with gaps) WHEN the bomb is passed THEN it rotates through the participants only', () => {
    // Sala: A1 B1 A2 B2 A3 (asientos 0..4); A2 (asiento 2) entró a mitad de partida y es espectador.
    const participants: Player[] = [
      { id: 'a1', name: 'A1', team: 'A', isHost: true, isConnected: true, seatIndex: 0 },
      { id: 'b1', name: 'B1', team: 'B', isHost: false, isConnected: true, seatIndex: 1 },
      { id: 'b2', name: 'B2', team: 'B', isHost: false, isConnected: true, seatIndex: 3 },
      { id: 'a3', name: 'A3', team: 'A', isHost: false, isConnected: true, seatIndex: 4 },
    ];
    const manager = new TurnManager(participants);
    manager.startRound(0, { word: 'W0', category: 'G' });

    const order = ['a1'];
    for (let i = 0; i < 4; i++) {
      order.push(manager.passTurn(order[order.length - 1], { word: `W${i + 1}`, category: 'G' }).activePlayerId);
    }

    // Orden de asientos entre participantes: a1, b1, b2, a3 (el hueco de A2 no rompe la rotación).
    expect(order).toEqual(['a1', 'b1', 'a3', 'b1', 'a3']);
  });

  it('GIVEN the defuser left the rotation WHEN the bomb is reassigned THEN it goes to the next teammate after the gap', () => {
    turnManager.startRound(0, { word: 'PALABRA_1', category: 'General' });
    turnManager.passTurn('p1', { word: 'PALABRA_2', category: 'General' }); // p2 (B) tiene la bomba
    turnManager.updatePlayers(players.filter((p) => p.id !== 'p2'));

    const turn = turnManager.reassignTurn({ word: 'PALABRA_3', category: 'General' });

    expect(turn.activePlayerId).toBe('p4');
  });
});
