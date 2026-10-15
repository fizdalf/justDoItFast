// @vitest-environment jsdom
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import React from 'react';
import {act, cleanup, fireEvent, render, screen} from '@testing-library/react';
import {HoldButton} from '../../src/client/components/HoldButton.js';

describe('HoldButton', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('fires only after being held for the whole duration', () => {
    const onHold = vi.fn();
    render(<HoldButton onHold={onHold} holdMs={500}>Falta</HoldButton>);

    fireEvent.pointerDown(screen.getByRole('button'));
    act(() => vi.advanceTimersByTime(499));
    expect(onHold).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(1));
    expect(onHold).toHaveBeenCalledTimes(1);
  });

  it('does nothing when released (or the finger slides off) too early', () => {
    const onHold = vi.fn();
    render(<HoldButton onHold={onHold} holdMs={500}>Falta</HoldButton>);
    const button = screen.getByRole('button');

    fireEvent.pointerDown(button);
    act(() => vi.advanceTimersByTime(300));
    fireEvent.pointerUp(button);

    fireEvent.pointerDown(button);
    act(() => vi.advanceTimersByTime(300));
    fireEvent.pointerLeave(button);

    act(() => vi.advanceTimersByTime(1000));
    expect(onHold).not.toHaveBeenCalled();
  });

  it('can be held with the keyboard and ignores holds while disabled', () => {
    const onHold = vi.fn();
    const { rerender } = render(<HoldButton onHold={onHold}>Falta</HoldButton>);

    fireEvent.keyDown(screen.getByRole('button'), { key: ' ' });
    act(() => vi.advanceTimersByTime(500));
    expect(onHold).toHaveBeenCalledTimes(1);

    rerender(<HoldButton onHold={onHold} disabled>Falta</HoldButton>);
    fireEvent.pointerDown(screen.getByRole('button'));
    act(() => vi.advanceTimersByTime(1000));
    expect(onHold).toHaveBeenCalledTimes(1);
  });
});

describe('Calling a foul', () => {
  const mockGame: Record<string, any> = {};

  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.resetModules();
  });

  it('holding the foul button calls the foul directly, with no reasons to pick', async () => {
    vi.doMock('../../src/client/context/GameContext.js', () => ({ useGame: () => mockGame }));
    Object.assign(mockGame, {
      currentTurn: { activePlayerId: 'a1', currentWord: 'PERRERA', category: 'Clásico' },
      game: null,
      players: [{ id: 'a1', name: 'Ana', team: 'A' }],
      triggerFoul: vi.fn().mockResolvedValue({ success: true }),
    });
    const { OpponentRefereeView } = await import('../../src/client/components/views/OpponentRefereeView.js');
    render(<OpponentRefereeView />);

    fireEvent.pointerDown(screen.getByRole('button', { name: /¡FALTA!/ }));
    await act(async () => vi.advanceTimersByTime(500));

    expect(mockGame.triggerFoul).toHaveBeenCalledWith();
    expect(screen.queryByText(/motivo/i)).toBeNull();
  });
});
