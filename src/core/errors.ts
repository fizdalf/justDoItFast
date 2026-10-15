// Errores con código estable. El servidor nunca envía textos para mostrar:
// el cliente traduce el código al idioma de cada jugador. `message` queda
// como texto técnico (logs, tests).

export type GameErrorCode =
  | 'ROOM_NOT_FOUND'
  | 'ROOM_CODE_REQUIRED'
  | 'NOT_IN_ROOM'
  | 'SESSION_EXPIRED'
  | 'NAME_REQUIRED'
  | 'PLAYER_NOT_FOUND'
  | 'NOT_HOST'
  | 'INVALID_STATE'
  | 'NOT_ENOUGH_PLAYERS'
  | 'INVALID_SETTINGS'
  | 'NOT_ACTIVE_PLAYER'
  | 'NOT_A_PARTICIPANT'
  | 'NO_PACKS_SELECTED'
  | 'ONLY_OPPONENTS_CAN_FOUL'
  | 'PACK_NOT_FOUND'
  | 'PACK_NAME_REQUIRED'
  | 'PACK_CATEGORY_REQUIRED'
  | 'PACK_TOO_FEW_WORDS'
  | 'INVALID_IMPORT'
  | 'POWERUP_NOT_FOUND'
  | 'POWERUP_NOT_ALLOWED'
  | 'FROZEN'
  | 'UNAUTHORIZED'
  | 'INTERNAL';

export class GameError extends Error {
  constructor(
    public readonly code: GameErrorCode,
    message: string
  ) {
    super(message);
    this.name = 'GameError';
  }
}

export function errorCodeOf(err: unknown): GameErrorCode {
  return err instanceof GameError ? err.code : 'INTERNAL';
}
