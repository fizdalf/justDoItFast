export type TeamId = 'A' | 'B';

/** Estado de una partida en curso. Fuera de una partida, la sala está reunida sin jugar (no hay GameState). */
export type GameStatus = 'PLAYING' | 'DISPUTE_PAUSED' | 'ROUND_OVER' | 'GAME_OVER';

export type PowerUpType = 'REVERSE' | 'DOUBLE_BURDEN' | 'FREEZE' | 'SKIP';

export type PriceTier = 'FREE' | 'TIER_1' | 'TIER_2';

export type DisputeResolution = 'AWARD_TEAM_A' | 'AWARD_TEAM_B' | 'RESTART_ROUND';

export type TileType = 'NORMAL' | 'DOUBLE_TIME' | 'MYSTERY_POWERUP' | 'GOAL';

export interface Player {
  id: string;
  name: string;
  team: TeamId;
  isHost: boolean;
  isConnected: boolean;
  seatIndex: number;
}

export interface PowerUp {
  id: string;
  type: PowerUpType;
}

export interface WordPack {
  id: string;
  name: string;
  description: string;
  category: string;
  isPremium: boolean;
  priceTier?: PriceTier;
  words: string[];
}

export interface DisputeState {
  triggeredByPlayerId: string;
  triggeredByTeam: TeamId;
  foulReason?: string;
  timestamp: number;
  remainingTimeMsAtPause: number;
}

export interface TurnState {
  activePlayerId: string;
  activeTeam: TeamId;
  currentWord: string;
  category: string;
  turnStartTime: number;
  requiredGuesses: number;
  successfulGuesses: number;
  isFrozen: boolean;
  freezeExpiresAt?: number;
}

export interface BoardTile {
  index: number;
  type: TileType;
  label: string;
}

export interface GameSettings {
  targetScore: number;
  minRoundDurationSec: number;
  maxRoundDurationSec: number;
  fastGuessThresholdSec: number;
  allowPowerUps: boolean;
  /** Herramientas que pueden salir como recompensa. */
  enabledPowerUps: PowerUpType[];
  /** Máximo de herramientas que puede guardar un equipo; con el inventario lleno no se gana ninguna. */
  maxPowerUpsPerTeam: number;
  /** Segundos que el Inhibidor bloquea el botón del artificiero rival. */
  freezeDurationSec: number;
  /** Segundos que se espera a un artificiero desconectado antes de pasar la bomba a un compañero. */
  disconnectGraceSec: number;
}

export interface RoundResult {
  reason: 'EXPLOSION' | 'DISPUTE';
  winningTeam: TeamId;
  losingTeam: TeamId;
  explodedPlayerId?: string;
  explodedWord?: string;
}

/** Una partida: de la primera ronda al podio. Vive dentro de una sala. */
export interface GameState {
  /** Número de partida dentro de la sala (1, 2, 3...). */
  gameNumber: number;
  status: GameStatus;
  scores: Record<TeamId, number>;
  targetScore: number;
  roundNumber: number;
  currentDispute?: DisputeState;
  currentTurn?: TurnState;
  teamInventory: Record<TeamId, PowerUp[]>;
  boardTiles: BoardTile[];
  winningTeam?: TeamId;
  lastRoundResult?: RoundResult;
  /** Mazos combinados en esta partida. */
  packIds: string[];
  /** Copia de los ajustes con los que empezó la partida (no cambian durante ella). */
  settings: GameSettings;
  /** Jugadores que participan; quien entra en la sala a mitad de partida es espectador hasta la siguiente. */
  participantIds: string[];
}

/** Lo que se jugará en la próxima partida; el anfitrión lo prepara en la sala. */
export interface GameSetup {
  settings: GameSettings;
  packIds: string[];
}

/** Resultado de una partida, para el historial de la sala. */
export interface GameSummary {
  gameNumber: number;
  packIds: string[];
  scores: Record<TeamId, number>;
  winningTeam?: TeamId;
  /** false si el anfitrión la terminó antes de que ganara nadie. */
  finished: boolean;
  roundsPlayed: number;
  endedAt: number;
}

/** La sala: el grupo de gente reunida. Dura toda la sesión y puede jugar varias partidas. */
export interface RoomState {
  roomCode: string;
  hostPlayerId: string;
  /** Jugadores de la sala en orden de asiento (equipos incluidos). */
  players: Player[];
  setup: GameSetup;
  history: GameSummary[];
}
