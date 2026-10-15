import React from 'react';
import {useI18n} from '../../i18n/index.js';
import {useGame} from '../../context/GameContext.js';
import {Player} from '../../../core/types.js';
import {PlayLayout} from './PlayLayout.js';
import {FrozenBadge, WireCounter} from './TurnStatus.js';
import {ToolsBar} from './ToolsBar.js';

export const TeamMateView: React.FC = () => {
  const { currentTurn, game, players } = useGame();
  const { t } = useI18n();

  const turn = currentTurn ?? game?.currentTurn;
  const category = turn?.category || '';
  const activeId = turn?.activePlayerId;
  const activePlayerName =
    players.find((p: Player) => p.id === activeId)?.name || t.common.roles.holder.singular;

  return (
    <PlayLayout
      banner={
        <>
          <div className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wide bg-rose-500/10 text-rose-400 border border-rose-500/30">
            <span>{t.game.helpers.roleBadge}</span>
          </div>
          <p className="text-xs text-slate-400">{t.game.helpers.intro(activePlayerName)}</p>
        </>
      }
      footer={
        <>
          <ToolsBar />
          <p className="text-center text-xs text-slate-500 italic">{t.game.helpers.footer(activePlayerName)}</p>
        </>
      }
    >
      <div className="w-full bg-slate-900 border-2 border-rose-500/40 rounded-3xl px-5 py-8 text-center shadow-xl flex flex-col items-center gap-3">
        <span className="text-[11px] font-bold font-mono uppercase tracking-widest text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-1 rounded-full">
          {t.game.helpers.categoryLabel(category)}
        </span>
        {(turn?.requiredGuesses ?? 1) > 1 || turn?.isFrozen ? (
          <div className="flex flex-wrap justify-center gap-2">
            <WireCounter turn={turn} />
            <FrozenBadge turn={turn} />
          </div>
        ) : null}
        <div className="text-5xl">👂🗣️</div>
        <h2 className="text-2xl font-black text-slate-200 uppercase tracking-wider">{t.game.helpers.guessAloud}</h2>
        <p className="text-xs text-slate-400 max-w-xs">{t.game.helpers.guessHint}</p>
      </div>
    </PlayLayout>
  );
};
