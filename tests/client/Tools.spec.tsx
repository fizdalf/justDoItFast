// @vitest-environment jsdom
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import React from 'react';
import {act, cleanup, fireEvent, render, screen} from '@testing-library/react';
import {GameState, Player, PowerUp, PowerUpType, TurnState} from '../../src/core/types.js';
import {DEFAULT_SETTINGS} from '../../src/core/settings.js';
import {es} from '../../src/client/i18n/locales/es/index.js';

const mockGame: Record<string, any> = {};

vi.mock('../../src/client/context/GameContext.js', () => ({
  useGame: () => mockGame,
}));

const { ToolsBar } = await import('../../src/client/components/views/ToolsBar.js');
const { ActiveGiverView } = await import('../../src/client/components/views/ActiveGiverView.js');
const { TeamMateView } = await import('../../src/client/components/views/TeamMateView.js');
const { OpponentRefereeView } = await import('../../src/client/components/views/OpponentRefereeView.js');
const { GameBoard } = await import('../../src/client/components/board/GameBoard.js');

const players: Player[] = [
  { id: 'a1', name: 'Ana', team: 'A', isHost: true, isConnected: true, seatIndex: 0 },
  { id: 'b1', name: 'Beto', team: 'B', isHost: false, isConnected: true, seatIndex: 1 },
  { id: 'a2', name: 'Alba', team: 'A', isHost: false, isConnected: true, seatIndex: 2 },
  { id: 'b2', name: 'Bruno', team: 'B', isHost: false, isConnected: true, seatIndex: 3 },
];

function turn(overrides: Partial<TurnState> = {}): TurnState {
  return {
    activePlayerId: 'a1',
    activeTeam: 'A',
    currentWord: 'PERRERA',
    category: 'Clásico',
    turnStartTime: 0,
    requiredGuesses: 1,
    successfulGuesses: 0,
    doubleRevealed: false,
    isFrozen: false,
    rewardForfeited: false,
    direction: 1,
    ...overrides,
  };
}

const tool = (type: PowerUpType): PowerUp => ({ id: `t-${type}`, type });
const allTools = (['REVERSE', 'SKIP', 'DOUBLE_BURDEN', 'FREEZE', 'SHIELD', 'XRAY', 'REWIRE'] as PowerUpType[]).map(tool);

function setContext(me: string, currentTurn: TurnState, extra: Partial<GameState> = {}, tools = allTools) {
  const myPlayer = players.find((p) => p.id === me)!;
  const game: GameState = {
    gameNumber: 1,
    status: 'PLAYING',
    scores: { A: 0, B: 0 },
    targetScore: 5,
    roundNumber: 1,
    currentTurn,
    teamInventory: { A: [], B: [], [myPlayer.team]: tools },
    boardTiles: [],
    packIds: ['p1'],
    settings: DEFAULT_SETTINGS,
    participantIds: players.map((p) => p.id),
    ...extra,
  };
  Object.keys(mockGame).forEach((k) => delete mockGame[k]);
  Object.assign(mockGame, {
    game,
    currentTurn,
    players,
    myPlayer,
    inventory: game.teamInventory,
    lastTick: null,
    usePowerUp: vi.fn().mockResolvedValue({ success: true, data: { powerUpType: 'FREEZE' } }),
    guessSuccess: vi.fn().mockResolvedValue({ success: true, data: { passed: true } }),
    triggerFoul: vi.fn().mockResolvedValue({ success: true }),
  });
}

const toolButton = (type: PowerUpType) =>
  screen.getByRole('button', { name: new RegExp(es.common.powerUps[type].name) }) as HTMLButtonElement;

const shown = (type: PowerUpType) =>
  screen.queryByRole('button', { name: new RegExp(es.common.powerUps[type].name) }) !== null;

describe('ToolsBar', () => {
  afterEach(cleanup);

  it('the holder only sees defensive and team tools', () => {
    setContext('a1', turn());
    render(<ToolsBar />);

    expect(shown('REVERSE')).toBe(true);
    expect(shown('SKIP')).toBe(true);
    expect(shown('XRAY')).toBe(true);
    expect(shown('REWIRE')).toBe(true);
    expect(shown('FREEZE')).toBe(false);
    expect(shown('DOUBLE_BURDEN')).toBe(false);
  });

  it('helpers only see team tools', () => {
    setContext('a2', turn());
    render(<ToolsBar />);

    expect(shown('REVERSE')).toBe(false);
    expect(shown('FREEZE')).toBe(false);
    expect(shown('XRAY')).toBe(true);
  });

  it('saboteurs see offensive and team tools', () => {
    setContext('b1', turn());
    render(<ToolsBar />);

    expect(shown('FREEZE')).toBe(true);
    expect(shown('DOUBLE_BURDEN')).toBe(true);
    expect(shown('REWIRE')).toBe(true);
    expect(shown('SKIP')).toBe(false);
  });

  it('never shows the passive bomb suit', () => {
    setContext('a1', turn());
    render(<ToolsBar />);
    expect(screen.queryByText(es.common.powerUps.SHIELD.name)).toBeNull();
  });

  it('shows nothing while the round is paused', () => {
    setContext('b1', turn(), { status: 'DISPUTE_PAUSED' });
    const { container } = render(<ToolsBar />);
    expect(container.textContent).toBe('');
  });

  it('renders nothing when the team has no tools', () => {
    setContext('a1', turn(), {}, []);
    const { container } = render(<ToolsBar />);
    expect(container.textContent).toBe('');
  });
});

describe('Using a tool', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('holding a usable tool calls usePowerUp with its id', async () => {
    setContext('b1', turn());
    render(<OpponentRefereeView />);

    fireEvent.pointerDown(toolButton('FREEZE'));
    await act(async () => vi.advanceTimersByTime(500));
    expect(mockGame.usePowerUp).toHaveBeenCalledWith('t-FREEZE');
  });

  it('a tap that is not held does nothing', async () => {
    setContext('b1', turn());
    render(<ToolsBar />);

    fireEvent.pointerDown(toolButton('FREEZE'));
    act(() => vi.advanceTimersByTime(200));
    fireEvent.pointerUp(toolButton('FREEZE'));
    await act(async () => vi.advanceTimersByTime(1000));
    expect(mockGame.usePowerUp).not.toHaveBeenCalled();
  });
});

describe('Jammer (frozen button)', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('blocks the cut button with a countdown and re-enables it when time runs out', async () => {
    setContext('a1', turn({ isFrozen: true, freezeRemainingMs: 2500 }));
    render(<ActiveGiverView />);

    const frozen = screen.getByRole('button', { name: new RegExp(es.game.holder.frozen(3)) }) as HTMLButtonElement;
    expect(frozen.disabled).toBe(true);
    expect(screen.queryByText(es.game.holder.cutWire)).toBeNull();

    act(() => vi.advanceTimersByTime(1000));
    expect(screen.getByText(es.game.holder.frozen(2))).toBeDefined();

    act(() => vi.advanceTimersByTime(1600));
    const cut = screen.getByRole('button', { name: new RegExp(es.game.holder.cutWire) }) as HTMLButtonElement;
    expect(cut.disabled).toBe(false);
    await act(async () => fireEvent.click(cut));
    expect(mockGame.guessSuccess).toHaveBeenCalled();
  });

  it('helpers and saboteurs see a small jammed indicator', () => {
    setContext('a2', turn({ isFrozen: true, freezeRemainingMs: 3000 }));
    render(<TeamMateView />);
    expect(screen.getByText(es.game.turn.frozenBadge(3))).toBeDefined();
    cleanup();

    setContext('b1', turn({ isFrozen: true, freezeRemainingMs: 3000 }));
    render(<OpponentRefereeView />);
    expect(screen.getByText(es.game.turn.frozenBadge(3))).toBeDefined();
  });
});

describe('Double detonator wire counter', () => {
  afterEach(cleanup);

  it('is hidden with a single wire', () => {
    setContext('a1', turn());
    render(<ActiveGiverView />);
    expect(screen.queryByText(/Cable \d\/\d/)).toBeNull();
  });

  it('shows the current wire to the holder, helpers and saboteurs', () => {
    const doubled = turn({ requiredGuesses: 3, successfulGuesses: 1, doubleRevealed: true });
    const text = es.game.turn.wireCounter(2, 3);

    setContext('a1', doubled);
    render(<ActiveGiverView />);
    expect(screen.getByText(text)).toBeDefined();
    cleanup();

    setContext('a2', doubled);
    render(<TeamMateView />);
    expect(screen.getByText(text)).toBeDefined();
    cleanup();

    setContext('b1', doubled);
    render(<OpponentRefereeView />);
    expect(screen.getByText(text)).toBeDefined();
  });
});

describe('Passing direction', () => {
  afterEach(cleanup);

  it('shows the reversed indicator on the compact board only when reversed', () => {
    setContext('a1', turn());
    render(<GameBoard compact />);
    expect(screen.queryByText(new RegExp(es.game.turn.reversed))).toBeNull();
    cleanup();

    setContext('a1', turn({ direction: -1 }));
    render(<GameBoard compact />);
    expect(screen.getByText(new RegExp(es.game.turn.reversed))).toBeDefined();
  });
});
