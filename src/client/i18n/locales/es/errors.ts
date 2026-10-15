import type {ApiErrorCode} from '../../../../server/protocol.js';

// Un texto por código de error. Añadir un código nuevo obliga a traducirlo aquí.
export const errors: Record<ApiErrorCode, string> = {
  ROOM_NOT_FOUND: 'No existe ninguna sala con ese código.',
  ROOM_CODE_REQUIRED: 'Escribe el código de la sala.',
  NOT_IN_ROOM: 'No estás en ninguna sala.',
  SESSION_EXPIRED: 'Ya no formas parte de esa sala. Vuelve a unirte con el código.',
  NAME_REQUIRED: 'Escribe tu nombre.',
  PLAYER_NOT_FOUND: 'Ese jugador ya no está en la sala.',
  NOT_HOST: 'Solo el anfitrión puede hacer eso.',
  INVALID_STATE: 'Ahora mismo no se puede hacer eso.',
  NOT_ENOUGH_PLAYERS: 'Hacen falta al menos 2 jugadores conectados por equipo.',
  INVALID_SETTINGS: 'Alguno de los ajustes no es válido.',
  NOT_ACTIVE_PLAYER: 'Solo el artificiero puede cortar el cable.',
  NOT_A_PARTICIPANT: 'No juegas en esta partida: entrarás en la siguiente.',
  NO_PACKS_SELECTED: 'Elige al menos un mazo de palabras.',
  ONLY_OPPONENTS_CAN_FOUL: 'Solo los saboteadores pueden cantar falta.',
  PACK_NOT_FOUND: 'Ese mazo no existe.',
  PACK_NAME_REQUIRED: 'El mazo necesita un nombre.',
  PACK_CATEGORY_REQUIRED: 'El mazo necesita una categoría.',
  PACK_TOO_FEW_WORDS: 'Un mazo necesita al menos 5 palabras distintas.',
  INVALID_IMPORT: 'El archivo no contiene una lista de mazos válida.',
  POWERUP_NOT_FOUND: 'Esa herramienta ya no está disponible.',
  UNAUTHORIZED: 'Token de administrador incorrecto.',
  INTERNAL: 'Algo ha fallado. Inténtalo de nuevo.',
  NOT_CONNECTED: 'Sin conexión con el servidor.',
  TIMEOUT: 'El servidor no responde. Inténtalo de nuevo.',
  CONNECTION_ERROR: 'No se puede conectar con el servidor.',
};

export type ErrorMessages = typeof errors;
