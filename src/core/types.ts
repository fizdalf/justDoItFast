export type TeamId = 'A' | 'B';

export type GameStatus = 'LOBBY' | 'PLAYING' | 'DISPUTE_PAUSED' | 'ROUND_OVER' | 'GAME_OVER';

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

export interface GameState {
  roomCode: string;
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
  selectedPackId: string;
}
