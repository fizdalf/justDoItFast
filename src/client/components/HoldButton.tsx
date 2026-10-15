import React, {useEffect, useRef, useState} from 'react';

interface HoldButtonProps {
  onHold: () => void;
  /** Tiempo que hay que mantenerlo pulsado (ms). */
  holdMs?: number;
  disabled?: boolean;
  className?: string;
  /** Color del relleno que avanza mientras se mantiene pulsado. */
  fillClassName?: string;
  children: React.ReactNode;
}

/**
 * Botón de "mantener pulsado": evita activaciones por un roce accidental sin
 * añadir pasos de confirmación. Si se suelta antes de tiempo, no pasa nada.
 */
export const HoldButton: React.FC<HoldButtonProps> = ({
  onHold,
  holdMs = 500,
  disabled = false,
  className = '',
  fillClassName = 'bg-white/30',
  children,
}) => {
  const [holding, setHolding] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancel = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    setHolding(false);
  };

  const start = () => {
    if (disabled || timer.current) return;
    setHolding(true);
    timer.current = setTimeout(() => {
      timer.current = null;
      setHolding(false);
      onHold();
    }, holdMs);
  };

  useEffect(() => cancel, []);

  return (
    <button
      type="button"
      disabled={disabled}
      onPointerDown={(e) => {
        e.preventDefault();
        start();
      }}
      onPointerUp={cancel}
      onPointerLeave={cancel}
      onPointerCancel={cancel}
      onKeyDown={(e) => {
        if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) {
          e.preventDefault();
          start();
        }
      }}
      onKeyUp={(e) => {
        if (e.key === ' ' || e.key === 'Enter') cancel();
      }}
      onContextMenu={(e) => e.preventDefault()}
      style={{ WebkitTouchCallout: 'none', touchAction: 'manipulation' }}
      className={`relative overflow-hidden select-none ${className}`}
    >
      <span
        aria-hidden
        className={`absolute inset-y-0 left-0 ${fillClassName}`}
        style={{
          width: holding ? '100%' : '0%',
          transition: `width ${holding ? holdMs : 150}ms linear`,
        }}
      />
      <span className="relative z-10 flex items-center justify-center gap-3 w-full">{children}</span>
    </button>
  );
};
