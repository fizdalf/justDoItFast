import React, {useState} from 'react';
import {useI18n} from '../../i18n/index.js';
import {useGame} from '../../context/GameContext.js';
import {Player} from '../../../core/types.js';

export const RoundOverView: React.FC = () => {
  const { game, players, myPlayer, hostPlayer, isHost, isSpectator, startRound } = useGame();
  const { t } = useI18n();
  const [starting, setStarting] = useState(false);

  if (!game) return null;

  const result = game.lastRoundResult;
  const winningTeam = result?.winningTeam;
  const isTeamAWinner = winningTeam === 'A';
  const didMyTeamScore = !!myPlayer && myPlayer.team === winningTeam;
  const explodedPlayer = players.find((p: Player) => p.id === result?.explodedPlayerId);

  const handleNextRound = async () => {
    if (starting) return;
    setStarting(true);
    await startRound();
    setStarting(false);
  };

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto space-y-4 text-center animate-fadeIn">

      {/* Round Result Header */}
      <div className="space-y-3">
        <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-rose-500/20 border-2 border-rose-500 flex items-center justify-center text-3xl sm:text-5xl mx-auto shadow-2xl">
          {result?.reason === 'DISPUTE' ? '⚖️' : '💥'}
        </div>
        <h2 className="text-3xl font-black text-amber-400 uppercase tracking-tight">
          {result?.reason === 'DISPUTE' ? t.game.roundOver.titleDispute : t.game.roundOver.titleExplosion}
        </h2>
        <p className="text-sm text-slate-400">{t.game.roundOver.roundEnded(game.roundNumber)}</p>
      </div>

      {/* Round Details Card */}
      {result && (
        <div className="w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
          {result.reason === 'EXPLOSION' ? (
            <div className="text-sm text-slate-300">
              {t.game.roundOver.exploded(
                <span className="font-black text-white">{explodedPlayer?.name || t.common.aPlayer}</span>,
                result.explodedWord && (
                  <span className="font-black text-amber-300 uppercase">{result.explodedWord}</span>
                )
              )}
            </div>
          ) : (
            <div className="text-sm text-slate-300">
              {t.game.roundOver.disputeResolved}
            </div>
          )}

          <div className={`text-lg font-bold px-5 py-2 rounded-full inline-block border shadow-lg ${
            isTeamAWinner
              ? 'bg-rose-500/20 border-rose-500 text-rose-300'
              : 'bg-sky-500/20 border-sky-500 text-sky-300'
          }`}>
            {isTeamAWinner ? '🔴' : '🔵'} {t.game.roundOver.pointFor(t.common.teams[winningTeam ?? 'A'])}
          </div>

          {myPlayer && !isSpectator && (
            <div className={`text-xs font-bold uppercase tracking-wider ${didMyTeamScore ? 'text-emerald-400' : 'text-slate-500'}`}>
              {didMyTeamScore ? t.game.roundOver.myTeamScored : t.game.roundOver.myTeamDidNotScore}
            </div>
          )}
        </div>
      )}

      {/* Next Round Action */}
      <div className="self-stretch sticky bottom-0 -mx-3 px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-gradient-to-t from-slate-950 via-slate-950 to-slate-950/0">
        {isHost ? (
          <button
            onClick={handleNextRound}
            disabled={starting}
            className="w-full py-4 px-6 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 text-slate-950 font-black text-lg rounded-2xl shadow-xl shadow-amber-500/20 transition-all uppercase tracking-wide"
          >
            {starting ? t.game.roundOver.starting : t.game.roundOver.nextRound}
          </button>
        ) : (
          <div className="text-sm text-slate-400 italic">
            {t.game.roundOver.waitingNextRound(hostPlayer?.name || t.common.roles.host.singular)}
          </div>
        )}
      </div>

    </div>
  );
};
