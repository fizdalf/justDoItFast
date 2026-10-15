import React, {useState} from 'react';
import {useI18n} from '../../i18n/index.js';
import {useGame} from '../../context/GameContext.js';
import {DisputeResolution, Player} from '../../../core/types.js';

export const HostDisputeModal: React.FC = () => {
  const { currentDispute, game, players, hostPlayer, isHost, resolveDispute } = useGame();
  const { t } = useI18n();
  const [resolving, setResolving] = useState(false);

  const dispute = currentDispute || game?.currentDispute;
  if (!dispute) return null;

  const triggeringPlayer = players.find((p: Player) => p.id === dispute.triggeredByPlayerId);

  const handleResolve = async (resolution: DisputeResolution) => {
    if (resolving) return;
    setResolving(true);
    await resolveDispute(resolution);
    setResolving(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 select-none animate-fadeIn">
      <div className="bg-slate-900 border-2 border-rose-500 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 text-center">
        
        {/* Header Icon & Title */}
        <div>
          <div className="w-16 h-16 bg-rose-500/20 border-2 border-rose-500 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-3 shadow-lg animate-bounce">
            🚨
          </div>
          <h2 className="text-2xl font-black text-rose-400 uppercase tracking-wide">
            {t.game.dispute.title}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {t.game.dispute.subtitle}
          </p>
        </div>

        {/* Dispute Details Box */}
        <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 text-left space-y-2">
          <div className="text-xs text-slate-400">
            <span className="font-bold text-slate-300">{t.game.dispute.calledBy}</span>{' '}
            <span className="text-amber-300 font-bold">{triggeringPlayer?.name || t.common.roles.saboteurs.singular}</span> ({t.common.teams[dispute.triggeredByTeam]})
          </div>
          {dispute.foulReason && (
            <div className="text-xs text-slate-400">
              <span className="font-bold text-slate-300">{t.game.dispute.reason}</span>{' '}
              <span className="text-white italic">&quot;{dispute.foulReason}&quot;</span>
            </div>
          )}
        </div>

        {/* Host Mediation Actions */}
        {isHost ? (
          <div className="space-y-3 pt-2">
            <div className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center justify-center space-x-1">
              <span>{t.game.dispute.hostDecision}</span>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              <button
                onClick={() => handleResolve('AWARD_TEAM_A')}
                disabled={resolving}
                className="w-full py-3 px-4 bg-rose-600/30 hover:bg-rose-600/50 border border-rose-500/60 text-rose-200 font-bold rounded-xl text-sm transition-all text-left flex items-center justify-between"
              >
                <span>{t.game.dispute.awardTo(t.common.teams.A)}</span>
                <span className="text-xs font-mono">+1</span>
              </button>

              <button
                onClick={() => handleResolve('AWARD_TEAM_B')}
                disabled={resolving}
                className="w-full py-3 px-4 bg-sky-600/30 hover:bg-sky-600/50 border border-sky-500/60 text-sky-200 font-bold rounded-xl text-sm transition-all text-left flex items-center justify-between"
              >
                <span>{t.game.dispute.awardTo(t.common.teams.B)}</span>
                <span className="text-xs font-mono">+1</span>
              </button>

              <button
                onClick={() => handleResolve('RESTART_ROUND')}
                disabled={resolving}
                className="w-full py-3 px-4 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 font-bold rounded-xl text-sm transition-all text-left flex items-center justify-between"
              >
                <span>{t.game.dispute.restart}</span>
                <span className="text-xs">{t.game.dispute.restartHint}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="py-4 space-y-2">
            <div className="inline-block animate-spin text-2xl">⏳</div>
            <div className="text-sm font-semibold text-slate-300">
              {t.game.dispute.waiting(hostPlayer?.name || t.common.roles.host.singular)}
            </div>
            <div className="text-xs text-slate-500 italic">
              {t.game.dispute.waitingHint}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
