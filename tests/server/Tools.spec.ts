import {afterEach, beforeEach, describe, expect, it} from 'vitest';
import {io as ioClient, Socket as ClientSocket} from 'socket.io-client';
import {AppServer, createServer} from '../../src/server/server.js';
import {ApiResponse, ClientToServerEvents, ServerToClientEvents} from '../../src/server/protocol.js';
import {GameSettings, PowerUpType, TeamId} from '../../src/core/types.js';

type TestSocket = ClientSocket<ServerToClientEvents, ClientToServerEvents>;

function emitAsync<T = any>(socket: TestSocket, event: keyof ClientToServerEvents, payload?: unknown): Promise<ApiResponse<T>> {
  return new Promise((resolve) => {
    if (payload !== undefined) (socket.emit as any)(event, payload, resolve);
    else (socket.emit as any)(event, resolve);
  });
}

function waitForEvent<T = any>(socket: TestSocket, event: keyof ServerToClientEvents): Promise<T> {
  return new Promise((resolve) => socket.once(event as any, (data: T) => resolve(data)));
}

/** Registra los eventos que recibe un socket, para comprobar luego lo que NO le llegó. */
function record(socket: TestSocket, event: keyof ServerToClientEvents): unknown[] {
  const received: unknown[] = [];
  socket.on(event as any, (data: unknown) => received.push(data));
  return received;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe('Tools with real rules', () => {
  let server: AppServer;
  let url: string;
  let sockets: TestSocket[] = [];

  beforeEach(async () => {
    server = await createServer({ port: 0, host: '127.0.0.1' });
    await server.start(0, '127.0.0.1');
    url = `http://127.0.0.1:${(server.app.server.address() as any).port}`;
    sockets = [];
  });

  afterEach(async () => {
    sockets.forEach((s) => s.connected && s.disconnect());
    await server.close();
  });

  const connect = () =>
    new Promise<TestSocket>((resolve) => {
      const s: TestSocket = ioClient(url, { transports: ['websocket'], forceNew: true });
      sockets.push(s);
      s.on('connect', () => resolve(s));
    });

  /**
   * Partida en marcha con 4 jugadores en asientos alternos: A1 (Ana, anfitriona) → B1 (Bea)
   * → A2 (Carlos) → B2 (Dani). Empieza con la bomba Ana.
   */
  async function startGame(settings: Partial<GameSettings> = {}) {
    const a1 = await connect();
    const created: any = await emitAsync(a1, 'room:create', { playerName: 'Ana' });
    const roomCode: string = created.data.room.roomCode;
    const ids: Record<string, string> = { a1: created.data.player.id };
    const others: Record<string, TestSocket> = {};
    for (const [key, name] of [['b1', 'Bea'], ['a2', 'Carlos'], ['b2', 'Dani']] as const) {
      const s = await connect();
      const joined: any = await emitAsync(s, 'room:join', { roomCode, playerName: name });
      ids[key] = joined.data.player.id;
      others[key] = s;
    }
    await emitAsync(a1, 'room:update_setup', { settings: { allowPowerUps: true, fastGuessThresholdSec: 0.5, ...settings } });
    const started: any = await emitAsync(a1, 'game:start');
    expect(started.success).toBe(true);

    const session = server.sessionManager.getSession(roomCode)!;
    const game = () => session.getCurrentGame()!;
    const p = { a1, b1: others.b1, a2: others.a2, b2: others.b2 };
    return {
      roomCode,
      ids,
      p,
      game,
      /** Estado completo sin filtrar. */
      truth: () => game().getState(),
      /** Lo que ve un jugador concreto. */
      viewOf: (playerId: string | null) => session.getSnapshot(playerId).game!,
      /** Da una herramienta a un equipo (determinista; en partida se ganan al azar). */
      give: (team: TeamId, type: PowerUpType) => (game() as any).powerUpEngine.grantPowerUp(team, type).id as string,
      holder: () => game().getState().currentTurn!.activePlayerId,
    };
  }

  it('sends each player only what they may see: word, tools and secret detonators', async () => {
    const g = await startGame();
    g.give('A', 'XRAY');
    g.give('B', 'FREEZE');

    const holder = g.viewOf(g.ids.a1);
    const helper = g.viewOf(g.ids.a2);
    const saboteur = g.viewOf(g.ids.b1);
    const spectator = g.viewOf(null);

    expect(holder.currentTurn!.currentWord).toBe(g.truth().currentTurn!.currentWord);
    expect(saboteur.currentTurn!.currentWord).toBe(g.truth().currentTurn!.currentWord);
    expect(helper.currentTurn!.currentWord).toBe('');
    expect(spectator.currentTurn!.currentWord).toBe('');

    expect(holder.teamInventory.A.map((t) => t.type)).toEqual(['XRAY']);
    expect(holder.teamInventory.B).toEqual([]);
    expect(saboteur.teamInventory.A).toEqual([]);
    expect(saboteur.teamInventory.B.map((t) => t.type)).toEqual(['FREEZE']);
    expect(spectator.teamInventory).toEqual({ A: [], B: [] });
  });

  it('Devolver al remitente: sends the bomb back to whoever passed it and reverses the passing order', async () => {
    const g = await startGame();
    await emitAsync(g.p.a1, 'turn:guess_success'); // Ana → Bea
    await emitAsync(g.p.b1, 'turn:guess_success'); // Bea → Carlos
    expect(g.holder()).toBe(g.ids.a2);
    const wordBefore = g.truth().currentTurn!.currentWord;

    // Solo el artificiero puede devolverla
    const reverse = g.give('A', 'REVERSE');
    expect(await emitAsync(g.p.a1, 'powerup:use', { powerUpId: reverse })).toMatchObject({ success: false, code: 'POWERUP_NOT_ALLOWED' });

    const turnChanged = waitForEvent(g.p.b2, 'turn:changed');
    expect(await emitAsync(g.p.a2, 'powerup:use', { powerUpId: reverse })).toMatchObject({ success: true });
    expect(await turnChanged).toEqual({ reason: 'BOUNCE' });

    const bounced = g.truth().currentTurn!;
    expect(bounced.activePlayerId).toBe(g.ids.b1); // vuelve a Bea, que se la pasó
    expect(bounced.passedByPlayerId).toBe(g.ids.a2);
    expect(bounced.direction).toBe(-1);
    expect(bounced.currentWord).not.toBe(wordBefore);

    // En sentido inverso, Bea se la pasa a Ana (no a Carlos)
    await emitAsync(g.p.b1, 'turn:guess_success');
    expect(g.holder()).toBe(g.ids.a1);
  });

  it('Otro cable: new wire for the same defuser, and that turn no longer earns tools', async () => {
    const g = await startGame({ fastGuessThresholdSec: 60 });
    const skip = g.give('A', 'SKIP');
    const wordBefore = g.truth().currentTurn!.currentWord;

    expect(await emitAsync(g.p.a2, 'powerup:use', { powerUpId: skip })).toMatchObject({ code: 'POWERUP_NOT_ALLOWED' });
    expect(await emitAsync(g.p.a1, 'powerup:use', { powerUpId: skip })).toMatchObject({ success: true });
    expect(g.holder()).toBe(g.ids.a1);
    expect(g.truth().currentTurn!.currentWord).not.toBe(wordBefore);
    expect(g.truth().currentTurn!.rewardForfeited).toBe(true);

    // Acierto rapidísimo, pero sin recompensa
    await emitAsync(g.p.a1, 'turn:guess_success');
    expect(g.truth().teamInventory.A).toEqual([]);
    // El siguiente turno vuelve a poder ganar
    await emitAsync(g.p.b1, 'turn:guess_success');
    expect(g.truth().teamInventory.B).toHaveLength(1);
  });

  it('Doble detonador: secret for the holding team until the first cut, then one more wire before passing', async () => {
    const g = await startGame();
    const double = g.give('B', 'DOUBLE_BURDEN');
    const activatedForA = record(g.p.a2, 'powerup:activated');
    const activatedForB = waitForEvent(g.p.b2, 'powerup:activated');

    expect(await emitAsync(g.p.a2, 'powerup:use', { powerUpId: double })).toMatchObject({ code: 'POWERUP_NOT_FOUND' });
    expect(await emitAsync(g.p.b1, 'powerup:use', { powerUpId: double })).toMatchObject({ success: true });
    expect(await activatedForB).toMatchObject({ type: 'DOUBLE_BURDEN', team: 'B' });
    await sleep(50);
    expect(activatedForA).toEqual([]); // el equipo portador no se entera

    expect(g.viewOf(g.ids.a1).currentTurn!.requiredGuesses).toBe(1);
    expect(g.viewOf(g.ids.a2).currentTurn!.requiredGuesses).toBe(1);
    expect(g.viewOf(g.ids.b2).currentTurn!.requiredGuesses).toBe(2);

    const revealed = waitForEvent(g.p.a1, 'powerup:double_revealed');
    expect(await emitAsync(g.p.a1, 'turn:guess_success')).toMatchObject({ data: { passed: false } });
    expect(await revealed).toEqual({ requiredGuesses: 2, bounced: false, holderTeam: 'A' });
    expect(g.holder()).toBe(g.ids.a1);
    expect(g.viewOf(g.ids.a1).currentTurn).toMatchObject({ requiredGuesses: 2, successfulGuesses: 1, doubleRevealed: true });

    expect(await emitAsync(g.p.a1, 'turn:guess_success')).toMatchObject({ data: { passed: true } });
    expect(g.holder()).toBe(g.ids.b1);
    expect(g.truth().currentTurn!.requiredGuesses).toBe(1);
  });

  it('Doble detonadores stack, and bouncing sends them back at full strength for everyone to see', async () => {
    const g = await startGame();
    await emitAsync(g.p.a1, 'turn:guess_success'); // Ana → Bea
    // El equipo A le pone dos detonadores a Bea
    await emitAsync(g.p.a1, 'powerup:use', { powerUpId: g.give('A', 'DOUBLE_BURDEN') });
    await emitAsync(g.p.a2, 'powerup:use', { powerUpId: g.give('A', 'DOUBLE_BURDEN') });
    expect(g.truth().currentTurn!.requiredGuesses).toBe(3);

    // Bea corta uno (se revela) y lo devuelve: Ana tiene que cortar los 3
    const firstReveal = waitForEvent(g.p.a2, 'powerup:double_revealed');
    await emitAsync(g.p.b1, 'turn:guess_success');
    expect(await firstReveal).toEqual({ requiredGuesses: 3, bounced: false, holderTeam: 'B' });
    const revealedForA = waitForEvent(g.p.a2, 'powerup:double_revealed');
    await emitAsync(g.p.b1, 'powerup:use', { powerUpId: g.give('B', 'REVERSE') });

    expect(await revealedForA).toEqual({ requiredGuesses: 3, bounced: true, holderTeam: 'A' });
    expect(g.holder()).toBe(g.ids.a1);
    expect(g.viewOf(g.ids.a1).currentTurn).toMatchObject({ requiredGuesses: 3, successfulGuesses: 0, doubleRevealed: true });
  });

  it('Inhibidor: jams the rival defuser for a while, and several jammers add up', async () => {
    const g = await startGame({ freezeDurationSec: 0.5 });

    expect(await emitAsync(g.p.a2, 'powerup:use', { powerUpId: g.give('A', 'FREEZE') })).toMatchObject({ code: 'POWERUP_NOT_ALLOWED' });

    await emitAsync(g.p.b1, 'powerup:use', { powerUpId: g.give('B', 'FREEZE') });
    await emitAsync(g.p.b2, 'powerup:use', { powerUpId: g.give('B', 'FREEZE') });

    const view = g.viewOf(g.ids.a1).currentTurn!;
    expect(view.isFrozen).toBe(true);
    expect(view.freezeRemainingMs).toBeGreaterThan(900);
    expect(view.freezeRemainingMs).toBeLessThanOrEqual(1000);
    expect(view).not.toHaveProperty('freezeExpiresAt');

    expect(await emitAsync(g.p.a1, 'turn:guess_success')).toMatchObject({ success: false, code: 'FROZEN' });
    await sleep(1100);
    expect(g.viewOf(g.ids.a1).currentTurn!.isFrozen).toBe(false);
    expect(await emitAsync(g.p.a1, 'turn:guess_success')).toMatchObject({ success: true });
  });

  it('Reprogramar temporizador: secretly redraws the remaining time, and everyone hears about it', async () => {
    const g = await startGame({ rewireMinSec: 1, rewireMaxSec: 1.5 });
    const heard = waitForEvent(g.p.b2, 'powerup:activated');

    await emitAsync(g.p.a2, 'powerup:use', { powerUpId: g.give('A', 'REWIRE') });
    expect(await heard).toMatchObject({ type: 'REWIRE', team: 'A' });

    const remaining = (g.game() as any).timerEngine.getRemainingMs();
    expect(remaining).toBeGreaterThan(800);
    expect(remaining).toBeLessThanOrEqual(1500);
  });

  it('Traje antiexplosivos: saves the defuser once, re-arms with a short fuse and passes the bomb', async () => {
    const g = await startGame({ minRoundDurationSec: 2, maxRoundDurationSec: 2, shieldFuseSec: 2 });
    const suit = g.give('A', 'SHIELD');
    expect(await emitAsync(g.p.a1, 'powerup:use', { powerUpId: suit })).toMatchObject({ code: 'POWERUP_NOT_ALLOWED' });

    const shielded = waitForEvent(g.p.b1, 'bomb:shielded');
    expect(await shielded).toEqual({ playerId: g.ids.a1, team: 'A' });

    expect(g.truth().status).toBe('PLAYING');
    expect(g.truth().scores).toEqual({ A: 0, B: 0 });
    expect(g.truth().teamInventory.A).toEqual([]);
    expect(g.holder()).toBe(g.ids.b1);
    const fuse = (g.game() as any).timerEngine.getRemainingMs();
    expect(fuse).toBeLessThanOrEqual(2000);

    // Sin traje, la siguiente explosión puntúa
    const exploded = waitForEvent(g.p.a1, 'timer:exploded');
    expect(await exploded).toMatchObject({ losingTeam: 'B', winningTeam: 'A' });
    expect(g.truth().scores).toEqual({ A: 1, B: 0 });
  }, 8000);

  it('board squares: a mystery square gives the scoring team a tool, double time stretches the next round', async () => {
    const g = await startGame({ targetScore: 5, minRoundDurationSec: 30, maxRoundDurationSec: 30, enabledPowerUps: ['XRAY'] });
    const scoreForB = async () => {
      if (g.truth().status === 'ROUND_OVER') await emitAsync(g.p.a1, 'game:start_round');
      const rival = g.truth().currentTurn!.activeTeam === 'A' ? g.p.b1 : g.p.a2;
      await emitAsync(rival, 'turn:foul_triggered');
      await emitAsync(g.p.a1, 'host:resolve_dispute', { resolution: 'AWARD_TEAM_B' });
    };

    await scoreForB(); // casilla 1: normal
    expect(g.truth().teamInventory.B).toEqual([]);

    const gift = waitForEvent(g.p.b2, 'powerup:awarded');
    await scoreForB(); // casilla 2: comodín sorpresa
    expect(await gift).toMatchObject({ source: 'TILE', powerUp: { type: 'XRAY' } });
    expect(g.truth().teamInventory.B).toHaveLength(1);

    await scoreForB(); // casilla 3: normal
    await scoreForB(); // casilla 4: doble tiempo
    await emitAsync(g.p.a1, 'game:start_round');
    expect((g.game() as any).timerEngine.getTargetDurationSec()).toBeCloseTo(60, 0);
  });
});
