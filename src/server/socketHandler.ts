import {Server, Socket} from 'socket.io';
import {RoomSessionManager} from './RoomSessionManager.js';
import {RoomSession} from './RoomSession.js';
import {ApiResponse, ClientToServerEvents, ServerToClientEvents, SocketData,} from './protocol.js';
import {errorCodeOf} from '../core/errors.js';

type GameSocket = Socket<ClientToServerEvents, ServerToClientEvents, any, SocketData>;

function newPlayerId(): string {
  return `p_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
}

export function setupSocketHandlers(
  io: Server<ClientToServerEvents, ServerToClientEvents, any, SocketData>,
  sessionManager: RoomSessionManager
): void {
  /** Registra el socket como jugador de la sala (y lo mete en la sala de socket.io). */
  function attachSocket(socket: GameSocket, session: RoomSession, playerId: string, playerName: string): void {
    socket.join(session.roomCode);
    socket.data = { playerId, roomCode: session.roomCode, playerName };
    sessionManager.registerSocket(socket.id, session.roomCode, playerId, playerName);
  }

  /**
   * Ejecuta una acción de un jugador ya sentado en una sala y contesta por el callback,
   * traduciendo los errores a su código estable.
   */
  function handleRoomAction<T>(
    socket: GameSocket,
    callback: ((res: ApiResponse<T>) => void) | undefined,
    fallbackMessage: string,
    action: (session: RoomSession, playerId: string) => T
  ): void {
    if (typeof callback !== 'function') return;
    try {
      const mapping = sessionManager.getSocketMapping(socket.id);
      if (!mapping) return callback({ success: false, error: 'Not in a room', code: 'NOT_IN_ROOM' });

      const session = sessionManager.getSession(mapping.roomCode);
      if (!session) return callback({ success: false, error: 'Room not found', code: 'ROOM_NOT_FOUND' });

      return callback({ success: true, data: action(session, mapping.playerId) });
    } catch (err: any) {
      return callback({ success: false, error: err?.message || fallbackMessage, code: errorCodeOf(err) });
    }
  }

  io.on('connection', (socket: GameSocket) => {
    socket.on('room:create', (payload, callback) => {
      try {
        const playerName = payload?.playerName?.trim();
        if (!playerName) {
          return callback({ success: false, error: 'Player name is required', code: 'NAME_REQUIRED' });
        }

        const playerId = newPlayerId();
        const session = sessionManager.createSession(playerId, playerName);
        attachSocket(socket, session, playerId, playerName);

        return callback({
          success: true,
          data: {
            ...session.getSnapshot(),
            player: session.getPlayer(playerId)!,
            sessionToken: session.issueSessionToken(playerId),
          },
        });
      } catch (err: any) {
        return callback({ success: false, error: err.message || 'Error creating room', code: errorCodeOf(err) });
      }
    });

    socket.on('room:join', (payload, callback) => {
      try {
        if (!payload?.roomCode) {
          return callback({ success: false, error: 'Room code is required', code: 'ROOM_CODE_REQUIRED' });
        }
        const playerName = payload.playerName?.trim();
        if (!playerName) {
          return callback({ success: false, error: 'Player name is required', code: 'NAME_REQUIRED' });
        }

        const session = sessionManager.getSession(payload.roomCode);
        if (!session) {
          return callback({ success: false, error: `Room ${payload.roomCode} not found`, code: 'ROOM_NOT_FOUND' });
        }

        // Siempre es un jugador nuevo: para volver como uno existente se usa room:rejoin con su token.
        const playerId = newPlayerId();

        // Entrar en la sala de socket.io antes de anunciar al jugador, para que
        // también reciba el estado que se difunde al unirse.
        attachSocket(socket, session, playerId, playerName);

        const player = session.joinPlayer(playerId, playerName);

        return callback({
          success: true,
          data: {
            ...session.getSnapshot(),
            player,
            sessionToken: session.issueSessionToken(playerId),
          },
        });
      } catch (err: any) {
        return callback({ success: false, error: err.message || 'Error joining room', code: errorCodeOf(err) });
      }
    });

    socket.on('room:rejoin', (payload, callback) => {
      try {
        const session = payload?.roomCode ? sessionManager.getSession(payload.roomCode) : undefined;
        if (!session) {
          return callback({ success: false, error: `Room ${payload?.roomCode} not found`, code: 'ROOM_NOT_FOUND' });
        }

        const playerId = payload.sessionToken ? session.resolveSessionToken(payload.sessionToken) : undefined;
        if (!playerId) {
          return callback({ success: false, error: 'Invalid or expired session token', code: 'SESSION_EXPIRED' });
        }

        // Registrar el socket antes de reconectar, para que un 'disconnect' tardío
        // del socket anterior no vuelva a marcar al jugador como desconectado.
        const playerName = session.getPlayer(playerId)!.name;
        attachSocket(socket, session, playerId, playerName);

        const player = session.reconnectPlayer(playerId);
        return callback({
          success: true,
          data: {
            ...session.getSnapshot(),
            player,
          },
        });
      } catch (err: any) {
        return callback({ success: false, error: err.message || 'Error rejoining room', code: errorCodeOf(err) });
      }
    });

    socket.on('room:leave', (callback) => {
      try {
        const mapping = sessionManager.getSocketMapping(socket.id);
        if (mapping) {
          const session = sessionManager.getSession(mapping.roomCode);
          if (session) {
            session.removePlayer(mapping.playerId);
            if (session.getPlayers().length === 0) {
              sessionManager.removeSession(mapping.roomCode);
            }
          }
          socket.leave(mapping.roomCode);
          sessionManager.removeSocket(socket.id);
        }
        if (typeof callback === 'function') callback({ success: true, data: {} });
      } catch (err: any) {
        if (typeof callback === 'function') callback({ success: false, error: err.message, code: errorCodeOf(err) });
      }
    });

    socket.on('room:switch_team', (payload, callback) => {
      handleRoomAction(socket, callback, 'Error switching team', (session, playerId) => {
        session.switchTeam(playerId, payload?.targetTeam);
        return session.getSnapshot();
      });
    });

    socket.on('room:update_setup', (payload, callback) => {
      handleRoomAction(socket, callback, 'Error updating setup', (session, playerId) => {
        session.updateSetup(playerId, payload ?? {});
        return session.getSnapshot();
      });
    });

    socket.on('game:start', (callback) => {
      handleRoomAction(socket, callback, 'Error starting game', (session, playerId) =>
        session.startGame(playerId)
      );
    });

    socket.on('game:start_round', (callback) => {
      handleRoomAction(socket, callback, 'Error starting round', (session, playerId) =>
        session.startRound(playerId)
      );
    });

    socket.on('game:end', (callback) => {
      handleRoomAction(socket, callback, 'Error ending game', (session, playerId) =>
        session.endGame(playerId)
      );
    });

    socket.on('turn:guess_success', (callback) => {
      handleRoomAction(socket, callback, 'Error recording guess', (session, playerId) =>
        session.recordGuessSuccess(playerId)
      );
    });

    socket.on('turn:foul_triggered', (payload, callback) => {
      handleRoomAction(socket, callback, 'Error triggering foul', (session, playerId) => ({
        dispute: session.triggerFoul(playerId, payload?.reason),
      }));
    });

    socket.on('host:resolve_dispute', (payload, callback) => {
      handleRoomAction(socket, callback, 'Error resolving dispute', (session, playerId) =>
        session.resolveDispute(playerId, payload?.resolution)
      );
    });

    socket.on('powerup:use', (payload, callback) => {
      handleRoomAction(socket, callback, 'Error using power-up', (session, playerId) =>
        session.usePowerUp(playerId, payload?.powerUpId)
      );
    });

    socket.on('disconnect', () => {
      const mapping = sessionManager.removeSocket(socket.id);
      if (!mapping) return;

      // Tras un F5 el socket nuevo puede haber vuelto antes de que llegue este aviso.
      if (sessionManager.hasSocketForPlayer(mapping.roomCode, mapping.playerId)) return;

      sessionManager.getSession(mapping.roomCode)?.handlePlayerDisconnect(mapping.playerId);
    });
  });
}
