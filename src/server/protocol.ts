import {
  DisputeResolution,
  DisputeState,
  GameSettings,
  GameState,
  Player,
  PowerUp,
  PowerUpType,
  RoomState,
  TeamId,
  TurnChangeReason,
  XrayReading,
} from '../core/types.js';
import type {GameErrorCode} from '../core/errors.js';

/** Códigos de error que puede recibir el cliente (los del servidor + fallos de red locales). */
export type ApiErrorCode = GameErrorCode | 'NOT_CONNECTED' | 'TIMEOUT' | 'CONNECTION_ERROR';

export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string; code: ApiErrorCode };

/**
 * Foto completa de lo que ve UN jugador: la sala y, si hay una en curso, la partida.
 * `game` es null mientras la sala está reunida sin jugar. La partida viene filtrada para
 * quien la recibe: solo las herramientas de su equipo, el cable solo para el artificiero y
 * los saboteadores, y el Doble detonador oculto al equipo portador hasta que se revela.
 */
export interface RoomSnapshot {
  room: RoomState;
  game: GameState | null;
}

export interface CreateRoomPayload {
  playerName: string;
}

export interface JoinRoomPayload {
  roomCode: string;
  playerName: string;
}

/** Volver a una sala tras recargar o perder la conexión, con el token secreto recibido al entrar. */
export interface RejoinRoomPayload {
  roomCode: string;
  sessionToken: string;
}

export interface SwitchTeamPayload {
  targetTeam: TeamId;
}

/** Cambios en la preparación de la próxima partida (solo anfitrión, sin partida en curso). */
export interface UpdateSetupPayload {
  settings?: Partial<GameSettings>;
  packIds?: string[];
}

export interface ResolveDisputePayload {
  resolution: DisputeResolution;
}

export interface UsePowerUpPayload {
  powerUpId: string;
}

/** Solo el ritmo del tic-tac: el tiempo restante es secreto y nunca sale del servidor. */
export interface TimerTickPayload {
  intervalMs: number;
  activePlayerId: string;
}

export interface TimerExplodedPayload {
  explodedPlayerId: string;
  losingTeam: TeamId;
  winningTeam: TeamId;
  scores: Record<TeamId, number>;
  isGameOver: boolean;
  winner?: TeamId;
}

export interface ClientToServerEvents {
  // --- Sala ---
  'room:create': (
    payload: CreateRoomPayload,
    callback: (res: ApiResponse<RoomSnapshot & { player: Player; sessionToken: string }>) => void
  ) => void;
  'room:join': (
    payload: JoinRoomPayload,
    callback: (res: ApiResponse<RoomSnapshot & { player: Player; sessionToken: string }>) => void
  ) => void;
  'room:rejoin': (
    payload: RejoinRoomPayload,
    callback: (res: ApiResponse<RoomSnapshot & { player: Player }>) => void
  ) => void;
  'room:leave': (callback?: (res: ApiResponse<{}>) => void) => void;
  /** Solo sin partida en curso. */
  'room:switch_team': (
    payload: SwitchTeamPayload,
    callback: (res: ApiResponse<RoomSnapshot>) => void
  ) => void;
  /** Ajustes y mazos de la próxima partida. Solo anfitrión, sin partida en curso. */
  'room:update_setup': (
    payload: UpdateSetupPayload,
    callback: (res: ApiResponse<RoomSnapshot>) => void
  ) => void;

  // --- Partida ---
  /** Crea una partida con la preparación actual y arranca la primera ronda. Solo anfitrión. */
  'game:start': (callback: (res: ApiResponse<RoomSnapshot>) => void) => void;
  /** Siguiente ronda (desde ROUND_OVER). Solo anfitrión. */
  'game:start_round': (callback: (res: ApiResponse<RoomSnapshot>) => void) => void;
  /**
   * Termina la partida y vuelve a la sala. Solo anfitrión. Tras GAME_OVER cierra el podio;
   * antes, abandona la partida (queda en el historial como no terminada).
   */
  'game:end': (callback: (res: ApiResponse<RoomSnapshot>) => void) => void;
  /** El artificiero corta el cable. Si quedan cables (Doble detonador), sigue con otro; si no, pasa la bomba. */
  'turn:guess_success': (callback: (res: ApiResponse<{ passed: boolean }>) => void) => void;
  /** Cantar falta: la ronda se detiene y el anfitrión decide (el motivo se discute en la mesa). */
  'turn:foul_triggered': (callback: (res: ApiResponse<{ dispute: DisputeState }>) => void) => void;
  'host:resolve_dispute': (
    payload: ResolveDisputePayload,
    callback: (res: ApiResponse<RoomSnapshot>) => void
  ) => void;
  'powerup:use': (
    payload: UsePowerUpPayload,
    callback: (res: ApiResponse<{ powerUpType: PowerUpType }>) => void
  ) => void;
}

/**
 * Los eventos solo avisan (sonidos, vibración, notificaciones); el estado completo llega
 * siempre en `room:state_updated`, filtrado para cada jugador.
 */
export interface ServerToClientEvents {
  'room:state_updated': (payload: RoomSnapshot) => void;
  'game:round_started': (payload: { roundNumber: number }) => void;
  'timer:tick': (payload: TimerTickPayload) => void;
  'turn:changed': (payload: { reason: TurnChangeReason }) => void;
  'game:dispute_started': (payload: { dispute: DisputeState }) => void;
  'game:dispute_resolved': (payload: { resolution: DisputeResolution }) => void;
  'timer:exploded': (payload: TimerExplodedPayload) => void;
  'game:over': (payload: { winner: TeamId; finalScores: Record<TeamId, number> }) => void;
  /** Herramienta ganada (acierto rápido o casilla). Solo al equipo que la gana. */
  'powerup:awarded': (payload: { powerUp: PowerUp; source: 'FAST_GUESS' | 'TILE' }) => void;
  /** Herramienta usada. A todos, salvo las secretas (Doble detonador): solo al equipo que la usa. */
  'powerup:activated': (payload: { type: PowerUpType; team: TeamId; byPlayerId: string }) => void;
  /** El equipo portador descubre el Doble detonador (al cortar el primer cable o porque se lo devuelven). A todos. */
  'powerup:double_revealed': (payload: { requiredGuesses: number; bounced: boolean; holderTeam: TeamId }) => void;
  /** Resultado de Rayos X. Solo al equipo que lo usa. */
  'powerup:xray': (payload: { reading: XrayReading }) => void;
  /** El Traje antiexplosivos salvó al artificiero: la bomba se rearma y pasa al rival. A todos. */
  'bomb:shielded': (payload: { playerId: string; team: TeamId }) => void;
  'error:message': (payload: { code: GameErrorCode; message: string }) => void;
}

export interface SocketData {
  playerId?: string;
  roomCode?: string;
  playerName?: string;
}
