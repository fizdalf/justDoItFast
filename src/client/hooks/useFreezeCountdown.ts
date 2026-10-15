import {useEffect, useState} from 'react';
import type {TurnState} from '../../core/types.js';

export interface FreezeCountdown {
  frozen: boolean;
  /** Segundos que quedan (redondeados hacia arriba); undefined si el servidor no los dio. */
  secondsLeft?: number;
}

/**
 * Cuenta atrás local del Inhibidor. Parte de `freezeRemainingMs` en el momento en que llega
 * cada estado (no del reloj del servidor) y desbloquea sola al terminar.
 */
export function useFreezeCountdown(turn: TurnState | null | undefined): FreezeCountdown {
  const isFrozen = !!turn?.isFrozen;
  const remainingMs = turn?.freezeRemainingMs;
  const [deadline, setDeadline] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());

  // Cada estado nuevo trae su propio "quedan X ms".
  useEffect(() => {
    if (!isFrozen || remainingMs === undefined) {
      setDeadline(null);
      return;
    }
    const start = Date.now();
    setNow(start);
    setDeadline(start + remainingMs);
  }, [turn, isFrozen, remainingMs]);

  useEffect(() => {
    if (deadline === null) return;
    const interval = setInterval(() => {
      const current = Date.now();
      setNow(current);
      if (current >= deadline) clearInterval(interval);
    }, 200);
    return () => clearInterval(interval);
  }, [deadline]);

  if (!isFrozen) return { frozen: false };
  if (deadline === null) return { frozen: remainingMs === undefined || remainingMs > 0 };
  const left = deadline - now;
  if (left <= 0) return { frozen: false };
  return { frozen: true, secondsLeft: Math.ceil(left / 1000) };
}
