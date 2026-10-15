import {
  DisputeResolution,
  DisputeState,
  GameSettings,
  GameState,
  Player,
  PowerUp,
  PowerUpType,
  TeamId,
  TurnState,
} from '../core/types.js';
import type {GameErrorCode} from '../core/errors.js';

/** Códigos de error que puede recibir el cliente (los del servidor + fallos de red locales). */
export type ApiErrorCode = GameErrorCode | 'NOT_CONNECTED' | 'TIMEOUT' | 'CONNECTION_ERROR';

export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string; code: ApiErrorCode };

export interface CreateRoomPayload {
  playerName: string;
  selectedPackId?: string;
  settings?: Partial<GameSettings>;
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

export interface SelectPackPayload {
  packId: string;
}

export interface UpdateSettingsPayload {
  settings: Partial<GameSettings>;
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
  gameState: GameState;
}

export interface ClientToServerEvents {
  'room:create': (
    payload: CreateRoomPayload,
    callback: (
      res: ApiResponse<{ roomCode: string; player: Player; gameState: GameState; sessionToken: string }>
    ) => void
  ) => void;
  'room:join': (
    payload: JoinRoomPayload,
    callback: (
      res: ApiResponse<{ player: Player; players: Player[]; gameState: GameState; sessionToken: string }>
    ) => void
  ) => void;
  'room:rejoin': (
    payload: RejoinRoomPayload,
    callback: (res: ApiResponse<{ player: Player; players: Player[]; gameState: GameState }>) => void
  ) => void;
  'room:leave': (callback?: (res: ApiResponse<{}>) => void) => void;
  'room:switch_team': (
    payload: SwitchTeamPayload,
    callback: (res: ApiResponse<{ player: Player; gameState: GameState }>) => void
  ) => void;
  'room:select_pack': (
    payload: SelectPackPayload,
    callback: (res: ApiResponse<{ gameState: GameState }>) => void
  ) => void;
  'room:update_settings': (
    payload: UpdateSettingsPayload,
    callback: (res: ApiResponse<{ gameState: GameState }>) => void
  ) => void;
  'game:start_round': (
    callback: (res: ApiResponse<{ gameState: GameState; currentTurn: TurnState }>) => void
  ) => void;
  'game:return_to_lobby': (
    callback: (res: ApiResponse<{ gameState: GameState }>) => void
  ) => void;
  'turn:guess_success': (
    callback: (res: ApiResponse<{ isFastGuess: boolean; currentTurn: TurnState }>) => void
  ) => void;
  'turn:foul_triggered': (
    payload: FoulTriggerPayload,
    callback: (res: ApiResponse<{ dispute: DisputeState }>) => void
  ) => void;
  'host:resolve_dispute': (
    payload: ResolveDisputePayload,
    callback: (res: ApiResponse<{ gameState: GameState }>) => void
  ) => void;
  'powerup:use': (
    payload: UsePowerUpPayload,
    callback: (res: ApiResponse<{ powerUpType: PowerUpType }>) => void
  ) => void;
}

export interface ServerToClientEvents {
  'room:state_updated': (payload: { gameState: GameState; players: Player[] }) => void;
  'room:player_joined': (payload: { player: Player; players: Player[] }) => void;
  'room:player_left': (payload: { playerId: string; newHostId?: string; players: Player[] }) => void;
  'room:player_reconnected': (payload: { player: Player; players: Player[] }) => void;
  'game:round_started': (payload: RoundStartedPayload) => void;
  'timer:tick': (payload: TimerTickPayload) => void;
  'turn:changed': (payload: TurnChangedPayload) => void;
  'game:dispute_started': (payload: { dispute: DisputeState; gameState: GameState }) => void;
  'game:dispute_resolved': (payload: { resolution: DisputeResolution; gameState: GameState }) => void;
  'powerup:activated': (payload: PowerUpActivatedPayload) => void;
  'timer:exploded': (payload: TimerExplodedPayload) => void;
  'game:over': (payload: { winner: TeamId; finalScores: Record<TeamId, number>; gameState: GameState }) => void;
  'error:message': (payload: { code: GameErrorCode; message: string }) => void;
}

export interface SocketData {
  playerId?: string;
  roomCode?: string;
  playerName?: string;
}
