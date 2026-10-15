import {afterEach, beforeEach, describe, expect, it} from 'vitest';
import {io as ioClient, Socket as ClientSocket} from 'socket.io-client';
import {AppServer, createServer} from '../../src/server/server.js';
import {ApiResponse, ClientToServerEvents, ServerToClientEvents,} from '../../src/server/protocol.js';
import {DisputeState, GameState, Player, TurnState} from '../../src/core/types.js';

type TestClientSocket = ClientSocket<ServerToClientEvents, ClientToServerEvents>;

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

  it('allows host to create a room and receive initial game state', async () => {
    const hostSocket = await createClient();

    const res = await emitAsync<{ roomCode: string; player: Player; gameState: GameState }>(
      hostSocket,
      'room:create',
      {
        playerName: 'Host Alice',
      }
    );

    expect(res.success).toBe(true);
    if (!res.success) return;

    expect(res.data.roomCode).toHaveLength(4);
    expect(res.data.player.name).toBe('Host Alice');
    expect(res.data.player.isHost).toBe(true);
    expect(res.data.player.team).toBe('A');
    expect(res.data.gameState.status).toBe('LOBBY');
  });

  it('allows 4 players to join, balances teams and orders seats', async () => {
    const host = await createClient();
    const p2 = await createClient();
    const p3 = await createClient();
    const p4 = await createClient();

    const createRes = await emitAsync<{ roomCode: string; player: Player; gameState: GameState }>(
      host,
      'room:create',
      { playerName: 'Player A1 (Host)' }
    );
    expect(createRes.success).toBe(true);
    if (!createRes.success) return;
    const roomCode = createRes.data.roomCode;

    const joinRes2 = await emitAsync<{ player: Player; gameState: GameState }>(p2, 'room:join', {
      roomCode,
      playerName: 'Player B1',
    });
    const joinRes3 = await emitAsync<{ player: Player; gameState: GameState }>(p3, 'room:join', {
      roomCode,
      playerName: 'Player A2',
    });
    const joinRes4 = await emitAsync<{ player: Player; gameState: GameState }>(p4, 'room:join', {
      roomCode,
      playerName: 'Player B2',
    });

    expect(joinRes2.success).toBe(true);
    expect(joinRes3.success).toBe(true);
    expect(joinRes4.success).toBe(true);

    if (!joinRes2.success || !joinRes3.success || !joinRes4.success) return;

    expect(joinRes2.data.player.team).toBe('B');
    expect(joinRes3.data.player.team).toBe('A');
    expect(joinRes4.data.player.team).toBe('B');

    const session = server.sessionManager.getSession(roomCode);
    expect(session).toBeDefined();
    const players = session!.getPlayers();
    expect(players.length).toBe(4);
    expect(players.map((p) => p.team)).toEqual(['A', 'B', 'A', 'B']);
  });

  it('runs a full round cycle: start round, receive ticks, guess words, pass potato', async () => {
    const host = await createClient();
    const p2 = await createClient();
    const p3 = await createClient();
    const p4 = await createClient();

    const createRes = await emitAsync<{ roomCode: string; player: Player; gameState: GameState }>(
      host,
      'room:create',
      { playerName: 'Alice' }
    );
    const roomCode = (createRes as any).data.roomCode;

    await emitAsync(p2, 'room:join', { roomCode, playerName: 'Bob' });
    await emitAsync(p3, 'room:join', { roomCode, playerName: 'Charlie' });
    await emitAsync(p4, 'room:join', { roomCode, playerName: 'Diana' });

    // Host starts round
    const startRes = await emitAsync<{ gameState: GameState; currentTurn: TurnState }>(
      host,
      'game:start_round'
    );
    expect(startRes.success).toBe(true);
    if (!startRes.success) return;

    expect(startRes.data.gameState.status).toBe('PLAYING');
    expect(startRes.data.currentTurn.activePlayerId).toBe((createRes as any).data.player.id);
    expect(startRes.data.currentTurn.currentWord).toBeTruthy();

    // Active player (Host Alice) hits guess success
    const turnChangePromise = waitForEvent<any>(p2, 'turn:changed');
    const guessRes = await emitAsync<{ isFastGuess: boolean; currentTurn: TurnState }>(
      host,
      'turn:guess_success'
    );
    expect(guessRes.success).toBe(true);

    const turnChangeEvent = await turnChangePromise;
    expect(turnChangeEvent.currentTurn.activeTeam).toBe('B');
    expect(typeof turnChangeEvent.currentTurn.activePlayerId).toBe('string');
    expect(turnChangeEvent.currentTurn.activePlayerId.length).toBeGreaterThan(0);
  });

  it('handles dispute mediation: rival triggers foul, freezes round, host resolves', async () => {
    const host = await createClient();
    const p2 = await createClient();
    const p3 = await createClient();
    const p4 = await createClient();

    const createRes = await emitAsync<{ roomCode: string; player: Player; gameState: GameState }>(
      host,
      'room:create',
      { playerName: 'Alice' }
    );
    const roomCode = (createRes as any).data.roomCode;

    await emitAsync(p2, 'room:join', { roomCode, playerName: 'Bob' });
    await emitAsync(p3, 'room:join', { roomCode, playerName: 'Charlie' });
    await emitAsync(p4, 'room:join', { roomCode, playerName: 'Diana' });

    await emitAsync(host, 'game:start_round');

    // Rival (Bob on Team B) calls foul while Alice (Team A) is active
    const disputePromise = waitForEvent<{ dispute: DisputeState; gameState: GameState }>(
      host,
      'game:dispute_started'
    );

    const foulRes = await emitAsync<{ dispute: DisputeState }>(p2, 'turn:foul_triggered', {
      reason: 'Palabra prohibida dicha',
    });
    expect(foulRes.success).toBe(true);

    const disputeEvent = await disputePromise;
    expect(disputeEvent.dispute.triggeredByTeam).toBe('B');
    expect(disputeEvent.gameState.status).toBe('DISPUTE_PAUSED');

    // Host Alice resolves dispute in favor of Team B
    const resolvePromise = waitForEvent<{ resolution: string; gameState: GameState }>(
      p3,
      'game:dispute_resolved'
    );

    const resolveRes = await emitAsync<{ gameState: GameState }>(host, 'host:resolve_dispute', {
      resolution: 'AWARD_TEAM_B',
    });
    expect(resolveRes.success).toBe(true);

    const resolveEvent = await resolvePromise;
    expect(resolveEvent.gameState.status).toBe('ROUND_OVER');
    expect(resolveEvent.gameState.scores.B).toBe(1);
    expect(resolveEvent.gameState.scores.A).toBe(0);
  });

  it('handles fast guess power-up reward and activation', async () => {
    const host = await createClient();
    const p2 = await createClient();
    const p3 = await createClient();
    const p4 = await createClient();

    const createRes = await emitAsync<{ roomCode: string; player: Player; gameState: GameState }>(
      host,
      'room:create',
      {
        playerName: 'Alice',
        settings: { fastGuessThresholdSec: 10 },
      }
    );
    const roomCode = (createRes as any).data.roomCode;

    await emitAsync(p2, 'room:join', { roomCode, playerName: 'Bob' });
    await emitAsync(p3, 'room:join', { roomCode, playerName: 'Charlie' });
    await emitAsync(p4, 'room:join', { roomCode, playerName: 'Diana' });

    await emitAsync(host, 'game:start_round');

    // Alice guesses fast
    const guessRes = await emitAsync<{ isFastGuess: boolean; currentTurn: TurnState }>(
      host,
      'turn:guess_success'
    );
    expect(guessRes.success).toBe(true);
    expect((guessRes as any).data.isFastGuess).toBe(true);

    const session = server.sessionManager.getSession(roomCode)!;
    const inventoryA = session.getGameState().teamInventory.A;
    expect(inventoryA.length).toBeGreaterThan(0);

    const powerUp = inventoryA[0];

    // Charlie (on Team A) activates the power-up
    const powerUpPromise = waitForEvent<any>(p2, 'powerup:activated');
    const useRes = await emitAsync<{ success: boolean; effect: string }>(p3, 'powerup:use', {
      powerUpId: powerUp.id,
    });
    expect(useRes.success).toBe(true);

    const activatedEvent = await powerUpPromise;
    expect(activatedEvent.powerUp.id).toBe(powerUp.id);
    expect(activatedEvent.activatedByTeam).toBe('A');
  });

  it('handles player disconnection gracefully during a game round', async () => {
    const host = await createClient();
    const p2 = await createClient();
    const p3 = await createClient();
    const p4 = await createClient();

    const createRes = await emitAsync<{ roomCode: string; player: Player; gameState: GameState }>(
      host,
      'room:create',
      { playerName: 'Alice' }
    );
    const roomCode = (createRes as any).data.roomCode;

    await emitAsync(p2, 'room:join', { roomCode, playerName: 'Bob' });
    await emitAsync(p3, 'room:join', { roomCode, playerName: 'Charlie' });
    await emitAsync(p4, 'room:join', { roomCode, playerName: 'Diana' });

    await emitAsync(host, 'game:start_round');

    // Bob disconnects
    p2.disconnect();

    await new Promise((r) => setTimeout(r, 100));

    const session = server.sessionManager.getSession(roomCode)!;
    const bob = session.getPlayers().find((p) => p.name === 'Bob');
    expect(bob?.isConnected).toBe(false);
  });

  it('provides REST endpoints for health check, room inspection and word pack catalog', async () => {
    const resHealth = await server.app.inject({
      method: 'GET',
      url: '/health',
    });
    expect(resHealth.statusCode).toBe(200);
    const healthJson = JSON.parse(resHealth.payload);
    expect(healthJson.status).toBe('ok');

    const resPacks = await server.app.inject({
      method: 'GET',
      url: '/api/packs',
    });
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

  it('rejects start_round from non-host players or with insufficient players', async () => {
    const host = await createClient();
    const p2 = await createClient();

    const createRes = await emitAsync<{ roomCode: string; player: Player; gameState: GameState }>(
      host,
      'room:create',
      { playerName: 'Alice' }
    );
    const roomCode = (createRes as any).data.roomCode;

    await emitAsync(p2, 'room:join', { roomCode, playerName: 'Bob' });

    // Host attempts to start with only 2 players -> should fail
    const startFail1 = await emitAsync(host, 'game:start_round');
    expect(startFail1.success).toBe(false);
    expect((startFail1 as any).code).toBe('NOT_ENOUGH_PLAYERS');

    // Non-host attempts to start -> should fail
    const startFail2 = await emitAsync(p2, 'game:start_round');
    expect(startFail2.success).toBe(false);
    expect((startFail2 as any).code).toBe('NOT_HOST');
  });

  it('returns stable error codes instead of display texts', async () => {
    const client = await createClient();

    const missingRoom = await emitAsync(client, 'room:join', { roomCode: 'ZZZZ', playerName: 'Eve' });
    expect(missingRoom).toMatchObject({ success: false, code: 'ROOM_NOT_FOUND' });

    const noName = await emitAsync(client, 'room:create', { playerName: '  ' });
    expect(noName).toMatchObject({ success: false, code: 'NAME_REQUIRED' });

    const notInRoom = await emitAsync(client, 'turn:guess_success');
    expect(notInRoom).toMatchObject({ success: false, code: 'NOT_IN_ROOM' });
  });

  it('allows host to switch team, select pack and update settings in lobby', async () => {
    const host = await createClient();
    const p2 = await createClient();

    const createRes = await emitAsync<{ roomCode: string; player: Player; gameState: GameState }>(
      host,
      'room:create',
      { playerName: 'Alice' }
    );
    const roomCode = (createRes as any).data.roomCode;

    await emitAsync(p2, 'room:join', { roomCode, playerName: 'Bob' });

    // Switch team of Bob to A
    const switchRes = await emitAsync<{ player: Player; gameState: GameState }>(
      p2,
      'room:switch_team',
      { targetTeam: 'A' }
    );
    expect(switchRes.success).toBe(true);
    if (switchRes.success) {
      expect(switchRes.data.player.team).toBe('A');
    }

    // Host selects pack
    const packRes = await emitAsync<{ gameState: GameState }>(host, 'room:select_pack', {
      packId: 'pop-culture',
    });
    expect(packRes.success).toBe(true);
    if (packRes.success) {
      expect(packRes.data.gameState.selectedPackId).toBe('pop-culture');
    }

    // Host updates settings
    const settingsRes = await emitAsync<{ gameState: GameState }>(host, 'room:update_settings', {
      settings: { targetScore: 7 },
    });
    expect(settingsRes.success).toBe(true);
    if (settingsRes.success) {
      expect(settingsRes.data.gameState.targetScore).toBe(7);
    }
  });

  it('emits authoritative timer ticks and handles round explosion', async () => {
    const host = await createClient();
    const p2 = await createClient();
    const p3 = await createClient();
    const p4 = await createClient();

    // Create room with custom short duration (2.5s) so we get ticks and explosion
    const createRes = await emitAsync<{ roomCode: string; player: Player; gameState: GameState }>(
      host,
      'room:create',
      {
        playerName: 'Alice',
        settings: {
          minRoundDurationSec: 2.5,
          maxRoundDurationSec: 2.5,
          targetScore: 2,
        },
      }
    );
    const roomCode = (createRes as any).data.roomCode;

    await emitAsync(p2, 'room:join', { roomCode, playerName: 'Bob' });
    await emitAsync(p3, 'room:join', { roomCode, playerName: 'Charlie' });
    await emitAsync(p4, 'room:join', { roomCode, playerName: 'Diana' });

    const tickPromise = waitForEvent<any>(host, 'timer:tick');
    const explodePromise = waitForEvent<any>(p2, 'timer:exploded');

    await emitAsync(host, 'game:start_round');

    const tickData = await tickPromise;
    expect(tickData).toBeDefined();
    expect(typeof tickData.elapsedMs).toBe('number');
    expect(typeof tickData.remainingMs).toBe('number');

    const explodeData = await explodePromise;
    expect(explodeData).toBeDefined();
    expect(explodeData.losingTeam).toBe('A');
    expect(explodeData.winningTeam).toBe('B');
    expect(explodeData.scores.B).toBe(1);

    const stateAfter = server.sessionManager.getSession(roomCode)!.getGameState();
    expect(stateAfter.status).toBe('ROUND_OVER');
    expect(stateAfter.lastRoundResult).toMatchObject({
      reason: 'EXPLOSION',
      winningTeam: 'B',
      losingTeam: 'A',
      explodedPlayerId: explodeData.explodedPlayerId,
    });
    expect(stateAfter.lastRoundResult?.explodedWord).toBeTruthy();
  });

  it('plays rounds through ROUND_OVER to GAME_OVER and lets the host return to the lobby', async () => {
    const host = await createClient();
    const p2 = await createClient();
    const p3 = await createClient();
    const p4 = await createClient();

    const createRes = await emitAsync<{ roomCode: string; player: Player; gameState: GameState }>(
      host,
      'room:create',
      { playerName: 'Alice', settings: { targetScore: 2 } }
    );
    const roomCode = (createRes as any).data.roomCode;

    await emitAsync(p2, 'room:join', { roomCode, playerName: 'Bob' });
    await emitAsync(p3, 'room:join', { roomCode, playerName: 'Charlie' });
    await emitAsync(p4, 'room:join', { roomCode, playerName: 'Diana' });

    const playRoundAwardedToB = async () => {
      const startRes = await emitAsync(host, 'game:start_round');
      expect(startRes.success).toBe(true);
      const session = server.sessionManager.getSession(roomCode)!;
      expect(session.getGameState().lastRoundResult).toBeUndefined();

      const activeTeam = session.getGameState().currentTurn!.activeTeam;
      const rival = activeTeam === 'A' ? p2 : host;
      await emitAsync(rival, 'turn:foul_triggered', { reason: 'test' });
      const resolveRes = await emitAsync<{ gameState: GameState }>(host, 'host:resolve_dispute', {
        resolution: 'AWARD_TEAM_B',
      });
      expect(resolveRes.success).toBe(true);
      return (resolveRes as any).data.gameState as GameState;
    };

    // Round 1 -> ROUND_OVER with a recorded result
    const afterRound1 = await playRoundAwardedToB();
    expect(afterRound1.status).toBe('ROUND_OVER');
    expect(afterRound1.lastRoundResult).toMatchObject({ reason: 'DISPUTE', winningTeam: 'B' });

    // Round 2 -> GAME_OVER
    const afterRound2 = await playRoundAwardedToB();
    expect(afterRound2.status).toBe('GAME_OVER');
    expect(afterRound2.winningTeam).toBe('B');

    // A finished game cannot be restarted directly
    const restartRes = await emitAsync(host, 'game:start_round');
    expect(restartRes.success).toBe(false);
    expect((restartRes as any).code).toBe('INVALID_STATE');

    // Only the host can return to the lobby
    const nonHostRes = await emitAsync(p2, 'game:return_to_lobby');
    expect(nonHostRes.success).toBe(false);
    expect((nonHostRes as any).code).toBe('NOT_HOST');

    const lobbyPromise = waitForEvent<{ gameState: GameState; players: Player[] }>(
      p3,
      'room:state_updated'
    );
    const lobbyRes = await emitAsync<{ gameState: GameState }>(host, 'game:return_to_lobby');
    expect(lobbyRes.success).toBe(true);

    const lobbyEvent = await lobbyPromise;
    expect(lobbyEvent.gameState.status).toBe('LOBBY');
    expect(lobbyEvent.gameState.scores).toEqual({ A: 0, B: 0 });
    expect(lobbyEvent.gameState.roundNumber).toBe(0);
    expect(lobbyEvent.gameState.winningTeam).toBeUndefined();
    expect(lobbyEvent.gameState.currentTurn).toBeUndefined();
    expect(lobbyEvent.gameState.teamInventory).toEqual({ A: [], B: [] });
    expect(lobbyEvent.players).toHaveLength(4);

    // And a fresh game can start
    const newGameRes = await emitAsync<{ gameState: GameState }>(host, 'game:start_round');
    expect(newGameRes.success).toBe(true);
    expect((newGameRes as any).data.gameState.roundNumber).toBe(1);
  });

  describe('reconnection (page reload / dropped connection)', () => {
    async function setupFourPlayers(settings: Record<string, unknown> = {}) {
      const host = await createClient();
      const p2 = await createClient();
      const p3 = await createClient();
      const p4 = await createClient();

      const createRes: any = await emitAsync(host, 'room:create', { playerName: 'Alice', settings });
      const roomCode: string = createRes.data.roomCode;
      const joins: any[] = [];
      for (const [socket, name] of [[p2, 'Bob'], [p3, 'Charlie'], [p4, 'Diana']] as const) {
        joins.push(await emitAsync(socket, 'room:join', { roomCode, playerName: name }));
      }
      return { host, p2, p3, p4, roomCode, hostRes: createRes.data, joins: joins.map((j) => j.data) };
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
      expect(res.data.players).toHaveLength(4);

      // And the restored socket can act as that player
      const startRes = await emitAsync(reloaded, 'game:start_round');
      expect(startRes.success).toBe(true);
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

      expect(server.sessionManager.getSession(roomCode)!.getPlayer(bob.player.id)!.isConnected).toBe(true);
    });

    it('waits a grace period, then hands the bomb of a disconnected defuser to a teammate', async () => {
      const { host, p2, roomCode, hostRes } = await setupFourPlayers({ disconnectGraceSec: 0.3 });
      await emitAsync(host, 'game:start_round');
      const session = server.sessionManager.getSession(roomCode)!;
      expect(session.getGameState().currentTurn!.activePlayerId).toBe(hostRes.player.id);

      const turnChanged = waitForEvent<any>(p2, 'turn:changed');
      await disconnectAndWait(host, roomCode, hostRes.player.id);

      // Still holding the bomb during the grace period
      expect(session.getGameState().currentTurn!.activePlayerId).toBe(hostRes.player.id);

      const changed = await turnChanged;
      const newHolder = session.getPlayer(changed.currentTurn.activePlayerId)!;
      expect(newHolder.name).toBe('Charlie'); // same team (A), next connected seat
      expect(newHolder.team).toBe('A');
    });

    it('keeps the bomb with a defuser who comes back within the grace period', async () => {
      const { host, roomCode, hostRes } = await setupFourPlayers({ disconnectGraceSec: 0.4 });
      await emitAsync(host, 'game:start_round');
      const session = server.sessionManager.getSession(roomCode)!;

      await disconnectAndWait(host, roomCode, hostRes.player.id);
      const reloaded = await createClient();
      await emitAsync(reloaded, 'room:rejoin', { roomCode, sessionToken: hostRes.sessionToken });

      await new Promise((r) => setTimeout(r, 600));
      expect(session.getGameState().currentTurn!.activePlayerId).toBe(hostRes.player.id);
    });
  });
});
