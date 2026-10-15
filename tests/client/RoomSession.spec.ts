// @vitest-environment jsdom
import {beforeEach, describe, expect, it} from 'vitest';
import {
    clearSession,
    getRoomCodeFromUrl,
    loadSession,
    roomPath,
    saveSession,
    sessionForCurrentUrl,
    setRoomUrl,
} from '../../src/client/services/roomSession.js';

const session = { roomCode: 'ABCD', playerId: 'p_1', sessionToken: 'secret-token' };

describe('room URL and per-tab session', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/');
    sessionStorage.clear();
  });

  it('reads the room code from /r/CODE and from legacy ?room= links', () => {
    window.history.replaceState(null, '', '/r/abcd');
    expect(getRoomCodeFromUrl()).toBe('ABCD');

    window.history.replaceState(null, '', '/?room=wxyz');
    expect(getRoomCodeFromUrl()).toBe('WXYZ');

    window.history.replaceState(null, '', '/');
    expect(getRoomCodeFromUrl()).toBeUndefined();
  });

  it('puts the room in the URL and removes it when leaving', () => {
    setRoomUrl('abcd');
    expect(window.location.pathname).toBe(roomPath('ABCD'));

    setRoomUrl(null);
    expect(window.location.pathname).toBe('/');
  });

  it('only restores the session that belongs to the room in the URL', () => {
    saveSession(session);

    window.history.replaceState(null, '', '/r/ABCD');
    expect(sessionForCurrentUrl()).toEqual(session);

    window.history.replaceState(null, '', '/r/ZZZZ');
    expect(sessionForCurrentUrl()).toBeNull();

    window.history.replaceState(null, '', '/');
    expect(sessionForCurrentUrl()).toBeNull();
  });

  it('forgets the session when cleared', () => {
    saveSession(session);
    expect(loadSession()).toEqual(session);
    clearSession();
    expect(loadSession()).toBeNull();
  });
});
