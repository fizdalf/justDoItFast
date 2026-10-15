import React, {useState} from 'react';
import {useI18n} from '../../i18n/index.js';
import {useGame} from '../../context/GameContext.js';
import {Player} from '../../../core/types.js';
import {PlayLayout} from './PlayLayout.js';
import {HoldButton} from '../HoldButton.js';

export const OpponentRefereeView: React.FC = () => {
  const { currentTurn, game, players, triggerFoul } = useGame();
  const { t } = useI18n();
  const [submitting, setSubmitting] = useState(false);

  const word = currentTurn?.currentWord || game?.currentTurn?.currentWord || '...';
  const category = currentTurn?.category || game?.currentTurn?.category || '';
  const activeId = currentTurn?.activePlayerId || game?.currentTurn?.activePlayerId;
  const activePlayerName =
    players.find((p: Player) => p.id === activeId)?.name || t.common.roles.holder.singular;

  const handleFoul = async () => {
    if (submitting) return;
    setSubmitting(true);
    await triggerFoul();
    setSubmitting(false);
  };

  return (
    <PlayLayout
      banner={
        <>
          <div className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wide bg-sky-500/10 text-sky-400 border border-sky-500/30">
            <span>{t.game.saboteurs.roleBadge}</span>
          </div>
          <p className="text-xs text-slate-400">{t.game.saboteurs.intro(activePlayerName)}</p>
        </>
      }
      footer={
        <>
          <HoldButton
            onHold={handleFoul}
            disabled={submitting}
            fillClassName="bg-rose-300/40"
            className="w-full min-h-[72px] px-6 bg-gradient-to-r from-rose-600 to-rose-700 active:scale-[0.98] disabled:opacity-50 text-white font-black text-xl rounded-2xl shadow-xl shadow-rose-600/30 border border-rose-500/50 transition-transform uppercase tracking-wide"
          >
            <span className="text-2xl">🚨</span>
            <span>{t.game.saboteurs.foul}</span>
          </HoldButton>
          <p className="text-center text-[11px] text-slate-500">{t.game.saboteurs.holdHint}</p>
        </>
      }
    >
      <div className="w-full bg-slate-900 border-2 border-sky-500/40 rounded-3xl px-5 py-6 text-center shadow-xl flex flex-col items-center gap-3">
        <span className="text-[11px] font-bold font-mono uppercase tracking-widest text-sky-400 bg-sky-500/10 border border-sky-500/20 px-3 py-1 rounded-full">
          {t.game.saboteurs.wireLabel(category)}
        </span>
        <h2 className="text-[clamp(1.75rem,9vw,3rem)] leading-tight font-black text-white tracking-wide break-words select-none uppercase w-full">
          {word}
        </h2>
      </div>
      <p className="text-xs text-slate-400 text-center px-2">{t.game.saboteurs.warning}</p>
    </PlayLayout>
  );
};
