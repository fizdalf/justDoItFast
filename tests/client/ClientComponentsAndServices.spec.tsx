// @vitest-environment jsdom
import {describe, expect, it, vi} from 'vitest';
import {SocketService} from '../../src/client/services/socketService.js';
import {AudioService} from '../../src/client/services/audioService.js';
import {HapticService} from '../../src/client/services/hapticService.js';

describe('Client Services: SocketService, AudioService & HapticService', () => {
  it('SocketService maintains initial status and notifies listeners', () => {
    const service = new SocketService();
    expect(service.getStatus()).toBe('DISCONNECTED');

    const statuses: string[] = [];
    const unsub = service.onStatusChange((s) => statuses.push(s));
    expect(statuses).toContain('DISCONNECTED');
    unsub();
  });

  it('AudioService allows muting and procedural tick triggers without crashing in Node/JSDOM', () => {
    const audio = new AudioService();
    expect(audio.getIsMuted()).toBe(false);

    audio.setMuted(true);
    expect(audio.getIsMuted()).toBe(true);

    // Calling sound methods when muted should be safe no-op
    expect(() => {
      audio.playTick(800, 50);
      audio.playExplosion();
      audio.playSuccess();
      audio.playFoulBuzzer();
    }).not.toThrow();

    audio.setMuted(false);
    expect(() => {
      audio.playTick(1200, 50);
    }).not.toThrow();
  });

  it('HapticService handles vibration safely with mock navigator', () => {
    const haptic = new HapticService();
    expect(haptic.getIsEnabled()).toBe(true);

    const mockVibrate = vi.fn();
    Object.defineProperty(navigator, 'vibrate', {
      value: mockVibrate,
      configurable: true,
      writable: true,
    });

    haptic.vibrateTick(50);
    expect(mockVibrate).toHaveBeenCalledWith(50);

    haptic.vibrateFoul();
    expect(mockVibrate).toHaveBeenCalledWith([150, 50, 150]);

    haptic.vibrateExplosion();
    expect(mockVibrate).toHaveBeenCalledWith([200, 100, 300, 100, 400]);

    haptic.setEnabled(false);
    mockVibrate.mockClear();
    haptic.vibrateTick(50);
    expect(mockVibrate).not.toHaveBeenCalled();
  });
});
