export interface TimerEngineOptions {
  minDurationSec: number;
  maxDurationSec: number;
  onTick?: (elapsedMs: number, remainingMs: number, intervalMs: number) => void;
  onExplode?: () => void;
}

export class TimerEngine {
  private minDurationSec: number;
  private maxDurationSec: number;
  private targetDurationMs: number = 0;
  private accumulatedElapsedMs: number = 0;
  private startTimestamp: number = 0;
  private running: boolean = false;
  private paused: boolean = false;
  private tickTimeoutId: NodeJS.Timeout | null = null;

  private onTick?: (elapsedMs: number, remainingMs: number, intervalMs: number) => void;
  private onExplode?: () => void;

  constructor(options: TimerEngineOptions) {
    this.minDurationSec = options.minDurationSec;
    this.maxDurationSec = options.maxDurationSec;
    this.onTick = options.onTick;
    this.onExplode = options.onExplode;

    this.generateTargetDuration();
  }

  getTargetDurationSec(): number {
    return this.targetDurationMs / 1000;
  }

  getElapsedMs(): number {
    if (!this.running) return this.accumulatedElapsedMs;
    if (this.paused) return this.accumulatedElapsedMs;
    return this.accumulatedElapsedMs + (Date.now() - this.startTimestamp);
  }

  getRemainingMs(): number {
    return Math.max(0, this.targetDurationMs - this.getElapsedMs());
  }

  isRunning(): boolean {
    return this.running;
  }

  isPaused(): boolean {
    return this.paused;
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.paused = false;
    this.startTimestamp = Date.now();
    this.scheduleNextTick();
  }

  pause(): void {
    if (!this.running || this.paused) return;
    this.accumulatedElapsedMs += Date.now() - this.startTimestamp;
    this.paused = true;
    if (this.tickTimeoutId) {
      clearTimeout(this.tickTimeoutId);
      this.tickTimeoutId = null;
    }
  }

  resume(): void {
    if (!this.running || !this.paused) return;
    this.paused = false;
    this.startTimestamp = Date.now();
    this.scheduleNextTick();
  }

  stop(): void {
    if (this.running && !this.paused) {
      this.accumulatedElapsedMs += Date.now() - this.startTimestamp;
    }
    this.running = false;
    this.paused = false;
    if (this.tickTimeoutId) {
      clearTimeout(this.tickTimeoutId);
      this.tickTimeoutId = null;
    }
  }

  /** Cambia el rango de duración secreta; se aplica a partir de la próxima ronda. */
  setDurationRange(minDurationSec: number, maxDurationSec: number): void {
    this.minDurationSec = minDurationSec;
    this.maxDurationSec = maxDurationSec;
    if (!this.running) this.generateTargetDuration();
  }

  reset(): void {
    this.stop();
    this.accumulatedElapsedMs = 0;
    this.generateTargetDuration();
  }

  calculateTickIntervalMs(elapsedMs: number, targetDurationMs: number): number {
    const progress = Math.min(1, Math.max(0, elapsedMs / targetDurationMs));
    const baseInterval = 1000;
    const minInterval = 150;
    const k = 1.9;

    const calculated = baseInterval * Math.exp(-k * progress);
    return Math.max(minInterval, Math.round(calculated));
  }

  private generateTargetDuration(): void {
    const range = this.maxDurationSec - this.minDurationSec;
    const randomSec = this.minDurationSec + Math.random() * range;
    this.targetDurationMs = Math.round(randomSec * 1000);
  }

  private scheduleNextTick(): void {
    if (!this.running || this.paused) return;

    const currentElapsed = this.getElapsedMs();
    if (currentElapsed >= this.targetDurationMs) {
      this.stop();
      if (this.onExplode) {
        this.onExplode();
      }
      return;
    }

    const interval = this.calculateTickIntervalMs(currentElapsed, this.targetDurationMs);
    const timeRemaining = this.targetDurationMs - currentElapsed;
    const nextWait = Math.min(interval, timeRemaining);

    this.tickTimeoutId = setTimeout(() => {
      if (!this.running || this.paused) return;

      const elapsedNow = this.getElapsedMs();
      if (elapsedNow >= this.targetDurationMs) {
        this.stop();
        if (this.onExplode) {
          this.onExplode();
        }
        return;
      }

      if (this.onTick) {
        this.onTick(elapsedNow, this.getRemainingMs(), interval);
      }

      this.scheduleNextTick();
    }, nextWait);
  }
}
