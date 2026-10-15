import fastify, {FastifyInstance, FastifyReply, FastifyRequest} from 'fastify';
import cors from '@fastify/cors';
import {Server as SocketIOServer} from 'socket.io';
import {DeckEngine, WordPack} from '../core/index.js';
import {RoomSessionManager} from './RoomSessionManager.js';
import {setupSocketHandlers} from './socketHandler.js';
import {ClientToServerEvents, ServerToClientEvents, SocketData,} from './protocol.js';

import {errorCodeOf, GameError} from '../core/errors.js';

export interface CreateServerOptions {
  port?: number;
  host?: string;
  deckEngine?: DeckEngine;
  corsOrigin?: string | boolean | string[];
  adminToken?: string;
}

export interface AppServer {
  app: FastifyInstance;
  io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, any, SocketData>;
  sessionManager: RoomSessionManager;
  deckEngine: DeckEngine;
  start: (port?: number, host?: string) => Promise<string>;
  close: () => Promise<void>;
}

export async function createServer(options: CreateServerOptions = {}): Promise<AppServer> {
  const app = fastify({
    logger: false,
  });

  await app.register(cors, {
    origin: options.corsOrigin ?? true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  });

  const deckEngine = options.deckEngine ?? new DeckEngine();
  const adminToken = options.adminToken ?? process.env.ADMIN_TOKEN ?? 'expresion-admin-secret-key';

  const io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents, any, SocketData>(
    app.server,
    {
      cors: {
        origin: options.corsOrigin ?? '*',
        methods: ['GET', 'POST'],
      },
    }
  );

  const sessionManager = new RoomSessionManager(io, deckEngine);
  setupSocketHandlers(io, sessionManager);

  // Authentication helper for admin routes
  const verifyAdminAuth = async (request: FastifyRequest, reply: FastifyReply) => {
    const headerToken = request.headers['x-admin-token'];
    const authHeader = request.headers['authorization'];
    let bearerToken: string | undefined;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      bearerToken = authHeader.substring(7).trim();
    }

    const providedToken = headerToken || bearerToken;

    if (!providedToken || providedToken !== adminToken) {
      reply.status(401);
      throw new GameError('UNAUTHORIZED', 'Unauthorized: Invalid or missing admin token');
    }
  };

  // Base Health Check
  app.get('/health', async () => {
    return {
      status: 'ok',
      uptime: process.uptime(),
      activeRooms: sessionManager.getActiveSessionsCount(),
    };
  });

  // Public Categories endpoint
  app.get('/api/categories', async () => {
    return {
      success: true,
      data: deckEngine.getCategories(),
    };
  });

  // Public Packs endpoints
  app.get<{ Querystring: { category?: string; isPremium?: string } }>('/api/packs', async (request) => {
    const { category, isPremium } = request.query;
    const filter: { category?: string; isPremium?: boolean } = {};
    if (category) filter.category = category;
    if (isPremium !== undefined) {
      filter.isPremium = isPremium === 'true' || isPremium === '1';
    }

    return {
      success: true,
      data: deckEngine.listPacks(Object.keys(filter).length > 0 ? filter : undefined),
    };
  });

  app.get<{ Params: { id: string } }>('/api/packs/:id', async (request, reply) => {
    const pack = deckEngine.getPack(request.params.id);
    if (!pack) {
      reply.status(404);
      return { success: false, error: 'Word pack not found', code: 'PACK_NOT_FOUND' };
    }
    return { success: true, data: pack };
  });

  app.post<{
    Body: {
      name: string;
      description: string;
      category: string;
      words: string[];
      isPremium?: boolean;
      priceTier?: 'FREE' | 'TIER_1' | 'TIER_2';
    };
  }>('/api/packs', async (request, reply) => {
    try {
      const { name, description, category, words, isPremium, priceTier } = request.body;
      const created = deckEngine.createCustomPack({
        name,
        description,
        category,
        words,
        isPremium: isPremium ?? false,
        priceTier: priceTier ?? 'FREE',
      });
      reply.status(201);
      return { success: true, data: created };
    } catch (err: any) {
      reply.status(400);
      return { success: false, error: err.message, code: errorCodeOf(err) };
    }
  });

  // Public Rooms endpoints
  app.get('/api/rooms', async () => {
    return {
      success: true,
      data: sessionManager.getAllSessions(),
    };
  });

  app.get<{ Params: { code: string } }>('/api/rooms/:code', async (request, reply) => {
    const session = sessionManager.getSession(request.params.code);
    if (!session) {
      reply.status(404);
      return { success: false, error: 'Room not found', code: 'ROOM_NOT_FOUND' };
    }

    // `status` es el de la partida en curso, o null si la sala está reunida sin jugar.
    const snapshot = session.getSnapshot();
    return {
      success: true,
      data: {
        roomCode: session.roomCode,
        status: snapshot.game?.status ?? null,
        playersCount: snapshot.room.players.length,
        ...snapshot,
      },
    };
  });

  // Protected Admin API Endpoints
  app.get('/api/admin/packs', { preHandler: verifyAdminAuth }, async () => {
    const packs = deckEngine.listPacks();
    return {
      success: true,
      data: packs.map((p) => ({
        ...p,
        totalWords: p.words.length,
      })),
    };
  });

  app.post<{
    Body: {
      id?: string;
      name: string;
      description: string;
      category: string;
      words: string[];
      isPremium?: boolean;
      priceTier?: 'FREE' | 'TIER_1' | 'TIER_2';
    };
  }>('/api/admin/packs', { preHandler: verifyAdminAuth }, async (request, reply) => {
    try {
      const { id, name, description, category, words, isPremium, priceTier } = request.body;
      let pack: WordPack;
      if (id) {
        pack = {
          id,
          name,
          description,
          category,
          words,
          isPremium: isPremium ?? false,
          priceTier: priceTier ?? 'FREE',
        };
        deckEngine.registerPack(pack);
      } else {
        pack = deckEngine.createCustomPack({
          name,
          description,
          category,
          words,
          isPremium: isPremium ?? false,
          priceTier: priceTier ?? 'FREE',
        });
      }

      reply.status(201);
      return { success: true, data: pack };
    } catch (err: any) {
      reply.status(400);
      return { success: false, error: err.message, code: errorCodeOf(err) };
    }
  });

  app.put<{
    Params: { id: string };
    Body: Partial<Omit<WordPack, 'id'>>;
  }>('/api/admin/packs/:id', { preHandler: verifyAdminAuth }, async (request, reply) => {
    try {
      const updated = deckEngine.updatePack(request.params.id, request.body);
      return { success: true, data: updated };
    } catch (err: any) {
      const isNotFound = errorCodeOf(err) === 'PACK_NOT_FOUND';
      reply.status(isNotFound ? 404 : 400);
      return { success: false, error: err.message, code: errorCodeOf(err) };
    }
  });

  app.delete<{ Params: { id: string } }>(
    '/api/admin/packs/:id',
    { preHandler: verifyAdminAuth },
    async (request, reply) => {
      const deleted = deckEngine.deletePack(request.params.id);
      if (!deleted) {
        reply.status(404);
        return { success: false, error: `Word pack with id '${request.params.id}' not found`, code: 'PACK_NOT_FOUND' };
      }
      return { success: true, data: { deletedId: request.params.id } };
    }
  );

  app.get('/api/admin/packs/export', { preHandler: verifyAdminAuth }, async () => {
    return {
      success: true,
      data: deckEngine.exportPacks(),
    };
  });

  app.post<{
    Body: {
      packs: WordPack[];
      overwrite?: boolean;
    };
  }>('/api/admin/packs/import', { preHandler: verifyAdminAuth }, async (request, reply) => {
    try {
      const { packs, overwrite } = request.body;
      if (!Array.isArray(packs)) {
        reply.status(400);
        return { success: false, error: 'Expected an array of packs', code: 'INVALID_IMPORT' };
      }

      const result = deckEngine.importPacks(packs, overwrite ?? true);
      return { success: true, data: result };
    } catch (err: any) {
      reply.status(400);
      return { success: false, error: err.message, code: errorCodeOf(err) };
    }
  });

  const start = async (port?: number, host?: string): Promise<string> => {
    const targetPort = port ?? options.port ?? 3000;
    const targetHost = host ?? options.host ?? '0.0.0.0';
    return await app.listen({ port: targetPort, host: targetHost });
  };

  const close = async (): Promise<void> => {
    sessionManager.destroyAll();
    io.close();
    await app.close();
  };

  return {
    app,
    io,
    sessionManager,
    deckEngine,
    start,
    close,
  };
}
