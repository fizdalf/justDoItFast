import {Server} from 'socket.io';
import {DeckEngine} from '../core/index.js';
import {GameSession, GameSessionOptions} from './GameSession.js';
import {ClientToServerEvents, ServerToClientEvents, SocketData,} from './protocol.js';

export interface SocketMapping {
  roomCode: string;
  playerId: string;
  playerName: string;
}

export class GameSessionManager {
  private sessions: Map<string, GameSession> = new Map();
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

  createSession(
    hostPlayerId: string,
    hostPlayerName: string,
    options: GameSessionOptions = {}
  ): GameSession {
    const roomCode = this.generateRoomCode();
    const session = new GameSession(
      roomCode,
      hostPlayerId,
      hostPlayerName,
      this.deckEngine,
      this.io,
      options
    );

    this.sessions.set(roomCode, session);
    return session;
  }

  getSession(roomCode: string): GameSession | undefined {
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

  getActiveSessionsCount(): number {
    return this.sessions.size;
  }

  getAllSessions(): { roomCode: string; playersCount: number; status: string }[] {
    return Array.from(this.sessions.values()).map((s) => ({
      roomCode: s.roomCode,
      playersCount: s.getPlayers().length,
      status: s.getGameState().status,
    }));
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
