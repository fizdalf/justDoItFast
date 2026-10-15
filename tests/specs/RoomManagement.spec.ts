import {beforeEach, describe, expect, it} from 'vitest';
import {RoomManager} from '../../src/core/RoomManager.js';

describe('Specification: Room Management & Team Balancing', () => {
  let roomManager: RoomManager;

  beforeEach(() => {
    roomManager = new RoomManager();
  });

  it('GIVEN a host creating a room WHEN room is initialized THEN it generates a 4-letter alphanumeric code and sets host as first player', () => {
    const room = roomManager.createRoom('host-123', 'Carlos');

    expect(room.roomCode).toMatch(/^[A-Z0-9]{4}$/);
    expect(room.hostPlayerId).toBe('host-123');
    expect(room.players).toHaveLength(1);
    expect(room.players[0]).toEqual({
      id: 'host-123',
      name: 'Carlos',
      team: 'A',
      isHost: true,
      isConnected: true,
      seatIndex: 0,
    });
  });

  it('GIVEN an existing room WHEN players join sequentially THEN it balances them automatically between Team A and Team B', () => {
    const room = roomManager.createRoom('p1', 'Player 1'); // Team A, seat 0
    const p2 = roomManager.joinRoom(room.roomCode, 'p2', 'Player 2'); // Team B, seat 1
    const p3 = roomManager.joinRoom(room.roomCode, 'p3', 'Player 3'); // Team A, seat 2
    const p4 = roomManager.joinRoom(room.roomCode, 'p4', 'Player 4'); // Team B, seat 3

    expect(p2.team).toBe('B');
    expect(p3.team).toBe('A');
    expect(p4.team).toBe('B');

    const updatedRoom = roomManager.getRoom(room.roomCode)!;
    expect(updatedRoom.players.filter((p) => p.team === 'A')).toHaveLength(2);
    expect(updatedRoom.players.filter((p) => p.team === 'B')).toHaveLength(2);

    const seatOrder = roomManager.getSeatOrder(room.roomCode);
    expect(seatOrder.map((p) => p.team)).toEqual(['A', 'B', 'A', 'B']);
  });

  it('GIVEN a player switching teams WHEN requested THEN seat indices and teams are updated cleanly', () => {
    const room = roomManager.createRoom('p1', 'Player 1');
    roomManager.joinRoom(room.roomCode, 'p2', 'Player 2');
    roomManager.joinRoom(room.roomCode, 'p3', 'Player 3');

    roomManager.switchTeam(room.roomCode, 'p3', 'B');
    const updatedP3 = roomManager.getPlayer(room.roomCode, 'p3');

    expect(updatedP3?.team).toBe('B');
  });

  it('GIVEN a disconnected player WHEN they reconnect with same ID THEN connection state is restored', () => {
    const room = roomManager.createRoom('p1', 'Player 1');
    roomManager.setConnectionStatus(room.roomCode, 'p1', false);

    expect(roomManager.getPlayer(room.roomCode, 'p1')?.isConnected).toBe(false);

    roomManager.setConnectionStatus(room.roomCode, 'p1', true);
    expect(roomManager.getPlayer(room.roomCode, 'p1')?.isConnected).toBe(true);
  });

  it('GIVEN a host leaving the room WHEN another player is present THEN host privilege is transferred', () => {
    const room = roomManager.createRoom('host-1', 'Host');
    roomManager.joinRoom(room.roomCode, 'p2', 'NextHost');

    roomManager.removePlayer(room.roomCode, 'host-1');
    const updatedRoom = roomManager.getRoom(room.roomCode)!;

    expect(updatedRoom.hostPlayerId).toBe('p2');
    expect(roomManager.getPlayer(room.roomCode, 'p2')?.isHost).toBe(true);
  });

  it('GIVEN a room WHEN checking canStartGame THEN it requires at least 2 players in Team A and 2 in Team B (minimum 4 total)', () => {
    const room = roomManager.createRoom('p1', 'A1');
    expect(roomManager.canStartGame(room.roomCode)).toBe(false);

    roomManager.joinRoom(room.roomCode, 'p2', 'B1');
    expect(roomManager.canStartGame(room.roomCode)).toBe(false);

    roomManager.joinRoom(room.roomCode, 'p3', 'A2');
    expect(roomManager.canStartGame(room.roomCode)).toBe(false);

    roomManager.joinRoom(room.roomCode, 'p4', 'B2');
    expect(roomManager.canStartGame(room.roomCode)).toBe(true);
  });
});
