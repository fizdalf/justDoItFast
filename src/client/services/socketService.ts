import {io, Socket} from 'socket.io-client';
import {
  ApiErrorCode,
  ApiResponse,
  ClientToServerEvents,
  RoomSnapshot,
  ServerToClientEvents,
  UpdateSetupPayload,
} from '../../server/protocol.js';
import {DisputeResolution, DisputeState, Player, PowerUpType, TeamId, TurnState} from '../../core/types.js';

/** Respuesta al entrar en una sala: la foto completa y quién eres. */
export type JoinedRoom = RoomSnapshot & { player: Player };

/** Error para mostrar al jugador: se traduce por `code`; `message` es solo técnico. */
export interface ClientError {
  code: ApiErrorCode;
  message: string;
}

export type SocketStatus = 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'RECONNECTING' | 'ERROR';

export class SocketService {
  private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;
  private status: SocketStatus = 'DISCONNECTED';
  private statusListeners: Set<(status: SocketStatus) => void> = new Set();
  private errorListeners: Set<(error: ClientError) => void> = new Set();

  public connect(url?: string): void {
    if (this.socket && this.socket.connected) {
      return;
    }

    this.setStatus('CONNECTING');
    const targetUrl = url || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');

    this.socket = io(targetUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    });

    this.socket.on('connect', () => {
      this.setStatus('CONNECTED');
    });

    this.socket.on('disconnect', (reason) => {
      if (reason === 'io server disconnect') {
        this.socket?.connect();
      }
      this.setStatus('DISCONNECTED');
    });

    this.socket.on('connect_error', (err) => {
      this.setStatus('ERROR');
      this.notifyError({ code: 'CONNECTION_ERROR', message: err.message });
    });

    this.socket.io.on('reconnect_attempt', () => {
      this.setStatus('RECONNECTING');
    });
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.setStatus('DISCONNECTED');
    }
  }

  public getStatus(): SocketStatus {
    return this.status;
  }

  public getSocketId(): string | undefined {
    return this.socket?.id;
  }

  public onStatusChange(callback: (status: SocketStatus) => void): () => void {
    this.statusListeners.add(callback);
    callback(this.status);
    return () => this.statusListeners.delete(callback);
  }

  public onError(callback: (error: ClientError) => void): () => void {
    this.errorListeners.add(callback);
    return () => this.errorListeners.delete(callback);
  }

  // Sala
  public async createRoom(playerName: string): Promise<ApiResponse<JoinedRoom & { sessionToken: string }>> {
    return this.emitWithAck('room:create', { playerName });
  }

  public async joinRoom(
    roomCode: string,
    playerName: string
  ): Promise<ApiResponse<JoinedRoom & { sessionToken: string }>> {
    return this.emitWithAck('room:join', { roomCode, playerName });
  }

  public async rejoinRoom(roomCode: string, sessionToken: string): Promise<ApiResponse<JoinedRoom>> {
    return this.emitWithAck('room:rejoin', { roomCode, sessionToken });
  }

  public async leaveRoom(): Promise<ApiResponse<{}>> {
    return this.emitWithAck('room:leave', undefined);
  }

  public async switchTeam(targetTeam: TeamId): Promise<ApiResponse<RoomSnapshot>> {
    return this.emitWithAck('room:switch_team', { targetTeam });
  }

  public async updateSetup(changes: UpdateSetupPayload): Promise<ApiResponse<RoomSnapshot>> {
    return this.emitWithAck('room:update_setup', changes);
  }

  // Partida
  public async startGame(): Promise<ApiResponse<RoomSnapshot>> {
    return this.emitWithAck('game:start', undefined);
  }

  public async startRound(): Promise<ApiResponse<RoomSnapshot>> {
    return this.emitWithAck('game:start_round', undefined);
  }

  public async endGame(): Promise<ApiResponse<RoomSnapshot>> {
    return this.emitWithAck('game:end', undefined);
  }

  public async guessSuccess(): Promise<ApiResponse<{ isFastGuess: boolean; currentTurn: TurnState }>> {
    return this.emitWithAck('turn:guess_success', undefined);
  }

  public async triggerFoul(reason?: string): Promise<ApiResponse<{ dispute: DisputeState }>> {
    return this.emitWithAck('turn:foul_triggered', { reason });
  }

  public async resolveDispute(resolution: DisputeResolution): Promise<ApiResponse<RoomSnapshot>> {
    return this.emitWithAck('host:resolve_dispute', { resolution });
  }

  public async usePowerUp(powerUpId: string): Promise<ApiResponse<{ powerUpType: PowerUpType }>> {
    return this.emitWithAck('powerup:use', { powerUpId });
  }

  // Eventos del servidor
  public onRoomStateUpdated(callback: ServerToClientEvents['room:state_updated']): () => void {
    return this.subscribe('room:state_updated', callback);
  }

  public onRoundStarted(callback: ServerToClientEvents['game:round_started']): () => void {
    return this.subscribe('game:round_started', callback);
  }

  public onTurnChanged(callback: ServerToClientEvents['turn:changed']): () => void {
    return this.subscribe('turn:changed', callback);
  }

  public onDisputeStarted(callback: ServerToClientEvents['game:dispute_started']): () => void {
    return this.subscribe('game:dispute_started', callback);
  }

  public onDisputeResolved(callback: ServerToClientEvents['game:dispute_resolved']): () => void {
    return this.subscribe('game:dispute_resolved', callback);
  }

  public onTimerTick(callback: ServerToClientEvents['timer:tick']): () => void {
    return this.subscribe('timer:tick', callback);
  }

  public onTimerExploded(callback: ServerToClientEvents['timer:exploded']): () => void {
    return this.subscribe('timer:exploded', callback);
  }

  public onGameOver(callback: ServerToClientEvents['game:over']): () => void {
    return this.subscribe('game:over', callback);
  }

  public onPowerUpActivated(callback: ServerToClientEvents['powerup:activated']): () => void {
    return this.subscribe('powerup:activated', callback);
  }

  public onErrorMessage(callback: ServerToClientEvents['error:message']): () => void {
    return this.subscribe('error:message', callback);
  }

  private subscribe<K extends keyof ServerToClientEvents>(
    event: K,
    callback: ServerToClientEvents[K]
  ): () => void {
    if (!this.socket) {
      this.connect();
    }
    this.socket?.on(event as any, callback as any);
    return () => {
      this.socket?.off(event as any, callback as any);
    };
  }

  private async emitWithAck<Req, Res>(
    event: keyof ClientToServerEvents,
    payload?: Req
  ): Promise<ApiResponse<Res>> {
    if (!this.socket || !this.socket.connected) {
      return { success: false, error: 'Socket is not connected to game server', code: 'NOT_CONNECTED' };
    }

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        resolve({ success: false, error: 'Request timed out', code: 'TIMEOUT' });
      }, 5000);

      const cb = (response: ApiResponse<Res>) => {
        clearTimeout(timeout);
        if (!response.success) {
          this.notifyError({ code: response.code ?? 'INTERNAL', message: response.error });
        }
        resolve(response);
      };

      if (payload !== undefined) {
        (this.socket?.emit as any)(event, payload, cb);
      } else {
        (this.socket?.emit as any)(event, cb);
      }
    });
  }

  private setStatus(status: SocketStatus): void {
    this.status = status;
    this.statusListeners.forEach((listener) => listener(status));
  }

  private notifyError(error: ClientError): void {
    this.errorListeners.forEach((listener) => listener(error));
  }
}

export const socketService = new SocketService();
