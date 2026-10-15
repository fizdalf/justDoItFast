import React, {useState} from 'react';
import {useI18n} from '../../i18n/index.js';
import {useGame} from '../../context/GameContext.js';
import {Player} from '../../../core/types.js';

export const OpponentRefereeView: React.FC = () => {
  const { currentTurn, game, players, triggerFoul } = useGame();
  const { t } = useI18n();
  const [submitting, setSubmitting] = useState(false);
  const [showReasonSelect, setShowReasonSelect] = useState(false);

  const word = currentTurn?.currentWord || game?.currentTurn?.currentWord || '...';
  const category = currentTurn?.category || game?.currentTurn?.category || '';
  const activeId = currentTurn?.activePlayerId || game?.currentTurn?.activePlayerId;
  const activePlayerName =
    players.find((p: Player) => p.id === activeId)?.name || t.common.roles.holder.singular;

  const handleFoul = async (reason?: string) => {
    if (submitting) return;
    setSubmitting(true);
    await triggerFoul(reason || t.game.saboteurs.defaultReason);
    setSubmitting(false);
    setShowReasonSelect(false);
  };

  return (
    <div className="flex flex-col items-center justify-between min-h-[460px] w-full max-w-md mx-auto space-y-6">
      
      {/* Role Banner */}
      <div className="w-full text-center">
        <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider bg-sky-500/10 text-sky-400 border border-sky-500/30 shadow-md">
          <span>{t.game.saboteurs.roleBadge}</span>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          {t.game.saboteurs.intro(activePlayerName)}
        </p>
      </div>

      {/* Secret Word Monitor */}
      <div className="w-full bg-slate-900 border-2 border-sky-500/40 rounded-3xl p-6 sm:p-8 text-center shadow-xl">
        <span className="text-xs font-bold font-mono uppercase tracking-widest text-sky-400 bg-sky-500/10 border border-sky-500/20 px-3 py-1 rounded-full mb-3 inline-block">
          {t.game.saboteurs.wireLabel(category)}
        </span>
        <h2 className="text-3xl sm:text-4xl font-black text-white tracking-wide break-words select-none uppercase">
          {word}
        </h2>
        <div className="text-[11px] text-slate-400 mt-4 bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60">
          {t.game.saboteurs.warning}
        </div>
      </div>

      {/* Foul Options or Direct Button */}
      <div className="w-full space-y-3 pt-2">
        {!showReasonSelect ? (
          <button
            onClick={() => setShowReasonSelect(true)}
            className="w-full py-5 px-6 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 active:scale-[0.98] text-white font-black text-xl rounded-2xl shadow-xl shadow-rose-600/30 border border-rose-500/50 transition-all uppercase tracking-wide flex items-center justify-center space-x-3 select-none"
          >
            <span className="text-2xl">🚨</span>
            <span>{t.game.saboteurs.foul}</span>
          </button>
        ) : (
          <div className="bg-slate-900 border border-rose-500/40 rounded-2xl p-4 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-rose-400 text-center">
              {t.game.saboteurs.reasonTitle}
            </div>

            <div className="grid grid-cols-1 gap-2">
              {t.game.saboteurs.reasons.map((reason) => (
                <button
                  key={reason}
                  onClick={() => handleFoul(reason)}
                  disabled={submitting}
                  className="py-2.5 px-3 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 rounded-xl text-xs font-bold text-rose-200 text-left transition-colors"
                >
                  {reason}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowReasonSelect(false)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-semibold text-slate-400 transition-colors"
            >
              {t.common.cancel}
            </button>
          </div>
        )}
      </div>

    </div>
  );
};
