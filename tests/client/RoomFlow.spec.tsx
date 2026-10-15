// @vitest-environment jsdom
import {afterEach, describe, expect, it, vi} from 'vitest';
import React from 'react';
import {cleanup, fireEvent, render, screen, waitFor} from '@testing-library/react';
import {GameState, GameSummary, Player, RoomState, WordPack} from '../../src/core/types.js';
import {DEFAULT_SETTINGS} from '../../src/core/settings.js';
import {es} from '../../src/client/i18n/locales/es/index.js';

const mockGame: Record<string, any> = {};

vi.mock('../../src/client/context/GameContext.js', () => ({
  useGame: () => mockGame,
}));

const packs: WordPack[] = [
  { id: 'p1', name: 'Clásico', description: '', category: 'General', isPremium: false, words: ['A', 'B', 'C'] },
  { id: 'p2', name: 'Cine', description: '', category: 'Cine', isPremium: false, words: ['C', 'D'] },
];

vi.mock('../../src/client/hooks/usePacks.js', () => ({
  usePacks: () => packs,
}));

const { PackSelector } = await import('../../src/client/components/lobby/PackSelector.js');
const { RoomHistoryPanel } = await import('../../src/client/components/lobby/RoomHistoryPanel.js');
const { EndGameControl } = await import('../../src/client/components/EndGameControl.js');
const { SpectatorView } = await import('../../src/client/components/views/SpectatorView.js');
const { RoomView } = await import('../../src/client/components/RoomView.js');

function player(id: string, team: 'A' | 'B', seatIndex: number, isConnected = true): Player {
  return { id, name: id.toUpperCase(), team, isHost: id === 'a1', isConnected, seatIndex };
}

const fullTeams = [player('a1', 'A', 0), player('b1', 'B', 1), player('a2', 'A', 2), player('b2', 'B', 3)];

function makeRoom(overrides: Partial<RoomState> = {}): RoomState {
  return {
    roomCode: 'ABCD',
    hostPlayerId: 'a1',
    players: fullTeams,
    setup: { settings: DEFAULT_SETTINGS, packIds: ['p1'] },
    history: [],
    ...overrides,
  };
}

function makeGame(overrides: Partial<GameState> = {}): GameState {
  return {
    gameNumber: 1,
    status: 'PLAYING',
    scores: { A: 1, B: 2 },
    targetScore: 5,
    roundNumber: 2,
    teamInventory: { A: [], B: [] },
    boardTiles: [],
    packIds: ['p1'],
    settings: DEFAULT_SETTINGS,
    participantIds: fullTeams.map((p) => p.id),
    currentTurn: {
      activePlayerId: 'a1',
      activeTeam: 'A',
      currentWord: 'SECRETO',
      category: 'General',
      turnStartTime: 0,
      requiredGuesses: 1,
      successfulGuesses: 0,
      doubleRevealed: false,
      isFrozen: false,
      rewardForfeited: false,
      direction: 1,
    },
    ...overrides,
  };
}

function setContext(values: Record<string, any>) {
  Object.keys(mockGame).forEach((k) => delete mockGame[k]);
  const room: RoomState = values.room ?? makeRoom();
  const me = room.players.find((p) => p.id === (values.playerId ?? 'a1'));
  Object.assign(mockGame, {
    room,
    game: null,
    players: room.players,
    myPlayer: me,
    hostPlayer: room.players.find((p) => p.id === room.hostPlayerId),
    isHost: me?.id === room.hostPlayerId,
    isSpectator: false,
    currentTurn: null,
    currentDispute: null,
    gameOver: null,
    error: null,
    clearError: vi.fn(),
    switchTeam: vi.fn().mockResolvedValue({ success: true }),
    updateSetup: vi.fn().mockResolvedValue({ success: true }),
    startGame: vi.fn().mockResolvedValue({ success: true }),
    startRound: vi.fn().mockResolvedValue({ success: true }),
    endGame: vi.fn().mockResolvedValue({ success: true }),
    leaveRoom: vi.fn().mockResolvedValue({ success: true }),
    resolveDispute: vi.fn().mockResolvedValue({ success: true }),
    ...values,
  });
}

const packLabel = (name: string) => new RegExp(name);

describe('PackSelector', () => {
  afterEach(cleanup);

  it('lets the host add and remove decks', () => {
    setContext({ room: makeRoom({ setup: { settings: DEFAULT_SETTINGS, packIds: ['p1', 'p2'] } }) });
    render(<PackSelector />);

    const cine = screen.getByRole('checkbox', { name: packLabel('Cine') });
    expect(cine.getAttribute('aria-checked')).toBe('true');
    fireEvent.click(cine);
    expect(mockGame.updateSetup).toHaveBeenCalledWith({ packIds: ['p1'] });
  });

  it('adds an unselected deck to the selection', () => {
    setContext({});
    render(<PackSelector />);

    fireEvent.click(screen.getByRole('checkbox', { name: packLabel('Cine') }));
    expect(mockGame.updateSetup).toHaveBeenCalledWith({ packIds: ['p1', 'p2'] });
  });

  it('never leaves the room without decks', () => {
    setContext({});
    render(<PackSelector />);

    const only = screen.getByRole('checkbox', { name: packLabel('Clásico') });
    expect(only.getAttribute('aria-disabled')).toBe('true');
    fireEvent.click(only);
    expect(mockGame.updateSetup).not.toHaveBeenCalled();
  });

  it('shows the combined word count without repeated words', () => {
    setContext({ room: makeRoom({ setup: { settings: DEFAULT_SETTINGS, packIds: ['p1', 'p2'] } }) });
    render(<PackSelector />);
    expect(screen.getByText(es.lobby.pack.total(4))).toBeDefined();
  });

  it('only shows the selected decks to other players', () => {
    setContext({ playerId: 'b1' });
    render(<PackSelector />);

    expect(screen.queryByRole('checkbox')).toBeNull();
    expect(screen.getByText(`Clásico · ${es.lobby.pack.words(3)}`)).toBeDefined();
    expect(screen.queryByText(/Cine/)).toBeNull();
  });
});

describe('RoomHistoryPanel', () => {
  afterEach(cleanup);

  const finished: GameSummary = {
    gameNumber: 1,
    packIds: ['p1', 'p2'],
    scores: { A: 5, B: 3 },
    winningTeam: 'A',
    finished: true,
    roundsPlayed: 8,
    endedAt: 1,
  };
  const abandoned: GameSummary = {
    gameNumber: 2,
    packIds: ['p2'],
    scores: { A: 1, B: 2 },
    finished: false,
    roundsPlayed: 3,
    endedAt: 2,
  };

  it('says when no game has been played yet', () => {
    setContext({});
    render(<RoomHistoryPanel />);
    expect(screen.getByText(es.lobby.history.empty)).toBeDefined();
  });

  it('lists finished and abandoned games, newest first', () => {
    setContext({ room: makeRoom({ history: [finished, abandoned] }) });
    render(<RoomHistoryPanel />);

    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(items[0].textContent).toContain(es.lobby.history.gameLabel(2));
    expect(items[0].textContent).toContain(es.lobby.history.abandoned);
    expect(items[1].textContent).toContain(es.lobby.history.gameLabel(1));
    expect(items[1].textContent).toContain('Clásico · Cine');
    expect(items[1].textContent).toContain(es.lobby.history.winner(es.common.teams.A));
    expect(items[1].textContent).toContain('5 – 3');
  });
});

describe('EndGameControl', () => {
  afterEach(cleanup);

  it('is only offered to the host during a game', () => {
    setContext({ game: makeGame(), playerId: 'b1' });
    render(<EndGameControl />);
    expect(screen.queryByText(es.game.endGame.button)).toBeNull();
    cleanup();

    setContext({ game: null });
    render(<EndGameControl />);
    expect(screen.queryByText(es.game.endGame.button)).toBeNull();
  });

  it('does nothing when the confirmation is cancelled', () => {
    setContext({ game: makeGame() });
    render(<EndGameControl />);

    fireEvent.click(screen.getByText(es.game.endGame.button));
    expect(screen.getByText(es.game.endGame.confirmTitle)).toBeDefined();
    fireEvent.click(screen.getByText(es.common.cancel));

    expect(screen.queryByText(es.game.endGame.confirmTitle)).toBeNull();
    expect(mockGame.endGame).not.toHaveBeenCalled();
  });

  it('ends the game once confirmed', async () => {
    setContext({ game: makeGame() });
    render(<EndGameControl />);

    fireEvent.click(screen.getByText(es.game.endGame.button));
    fireEvent.click(screen.getByText(es.game.endGame.confirm));
    expect(mockGame.endGame).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.queryByText(es.game.endGame.confirmTitle)).toBeNull());
  });
});

describe('SpectatorView', () => {
  afterEach(cleanup);

  it('shows the board and the notice but never the wire', () => {
    const latecomer = player('c1', 'A', 4);
    const room = makeRoom({ players: [...fullTeams, latecomer] });
    const game = makeGame();
    setContext({ room, game, playerId: 'c1', isSpectator: true, currentTurn: game.currentTurn });
    render(<SpectatorView />);

    expect(screen.getByText(es.game.spectator.body)).toBeDefined();
    expect(screen.getByText(es.game.board.goal(5))).toBeDefined();
    expect(screen.queryByText('SECRETO')).toBeNull();
  });
});

describe('RoomView start button', () => {
  afterEach(cleanup);

  it('lets the host start once both teams have 2 connected players', () => {
    setContext({});
    render(<RoomView />);

    fireEvent.click(screen.getByText(es.lobby.startGame));
    expect(mockGame.startGame).toHaveBeenCalledTimes(1);
  });

  it('is disabled without quorum, counting only connected players', () => {
    const players = [player('a1', 'A', 0), player('b1', 'B', 1), player('a2', 'A', 2), player('b2', 'B', 3, false)];
    setContext({ room: makeRoom({ players }) });
    render(<RoomView />);

    expect(screen.getByText(es.lobby.quorumMissing)).toBeDefined();
    const button = screen.getByText(es.lobby.startGame).closest('button')!;
    expect(button.disabled).toBe(true);
    fireEvent.click(button);
    expect(mockGame.startGame).not.toHaveBeenCalled();
  });

  it('is not shown to other players', () => {
    setContext({ playerId: 'b1' });
    render(<RoomView />);

    expect(screen.queryByText(es.lobby.startGame)).toBeNull();
    expect(screen.getByText(es.lobby.waitingForHostToStart('A1'))).toBeDefined();
  });
});
