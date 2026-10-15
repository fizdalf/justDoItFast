import React from 'react';
import {useI18n} from '../../i18n/index.js';
import {useGame} from '../../context/GameContext.js';
import {PlayLayout} from './PlayLayout.js';
import {FrozenBadge, WireCounter} from './TurnStatus.js';
import {ToolsBar} from './ToolsBar.js';

export const TeamMateView: React.FC = () => {
  const { currentTurn, game } = useGame();
  const { t } = useI18n();

  const turn = currentTurn ?? game?.currentTurn;

  return (
    <PlayLayout
      banner={
        <span className="inline-block px-4 py-1.5 rounded-full text-sm font-black uppercase tracking-wide bg-rose-500/10 text-rose-300 border border-rose-500/30">
          {t.game.helpers.roleBadge}
        </span>
      }
      footer={<ToolsBar />}
    >
      <div className="w-full bg-slate-900 border-2 border-rose-500/40 rounded-3xl px-5 py-10 text-center flex flex-col items-center gap-3">
        <WireCounter turn={turn} />
        <FrozenBadge turn={turn} />
        <div className="text-6xl" aria-hidden>🗣️</div>
        <h2 className="text-4xl font-black text-white uppercase tracking-wider">{t.game.helpers.guessAloud}</h2>
        {turn?.category && <span className="text-sm font-semibold text-slate-400">{turn.category}</span>}
      </div>
    </PlayLayout>
  );
};
