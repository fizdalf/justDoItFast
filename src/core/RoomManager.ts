import {Player, TeamId} from './types.js';

import {GameError} from './errors.js';

export interface RoomData {
  roomCode: string;
  hostPlayerId: string;
  players: Player[];
  createdAt: number;
}

export class RoomManager {
  private rooms: Map<string, RoomData> = new Map();

  createRoom(hostPlayerId: string, hostName: string, customRoomCode?: string): RoomData {
    const roomCode = customRoomCode ? customRoomCode.toUpperCase() : this.generateRoomCode();
    const hostPlayer: Player = {
      id: hostPlayerId,
      name: hostName,
      team: 'A',
      isHost: true,
      isConnected: true,
      seatIndex: 0,
    };

    const room: RoomData = {
      roomCode,
      hostPlayerId,
      players: [hostPlayer],
      createdAt: Date.now(),
    };

    this.rooms.set(roomCode, room);
    return room;
  }

  joinRoom(roomCode: string, playerId: string, playerName: string): Player {
    const room = this.rooms.get(roomCode);
    if (!room) {
      throw new GameError('ROOM_NOT_FOUND', `Room ${roomCode} does not exist`);
    }

    const existing = room.players.find((p) => p.id === playerId);
    if (existing) {
      existing.isConnected = true;
      existing.name = playerName;
      return existing;
    }

    const countA = room.players.filter((p) => p.team === 'A').length;
    const countB = room.players.filter((p) => p.team === 'B').length;
    const assignedTeam: TeamId = countA <= countB ? 'A' : 'B';

    const newPlayer: Player = {
      id: playerId,
      name: playerName,
      team: assignedTeam,
      isHost: false,
      isConnected: true,
      seatIndex: room.players.length,
    };

    room.players.push(newPlayer);
    this.recomputeSeats(room);
    return newPlayer;
  }

  getRoom(roomCode: string): RoomData | undefined {
    return this.rooms.get(roomCode);
  }

  getPlayer(roomCode: string, playerId: string): Player | undefined {
    const room = this.rooms.get(roomCode);
    return room?.players.find((p) => p.id === playerId);
  }

  switchTeam(roomCode: string, playerId: string, targetTeam: TeamId): void {
    const room = this.rooms.get(roomCode);
    if (!room) throw new GameError('ROOM_NOT_FOUND', `Room ${roomCode} not found`);

    const player = room.players.find((p) => p.id === playerId);
    if (!player) throw new GameError('PLAYER_NOT_FOUND', `Player ${playerId} not found`);

    player.team = targetTeam;
    this.recomputeSeats(room);
  }

  setConnectionStatus(roomCode: string, playerId: string, isConnected: boolean): void {
    const room = this.rooms.get(roomCode);
    if (!room) return;

    const player = room.players.find((p) => p.id === playerId);
    if (player) {
      player.isConnected = isConnected;
    }
  }

  removePlayer(roomCode: string, playerId: string): void {
    const room = this.rooms.get(roomCode);
    if (!room) return;

    room.players = room.players.filter((p) => p.id !== playerId);

    if (room.players.length === 0) {
      this.rooms.delete(roomCode);
      return;
    }

    if (room.hostPlayerId === playerId) {
      const nextHost = room.players.find((p) => p.isConnected) || room.players[0];
      room.hostPlayerId = nextHost.id;
      nextHost.isHost = true;
    }

    this.recomputeSeats(room);
  }

  getSeatOrder(roomCode: string): Player[] {
    const room = this.rooms.get(roomCode);
    if (!room) return [];
    return [...room.players].sort((a, b) => a.seatIndex - b.seatIndex);
  }

  canStartGame(roomCode: string): boolean {
    const room = this.rooms.get(roomCode);
    if (!room) return false;

    const connectedPlayers = room.players.filter((p) => p.isConnected);
    const countA = connectedPlayers.filter((p) => p.team === 'A').length;
    const countB = connectedPlayers.filter((p) => p.team === 'B').length;

    return countA >= 2 && countB >= 2 && connectedPlayers.length >= 4;
  }

  private recomputeSeats(room: RoomData): void {
    const teamA = room.players.filter((p) => p.team === 'A');
    const teamB = room.players.filter((p) => p.team === 'B');

    const ordered: Player[] = [];
    const maxLen = Math.max(teamA.length, teamB.length);

    for (let i = 0; i < maxLen; i++) {
      if (teamA[i]) ordered.push(teamA[i]);
      if (teamB[i]) ordered.push(teamB[i]);
    }

    ordered.forEach((p, idx) => {
      p.seatIndex = idx;
    });

    room.players = ordered;
  }

  private generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    do {
      code = '';
      for (let i = 0; i < 4; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    } while (this.rooms.has(code));

    return code;
  }
}
