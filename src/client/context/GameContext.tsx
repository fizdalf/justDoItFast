import React, {createContext, useCallback, useContext, useEffect, useMemo, useRef, useState} from 'react';
import {ClientError, socketService, SocketStatus,} from '../services/socketService.js';
import {clearSession, saveSession, sessionForCurrentUrl, setRoomUrl} from '../services/roomSession.js';
import {audioService} from '../services/audioService.js';
import {hapticService} from '../services/hapticService.js';
import {ApiResponse, TimerExplodedPayload, TimerTickPayload, TurnChangedPayload,} from '../../server/protocol.js';
import {
  DisputeResolution,
  DisputeState,
  GameState,
  Player,
  PowerUp,
  PowerUpType,
  TeamId,
  TurnState,
} from '../../core/types.js';

export interface GameContextValue {
  socketStatus: SocketStatus;
  playerId: string | null;
  gameState: GameState | null;
  players: Player[];
  currentTurn: TurnState | null;
  currentDispute: DisputeState | null;
  lastTick: TimerTickPayload | null;
  explosion: TimerExplodedPayload | null;
  gameOver: { winner: TeamId; finalScores: Record<TeamId, number>; gameState: GameState } | null;
  inventory: Record<TeamId, PowerUp[]>;
  error: ClientError | null;
  /** Código de la sala a la que se está volviendo tras recargar (null si no). */
  restoringRoom: string | null;
  
  // Computed helpers
  myPlayer: Player | undefined;
  isHost: boolean;
  isActivePlayer: boolean;
  isOpponentReferee: boolean;
  isTeammate: boolean;

  // Actions
  createRoom: (playerName: string, packId?: string) => Promise<ApiResponse<{ roomCode: string; player: Player; gameState: GameState; sessionToken: string }>>;
  joinRoom: (roomCode: string, playerName: string) => Promise<ApiResponse<{ player: Player; players: Player[]; gameState: GameState; sessionToken: string }>>;
  leaveRoom: () => Promise<ApiResponse<{}>>;
  switchTeam: (team: TeamId) => Promise<ApiResponse<{ player: Player; gameState: GameState }>>;
  selectPack: (packId: string) => Promise<ApiResponse<{ gameState: GameState }>>;
  startRound: () => Promise<ApiResponse<{ gameState: GameState; currentTurn: TurnState }>>;
  returnToLobby: () => Promise<ApiResponse<{ gameState: GameState }>>;
  guessSuccess: () => Promise<ApiResponse<{ isFastGuess: boolean; currentTurn: TurnState }>>;
  triggerFoul: (reason?: string) => Promise<ApiResponse<{ dispute: DisputeState }>>;
  resolveDispute: (resolution: DisputeResolution) => Promise<ApiResponse<{ gameState: GameState }>>;
  usePowerUp: (powerUpId: string) => Promise<ApiResponse<{ powerUpType: PowerUpType }>>;
  clearError: () => void;
  resetLocalState: () => void;
}

const GameContext = createContext<GameContextValue | null>(null);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socketStatus, setSocketStatus] = useState<SocketStatus>(socketService.getStatus());
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentTurn, setCurrentTurn] = useState<TurnState | null>(null);
  const [currentDispute, setCurrentDispute] = useState<DisputeState | null>(null);
  const [lastTick, setLastTick] = useState<TimerTickPayload | null>(null);
  const [explosion, setExplosion] = useState<TimerExplodedPayload | null>(null);
  const [gameOver, setGameOver] = useState<{ winner: TeamId; finalScores: Record<TeamId, number>; gameState: GameState } | null>(null);
  const [error, setError] = useState<ClientError | null>(null);
  const [restoringRoom, setRestoringRoom] = useState<string | null>(
    () => sessionForCurrentUrl()?.roomCode ?? null
  );
  const rejoinedSocketId = useRef<string | undefined>(undefined);

  // Volver a la sala de la URL con la sesión guardada: al cargar la página (F5)
  // y cada vez que el socket se reconecta tras perder la conexión.
  useEffect(() => {
    const tryRejoin = async () => {
      const socketId = socketService.getSocketId();
      if (!socketId || rejoinedSocketId.current === socketId) return;
      rejoinedSocketId.current = socketId;

      const session = sessionForCurrentUrl();
      if (!session) {
        setRestoringRoom(null);
        return;
      }

      const res = await socketService.rejoinRoom(session.roomCode, session.sessionToken);
      if (res.success) {
        setPlayerId(res.data.player.id);
        setPlayers(res.data.players);
        setGameState(res.data.gameState);
        setCurrentTurn(res.data.gameState.currentTurn ?? null);
        setCurrentDispute(res.data.gameState.currentDispute ?? null);
      } else if (res.code === 'ROOM_NOT_FOUND' || res.code === 'SESSION_EXPIRED') {
        // La URL se mantiene: el inicio mostrará el formulario de unirse con ese código.
        clearSession();
      }
      setRestoringRoom(null);
    };

    return socketService.onStatusChange((status) => {
      if (status === 'CONNECTED') void tryRejoin();
    });
  }, []);

  // La URL siempre refleja la sala en la que estás (también si se pulsa "atrás").
  useEffect(() => {
    const roomCode = gameState?.roomCode;
    if (!roomCode) return;
    setRoomUrl(roomCode, 'replace');
    const keepRoomUrl = () => setRoomUrl(roomCode, 'push');
    window.addEventListener('popstate', keepRoomUrl);
    return () => window.removeEventListener('popstate', keepRoomUrl);
  }, [gameState?.roomCode]);

  useEffect(() => {
    socketService.connect();

    const unsubStatus = socketService.onStatusChange((status) => {
      setSocketStatus(status);
    });

    const unsubError = socketService.onError((err) => {
      setError(err);
    });

    const unsubRoomState = socketService.onRoomStateUpdated((payload) => {
      setGameState(payload.gameState);
      setPlayers(payload.players);
      if (payload.gameState.currentDispute) {
        setCurrentDispute(payload.gameState.currentDispute);
      } else {
        setCurrentDispute(null);
      }
      if (payload.gameState.currentTurn) {
        setCurrentTurn(payload.gameState.currentTurn);
      }
      if (payload.gameState.status === 'LOBBY') {
        setCurrentTurn(null);
        setExplosion(null);
        setGameOver(null);
      }
    });

    const unsubPlayerJoined = socketService.onPlayerJoined((payload) => {
      setPlayers(payload.players);
    });

    const unsubPlayerLeft = socketService.onPlayerLeft((payload) => {
      setPlayers(payload.players);
    });

    const unsubRoundStarted = socketService.onRoundStarted((payload) => {
      setGameState(payload.gameState);
      setCurrentTurn(payload.currentTurn);
      setCurrentDispute(null);
      setExplosion(null);
      audioService.playSuccess();
    });

    const unsubTurnChanged = socketService.onTurnChanged((payload: TurnChangedPayload) => {
      setCurrentTurn(payload.currentTurn);
      setCurrentDispute(null);
      setExplosion(null);
      audioService.playSuccess();
    });

    const unsubDisputeStarted = socketService.onDisputeStarted((payload) => {
      setCurrentDispute(payload.dispute);
      setGameState(payload.gameState);
      audioService.playFoulBuzzer();
      hapticService.vibrateFoul();
    });

    const unsubDisputeResolved = socketService.onDisputeResolved((payload) => {
      setCurrentDispute(null);
      setGameState(payload.gameState);
      if (payload.gameState.currentTurn) {
        setCurrentTurn(payload.gameState.currentTurn);
      }
    });

    const unsubTimerTick = socketService.onTimerTick((tick) => {
      setLastTick(tick);
      if (playerId && tick.activePlayerId === playerId) {
        const interval = tick.intervalMs || 1000;
        const urgencyHz = 700 + Math.max(0, Math.floor((1000 - interval) * 1.5));
        audioService.playTick(urgencyHz, 50);
        hapticService.vibrateTick(45);
      }
    });

    const unsubTimerExploded = socketService.onTimerExploded((exploded) => {
      setExplosion(exploded);
      audioService.playExplosion();
      hapticService.vibrateExplosion();
    });

    const unsubGameOver = socketService.onGameOver((go) => {
      setGameOver(go);
      setGameState(go.gameState);
      audioService.playExplosion();
    });

    const unsubErrorMessage = socketService.onErrorMessage((err) => {
      setError(err);
    });

    return () => {
      unsubStatus();
      unsubError();
      unsubRoomState();
      unsubPlayerJoined();
      unsubPlayerLeft();
      unsubRoundStarted();
      unsubTurnChanged();
      unsubDisputeStarted();
      unsubDisputeResolved();
      unsubTimerTick();
      unsubTimerExploded();
      unsubGameOver();
      unsubErrorMessage();
    };
  }, [playerId]);

  const myPlayer = useMemo(() => {
    if (!playerId) return undefined;
    return players.find((p: Player) => p.id === playerId);
  }, [players, playerId]);

  const isHost = useMemo(() => {
    return myPlayer?.isHost ?? false;
  }, [myPlayer]);

  const activePlayerId = useMemo(() => {
    if (currentTurn) return currentTurn.activePlayerId;
    if (gameState?.currentTurn) return gameState.currentTurn.activePlayerId;
    return null;
  }, [currentTurn, gameState]);

  const activeTeam = useMemo(() => {
    if (currentTurn) return currentTurn.activeTeam;
    if (gameState?.currentTurn) return gameState.currentTurn.activeTeam;
    return null;
  }, [currentTurn, gameState]);

  const isActivePlayer = useMemo(() => {
    return !!(playerId && activePlayerId && playerId === activePlayerId);
  }, [playerId, activePlayerId]);

  const isOpponentReferee = useMemo(() => {
    if (!myPlayer || !activeTeam) return false;
    return myPlayer.team !== activeTeam;
  }, [myPlayer, activeTeam]);

  const isTeammate = useMemo(() => {
    if (!myPlayer || !activeTeam || !activePlayerId) return false;
    return myPlayer.team === activeTeam && myPlayer.id !== activePlayerId;
  }, [myPlayer, activeTeam, activePlayerId]);

  const inventory = useMemo(() => {
    return gameState?.teamInventory || { A: [], B: [] };
  }, [gameState]);

  const createRoom = useCallback(async (playerName: string, packId?: string) => {
    audioService.enableAudio();
    const res = await socketService.createRoom(playerName, packId);
    if (res.success && res.data) {
      saveSession({ roomCode: res.data.roomCode, playerId: res.data.player.id, sessionToken: res.data.sessionToken });
      setRoomUrl(res.data.roomCode);
      setPlayerId(res.data.player.id);
      setGameState(res.data.gameState);
      setPlayers([res.data.player]);
    }
    return res;
  }, []);

  const joinRoom = useCallback(async (roomCode: string, playerName: string) => {
    audioService.enableAudio();
    const res = await socketService.joinRoom(roomCode, playerName);
    if (res.success && res.data) {
      saveSession({
        roomCode: res.data.gameState.roomCode,
        playerId: res.data.player.id,
        sessionToken: res.data.sessionToken,
      });
      setRoomUrl(res.data.gameState.roomCode);
      setPlayerId(res.data.player.id);
      setPlayers(res.data.players);
      setGameState(res.data.gameState);
    }
    return res;
  }, []);

  const leaveRoom = useCallback(async () => {
    const res = await socketService.leaveRoom();
    clearSession();
    setRoomUrl(null);
    setPlayerId(null);
    setGameState(null);
    setPlayers([]);
    setCurrentTurn(null);
    setCurrentDispute(null);
    setExplosion(null);
    setGameOver(null);
    return res;
  }, []);

  const switchTeam = useCallback(async (team: TeamId) => {
    const res = await socketService.switchTeam(team);
    if (res.success && res.data) {
      setGameState(res.data.gameState);
    }
    return res;
  }, []);

  const selectPack = useCallback(async (packId: string) => {
    const res = await socketService.selectPack(packId);
    if (res.success && res.data) {
      setGameState(res.data.gameState);
    }
    return res;
  }, []);

  const startRound = useCallback(async () => {
    const res = await socketService.startRound();
    if (res.success && res.data) {
      setGameState(res.data.gameState);
      setCurrentTurn(res.data.currentTurn);
    }
    return res;
  }, []);

  const returnToLobby = useCallback(async () => {
    const res = await socketService.returnToLobby();
    if (res.success && res.data) {
      setGameState(res.data.gameState);
    }
    return res;
  }, []);

  const guessSuccess = useCallback(async () => {
    return socketService.guessSuccess();
  }, []);

  const triggerFoul = useCallback(async (reason?: string) => {
    return socketService.triggerFoul(reason);
  }, []);

  const resolveDispute = useCallback(async (resolution: DisputeResolution) => {
    return socketService.resolveDispute(resolution);
  }, []);

  const usePowerUp = useCallback(async (powerUpId: string) => {
    return socketService.usePowerUp(powerUpId);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const resetLocalState = useCallback(() => {
    clearSession();
    setRoomUrl(null);
    setPlayerId(null);
    setGameState(null);
    setPlayers([]);
    setCurrentTurn(null);
    setCurrentDispute(null);
    setExplosion(null);
    setGameOver(null);
  }, []);

  const value: GameContextValue = {
    socketStatus,
    playerId,
    gameState,
    players,
    currentTurn,
    currentDispute,
    lastTick,
    explosion,
    gameOver,
    inventory,
    error,
    restoringRoom,
    myPlayer,
    isHost,
    isActivePlayer,
    isOpponentReferee,
    isTeammate,
    createRoom,
    joinRoom,
    leaveRoom,
    switchTeam,
    selectPack,
    startRound,
    returnToLobby,
    guessSuccess,
    triggerFoul,
    resolveDispute,
    usePowerUp,
    clearError,
    resetLocalState,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

export const useGame = (): GameContextValue => {
  const ctx = useContext(GameContext);
  if (!ctx) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return ctx;
};
