// @vitest-environment jsdom
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import React from 'react';
import {cleanup, fireEvent, render, screen} from '@testing-library/react';
import {GameState, Player} from '../../src/core/types.js';
import {es} from '../../src/client/i18n/locales/es/index.js';
import {DEFAULT_SETTINGS} from '../../src/core/settings.js';

const mockGame: Record<string, any> = {};

vi.mock('../../src/client/context/GameContext.js', () => ({
  useGame: () => mockGame,
}));

const { RoundOverView } = await import('../../src/client/components/views/RoundOverView.js');
const { GameOverView } = await import('../../src/client/components/views/GameOverView.js');

const players: Player[] = [
  { id: 'a1', name: 'Alice', team: 'A', isHost: true, isConnected: true, seatIndex: 0 },
  { id: 'b1', name: 'Bob', team: 'B', isHost: false, isConnected: true, seatIndex: 1 },
];

function baseState(overrides: Partial<GameState> = {}): GameState {
  return {
    gameNumber: 1,
    status: 'ROUND_OVER',
    scores: { A: 0, B: 1 },
    targetScore: 5,
    roundNumber: 1,
    teamInventory: { A: [], B: [] },
    boardTiles: [],
    packIds: ['classic-1996'],
    participantIds: players.map((p) => p.id),
    settings: DEFAULT_SETTINGS,
    ...overrides,
  };
}

function setGame(game: GameState, me: Player, extra: Record<string, any> = {}) {
  Object.keys(mockGame).forEach((k) => delete mockGame[k]);
  Object.assign(mockGame, {
    game,
    players,
    myPlayer: me,
    hostPlayer: players[0],
    isHost: me.id === players[0].id,
    isSpectator: false,
    gameOver: null,
    startRound: vi.fn().mockResolvedValue({ success: true }),
    endGame: vi.fn().mockResolvedValue({ success: true }),
    leaveRoom: vi.fn().mockResolvedValue({ success: true }),
    ...extra,
  });
}

describe('RoundOverView', () => {
  afterEach(cleanup);

  const explosionState = baseState({
    lastRoundResult: {
      reason: 'EXPLOSION',
      winningTeam: 'B',
      losingTeam: 'A',
      explodedPlayerId: 'a1',
      explodedWord: 'Patata',
    },
  });

  it('shows who held the bomb, the wire and the scoring team', () => {
    setGame(explosionState, players[1]);
    render(<RoundOverView />);

    expect(screen.getByText('¡BOOM!')).toBeDefined();
    expect(screen.getByText('Alice')).toBeDefined();
    expect(screen.getByText('Patata')).toBeDefined();
    expect(screen.getByText(/\+1 punto para el Equipo Azul/)).toBeDefined();
  });

  it('lets only the host start the next round', () => {
    setGame(explosionState, players[1]);
    render(<RoundOverView />);
    expect(screen.queryByText(es.game.roundOver.nextRound)).toBeNull();
    expect(screen.getByText(/Esperando a que el anfitrión \(Alice\)/)).toBeDefined();
    cleanup();

    setGame(explosionState, players[0]);
    render(<RoundOverView />);
    fireEvent.click(screen.getByText(es.game.roundOver.nextRound));
    expect(mockGame.startRound).toHaveBeenCalledTimes(1);
  });
});

describe('GameOverView', () => {
  afterEach(cleanup);

  beforeEach(() => {
    setGame(baseState({ status: 'GAME_OVER', scores: { A: 2, B: 5 }, winningTeam: 'B' }), players[0], {
      gameOver: { winner: 'B', finalScores: { A: 2, B: 5 }, game: baseState() },
    });
  });

  it('announces the actual winning team', () => {
    render(<GameOverView />);
    expect(screen.getByText(/GANADOR: EQUIPO AZUL/i)).toBeDefined();
  });

  it('lets the host close the podium back to the room and anyone leave the room', () => {
    render(<GameOverView />);
    fireEvent.click(screen.getByText(es.game.gameOver.backToRoom));
    expect(mockGame.endGame).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText(es.game.gameOver.leaveRoom));
    expect(mockGame.leaveRoom).toHaveBeenCalledTimes(1);
  });

  it('makes other players wait for the host to head back', () => {
    setGame(baseState({ status: 'GAME_OVER', winningTeam: 'B' }), players[1]);
    render(<GameOverView />);
    expect(screen.queryByText(es.game.gameOver.backToRoom)).toBeNull();
    expect(screen.getByText(es.game.gameOver.waitingBackToRoom('Alice'))).toBeDefined();
  });
});
