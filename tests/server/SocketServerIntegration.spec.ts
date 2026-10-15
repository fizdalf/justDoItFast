import {afterEach, beforeEach, describe, expect, it} from 'vitest';
import {io as ioClient, Socket as ClientSocket} from 'socket.io-client';
import {AppServer, createServer} from '../../src/server/server.js';
import {ApiResponse, ClientToServerEvents, RoomSnapshot, ServerToClientEvents,} from '../../src/server/protocol.js';
import {DisputeState, GameSettings, GameState, Player, TurnState} from '../../src/core/types.js';

type TestClientSocket = ClientSocket<ServerToClientEvents, ClientToServerEvents>;
type JoinData = RoomSnapshot & { player: Player; sessionToken: string };

function emitAsync<T>(
  socket: TestClientSocket,
  event: keyof ClientToServerEvents,
  payload?: any
): Promise<ApiResponse<T>> {
  return new Promise((resolve) => {
    if (payload !== undefined) {
      (socket.emit as any)(event, payload, (res: ApiResponse<T>) => {
        resolve(res);
      });
    } else {
      (socket.emit as any)(event, (res: ApiResponse<T>) => {
        resolve(res);
      });
    }
  });
}

function waitForEvent<T>(socket: TestClientSocket, event: keyof ServerToClientEvents): Promise<T> {
  return new Promise((resolve) => {
    socket.once(event as any, (data: T) => {
      resolve(data);
    });
  });
}

/** Espera al siguiente room:state_updated que cumpla la condición. */
function waitForSnapshot(socket: TestClientSocket, predicate: (s: RoomSnapshot) => boolean): Promise<RoomSnapshot> {
  return new Promise((resolve) => {
    const listener = (snapshot: RoomSnapshot) => {
      if (!predicate(snapshot)) return;
      socket.off('room:state_updated', listener);
      resolve(snapshot);
    };
    socket.on('room:state_updated', listener);
  });
}

function dataOf<T>(res: ApiResponse<T>): T {
  if (!res.success) throw new Error(`Expected success, got ${res.code}: ${res.error}`);
  return res.data;
}

describe('Socket.io Real-Time Game Server Integration', () => {
  let server: AppServer;
  let socketUrl: string;
  let clientSockets: TestClientSocket[] = [];

  beforeEach(async () => {
    server = await createServer({
      port: 0,
      host: '127.0.0.1',
    });

    await server.start(0, '127.0.0.1');
    const addr = server.app.server.address() as any;
    socketUrl = `http://127.0.0.1:${addr.port}`;
    clientSockets = [];
  });

  afterEach(async () => {
    for (const socket of clientSockets) {
      if (socket.connected) {
        socket.disconnect();
      }
    }
    await server.close();
  });

  function createClient(): Promise<TestClientSocket> {
    return new Promise((resolve) => {
      const socket: TestClientSocket = ioClient(socketUrl, {
        transports: ['websocket'],
        forceNew: true,
      });
      clientSockets.push(socket);
      socket.on('connect', () => {
        resolve(socket);
      });
    });
  }

  function sessionOf(roomCode: string) {
    return server.sessionManager.getSession(roomCode)!;
  }

  function gameOf(roomCode: string): GameState {
    const game = sessionOf(roomCode).getSnapshot().game;
    if (!game) throw new Error('Expected a game in progress');
    return game;
  }

  /** Sala con 4 jugadores (A1 anfitrión, B1, A2, B2) y, opcionalmente, ajustes para la próxima partida. */
  async function setupFourPlayers(settings: Partial<GameSettings> = {}) {
    const host = await createClient();
    const p2 = await createClient();
    const p3 = await createClient();
    const p4 = await createClient();

    const hostRes = dataOf(await emitAsync<JoinData>(host, 'room:create', { playerName: 'Alice' }));
    const roomCode = hostRes.room.roomCode;
    const joins: JoinData[] = [];
    for (const [socket, name] of [[p2, 'Bob'], [p3, 'Charlie'], [p4, 'Diana']] as const) {
      joins.push(dataOf(await emitAsync<JoinData>(socket, 'room:join', { roomCode, playerName: name })));
    }
    if (Object.keys(settings).length > 0) {
      dataOf(await emitAsync(host, 'room:update_setup', { settings }));
    }

    const socketsById = new Map<string, TestClientSocket>([
      [hostRes.player.id, host],
      [joins[0].player.id, p2],
      [joins[1].player.id, p3],
      [joins[2].player.id, p4],
    ]);
    return { host, p2, p3, p4, roomCode, hostRes, joins, socketsById };
  }

  function disconnectAndWait(socket: TestClientSocket, roomCode: string, playerId: string) {
    socket.disconnect();
    return new Promise<void>((resolve) => {
      const check = () =>
        server.sessionManager.getSession(roomCode)?.getPlayer(playerId)?.isConnected === false
          ? resolve()
          : setTimeout(check, 10);
      check();
    });
  }

  it('allows host to create a room and receive the initial room snapshot', async () => {
    const hostSocket = await createClient();

    const res = await emitAsync<JoinData>(hostSocket, 'room:create', { playerName: 'Host Alice' });

    expect(res.success).toBe(true);
    if (!res.success) return;

    expect(res.data.room.roomCode).toHaveLength(4);
    expect(res.data.player.name).toBe('Host Alice');
    expect(res.data.player.isHost).toBe(true);
    expect(res.data.player.team).toBe('A');
    expect(res.data.room.hostPlayerId).toBe(res.data.player.id);
    expect(res.data.room.setup.packIds).toEqual(['classic-1996']);
    expect(res.data.room.setup.settings.maxPowerUpsPerTeam).toBe(2);
    expect(res.data.room.history).toEqual([]);
    expect(res.data.game).toBeNull();
  });

  it('gives a joining player the current member list (response and broadcast)', async () => {
    const host = await createClient();
    const joiner = await createClient();

    const createRes = dataOf(await emitAsync<JoinData>(host, 'room:create', { playerName: 'Alice' }));
    const roomCode = createRes.room.roomCode;

    // The broadcast sent while joining must also reach the joining socket
    const stateForJoiner = waitForEvent<RoomSnapshot>(joiner, 'room:state_updated');
    const joinRes = dataOf(await emitAsync<JoinData>(joiner, 'room:join', { roomCode, playerName: 'Bob' }));

    expect(joinRes.room.players.map((p) => p.name)).toEqual(['Alice', 'Bob']);

    const broadcast = await stateForJoiner;
    expect(broadcast.room.players.map((p) => p.name)).toEqual(['Alice', 'Bob']);
    expect(broadcast.game).toBeNull();
  });

  it('allows 4 players to join, balances teams and orders seats', async () => {
    const { roomCode, joins } = await setupFourPlayers();

    expect(joins.map((j) => j.player.team)).toEqual(['B', 'A', 'B']);

    const players = sessionOf(roomCode).getPlayers();
    expect(players.length).toBe(4);
    expect(players.map((p) => p.team)).toEqual(['A', 'B', 'A', 'B']);
  });

  it('runs a full round cycle: start game, guess words, pass the bomb', async () => {
    const { host, p2, hostRes } = await setupFourPlayers();

    const roundStarted = waitForEvent<any>(p2, 'game:round_started');
    const startRes = dataOf(await emitAsync<RoomSnapshot>(host, 'game:start'));

    expect(startRes.game).not.toBeNull();
    expect(startRes.game!.status).toBe('PLAYING');
    expect(startRes.game!.gameNumber).toBe(1);
    expect(startRes.game!.roundNumber).toBe(1);
    expect(startRes.game!.participantIds).toHaveLength(4);
    expect(startRes.game!.currentTurn!.activePlayerId).toBe(hostRes.player.id);
    expect(startRes.game!.currentTurn!.currentWord).toBeTruthy();

    const started = await roundStarted;
    expect(started.roundNumber).toBe(1);
    expect(started.game.status).toBe('PLAYING');

    // Active player (Host Alice) hits guess success
    const turnChangePromise = waitForEvent<any>(p2, 'turn:changed');
    const guessRes = await emitAsync<{ isFastGuess: boolean; currentTurn: TurnState }>(host, 'turn:guess_success');
    expect(guessRes.success).toBe(true);

    const turnChangeEvent = await turnChangePromise;
    expect(turnChangeEvent.currentTurn.activeTeam).toBe('B');
    expect(typeof turnChangeEvent.currentTurn.activePlayerId).toBe('string');
    expect(turnChangeEvent.currentTurn.activePlayerId.length).toBeGreaterThan(0);
  });

  it('handles dispute mediation: rival triggers foul, freezes round, host resolves', async () => {
    const { host, p2, p3 } = await setupFourPlayers();
    await emitAsync(host, 'game:start');

    // Rival (Bob on Team B) calls foul while Alice (Team A) is active
    const disputePromise = waitForEvent<{ dispute: DisputeState; game: GameState }>(host, 'game:dispute_started');

    const foulRes = await emitAsync<{ dispute: DisputeState }>(p2, 'turn:foul_triggered');
    expect(foulRes.success).toBe(true);

    const disputeEvent = await disputePromise;
    expect(disputeEvent.dispute.triggeredByTeam).toBe('B');
    expect(disputeEvent.game.status).toBe('DISPUTE_PAUSED');

    // Host Alice resolves dispute in favor of Team B
    const resolvePromise = waitForEvent<{ resolution: string; game: GameState }>(p3, 'game:dispute_resolved');

    const resolveRes = await emitAsync<RoomSnapshot>(host, 'host:resolve_dispute', { resolution: 'AWARD_TEAM_B' });
    expect(resolveRes.success).toBe(true);
    expect(dataOf(resolveRes).game!.status).toBe('ROUND_OVER');

    const resolveEvent = await resolvePromise;
    expect(resolveEvent.game.status).toBe('ROUND_OVER');
    expect(resolveEvent.game.scores.B).toBe(1);
    expect(resolveEvent.game.scores.A).toBe(0);
  });

  it('handles fast guess power-up reward and activation', async () => {
    const { host, p2, p3, roomCode } = await setupFourPlayers({ fastGuessThresholdSec: 10 });
    await emitAsync(host, 'game:start');

    // Alice guesses fast
    const guessRes = await emitAsync<{ isFastGuess: boolean; currentTurn: TurnState }>(host, 'turn:guess_success');
    expect(guessRes.success).toBe(true);
    expect((guessRes as any).data.isFastGuess).toBe(true);

    const inventoryA = gameOf(roomCode).teamInventory.A;
    expect(inventoryA.length).toBeGreaterThan(0);

    const powerUp = inventoryA[0];

    // Charlie (on Team A) activates the power-up
    const powerUpPromise = waitForEvent<any>(p2, 'powerup:activated');
    const useRes = await emitAsync<{ powerUpType: string }>(p3, 'powerup:use', { powerUpId: powerUp.id });
    expect(useRes.success).toBe(true);

    const activatedEvent = await powerUpPromise;
    expect(activatedEvent.powerUp.id).toBe(powerUp.id);
    expect(activatedEvent.activatedByTeam).toBe('A');
  });

  it('handles player disconnection gracefully during a game round', async () => {
    const { host, p2, roomCode } = await setupFourPlayers();
    await emitAsync(host, 'game:start');

    // Bob disconnects
    p2.disconnect();

    await new Promise((r) => setTimeout(r, 100));

    const bob = sessionOf(roomCode).getPlayers().find((p) => p.name === 'Bob');
    expect(bob?.isConnected).toBe(false);
    // Sigue siendo participante: puede volver
    expect(gameOf(roomCode).participantIds).toContain(bob!.id);
  });

  it('provides REST endpoints for health check, room inspection and word pack catalog', async () => {
    const resHealth = await server.app.inject({ method: 'GET', url: '/health' });
    expect(resHealth.statusCode).toBe(200);
    const healthJson = JSON.parse(resHealth.payload);
    expect(healthJson.status).toBe('ok');

    const resPacks = await server.app.inject({ method: 'GET', url: '/api/packs' });
    expect(resPacks.statusCode).toBe(200);
    const packsJson = JSON.parse(resPacks.payload);
    expect(packsJson.success).toBe(true);
    expect(packsJson.data.length).toBeGreaterThanOrEqual(4);

    const resCreatePack = await server.app.inject({
      method: 'POST',
      url: '/api/packs',
      payload: {
        name: 'Mazo Especial Test',
        description: 'Pack de prueba para tests',
        category: 'Tests',
        words: ['PALABRA1', 'PALABRA2', 'PALABRA3', 'PALABRA4', 'PALABRA5'],
        isPremium: false,
      },
    });
    expect(resCreatePack.statusCode).toBe(201);
    const createJson = JSON.parse(resCreatePack.payload);
    expect(createJson.success).toBe(true);
    expect(createJson.data.id).toBeTruthy();
  });

  it('exposes rooms (and their current game) over REST', async () => {
    const { host, roomCode } = await setupFourPlayers();

    const before = JSON.parse((await server.app.inject({ method: 'GET', url: `/api/rooms/${roomCode}` })).payload);
    expect(before.success).toBe(true);
    expect(before.data).toMatchObject({ roomCode, status: null, playersCount: 4, game: null });
    expect(before.data.room.players).toHaveLength(4);

    await emitAsync(host, 'game:start');

    const list = JSON.parse((await server.app.inject({ method: 'GET', url: '/api/rooms' })).payload);
    expect(list.data).toEqual([
      { roomCode, playersCount: 4, gameNumber: 1, status: 'PLAYING', gamesPlayed: 0 },
    ]);

    const during = JSON.parse((await server.app.inject({ method: 'GET', url: `/api/rooms/${roomCode}` })).payload);
    expect(during.data.status).toBe('PLAYING');
    expect(during.data.game.gameNumber).toBe(1);

    const missing = await server.app.inject({ method: 'GET', url: '/api/rooms/ZZZZ' });
    expect(missing.statusCode).toBe(404);
    expect(JSON.parse(missing.payload).code).toBe('ROOM_NOT_FOUND');
  });

  it('rejects game:start from non-host players or with insufficient players', async () => {
    const host = await createClient();
    const p2 = await createClient();

    const createRes = dataOf(await emitAsync<JoinData>(host, 'room:create', { playerName: 'Alice' }));
    const roomCode = createRes.room.roomCode;

    await emitAsync(p2, 'room:join', { roomCode, playerName: 'Bob' });

    // Host attempts to start with only 2 players -> should fail
    const startFail1 = await emitAsync(host, 'game:start');
    expect(startFail1).toMatchObject({ success: false, code: 'NOT_ENOUGH_PLAYERS' });

    // Non-host attempts to start -> should fail
    const startFail2 = await emitAsync(p2, 'game:start');
    expect(startFail2).toMatchObject({ success: false, code: 'NOT_HOST' });

    expect(sessionOf(roomCode).getSnapshot().game).toBeNull();
  });

  it('requires 2 connected players per team to start a game', async () => {
    const { host, p4, roomCode, joins } = await setupFourPlayers();
    await disconnectAndWait(p4, roomCode, joins[2].player.id);

    expect(await emitAsync(host, 'game:start')).toMatchObject({ success: false, code: 'NOT_ENOUGH_PLAYERS' });
  });

  it('returns stable error codes instead of display texts', async () => {
    const client = await createClient();

    const missingRoom = await emitAsync(client, 'room:join', { roomCode: 'ZZZZ', playerName: 'Eve' });
    expect(missingRoom).toMatchObject({ success: false, code: 'ROOM_NOT_FOUND' });

    const noName = await emitAsync(client, 'room:create', { playerName: '  ' });
    expect(noName).toMatchObject({ success: false, code: 'NAME_REQUIRED' });

    const notInRoom = await emitAsync(client, 'turn:guess_success');
    expect(notInRoom).toMatchObject({ success: false, code: 'NOT_IN_ROOM' });

    expect(await emitAsync(client, 'game:start')).toMatchObject({ success: false, code: 'NOT_IN_ROOM' });
  });

  it('allows switching team and preparing the next game in the room', async () => {
    const host = await createClient();
    const p2 = await createClient();

    const createRes = dataOf(await emitAsync<JoinData>(host, 'room:create', { playerName: 'Alice' }));
    const roomCode = createRes.room.roomCode;
    const bob = dataOf(await emitAsync<JoinData>(p2, 'room:join', { roomCode, playerName: 'Bob' }));

    // Switch team of Bob to A
    const switchRes = dataOf(await emitAsync<RoomSnapshot>(p2, 'room:switch_team', { targetTeam: 'A' }));
    expect(switchRes.room.players.find((p) => p.id === bob.player.id)!.team).toBe('A');

    // Host prepares packs and settings
    const setupRes = dataOf(
      await emitAsync<RoomSnapshot>(host, 'room:update_setup', {
        packIds: ['pop-culture'],
        settings: { targetScore: 7 },
      })
    );
    expect(setupRes.room.setup.packIds).toEqual(['pop-culture']);
    expect(setupRes.room.setup.settings.targetScore).toBe(7);

    // Partial updates keep the rest
    const settingsOnly = dataOf(await emitAsync<RoomSnapshot>(host, 'room:update_setup', { settings: { freezeDurationSec: 4 } }));
    expect(settingsOnly.room.setup.packIds).toEqual(['pop-culture']);
    expect(settingsOnly.room.setup.settings).toMatchObject({ targetScore: 7, freezeDurationSec: 4 });
  });

  it('validates the setup, shares it with everyone and freezes it into the game', async () => {
    const { host, p2, roomCode } = await setupFourPlayers();

    expect(await emitAsync(p2, 'room:update_setup', { settings: { targetScore: 8 } }))
      .toMatchObject({ success: false, code: 'NOT_HOST' });
    expect(await emitAsync(host, 'room:update_setup', { settings: { targetScore: -1 } }))
      .toMatchObject({ success: false, code: 'INVALID_SETTINGS' });
    expect(await emitAsync(host, 'room:update_setup', { settings: { maxRoundDurationSec: 9999 } }))
      .toMatchObject({ success: false, code: 'INVALID_SETTINGS' });
    expect(await emitAsync(host, 'room:update_setup', { packIds: [] }))
      .toMatchObject({ success: false, code: 'NO_PACKS_SELECTED' });
    expect(await emitAsync(host, 'room:update_setup', { packIds: ['classic-1996', 'nope'] }))
      .toMatchObject({ success: false, code: 'PACK_NOT_FOUND' });
    // A rejected change does not apply any part of it
    expect(await emitAsync(host, 'room:update_setup', { settings: { targetScore: 9 }, packIds: [] }))
      .toMatchObject({ success: false, code: 'NO_PACKS_SELECTED' });
    expect(sessionOf(roomCode).getSnapshot().room.setup.settings.targetScore).toBe(5);

    const update = waitForEvent<RoomSnapshot>(p2, 'room:state_updated');
    const res = await emitAsync(host, 'room:update_setup', {
      settings: { targetScore: 8, maxPowerUpsPerTeam: 3, freezeDurationSec: 4, enabledPowerUps: ['SKIP', 'FREEZE'] },
      packIds: ['pop-culture', 'pop-culture', 'classic-1996'],
    });
    expect(res.success).toBe(true);

    const { room } = await update;
    expect(room.setup.settings).toMatchObject({ targetScore: 8, maxPowerUpsPerTeam: 3, freezeDurationSec: 4 });
    expect(room.setup.settings.enabledPowerUps).toEqual(['SKIP', 'FREEZE']);
    expect(room.setup.packIds).toEqual(['pop-culture', 'classic-1996']);

    const { game } = dataOf(await emitAsync<RoomSnapshot>(host, 'game:start'));
    expect(game!.targetScore).toBe(8);
    expect(game!.boardTiles).toHaveLength(9);
    expect(game!.settings).toMatchObject({ maxPowerUpsPerTeam: 3, freezeDurationSec: 4 });
    expect(game!.settings.enabledPowerUps).toEqual(['SKIP', 'FREEZE']);
    expect(game!.packIds).toEqual(['pop-culture', 'classic-1996']);
  });

  it('combines several packs in one game deck', async () => {
    const { host, roomCode, socketsById } = await setupFourPlayers();
    server.deckEngine.registerPack({
      id: 'test-animals', name: 'Animales', description: 'T', category: 'Animales', isPremium: false,
      words: ['PERRO', 'GATO', 'LEÓN', 'TIGRE', 'LOBO'],
    });
    server.deckEngine.registerPack({
      id: 'test-food', name: 'Comida', description: 'T', category: 'Comida', isPremium: false,
      words: ['PAN', 'QUESO', 'SOPA', 'ARROZ', 'HUEVO'],
    });

    const setupRes = dataOf(await emitAsync<RoomSnapshot>(host, 'room:update_setup', { packIds: ['test-animals', 'test-food'] }));
    expect(setupRes.room.setup.packIds).toEqual(['test-animals', 'test-food']);

    const { game } = dataOf(await emitAsync<RoomSnapshot>(host, 'game:start'));
    expect(game!.packIds).toEqual(['test-animals', 'test-food']);

    // 10 cartas en total: la primera + 9 aciertos las sacan todas
    const seen: TurnState[] = [game!.currentTurn!];
    for (let i = 0; i < 9; i++) {
      const active = gameOf(roomCode).currentTurn!.activePlayerId;
      const res = dataOf(await emitAsync<{ currentTurn: TurnState }>(socketsById.get(active)!, 'turn:guess_success'));
      seen.push(res.currentTurn);
    }

    expect(new Set(seen.map((t) => t.currentWord)).size).toBe(10);
    expect(new Set(seen.map((t) => t.category))).toEqual(new Set(['Animales', 'Comida']));
    for (const turn of seen) {
      expect(turn.category).toBe(['PERRO', 'GATO', 'LEÓN', 'TIGRE', 'LOBO'].includes(turn.currentWord) ? 'Animales' : 'Comida');
    }
  });

  it('emits authoritative timer ticks and handles round explosion', async () => {
    // Short duration (2.5s) so we get ticks and explosion
    const { host, p2, roomCode } = await setupFourPlayers({
      minRoundDurationSec: 2.5,
      maxRoundDurationSec: 2.5,
      targetScore: 2,
    });

    const tickPromise = waitForEvent<any>(host, 'timer:tick');
    const explodePromise = waitForEvent<any>(p2, 'timer:exploded');

    await emitAsync(host, 'game:start');

    const tickData = await tickPromise;
    expect(tickData).toBeDefined();
    expect(typeof tickData.elapsedMs).toBe('number');
    expect(typeof tickData.remainingMs).toBe('number');

    const explodeData = await explodePromise;
    expect(explodeData).toBeDefined();
    expect(explodeData.losingTeam).toBe('A');
    expect(explodeData.winningTeam).toBe('B');
    expect(explodeData.scores.B).toBe(1);

    const stateAfter = gameOf(roomCode);
    expect(stateAfter.status).toBe('ROUND_OVER');
    expect(stateAfter.lastRoundResult).toMatchObject({
      reason: 'EXPLOSION',
      winningTeam: 'B',
      losingTeam: 'A',
      explodedPlayerId: explodeData.explodedPlayerId,
    });
    expect(stateAfter.lastRoundResult?.explodedWord).toBeTruthy();
  });

  it('plays rounds through ROUND_OVER to GAME_OVER, records the summary and lets the host return to the room', async () => {
    const { host, p2, p3, roomCode } = await setupFourPlayers({ targetScore: 2 });

    const playRoundAwardedToB = async (start: 'game:start' | 'game:start_round') => {
      const startRes = await emitAsync(host, start);
      expect(startRes.success).toBe(true);
      expect(gameOf(roomCode).lastRoundResult).toBeUndefined();

      const activeTeam = gameOf(roomCode).currentTurn!.activeTeam;
      const rival = activeTeam === 'A' ? p2 : host;
      await emitAsync(rival, 'turn:foul_triggered');
      const resolveRes = await emitAsync<RoomSnapshot>(host, 'host:resolve_dispute', { resolution: 'AWARD_TEAM_B' });
      expect(resolveRes.success).toBe(true);
      return dataOf(resolveRes);
    };

    // Round 1 -> ROUND_OVER with a recorded result
    const afterRound1 = await playRoundAwardedToB('game:start');
    expect(afterRound1.game!.status).toBe('ROUND_OVER');
    expect(afterRound1.game!.lastRoundResult).toMatchObject({ reason: 'DISPUTE', winningTeam: 'B' });
    expect(afterRound1.room.history).toEqual([]);

    // Only from ROUND_OVER
    const gameOverPromise = waitForEvent<{ winner: string; finalScores: any; game: GameState }>(p3, 'game:over');

    // Round 2 -> GAME_OVER
    const afterRound2 = await playRoundAwardedToB('game:start_round');
    expect(afterRound2.game!.status).toBe('GAME_OVER');
    expect(afterRound2.game!.winningTeam).toBe('B');

    const gameOver = await gameOverPromise;
    expect(gameOver.winner).toBe('B');
    expect(gameOver.finalScores).toEqual({ A: 0, B: 2 });
    expect(gameOver.game.status).toBe('GAME_OVER');

    // The summary is recorded as soon as the game is over; the podium stays until the host closes it
    expect(afterRound2.room.history).toHaveLength(1);
    expect(afterRound2.room.history[0]).toMatchObject({
      gameNumber: 1,
      finished: true,
      winningTeam: 'B',
      scores: { A: 0, B: 2 },
      roundsPlayed: 2,
      packIds: ['classic-1996'],
    });
    expect(typeof afterRound2.room.history[0].endedAt).toBe('number');

    // A finished game cannot be restarted directly
    expect(await emitAsync(host, 'game:start_round')).toMatchObject({ success: false, code: 'INVALID_STATE' });
    expect(await emitAsync(host, 'game:start')).toMatchObject({ success: false, code: 'INVALID_STATE' });

    // Only the host can end it
    expect(await emitAsync(p2, 'game:end')).toMatchObject({ success: false, code: 'NOT_HOST' });

    const roomPromise = waitForSnapshot(p3, (s) => s.game === null);
    const endRes = dataOf(await emitAsync<RoomSnapshot>(host, 'game:end'));
    expect(endRes.game).toBeNull();
    expect(endRes.room.history).toHaveLength(1);

    const roomEvent = await roomPromise;
    expect(roomEvent.room.history).toHaveLength(1);
    expect(roomEvent.room.players).toHaveLength(4);
    expect(roomEvent.room.setup.settings.targetScore).toBe(2); // setup persists between games

    // Nothing to end any more
    expect(await emitAsync(host, 'game:end')).toMatchObject({ success: false, code: 'INVALID_STATE' });

    // And a fresh game can start
    const newGame = dataOf(await emitAsync<RoomSnapshot>(host, 'game:start')).game!;
    expect(newGame.gameNumber).toBe(2);
    expect(newGame.roundNumber).toBe(1);
    expect(newGame.scores).toEqual({ A: 0, B: 0 });
    expect(newGame.winningTeam).toBeUndefined();
    expect(newGame.teamInventory).toEqual({ A: [], B: [] });
  });

  it('lets the host abandon a game mid-round: unfinished summary, back to the room, timers stopped', async () => {
    const { host, p2, p3, roomCode } = await setupFourPlayers();
    await emitAsync(host, 'game:start');
    // Un punto para B antes de abandonar
    await emitAsync(p2, 'turn:foul_triggered');
    await emitAsync(host, 'host:resolve_dispute', { resolution: 'AWARD_TEAM_B' });
    await emitAsync(host, 'game:start_round');

    const roomPromise = waitForSnapshot(p3, (s) => s.game === null);
    const endRes = dataOf(await emitAsync<RoomSnapshot>(host, 'game:end'));

    expect(endRes.game).toBeNull();
    expect(endRes.room.history).toHaveLength(1);
    expect(endRes.room.history[0]).toMatchObject({
      gameNumber: 1,
      finished: false,
      scores: { A: 0, B: 1 },
      roundsPlayed: 2,
      packIds: ['classic-1996'],
    });
    expect(endRes.room.history[0].winningTeam).toBeUndefined();
    expect((await roomPromise).room.history[0].finished).toBe(false);

    // The bomb of the abandoned game no longer ticks
    let ticks = 0;
    p3.on('timer:tick', () => ticks++);
    await new Promise((r) => setTimeout(r, 1500));
    expect(ticks).toBe(0);

    // Game actions now have no game to act on
    expect(await emitAsync(host, 'turn:guess_success')).toMatchObject({ success: false, code: 'INVALID_STATE' });
    expect(await emitAsync(p2, 'turn:foul_triggered')).toMatchObject({ success: false, code: 'INVALID_STATE' });
    expect(await emitAsync(host, 'game:start_round')).toMatchObject({ success: false, code: 'INVALID_STATE' });

    const next = dataOf(await emitAsync<RoomSnapshot>(host, 'game:start')).game!;
    expect(next.gameNumber).toBe(2);
  });

  it('rejects team switches, setup changes and a second game while a game is in progress', async () => {
    const { host, p2 } = await setupFourPlayers();
    await emitAsync(host, 'game:start');

    expect(await emitAsync(p2, 'room:switch_team', { targetTeam: 'A' }))
      .toMatchObject({ success: false, code: 'INVALID_STATE' });
    expect(await emitAsync(host, 'room:update_setup', { settings: { targetScore: 3 } }))
      .toMatchObject({ success: false, code: 'INVALID_STATE' });
    expect(await emitAsync(host, 'room:update_setup', { packIds: ['pop-culture'] }))
      .toMatchObject({ success: false, code: 'INVALID_STATE' });
    expect(await emitAsync(host, 'game:start')).toMatchObject({ success: false, code: 'INVALID_STATE' });
  });

  it('reserves game control to the room host', async () => {
    const { host, p2, p3 } = await setupFourPlayers();

    expect(await emitAsync(p2, 'game:start')).toMatchObject({ success: false, code: 'NOT_HOST' });
    expect(await emitAsync(p2, 'room:update_setup', { packIds: ['pop-culture'] }))
      .toMatchObject({ success: false, code: 'NOT_HOST' });

    await emitAsync(host, 'game:start');
    await emitAsync(p2, 'turn:foul_triggered');

    expect(await emitAsync(p3, 'host:resolve_dispute', { resolution: 'AWARD_TEAM_A' }))
      .toMatchObject({ success: false, code: 'NOT_HOST' });
    expect(await emitAsync(p3, 'game:end')).toMatchObject({ success: false, code: 'NOT_HOST' });

    await emitAsync(host, 'host:resolve_dispute', { resolution: 'AWARD_TEAM_A' });
    expect(await emitAsync(p3, 'game:start_round')).toMatchObject({ success: false, code: 'NOT_HOST' });
    expect(dataOf(await emitAsync<RoomSnapshot>(host, 'game:start_round')).game!.roundNumber).toBe(2);
  });

  it('makes a player who joins mid-game a spectator until the next game', async () => {
    const { host, roomCode, socketsById } = await setupFourPlayers({ fastGuessThresholdSec: 10 });
    await emitAsync(host, 'game:start');
    // Team A gets a power-up
    await emitAsync(host, 'turn:guess_success');
    const powerUp = gameOf(roomCode).teamInventory.A[0];

    const late = await createClient();
    const lateRes = dataOf(await emitAsync<JoinData>(late, 'room:join', { roomCode, playerName: 'Eve' }));
    const eveId = lateRes.player.id;

    // Joins the room (smaller team... both have 2, so A) but not the game
    expect(lateRes.player.team).toBe('A');
    expect(lateRes.room.players).toHaveLength(5);
    expect(lateRes.game).not.toBeNull();
    expect(lateRes.game!.participantIds).not.toContain(eveId);
    expect(lateRes.game!.participantIds).toHaveLength(4);

    // Eve is on team A (the defending team is B now), so she could foul and use A's power-up if she played
    expect(gameOf(roomCode).currentTurn!.activeTeam).toBe('B');
    expect(await emitAsync(late, 'turn:foul_triggered')).toMatchObject({ success: false, code: 'NOT_A_PARTICIPANT' });
    expect(await emitAsync(late, 'powerup:use', { powerUpId: powerUp.id }))
      .toMatchObject({ success: false, code: 'NOT_A_PARTICIPANT' });
    expect(await emitAsync(late, 'turn:guess_success')).toMatchObject({ success: false, code: 'NOT_A_PARTICIPANT' });
    expect(gameOf(roomCode).status).toBe('PLAYING');

    // The bomb never reaches the spectator
    const holders = new Set<string>();
    for (let i = 0; i < 6; i++) {
      const active = gameOf(roomCode).currentTurn!.activePlayerId;
      holders.add(active);
      dataOf(await emitAsync(socketsById.get(active)!, 'turn:guess_success'));
    }
    expect(holders.has(eveId)).toBe(false);

    // Next game: Eve takes part
    await emitAsync(host, 'game:end');
    const next = dataOf(await emitAsync<RoomSnapshot>(host, 'game:start')).game!;
    expect(next.participantIds).toContain(eveId);
    expect(next.participantIds).toHaveLength(5);
  });

  it('removes a participant who leaves from the rotation and hands over the bomb they were holding', async () => {
    const { host, p3, roomCode, hostRes, joins } = await setupFourPlayers();
    await emitAsync(host, 'game:start');
    expect(gameOf(roomCode).currentTurn!.activePlayerId).toBe(hostRes.player.id);

    const turnChanged = waitForEvent<any>(p3, 'turn:changed');
    await emitAsync(host, 'room:leave');

    const changed = await turnChanged;
    expect(changed.currentTurn.activePlayerId).toBe(joins[1].player.id); // Charlie, same team
    const game = gameOf(roomCode);
    expect(game.participantIds).not.toContain(hostRes.player.id);
    expect(game.participantIds).toHaveLength(3);
    // Host role moves on
    expect(sessionOf(roomCode).getSnapshot().room.hostPlayerId).not.toBe(hostRes.player.id);
  });

  it('lets a host who is a spectator manage the game', async () => {
    const { host, p2, p3, p4, roomCode, hostRes, joins } = await setupFourPlayers();
    await emitAsync(host, 'game:start');

    const late = await createClient();
    const eve = dataOf(await emitAsync<JoinData>(late, 'room:join', { roomCode, playerName: 'Eve' }));

    // Everyone but Eve drops; then the host leaves for good, so the host role goes to Eve
    for (const [socket, j] of [[p2, joins[0]], [p3, joins[1]], [p4, joins[2]]] as const) {
      await disconnectAndWait(socket, roomCode, j.player.id);
    }
    await emitAsync(host, 'room:leave');
    expect(sessionOf(roomCode).getSnapshot().room.hostPlayerId).toBe(eve.player.id);

    // The others come back
    const back: TestClientSocket[] = [];
    for (const j of joins) {
      const socket = await createClient();
      dataOf(await emitAsync(socket, 'room:rejoin', { roomCode, sessionToken: j.sessionToken }));
      back.push(socket);
    }
    const [bob, charlie] = back;

    const game = gameOf(roomCode);
    expect(game.participantIds).not.toContain(eve.player.id);
    expect(game.participantIds).not.toContain(hostRes.player.id);

    // Eve still cannot play...
    expect(await emitAsync(late, 'turn:guess_success')).toMatchObject({ success: false, code: 'NOT_A_PARTICIPANT' });

    // ...but resolves disputes, starts rounds and ends the game
    const rival = game.currentTurn!.activeTeam === 'A' ? bob : charlie;
    dataOf(await emitAsync(rival, 'turn:foul_triggered'));
    expect(dataOf(await emitAsync<RoomSnapshot>(late, 'host:resolve_dispute', { resolution: 'RESTART_ROUND' })).game!.status)
      .toBe('PLAYING');
    dataOf(await emitAsync(rival, 'turn:foul_triggered'));
    expect(dataOf(await emitAsync<RoomSnapshot>(late, 'host:resolve_dispute', { resolution: 'AWARD_TEAM_A' })).game!.status)
      .toBe('ROUND_OVER');
    expect(dataOf(await emitAsync<RoomSnapshot>(late, 'game:start_round')).game!.roundNumber).toBe(2);
    expect(dataOf(await emitAsync<RoomSnapshot>(late, 'game:end')).game).toBeNull();
  });

  describe('reconnection (page reload / dropped connection)', () => {
    it('gives every player a private session token on create and join', async () => {
      const { hostRes, joins } = await setupFourPlayers();
      const tokens = [hostRes.sessionToken, ...joins.map((j) => j.sessionToken)];
      expect(tokens.every((t) => typeof t === 'string' && t.length >= 32)).toBe(true);
      expect(new Set(tokens).size).toBe(4);
    });

    it('restores the same player (and host role) after a page reload', async () => {
      const { host, roomCode, hostRes } = await setupFourPlayers();
      const hostId = hostRes.player.id;

      await disconnectAndWait(host, roomCode, hostId);

      const reloaded = await createClient();
      const res: any = await emitAsync(reloaded, 'room:rejoin', { roomCode, sessionToken: hostRes.sessionToken });

      expect(res.success).toBe(true);
      expect(res.data.player.id).toBe(hostId);
      expect(res.data.player.isHost).toBe(true);
      expect(res.data.player.isConnected).toBe(true);
      expect(res.data.room.players).toHaveLength(4);
      expect(res.data.game).toBeNull();

      // And the restored socket can act as that player
      const startRes = await emitAsync(reloaded, 'game:start');
      expect(startRes.success).toBe(true);
    });

    it('keeps a participant in the game after a page reload mid-game', async () => {
      const { host, p2, roomCode, joins } = await setupFourPlayers();
      await emitAsync(host, 'game:start');
      const bob = joins[0];

      await disconnectAndWait(p2, roomCode, bob.player.id);
      const reloaded = await createClient();
      const res = dataOf(await emitAsync<RoomSnapshot & { player: Player }>(reloaded, 'room:rejoin', {
        roomCode,
        sessionToken: bob.sessionToken,
      }));

      expect(res.game!.participantIds).toContain(bob.player.id);
      // Bob (team B) can still act in the game
      dataOf(await emitAsync(reloaded, 'turn:foul_triggered'));
    });

    it('rejects unknown rooms, invalid tokens and tokens of players who left', async () => {
      const { p2, roomCode, joins } = await setupFourPlayers();
      const other = await createClient();

      expect(await emitAsync(other, 'room:rejoin', { roomCode: 'ZZZZ', sessionToken: joins[0].sessionToken }))
        .toMatchObject({ success: false, code: 'ROOM_NOT_FOUND' });
      expect(await emitAsync(other, 'room:rejoin', { roomCode, sessionToken: 'not-a-real-token' }))
        .toMatchObject({ success: false, code: 'SESSION_EXPIRED' });

      await emitAsync(p2, 'room:leave');
      expect(await emitAsync(other, 'room:rejoin', { roomCode, sessionToken: joins[0].sessionToken }))
        .toMatchObject({ success: false, code: 'SESSION_EXPIRED' });
    });

    it('does not let a player take over someone else by sending their public id', async () => {
      const { roomCode, hostRes } = await setupFourPlayers();
      const intruder = await createClient();

      const res: any = await emitAsync(intruder, 'room:join', {
        roomCode,
        playerName: 'Mallory',
        playerId: hostRes.player.id,
      });

      expect(res.success).toBe(true);
      expect(res.data.player.id).not.toBe(hostRes.player.id);
      expect(res.data.player.isHost).toBe(false);
    });

    it('keeps the player connected when the old socket disconnects after the new one rejoined', async () => {
      const { p2, roomCode, joins } = await setupFourPlayers();
      const bob = joins[0];

      const newTab = await createClient();
      await emitAsync(newTab, 'room:rejoin', { roomCode, sessionToken: bob.sessionToken });

      p2.disconnect();
      await new Promise((r) => setTimeout(r, 100));

      expect(sessionOf(roomCode).getPlayer(bob.player.id)!.isConnected).toBe(true);
    });

    it('waits a grace period, then hands the bomb of a disconnected defuser to a teammate', async () => {
      const { host, p2, roomCode, hostRes } = await setupFourPlayers({ disconnectGraceSec: 0.3 });
      await emitAsync(host, 'game:start');
      expect(gameOf(roomCode).currentTurn!.activePlayerId).toBe(hostRes.player.id);

      const turnChanged = waitForEvent<any>(p2, 'turn:changed');
      await disconnectAndWait(host, roomCode, hostRes.player.id);

      // Still holding the bomb during the grace period
      expect(gameOf(roomCode).currentTurn!.activePlayerId).toBe(hostRes.player.id);

      const changed = await turnChanged;
      const newHolder = sessionOf(roomCode).getPlayer(changed.currentTurn.activePlayerId)!;
      expect(newHolder.name).toBe('Charlie'); // same team (A), next connected seat
      expect(newHolder.team).toBe('A');
    });

    it('keeps the bomb with a defuser who comes back within the grace period', async () => {
      const { host, roomCode, hostRes } = await setupFourPlayers({ disconnectGraceSec: 0.4 });
      await emitAsync(host, 'game:start');

      await disconnectAndWait(host, roomCode, hostRes.player.id);
      const reloaded = await createClient();
      await emitAsync(reloaded, 'room:rejoin', { roomCode, sessionToken: hostRes.sessionToken });

      await new Promise((r) => setTimeout(r, 600));
      expect(gameOf(roomCode).currentTurn!.activePlayerId).toBe(hostRes.player.id);
    });
  });
});
