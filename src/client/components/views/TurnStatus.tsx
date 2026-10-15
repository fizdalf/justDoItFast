import React from 'react';
import {useI18n} from '../../i18n/index.js';
import {useFreezeCountdown} from '../../hooks/useFreezeCountdown.js';
import type {TurnState} from '../../../core/types.js';

/** "Cable 2/3" cuando hay Doble detonador visible para mí (el servidor oculta el que aún es secreto). */
export const WireCounter: React.FC<{ turn: TurnState | null | undefined }> = ({ turn }) => {
  const { t } = useI18n();
  if (!turn || turn.requiredGuesses <= 1) return null;
  const current = Math.min(turn.successfulGuesses + 1, turn.requiredGuesses);
  return (
    <span className="inline-flex items-center gap-1 text-xs font-black uppercase tracking-wider text-orange-200 bg-orange-500/20 border border-orange-400/50 px-3 py-1 rounded-full">
      <span aria-hidden>🧨</span>
      <span>{t.game.turn.wireCounter(current, turn.requiredGuesses)}</span>
    </span>
  );
};

/** Indicador pequeño del Inhibidor para ayudantes y saboteadores. */
export const FrozenBadge: React.FC<{ turn: TurnState | null | undefined }> = ({ turn }) => {
  const { t } = useI18n();
  const { frozen, secondsLeft } = useFreezeCountdown(turn);
  if (!frozen) return null;
  return (
    <span className="inline-flex items-center text-xs font-black uppercase tracking-wider text-cyan-100 bg-cyan-500/20 border border-cyan-300/50 px-3 py-1 rounded-full">
      {t.game.turn.frozenBadge(secondsLeft)}
    </span>
  );
};
