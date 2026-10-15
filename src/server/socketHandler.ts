import {Server, Socket} from 'socket.io';
import {GameSessionManager} from './GameSessionManager.js';
import {ClientToServerEvents, ServerToClientEvents, SocketData,} from './protocol.js';
import {errorCodeOf} from '../core/errors.js';

export function setupSocketHandlers(
  io: Server<ClientToServerEvents, ServerToClientEvents, any, SocketData>,
  sessionManager: GameSessionManager
): void {
  io.on('connection', (socket: Socket<ClientToServerEvents, ServerToClientEvents, any, SocketData>) => {
    socket.on('room:create', (payload, callback) => {
      try {
        if (!payload.playerName || payload.playerName.trim().length === 0) {
          return callback({ success: false, error: 'Player name is required', code: 'NAME_REQUIRED' });
        }

        const playerId = `p_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const session = sessionManager.createSession(
          playerId,
          payload.playerName.trim(),
          {
            selectedPackId: payload.selectedPackId,
            settings: payload.settings,
          }
        );

        socket.join(session.roomCode);
        socket.data = {
          playerId,
          roomCode: session.roomCode,
          playerName: payload.playerName.trim(),
        };

        sessionManager.registerSocket(
          socket.id,
          session.roomCode,
          playerId,
          payload.playerName.trim()
        );

        const player = session.getPlayer(playerId)!;
        return callback({
          success: true,
          data: {
            roomCode: session.roomCode,
            player,
            gameState: session.getGameState(),
            sessionToken: session.issueSessionToken(playerId),
          },
        });
      } catch (err: any) {
        return callback({ success: false, error: err.message || 'Error creating room', code: errorCodeOf(err) });
      }
    });

    socket.on('room:join', (payload, callback) => {
      try {
        if (!payload.roomCode) {
          return callback({ success: false, error: 'Room code is required', code: 'ROOM_CODE_REQUIRED' });
        }
        if (!payload.playerName || payload.playerName.trim().length === 0) {
          return callback({ success: false, error: 'Player name is required', code: 'NAME_REQUIRED' });
        }

        const session = sessionManager.getSession(payload.roomCode);
        if (!session) {
          return callback({ success: false, error: `Room ${payload.roomCode} not found`, code: 'ROOM_NOT_FOUND' });
        }

        // Siempre es un jugador nuevo: para volver como uno existente se usa room:rejoin con su token.
        const playerId = `p_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

        const player = session.joinPlayer(playerId, payload.playerName.trim());

        socket.join(session.roomCode);
        socket.data = {
          playerId,
          roomCode: session.roomCode,
          playerName: payload.playerName.trim(),
        };

        sessionManager.registerSocket(
          socket.id,
          session.roomCode,
          playerId,
          payload.playerName.trim()
        );

        return callback({
          success: true,
          data: {
            player,
            gameState: session.getGameState(),
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
        socket.join(session.roomCode);
        socket.data = { playerId, roomCode: session.roomCode, playerName };
        sessionManager.registerSocket(socket.id, session.roomCode, playerId, playerName);

        const player = session.reconnectPlayer(playerId);
        return callback({
          success: true,
          data: {
            player,
            players: session.getPlayers(),
            gameState: session.getGameState(),
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
        if (callback) callback({ success: true, data: {} });
      } catch (err: any) {
        if (callback) callback({ success: false, error: err.message, code: errorCodeOf(err) });
      }
    });

    socket.on('room:switch_team', (payload, callback) => {
      try {
        const mapping = sessionManager.getSocketMapping(socket.id);
        if (!mapping) {
          return callback({ success: false, error: 'Not in a room', code: 'NOT_IN_ROOM' });
        }

        const session = sessionManager.getSession(mapping.roomCode);
        if (!session) {
          return callback({ success: false, error: 'Room not found', code: 'ROOM_NOT_FOUND' });
        }

        const player = session.switchTeam(mapping.playerId, payload.targetTeam);
        return callback({
          success: true,
          data: {
            player,
            gameState: session.getGameState(),
          },
        });
      } catch (err: any) {
        return callback({ success: false, error: err.message || 'Error switching team', code: errorCodeOf(err) });
      }
    });

    socket.on('room:select_pack', (payload, callback) => {
      try {
        const mapping = sessionManager.getSocketMapping(socket.id);
        if (!mapping) return callback({ success: false, error: 'Not in a room', code: 'NOT_IN_ROOM' });

        const session = sessionManager.getSession(mapping.roomCode);
        if (!session) return callback({ success: false, error: 'Room not found', code: 'ROOM_NOT_FOUND' });

        session.selectPack(mapping.playerId, payload.packId);
        return callback({
          success: true,
          data: {
            gameState: session.getGameState(),
          },
        });
      } catch (err: any) {
        return callback({ success: false, error: err.message || 'Error selecting pack', code: errorCodeOf(err) });
      }
    });

    socket.on('room:update_settings', (payload, callback) => {
      try {
        const mapping = sessionManager.getSocketMapping(socket.id);
        if (!mapping) return callback({ success: false, error: 'Not in a room', code: 'NOT_IN_ROOM' });

        const session = sessionManager.getSession(mapping.roomCode);
        if (!session) return callback({ success: false, error: 'Room not found', code: 'ROOM_NOT_FOUND' });

        session.updateSettings(mapping.playerId, payload.settings);
        return callback({
          success: true,
          data: {
            gameState: session.getGameState(),
          },
        });
      } catch (err: any) {
        return callback({ success: false, error: err.message || 'Error updating settings', code: errorCodeOf(err) });
      }
    });

    socket.on('game:start_round', (callback) => {
      try {
        const mapping = sessionManager.getSocketMapping(socket.id);
        if (!mapping) return callback({ success: false, error: 'Not in a room', code: 'NOT_IN_ROOM' });

        const session = sessionManager.getSession(mapping.roomCode);
        if (!session) return callback({ success: false, error: 'Room not found', code: 'ROOM_NOT_FOUND' });

        const result = session.startRound(mapping.playerId);
        return callback({
          success: true,
          data: result,
        });
      } catch (err: any) {
        return callback({ success: false, error: err.message || 'Error starting round', code: errorCodeOf(err) });
      }
    });

    socket.on('game:return_to_lobby', (callback) => {
      try {
        const mapping = sessionManager.getSocketMapping(socket.id);
        if (!mapping) return callback({ success: false, error: 'Not in a room', code: 'NOT_IN_ROOM' });

        const session = sessionManager.getSession(mapping.roomCode);
        if (!session) return callback({ success: false, error: 'Room not found', code: 'ROOM_NOT_FOUND' });

        const gameState = session.returnToLobby(mapping.playerId);
        return callback({
          success: true,
          data: { gameState },
        });
      } catch (err: any) {
        return callback({ success: false, error: err.message || 'Error returning to lobby', code: errorCodeOf(err) });
      }
    });

    socket.on('turn:guess_success', (callback) => {
      try {
        const mapping = sessionManager.getSocketMapping(socket.id);
        if (!mapping) return callback({ success: false, error: 'Not in a room', code: 'NOT_IN_ROOM' });

        const session = sessionManager.getSession(mapping.roomCode);
        if (!session) return callback({ success: false, error: 'Room not found', code: 'ROOM_NOT_FOUND' });

        const result = session.recordGuessSuccess(mapping.playerId);
        return callback({
          success: true,
          data: result,
        });
      } catch (err: any) {
        return callback({ success: false, error: err.message || 'Error recording guess', code: errorCodeOf(err) });
      }
    });

    socket.on('turn:foul_triggered', (payload, callback) => {
      try {
        const mapping = sessionManager.getSocketMapping(socket.id);
        if (!mapping) return callback({ success: false, error: 'Not in a room', code: 'NOT_IN_ROOM' });

        const session = sessionManager.getSession(mapping.roomCode);
        if (!session) return callback({ success: false, error: 'Room not found', code: 'ROOM_NOT_FOUND' });

        const dispute = session.triggerFoul(mapping.playerId, payload?.reason);
        return callback({
          success: true,
          data: { dispute },
        });
      } catch (err: any) {
        return callback({ success: false, error: err.message || 'Error triggering foul', code: errorCodeOf(err) });
      }
    });

    socket.on('host:resolve_dispute', (payload, callback) => {
      try {
        const mapping = sessionManager.getSocketMapping(socket.id);
        if (!mapping) return callback({ success: false, error: 'Not in a room', code: 'NOT_IN_ROOM' });

        const session = sessionManager.getSession(mapping.roomCode);
        if (!session) return callback({ success: false, error: 'Room not found', code: 'ROOM_NOT_FOUND' });

        const gameState = session.resolveDispute(mapping.playerId, payload.resolution);
        return callback({
          success: true,
          data: { gameState },
        });
      } catch (err: any) {
        return callback({ success: false, error: err.message || 'Error resolving dispute', code: errorCodeOf(err) });
      }
    });

    socket.on('powerup:use', (payload, callback) => {
      try {
        const mapping = sessionManager.getSocketMapping(socket.id);
        if (!mapping) return callback({ success: false, error: 'Not in a room', code: 'NOT_IN_ROOM' });

        const session = sessionManager.getSession(mapping.roomCode);
        if (!session) return callback({ success: false, error: 'Room not found', code: 'ROOM_NOT_FOUND' });

        const result = session.usePowerUp(mapping.playerId, payload.powerUpId);
        return callback({
          success: true,
          data: result,
        });
      } catch (err: any) {
        return callback({ success: false, error: err.message || 'Error using power-up', code: errorCodeOf(err) });
      }
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
