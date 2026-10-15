// La URL identifica la sala (/r/ABCD) y sessionStorage guarda quién eres en ella.
// sessionStorage es por pestaña y sobrevive a un F5: varias pestañas del mismo
// navegador pueden ser jugadores distintos sin pisarse.

const ROOM_PATH = /^\/r\/([A-Za-z0-9]{4})\/?$/;
const SESSION_KEY = 'sdr_session';

export interface StoredSession {
  roomCode: string;
  playerId: string;
  sessionToken: string;
}

export function roomPath(roomCode: string): string {
  return `/r/${roomCode.toUpperCase()}`;
}

export function roomInviteUrl(roomCode: string): string {
  return `${window.location.origin}${roomPath(roomCode)}`;
}

/** Código de sala de la URL actual: /r/ABCD o el formato antiguo ?room=ABCD. */
export function getRoomCodeFromUrl(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  const match = window.location.pathname.match(ROOM_PATH);
  if (match) return match[1].toUpperCase();
  const legacy = new URLSearchParams(window.location.search).get('room');
  return legacy ? legacy.toUpperCase() : undefined;
}

/** Refleja en la URL la sala en la que estás (o el inicio si no estás en ninguna). */
export function setRoomUrl(roomCode: string | null, mode: 'push' | 'replace' = 'push'): void {
  if (typeof window === 'undefined') return;
  const target = roomCode ? roomPath(roomCode) : '/';
  if (window.location.pathname === target && !window.location.search) return;
  window.history[mode === 'push' ? 'pushState' : 'replaceState'](null, '', target);
}

export function loadSession(): StoredSession | null {
  if (typeof sessionStorage === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as StoredSession) : null;
  } catch {
    return null;
  }
}

export function saveSession(session: StoredSession): void {
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }
}

export function clearSession(): void {
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.removeItem(SESSION_KEY);
  }
}

/** Sesión guardada que corresponde a la sala de la URL, si la hay. */
export function sessionForCurrentUrl(): StoredSession | null {
  const session = loadSession();
  const urlRoom = getRoomCodeFromUrl();
  return session && urlRoom && session.roomCode === urlRoom ? session : null;
}
