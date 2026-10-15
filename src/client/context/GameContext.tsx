import React, {createContext, useCallback, useContext, useEffect, useMemo, useRef, useState} from 'react';
import {ClientError, JoinedRoom, socketService, SocketStatus} from '../services/socketService.js';
import {clearSession, saveSession, sessionForCurrentUrl, setRoomUrl} from '../services/roomSession.js';
import {audioService} from '../services/audioService.js';
import {hapticService} from '../services/hapticService.js';
import {
  ApiResponse,
  RoomSnapshot,
  TimerExplodedPayload,
  TimerTickPayload,
  TurnChangedPayload,
  UpdateSetupPayload,
} from '../../server/protocol.js';
import {
  DisputeResolution,
  DisputeState,
  GameState,
  Player,
  PowerUp,
  PowerUpType,
  RoomState,
  TeamId,
  TurnState,
} from '../../core/types.js';

export interface GameOverInfo {
  winner: TeamId;
  finalScores: Record<TeamId, number>;
  game: GameState;
}

export interface GameContextValue {
  socketStatus: SocketStatus;
  playerId: string | null;
  /** La sala en la que estás (null en el inicio). */
  room: RoomState | null;
  /** La partida en curso de la sala (null mientras la sala está reunida sin jugar). */
  game: GameState | null;
  players: Player[];
  currentTurn: TurnState | null;
  currentDispute: DisputeState | null;
  lastTick: TimerTickPayload | null;
  explosion: TimerExplodedPayload | null;
  gameOver: GameOverInfo | null;
  inventory: Record<TeamId, PowerUp[]>;
  error: ClientError | null;
  /** Código de la sala a la que se está volviendo tras recargar (null si no). */
  restoringRoom: string | null;

  // Ayudas calculadas
  myPlayer: Player | undefined;
  hostPlayer: Player | undefined;
  isHost: boolean;
  /** Hay partida y no participas en ella: juegas en la siguiente. */
  isSpectator: boolean;
  isActivePlayer: boolean;
  isOpponentReferee: boolean;
  isTeammate: boolean;

  // Acciones
  createRoom: (playerName: string) => Promise<ApiResponse<JoinedRoom & { sessionToken: string }>>;
  joinRoom: (roomCode: string, playerName: string) => Promise<ApiResponse<JoinedRoom & { sessionToken: string }>>;
  leaveRoom: () => Promise<ApiResponse<{}>>;
  switchTeam: (team: TeamId) => Promise<ApiResponse<RoomSnapshot>>;
  updateSetup: (changes: UpdateSetupPayload) => Promise<ApiResponse<RoomSnapshot>>;
  startGame: () => Promise<ApiResponse<RoomSnapshot>>;
  startRound: () => Promise<ApiResponse<RoomSnapshot>>;
  endGame: () => Promise<ApiResponse<RoomSnapshot>>;
  guessSuccess: () => Promise<ApiResponse<{ isFastGuess: boolean; currentTurn: TurnState }>>;
  triggerFoul: (reason?: string) => Promise<ApiResponse<{ dispute: DisputeState }>>;
  resolveDispute: (resolution: DisputeResolution) => Promise<ApiResponse<RoomSnapshot>>;
  usePowerUp: (powerUpId: string) => Promise<ApiResponse<{ powerUpType: PowerUpType }>>;
  clearError: () => void;
  resetLocalState: () => void;
}

const GameContext = createContext<GameContextValue | null>(null);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socketStatus, setSocketStatus] = useState<SocketStatus>(socketService.getStatus());
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [room, setRoom] = useState<RoomState | null>(null);
  const [game, setGame] = useState<GameState | null>(null);
  const [currentTurn, setCurrentTurn] = useState<TurnState | null>(null);
  const [currentDispute, setCurrentDispute] = useState<DisputeState | null>(null);
  const [lastTick, setLastTick] = useState<TimerTickPayload | null>(null);
  const [explosion, setExplosion] = useState<TimerExplodedPayload | null>(null);
  const [gameOver, setGameOver] = useState<GameOverInfo | null>(null);
  const [error, setError] = useState<ClientError | null>(null);
  const [restoringRoom, setRestoringRoom] = useState<string | null>(
    () => sessionForCurrentUrl()?.roomCode ?? null
  );
  const rejoinedSocketId = useRef<string | undefined>(undefined);

  /** Aplica una foto completa de sala + partida (la fuente de verdad). */
  const applySnapshot = useCallback((snapshot: RoomSnapshot) => {
    setRoom(snapshot.room);
    setGame(snapshot.game);
    if (snapshot.game) {
      setCurrentTurn(snapshot.game.currentTurn ?? null);
      setCurrentDispute(snapshot.game.currentDispute ?? null);
    } else {
      // De vuelta en la sala: se olvida todo lo de la partida anterior.
      setCurrentTurn(null);
      setCurrentDispute(null);
      setExplosion(null);
      setGameOver(null);
      setLastTick(null);
    }
  }, []);

  const clearLocalState = useCallback(() => {
    setPlayerId(null);
    setRoom(null);
    setGame(null);
    setCurrentTurn(null);
    setCurrentDispute(null);
    setExplosion(null);
    setGameOver(null);
    setLastTick(null);
  }, []);

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
        applySnapshot(res.data);
      } else if (res.code === 'ROOM_NOT_FOUND' || res.code === 'SESSION_EXPIRED') {
        // La URL se mantiene: el inicio mostrará el formulario de unirse con ese código.
        clearSession();
      }
      setRestoringRoom(null);
    };

    return socketService.onStatusChange((status) => {
      if (status === 'CONNECTED') void tryRejoin();
    });
  }, [applySnapshot]);

  // La URL siempre refleja la sala en la que estás (también si se pulsa "atrás").
  const roomCode = room?.roomCode;
  useEffect(() => {
    if (!roomCode) return;
    setRoomUrl(roomCode, 'replace');
    const keepRoomUrl = () => setRoomUrl(roomCode, 'push');
    window.addEventListener('popstate', keepRoomUrl);
    return () => window.removeEventListener('popstate', keepRoomUrl);
  }, [roomCode]);

  useEffect(() => {
    socketService.connect();

    const unsubs = [
      socketService.onStatusChange((status) => setSocketStatus(status)),
      socketService.onError((err) => setError(err)),
      socketService.onRoomStateUpdated(applySnapshot),

      socketService.onRoundStarted((payload) => {
        setGame(payload.game);
        setCurrentTurn(payload.currentTurn);
        setCurrentDispute(null);
        setExplosion(null);
        audioService.playSuccess();
      }),

      socketService.onTurnChanged((payload: TurnChangedPayload) => {
        setCurrentTurn(payload.currentTurn);
        setCurrentDispute(null);
        setExplosion(null);
        audioService.playSuccess();
      }),

      socketService.onDisputeStarted((payload) => {
        setCurrentDispute(payload.dispute);
        setGame(payload.game);
        audioService.playFoulBuzzer();
        hapticService.vibrateFoul();
      }),

      socketService.onDisputeResolved((payload) => {
        setCurrentDispute(null);
        setGame(payload.game);
        if (payload.game.currentTurn) {
          setCurrentTurn(payload.game.currentTurn);
        }
      }),

      socketService.onTimerTick((tick) => {
        setLastTick(tick);
        if (playerId && tick.activePlayerId === playerId) {
          const interval = tick.intervalMs || 1000;
          const urgencyHz = 700 + Math.max(0, Math.floor((1000 - interval) * 1.5));
          audioService.playTick(urgencyHz, 50);
          hapticService.vibrateTick(45);
        }
      }),

      socketService.onTimerExploded((exploded) => {
        setExplosion(exploded);
        audioService.playExplosion();
        hapticService.vibrateExplosion();
      }),

      socketService.onGameOver((go) => {
        setGameOver(go);
        setGame(go.game);
        audioService.playExplosion();
      }),

      socketService.onErrorMessage((err) => setError(err)),
    ];

    return () => unsubs.forEach((unsub) => unsub());
  }, [playerId, applySnapshot]);

  const players = useMemo(() => room?.players ?? [], [room]);

  const myPlayer = useMemo(() => {
    if (!playerId) return undefined;
    return players.find((p: Player) => p.id === playerId);
  }, [players, playerId]);

  const hostPlayer = useMemo(
    () => players.find((p: Player) => p.id === room?.hostPlayerId),
    [players, room?.hostPlayerId]
  );

  const isHost = !!playerId && room?.hostPlayerId === playerId;

  const isSpectator = !!game && !!playerId && !game.participantIds.includes(playerId);

  const activePlayerId = currentTurn?.activePlayerId ?? game?.currentTurn?.activePlayerId ?? null;
  const activeTeam = currentTurn?.activeTeam ?? game?.currentTurn?.activeTeam ?? null;

  // Los roles solo tienen sentido para quien participa en la partida.
  const isActivePlayer = !isSpectator && !!playerId && !!activePlayerId && playerId === activePlayerId;
  const isOpponentReferee = !isSpectator && !!myPlayer && !!activeTeam && myPlayer.team !== activeTeam;
  const isTeammate =
    !isSpectator &&
    !!myPlayer &&
    !!activeTeam &&
    !!activePlayerId &&
    myPlayer.team === activeTeam &&
    myPlayer.id !== activePlayerId;

  const inventory = useMemo(() => game?.teamInventory || { A: [], B: [] }, [game]);

  /** Guarda la sesión de la pestaña y muestra la sala recién creada o a la que te unes. */
  const enterRoom = useCallback(
    (data: JoinedRoom & { sessionToken: string }) => {
      saveSession({ roomCode: data.room.roomCode, playerId: data.player.id, sessionToken: data.sessionToken });
      setRoomUrl(data.room.roomCode);
      setPlayerId(data.player.id);
      applySnapshot(data);
    },
    [applySnapshot]
  );

  const createRoom = useCallback(
    async (playerName: string) => {
      audioService.enableAudio();
      const res = await socketService.createRoom(playerName);
      if (res.success) enterRoom(res.data);
      return res;
    },
    [enterRoom]
  );

  const joinRoom = useCallback(
    async (code: string, playerName: string) => {
      audioService.enableAudio();
      const res = await socketService.joinRoom(code, playerName);
      if (res.success) enterRoom(res.data);
      return res;
    },
    [enterRoom]
  );

  const leaveRoom = useCallback(async () => {
    const res = await socketService.leaveRoom();
    clearSession();
    setRoomUrl(null);
    clearLocalState();
    return res;
  }, [clearLocalState]);

  /** Envuelve una acción que responde con la foto de la sala. */
  const withSnapshot = useCallback(
    async (request: Promise<ApiResponse<RoomSnapshot>>) => {
      const res = await request;
      if (res.success) applySnapshot(res.data);
      return res;
    },
    [applySnapshot]
  );

  const switchTeam = useCallback((team: TeamId) => withSnapshot(socketService.switchTeam(team)), [withSnapshot]);
  const updateSetup = useCallback(
    (changes: UpdateSetupPayload) => withSnapshot(socketService.updateSetup(changes)),
    [withSnapshot]
  );
  const startGame = useCallback(() => withSnapshot(socketService.startGame()), [withSnapshot]);
  const startRound = useCallback(() => withSnapshot(socketService.startRound()), [withSnapshot]);
  const endGame = useCallback(() => withSnapshot(socketService.endGame()), [withSnapshot]);
  const resolveDispute = useCallback(
    (resolution: DisputeResolution) => withSnapshot(socketService.resolveDispute(resolution)),
    [withSnapshot]
  );

  const guessSuccess = useCallback(() => socketService.guessSuccess(), []);
  const triggerFoul = useCallback((reason?: string) => socketService.triggerFoul(reason), []);
  const usePowerUp = useCallback((powerUpId: string) => socketService.usePowerUp(powerUpId), []);

  const clearError = useCallback(() => setError(null), []);

  const resetLocalState = useCallback(() => {
    clearSession();
    setRoomUrl(null);
    clearLocalState();
  }, [clearLocalState]);

  const value: GameContextValue = {
    socketStatus,
    playerId,
    room,
    game,
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
    hostPlayer,
    isHost,
    isSpectator,
    isActivePlayer,
    isOpponentReferee,
    isTeammate,
    createRoom,
    joinRoom,
    leaveRoom,
    switchTeam,
    updateSetup,
    startGame,
    startRound,
    endGame,
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
