import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {TimerEngine} from '../../src/core/TimerEngine.js';

describe('Specification: Authoritative Server Timer & Three-Stage Tick Pacing', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('GIVEN min and max duration bounds WHEN initialized THEN target duration is randomly selected within the interval', () => {
    const timer = new TimerEngine({ minDurationSec: 35, maxDurationSec: 65 });
    const duration = timer.getTargetDurationSec();

    expect(duration).toBeGreaterThanOrEqual(35);
    expect(duration).toBeLessThanOrEqual(65);
  });

  it('GIVEN an active timer WHEN time progresses THEN tick interval changes in three broad stages', () => {
    const timer = new TimerEngine({ minDurationSec: 40, maxDurationSec: 40 }); // Fixed 40s for predictability

    // Calculate tick intervals at 0s, 20s, and 35s into a 40s round
    const intervalAtStart = timer.calculateTickIntervalMs(0, 40000);
    const intervalAtMid = timer.calculateTickIntervalMs(20000, 40000);
    const intervalAtEnd = timer.calculateTickIntervalMs(35000, 40000);

    expect(intervalAtStart).toBe(1500);
    expect(intervalAtMid).toBe(750);
    expect(intervalAtEnd).toBe(400);
  });

  it('GIVEN a running timer WHEN paused THEN time stops accumulating and ticks cease', () => {
    const onTick = vi.fn();
    const onExplode = vi.fn();

    const timer = new TimerEngine({
      minDurationSec: 10,
      maxDurationSec: 10,
      onTick,
      onExplode,
    });

    timer.start();
    vi.advanceTimersByTime(2000);
    const ticksBeforePause = onTick.mock.calls.length;

    timer.pause();
    vi.advanceTimersByTime(3000);

    expect(onTick.mock.calls.length).toBe(ticksBeforePause);
    expect(timer.isPaused()).toBe(true);
    expect(onExplode).not.toHaveBeenCalled();
  });

  it('GIVEN a paused timer WHEN resumed THEN it continues counting down with the exact remaining time', () => {
    const onExplode = vi.fn();
    const timer = new TimerEngine({
      minDurationSec: 10,
      maxDurationSec: 10,
      onExplode,
    });

    timer.start();
    vi.advanceTimersByTime(4000); // 4s elapsed, 6s remaining
    timer.pause();

    vi.advanceTimersByTime(5000); // paused, nothing happens
    expect(onExplode).not.toHaveBeenCalled();

    timer.resume();
    vi.advanceTimersByTime(5900);
    expect(onExplode).not.toHaveBeenCalled();

    vi.advanceTimersByTime(200);
    expect(onExplode).toHaveBeenCalledTimes(1);
  });

  it('GIVEN a timer reaching its target duration WHEN time elapses THEN onExplode is fired and timer stops', () => {
    const onExplode = vi.fn();
    const timer = new TimerEngine({
      minDurationSec: 5,
      maxDurationSec: 5,
      onExplode,
    });

    timer.start();
    vi.advanceTimersByTime(5050);

    expect(onExplode).toHaveBeenCalledTimes(1);
    expect(timer.isRunning()).toBe(false);
  });

  it('GIVEN a reset request WHEN invoked THEN new duration is generated and elapsed time resets to zero', () => {
    const timer = new TimerEngine({ minDurationSec: 30, maxDurationSec: 50 });
    timer.start();
    vi.advanceTimersByTime(10000);

    timer.reset();
    expect(timer.getElapsedMs()).toBe(0);
    expect(timer.isRunning()).toBe(false);
  });
});
