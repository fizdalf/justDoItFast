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
  TurnState,
} from '../core/types.js';
import type {GameErrorCode} from '../core/errors.js';

/** Códigos de error que puede recibir el cliente (los del servidor + fallos de red locales). */
export type ApiErrorCode = GameErrorCode | 'NOT_CONNECTED' | 'TIMEOUT' | 'CONNECTION_ERROR';

export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string; code: ApiErrorCode };

/**
 * Foto completa de lo que ve un jugador: la sala y, si hay una en curso, la partida.
 * `game` es null mientras la sala está reunida sin jugar.
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

export interface FoulTriggerPayload {
  reason?: string;
}

export interface ResolveDisputePayload {
  resolution: DisputeResolution;
}

export interface UsePowerUpPayload {
  powerUpId: string;
}

export interface TimerTickPayload {
  elapsedMs: number;
  remainingMs: number;
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

export interface TurnChangedPayload {
  currentTurn: TurnState;
  lastGuessFast: boolean;
  awardedPowerUp?: PowerUp;
}

export interface PowerUpActivatedPayload {
  powerUp: PowerUp;
  activatedByTeam: TeamId;
  currentTurn?: TurnState;
}

export interface RoundStartedPayload {
  roundNumber: number;
  currentTurn: TurnState;
  game: GameState;
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
  'turn:guess_success': (
    callback: (res: ApiResponse<{ isFastGuess: boolean; currentTurn: TurnState }>) => void
  ) => void;
  'turn:foul_triggered': (
    payload: FoulTriggerPayload,
    callback: (res: ApiResponse<{ dispute: DisputeState }>) => void
  ) => void;
  'host:resolve_dispute': (
    payload: ResolveDisputePayload,
    callback: (res: ApiResponse<RoomSnapshot>) => void
  ) => void;
  'powerup:use': (
    payload: UsePowerUpPayload,
    callback: (res: ApiResponse<{ powerUpType: PowerUpType }>) => void
  ) => void;
}

export interface ServerToClientEvents {
  /** Estado completo tras cualquier cambio de sala o partida. Es la fuente de verdad del cliente. */
  'room:state_updated': (payload: RoomSnapshot) => void;
  'game:round_started': (payload: RoundStartedPayload) => void;
  'timer:tick': (payload: TimerTickPayload) => void;
  'turn:changed': (payload: TurnChangedPayload) => void;
  'game:dispute_started': (payload: { dispute: DisputeState; game: GameState }) => void;
  'game:dispute_resolved': (payload: { resolution: DisputeResolution; game: GameState }) => void;
  'powerup:activated': (payload: PowerUpActivatedPayload) => void;
  'timer:exploded': (payload: TimerExplodedPayload) => void;
  'game:over': (payload: { winner: TeamId; finalScores: Record<TeamId, number>; game: GameState }) => void;
  'error:message': (payload: { code: GameErrorCode; message: string }) => void;
}

export interface SocketData {
  playerId?: string;
  roomCode?: string;
  playerName?: string;
}
