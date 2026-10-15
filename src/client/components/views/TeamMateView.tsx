import React from 'react';
import {useI18n} from '../../i18n/index.js';
import {useGame} from '../../context/GameContext.js';
import {Player, PowerUp} from '../../../core/types.js';

export const TeamMateView: React.FC = () => {
  const { currentTurn, game, players, myPlayer, inventory, usePowerUp } = useGame();
  const { t } = useI18n();

  const category = currentTurn?.category || game?.currentTurn?.category || '';
  const activeId = currentTurn?.activePlayerId || game?.currentTurn?.activePlayerId;
  const activePlayerName =
    players.find((p: Player) => p.id === activeId)?.name || t.common.roles.holder.singular;
  const myTeam = myPlayer?.team || 'A';
  const myTeamInventory = inventory[myTeam] || [];

  return (
    <div className="flex flex-col items-center justify-between min-h-[460px] w-full max-w-md mx-auto space-y-6">
      
      {/* Role Banner */}
      <div className="w-full text-center">
        <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/30 shadow-md">
          <span>{t.game.helpers.roleBadge}</span>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          {t.game.helpers.intro(activePlayerName)}
        </p>
      </div>

      {/* Secret Word Masked Card */}
      <div className="w-full bg-slate-900 border-2 border-rose-500/40 rounded-3xl p-8 sm:p-10 text-center shadow-xl flex flex-col items-center justify-center min-h-[220px]">
        <span className="text-xs font-bold font-mono uppercase tracking-widest text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-1 rounded-full mb-4">
          {t.game.helpers.categoryLabel(category)}
        </span>
        <div className="text-5xl mb-3">👂🗣️</div>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-200 uppercase tracking-wider">
          {t.game.helpers.guessAloud}
        </h2>
        <p className="text-xs text-slate-400 mt-3 max-w-xs">
          {t.game.helpers.guessHint}
        </p>
      </div>

      {/* Team Power-ups */}
      {myTeamInventory.length > 0 && (
        <div className="w-full bg-slate-900/80 border border-slate-800 rounded-2xl p-3">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 text-center">
            {t.common.yourTeamTools}
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
            {myTeamInventory.map((p: PowerUp) => (
              <button
                key={p.id}
                onClick={() => usePowerUp(p.id)}
                title={t.common.powerUps[p.type].description}
                className="px-3 py-1.5 bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 rounded-xl text-xs font-bold text-purple-200 transition-colors flex items-center space-x-1"
              >
                <span>⚡</span>
                <span>{t.common.powerUps[p.type].name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Status Bar */}
      <div className="w-full text-center text-xs text-slate-500 italic py-2">
        {t.game.helpers.footer(activePlayerName)}
      </div>

    </div>
  );
};
