// @vitest-environment jsdom
import {afterEach, describe, expect, it, vi} from 'vitest';
import React from 'react';
import {cleanup, fireEvent, render, screen, waitFor} from '@testing-library/react';
import {GameSettings, RoomState} from '../../src/core/types.js';
import {ALL_POWER_UPS, DEFAULT_SETTINGS} from '../../src/core/settings.js';
import {es} from '../../src/client/i18n/locales/es/index.js';

const mockGame: Record<string, any> = {};

vi.mock('../../src/client/context/GameContext.js', () => ({
  useGame: () => mockGame,
}));

const { RoomSettingsPanel } = await import('../../src/client/components/lobby/RoomSettingsPanel.js');
const { InviteQr } = await import('../../src/client/components/lobby/InviteQr.js');

const labels = es.lobby.settings;

function setGame(isHost: boolean, settings: Partial<GameSettings> = {}) {
  const room: RoomState = {
    roomCode: 'ABCD',
    hostPlayerId: 'host',
    players: [],
    setup: { settings: { ...DEFAULT_SETTINGS, ...settings }, packIds: ['classic-1996'] },
    history: [],
  };
  Object.keys(mockGame).forEach((k) => delete mockGame[k]);
  Object.assign(mockGame, {
    room,
    game: null,
    isHost,
    updateSetup: vi.fn().mockResolvedValue({ success: true }),
  });
}

describe('RoomSettingsPanel', () => {
  afterEach(cleanup);

  it('lets the host change a setting with the steppers', () => {
    setGame(true);
    render(<RoomSettingsPanel />);

    fireEvent.click(screen.getByLabelText(labels.increase(labels.targetScore)));
    expect(mockGame.updateSetup).toHaveBeenCalledWith({ settings: { targetScore: 6 } });
  });

  it('keeps the shortest fuse below the longest one', () => {
    setGame(true, { minRoundDurationSec: 60, maxRoundDurationSec: 60 });
    render(<RoomSettingsPanel />);

    fireEvent.click(screen.getByLabelText(labels.increase(labels.minRoundDuration)));
    expect(mockGame.updateSetup).toHaveBeenCalledWith({ settings: { minRoundDurationSec: 65, maxRoundDurationSec: 65 } });
  });

  it('lets the host disable a single tool', () => {
    setGame(true);
    render(<RoomSettingsPanel />);

    fireEvent.click(screen.getByText(es.common.powerUps.FREEZE.name));
    expect(mockGame.updateSetup).toHaveBeenCalledWith({ settings: {
      enabledPowerUps: DEFAULT_SETTINGS.enabledPowerUps.filter((t) => t !== 'FREEZE'),
    } });
  });

  it('shows the rules to other players without letting them edit', () => {
    setGame(false, { targetScore: 7 });
    render(<RoomSettingsPanel />);

    expect(screen.getByText(labels.hostOnly)).toBeDefined();
    expect(screen.getByText('7')).toBeDefined();
    expect(screen.queryByLabelText(labels.increase(labels.targetScore))).toBeNull();

    fireEvent.click(screen.getByText(es.common.powerUps.FREEZE.name));
    expect(mockGame.updateSetup).not.toHaveBeenCalled();
  });

  it('lists all seven tools', () => {
    setGame(true);
    render(<RoomSettingsPanel />);
    for (const type of ALL_POWER_UPS) {
      expect(screen.getByText(es.common.powerUps[type].name)).toBeDefined();
    }
  });

  it('shows the bomb suit and rewire steppers only when those tools are enabled', () => {
    const tools = es.common.powerUps;
    setGame(true, { enabledPowerUps: ['FREEZE'] });
    render(<RoomSettingsPanel />);
    expect(screen.queryByText(labels.shieldFuse(tools.SHIELD.name))).toBeNull();
    expect(screen.queryByText(labels.rewireMin(tools.REWIRE.name))).toBeNull();
    expect(screen.queryByText(labels.rewireMax(tools.REWIRE.name))).toBeNull();
    cleanup();

    setGame(true, { enabledPowerUps: ['SHIELD', 'REWIRE'] });
    render(<RoomSettingsPanel />);
    expect(screen.getByText(labels.shieldFuse(tools.SHIELD.name))).toBeDefined();
    expect(screen.getByText(labels.rewireMin(tools.REWIRE.name))).toBeDefined();
    expect(screen.getByText(labels.rewireMax(tools.REWIRE.name))).toBeDefined();

    fireEvent.click(screen.getByLabelText(labels.increase(labels.shieldFuse(tools.SHIELD.name))));
    expect(mockGame.updateSetup).toHaveBeenCalledWith({ settings: { shieldFuseSec: DEFAULT_SETTINGS.shieldFuseSec + 1 } });
  });

  it('keeps the rewire minimum below the maximum', () => {
    const name = es.common.powerUps.REWIRE.name;
    setGame(true, { rewireMinSec: 20, rewireMaxSec: 20 });
    render(<RoomSettingsPanel />);

    fireEvent.click(screen.getByLabelText(labels.increase(labels.rewireMin(name))));
    expect(mockGame.updateSetup).toHaveBeenLastCalledWith({ settings: { rewireMinSec: 25, rewireMaxSec: 25 } });

    fireEvent.click(screen.getByLabelText(labels.decrease(labels.rewireMax(name))));
    expect(mockGame.updateSetup).toHaveBeenLastCalledWith({ settings: { rewireMaxSec: 15, rewireMinSec: 15 } });
  });

  it('hides tool settings when tools are switched off', () => {
    setGame(true, { allowPowerUps: false });
    render(<RoomSettingsPanel />);

    expect(screen.queryByText(labels.maxTools)).toBeNull();
    fireEvent.click(screen.getByRole('switch', { name: labels.toolsEnabled }));
    expect(mockGame.updateSetup).toHaveBeenCalledWith({ settings: { allowPowerUps: true } });
  });
});

describe('InviteQr', () => {
  afterEach(cleanup);

  it('renders a QR image for the room invite link', async () => {
    render(<InviteQr roomCode="ABCD" />);
    const img = await waitFor(() => screen.getByAltText(es.lobby.invite.qrAlt('ABCD')) as HTMLImageElement);
    expect(img.src.startsWith('data:image/png;base64,')).toBe(true);
  });
});
