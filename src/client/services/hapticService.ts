export class HapticService {
  private isEnabled: boolean = true;

  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  public getIsEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * Pulse vibration for active potato tick.
   * Duration slightly scales with frequency / urgency.
   */
  public vibrateTick(durationMs = 40): void {
    if (!this.isEnabled || typeof window === 'undefined' || !navigator.vibrate) {
      return;
    }
    try {
      navigator.vibrate(durationMs);
    } catch {
      // Vibration not permitted
    }
  }

  /**
   * Heavy vibration pattern for timer explosion.
   */
  public vibrateExplosion(): void {
    if (!this.isEnabled || typeof window === 'undefined' || !navigator.vibrate) {
      return;
    }
    try {
      navigator.vibrate([200, 100, 300, 100, 400]);
    } catch {
      // Ignored
    }
  }

  /**
   * Quick double buzz for foul alert.
   */
  public vibrateFoul(): void {
    if (!this.isEnabled || typeof window === 'undefined' || !navigator.vibrate) {
      return;
    }
    try {
      navigator.vibrate([150, 50, 150]);
    } catch {
      // Ignored
    }
  }
}

export const hapticService = new HapticService();
