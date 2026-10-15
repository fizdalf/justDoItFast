import type {PowerUpType, TeamId} from '../../../../core/types.js';
import type {SocketStatus} from '../../../services/socketService.js';

// Vocabulario del juego: renombrar roles, equipos o herramientas se hace aquí.
export const common = {
  gameName: '¡Desactívala! ¡Rápido!',
  tagline: 'Haz que adivinen el cable antes de que la bomba te explote en las manos',

  roles: {
    /** Quien tiene la bomba y da pistas del cable (con palabras, mímica, sonidos...). */
    holder: { singular: 'Artificiero', plural: 'Artificieros' },
    /** Compañeros del artificiero: adivinan el cable. */
    helpers: { singular: 'Ayudante', plural: 'Ayudantes' },
    /** Equipo rival del artificiero: vigilan, cantan faltas y sabotean. */
    saboteurs: { singular: 'Saboteador', plural: 'Saboteadores' },
    host: { singular: 'Anfitrión', plural: 'Anfitriones' },
  },

  teams: {
    A: 'Equipo Rojo',
    B: 'Equipo Azul',
  } as Record<TeamId, string>,

  tools: 'Herramientas',
  yourTeamTools: '🧰 Herramientas de tu equipo',

  powerUps: {
    REVERSE: {
      name: 'Devolver al remitente',
      description: 'Devuelve la bomba a quien te la acaba de pasar e invierte el sentido de los pases.',
    },
    SKIP: {
      name: 'Otro cable',
      description: 'Descarta el cable actual y coge otro. Este turno ya no gana herramientas.',
    },
    DOUBLE_BURDEN: {
      name: 'Doble detonador',
      description: 'La bomba del rival tiene un cable más. No lo sabrán hasta cortar el primero.',
    },
    FREEZE: {
      name: 'Inhibidor',
      description: 'Bloquea el botón del artificiero rival durante unos segundos.',
    },
    SHIELD: {
      name: 'Traje antiexplosivos',
      description: 'Se activa sola si la bomba os explota: se rearma con mecha corta y pasa al rival.',
    },
    XRAY: {
      name: 'Rayos X',
      description: 'Tu equipo ve más o menos cuánto le queda a la bomba.',
    },
    REWIRE: {
      name: 'Reprogramar temporizador',
      description: 'El tiempo que le queda a la bomba se vuelve a sortear en secreto.',
    },
  } as Record<PowerUpType, { name: string; description: string }>,

  connection: {
    DISCONNECTED: 'desconectado',
    CONNECTING: 'conectando',
    CONNECTED: 'conectado',
    RECONNECTING: 'reconectando',
    ERROR: 'error',
  } as Record<SocketStatus, string>,

  header: {
    bombAlt: 'bomba',
    copyRoomCode: 'Copiar código de sala',
    mute: 'Silenciar sonido',
    unmute: 'Activar sonido',
    admin: '⚙️ Admin',
    adminTitle: 'Panel de administración de mazos',
    leave: 'Salir',
    leaveTitle: 'Salir de la sala',
    language: 'Idioma',
    menu: 'Menú',
    roomCode: 'Código de sala',
  },

  you: '(Tú)',
  hostBadge: 'Anfitrión',
  back: 'Volver',
  cancel: 'Cancelar',
  close: 'Cerrar',
  dismiss: 'Descartar',
  aPlayer: 'un jugador',
  disconnected: 'desconectado',
  returningToRoom: (roomCode: string) => `Volviendo a la sala ${roomCode}...`,
  waitingForHost: (hostName: string) => `Esperando a que el anfitrión (${hostName}) continúe...`,
};

export type CommonMessages = typeof common;
