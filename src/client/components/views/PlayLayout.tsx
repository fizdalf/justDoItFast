import React from 'react';

/**
 * Esqueleto de la pantalla de juego en el móvil: rol arriba, cable en el centro ocupando
 * el espacio libre y la acción principal fija abajo, al alcance del pulgar.
 */
export const PlayLayout: React.FC<{
  banner: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}> = ({ banner, children, footer }) => (
  <div className="flex-1 w-full max-w-md mx-auto flex flex-col gap-3">
    <div className="text-center space-y-1">{banner}</div>
    <div className="flex-1 flex flex-col justify-center gap-3">{children}</div>
    {footer && (
      <div className="sticky bottom-0 -mx-3 px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-gradient-to-t from-slate-950 via-slate-950 to-slate-950/0 space-y-2">
        {footer}
      </div>
    )}
  </div>
);
