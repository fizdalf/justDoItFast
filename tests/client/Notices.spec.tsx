// @vitest-environment jsdom
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import React from 'react';
import {act, cleanup, fireEvent, render, screen} from '@testing-library/react';
import {GameState, Player, RoomState} from '../../src/core/types.js';
import {DEFAULT_SETTINGS} from '../../src/core/settings.js';
import {es} from '../../src/client/i18n/locales/es/index.js';

// Socket falso: guarda los manejadores de eventos para dispararlos desde el test.
const handlers: Record<string, (payload: any) => void> = {};
const fakeSocket = new Proxy({} as Record<string, any>, {
  get(target, prop: string) {
    if (prop in target) return target[prop];
    if (prop === 'getStatus') return () => 'CONNECTED';
    if (prop === 'getSocketId') return () => undefined;
    if (prop === 'onStatusChange' || prop === 'onError') return () => () => {};
    if (prop.startsWith('on')) {
      return (cb: (payload: any) => void) => {
        handlers[prop] = cb;
        return () => {};
      };
    }
    return vi.fn();
  },
});

vi.mock('../../src/client/services/socketService.js', () => ({ socketService: fakeSocket }));

const { GameProvider, NOTICE_DURATION_MS, useGame } = await import('../../src/client/context/GameContext.js');
const { NoticeStack } = await import('../../src/client/components/NoticeStack.js');

const players: Player[] = [
  { id: 'a1', name: 'Ana', team: 'A', isHost: true, isConnected: true, seatIndex: 0 },
  { id: 'b1', name: 'Beto', team: 'B', isHost: false, isConnected: true, seatIndex: 1 },
];

const room: RoomState = {
  roomCode: 'ABCD',
  hostPlayerId: 'a1',
  players,
  setup: { settings: DEFAULT_SETTINGS, packIds: ['p1'] },
  history: [],
};

const game: GameState = {
  gameNumber: 1,
  status: 'PLAYING',
  scores: { A: 0, B: 0 },
  targetScore: 5,
  roundNumber: 1,
  teamInventory: { A: [], B: [] },
  boardTiles: [],
  packIds: ['p1'],
  settings: DEFAULT_SETTINGS,
  participantIds: ['a1', 'b1'],
  currentTurn: {
    activePlayerId: 'a1',
    activeTeam: 'A',
    currentWord: 'PERRERA',
    category: 'Clásico',
    turnStartTime: 0,
    requiredGuesses: 2,
    successfulGuesses: 1,
    doubleRevealed: true,
    isFrozen: false,
    rewardForfeited: false,
    direction: 1,
  },
};

/** Entra en la sala como Ana (equipo A, tiene la bomba) y deja la partida en marcha. */
const Joiner: React.FC = () => {
  const { createRoom } = useGame();
  React.useEffect(() => {
    void createRoom('Ana');
  }, [createRoom]);
  return <NoticeStack />;
};

const notices = es.game.notices;

async function setup() {
  fakeSocket.createRoom = vi.fn().mockResolvedValue({
    success: true,
    data: { room, game, player: players[0], sessionToken: 'tok' },
  });
  render(
    <GameProvider>
      <Joiner />
    </GameProvider>
  );
  await act(async () => {});
}

const emit = (event: string, payload: unknown) => act(() => handlers[event](payload));

describe('Tool notices', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('shows the X-ray reading prominently and dismisses it after a few seconds', async () => {
    await setup();
    emit('onXray', { reading: 'SHORT' });

    expect(screen.getByText(notices.xray.SHORT)).toBeDefined();
    expect(screen.getByText(notices.xrayHint)).toBeDefined();

    act(() => vi.advanceTimersByTime(NOTICE_DURATION_MS.XRAY - 100));
    expect(screen.queryByText(notices.xray.SHORT)).not.toBeNull();
    act(() => vi.advanceTimersByTime(200));
    expect(screen.queryByText(notices.xray.SHORT)).toBeNull();
  });

  it('announces the bomb suit with the saved player and the rival team', async () => {
    await setup();
    emit('onBombShielded', { playerId: 'a1', team: 'A' });

    expect(screen.getByText(notices.shielded(es.common.powerUps.SHIELD.name, 'Ana'))).toBeDefined();
    expect(screen.getByText(notices.shieldedDetail(es.common.teams.B))).toBeDefined();

    act(() => vi.advanceTimersByTime(NOTICE_DURATION_MS.default + 1));
    expect(screen.queryByText(notices.shieldedDetail(es.common.teams.B))).toBeNull();
  });

  it('surprises the holding team with the double detonator, and the bounced variant', async () => {
    await setup();
    emit('onDoubleRevealed', { requiredGuesses: 2, bounced: false, holderTeam: 'A' });
    expect(screen.getByText(notices.doubleRevealed.ours)).toBeDefined();

    emit('onDoubleRevealed', { requiredGuesses: 2, bounced: true, holderTeam: 'A' });
    expect(screen.getByText(notices.doubleRevealed.bouncedToUs)).toBeDefined();

    // Lo decide el evento, no el estado local (que aún dice que la bomba la tiene el equipo A)
    emit('onDoubleRevealed', { requiredGuesses: 3, bounced: true, holderTeam: 'B' });
    expect(screen.getByText(notices.doubleRevealed.bounced(es.common.teams.B))).toBeDefined();
  });

  it('names who used a tool and its team, and can be dismissed with a tap', async () => {
    await setup();
    emit('onPowerUpActivated', { type: 'REWIRE', team: 'B', byPlayerId: 'b1' });

    const title = notices.activated('Beto', es.common.teams.B, es.common.powerUps.REWIRE.name);
    expect(screen.getByText(title)).toBeDefined();
    expect(screen.getByText(notices.effects.REWIRE)).toBeDefined();

    fireEvent.click(screen.getByText(title));
    expect(screen.queryByText(title)).toBeNull();
  });

  it('tells the team which tool it earned', async () => {
    await setup();
    emit('onPowerUpAwarded', { powerUp: { id: 'p', type: 'FREEZE' }, source: 'FAST_GUESS' });

    expect(screen.getByText(notices.awarded(es.common.powerUps.FREEZE.name))).toBeDefined();
    expect(screen.getByText(notices.awardedSource.FAST_GUESS)).toBeDefined();
  });
});
