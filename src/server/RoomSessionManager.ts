import {Server} from 'socket.io';
import {DeckEngine} from '../core/index.js';
import {RoomSession} from './RoomSession.js';
import {ClientToServerEvents, ServerToClientEvents, SocketData,} from './protocol.js';

export interface SocketMapping {
  roomCode: string;
  playerId: string;
  playerName: string;
}

/** Todas las salas abiertas y qué socket pertenece a qué jugador. */
export class RoomSessionManager {
  private sessions: Map<string, RoomSession> = new Map();
  private socketMappings: Map<string, SocketMapping> = new Map();
  private deckEngine: DeckEngine;
  private io: Server<ClientToServerEvents, ServerToClientEvents, any, SocketData>;

  constructor(
    io: Server<ClientToServerEvents, ServerToClientEvents, any, SocketData>,
    deckEngine?: DeckEngine
  ) {
    this.io = io;
    this.deckEngine = deckEngine ?? new DeckEngine();
  }

  getDeckEngine(): DeckEngine {
    return this.deckEngine;
  }

  createSession(hostPlayerId: string, hostPlayerName: string): RoomSession {
    const roomCode = this.generateRoomCode();
    const session = new RoomSession(roomCode, hostPlayerId, hostPlayerName, this.deckEngine, this.io);

    this.sessions.set(roomCode, session);
    return session;
  }

  getSession(roomCode: string): RoomSession | undefined {
    return this.sessions.get(roomCode.toUpperCase());
  }

  removeSession(roomCode: string): void {
    const normalized = roomCode.toUpperCase();
    const session = this.sessions.get(normalized);
    if (session) {
      session.destroy();
      this.sessions.delete(normalized);
    }
  }

  registerSocket(
    socketId: string,
    roomCode: string,
    playerId: string,
    playerName: string
  ): void {
    this.socketMappings.set(socketId, {
      roomCode: roomCode.toUpperCase(),
      playerId,
      playerName,
    });
  }

  getSocketMapping(socketId: string): SocketMapping | undefined {
    return this.socketMappings.get(socketId);
  }

  removeSocket(socketId: string): SocketMapping | undefined {
    const mapping = this.socketMappings.get(socketId);
    if (mapping) {
      this.socketMappings.delete(socketId);
    }
    return mapping;
  }

  /** ¿Sigue el jugador conectado desde algún otro socket? (p. ej. tras recargar la página) */
  hasSocketForPlayer(roomCode: string, playerId: string): boolean {
    const code = roomCode.toUpperCase();
    for (const mapping of this.socketMappings.values()) {
      if (mapping.roomCode === code && mapping.playerId === playerId) return true;
    }
    return false;
  }

  getActiveSessionsCount(): number {
    return this.sessions.size;
  }

  getAllSessions(): { roomCode: string; playersCount: number; gameNumber: number | null; status: string | null; gamesPlayed: number }[] {
    return Array.from(this.sessions.values()).map((s) => {
      const game = s.getCurrentGame();
      return {
        roomCode: s.roomCode,
        playersCount: s.getPlayers().length,
        gameNumber: game?.gameNumber ?? null,
        status: game?.status ?? null,
        gamesPlayed: s.getHistory().length,
      };
    });
  }

  destroyAll(): void {
    for (const session of this.sessions.values()) {
      session.destroy();
    }
    this.sessions.clear();
    this.socketMappings.clear();
  }

  private generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    do {
      code = '';
      for (let i = 0; i < 4; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    } while (this.sessions.has(code));

    return code;
  }
}
