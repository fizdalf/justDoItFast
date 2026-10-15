import React, {useState} from 'react';
import {useI18n} from '../../i18n/index.js';
import {useGame} from '../../context/GameContext.js';
import {PlayLayout} from './PlayLayout.js';
import {FrozenBadge, WireCounter} from './TurnStatus.js';
import {HoldButton} from '../HoldButton.js';
import {ToolsBar} from './ToolsBar.js';
import {WordCard} from './ActiveGiverView.js';

export const OpponentRefereeView: React.FC = () => {
  const { currentTurn, game, triggerFoul } = useGame();
  const { t } = useI18n();
  const [submitting, setSubmitting] = useState(false);

  const turn = currentTurn ?? game?.currentTurn;

  const handleFoul = async () => {
    if (submitting) return;
    setSubmitting(true);
    await triggerFoul();
    setSubmitting(false);
  };

  return (
    <PlayLayout
      banner={
        <span className="inline-block px-4 py-1.5 rounded-full text-sm font-black uppercase tracking-wide bg-sky-500/10 text-sky-300 border border-sky-500/30">
          {t.game.saboteurs.roleBadge}
        </span>
      }
      footer={
        <>
          <ToolsBar />
          <HoldButton
            onHold={handleFoul}
            disabled={submitting}
            fillClassName="bg-rose-300/40"
            className="w-full min-h-[72px] px-6 bg-gradient-to-r from-rose-600 to-rose-700 active:scale-[0.98] disabled:opacity-50 text-white rounded-2xl shadow-xl shadow-rose-600/30 border border-rose-500/50 transition-transform"
          >
            <span className="text-2xl">🚨</span>
            <span className="flex flex-col leading-tight">
              <span className="font-black text-xl uppercase tracking-wide">{t.game.saboteurs.foul}</span>
              <span className="text-[11px] font-semibold text-rose-100/80">{t.game.saboteurs.holdHint}</span>
            </span>
          </HoldButton>
        </>
      }
    >
      <WordCard word={turn?.currentWord || '...'} category={turn?.category} tone="sky">
        <WireCounter turn={turn} />
        <FrozenBadge turn={turn} />
      </WordCard>
    </PlayLayout>
  );
};
