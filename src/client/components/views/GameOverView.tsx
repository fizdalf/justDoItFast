import React, {useState} from 'react';
import {useI18n} from '../../i18n/index.js';
import {useGame} from '../../context/GameContext.js';

export const GameOverView: React.FC = () => {
  const { gameOver, game, hostPlayer, isHost, endGame, leaveRoom } = useGame();
  const { t } = useI18n();
  const [returning, setReturning] = useState(false);

  const winner =
    gameOver?.winner ??
    game?.winningTeam ??
    ((game?.scores.A ?? 0) >= (game?.scores.B ?? 0) ? 'A' : 'B');
  const scores = gameOver?.finalScores || game?.scores || { A: 0, B: 0 };
  const isTeamAWinner = winner === 'A';

  // Cierra el podio: la partida pasa al historial y todos vuelven a la sala.
  const handleBackToRoom = async () => {
    if (returning) return;
    setReturning(true);
    await endGame();
    setReturning(false);
  };

  return (
    <div className="flex-1 flex flex-col items-center w-full max-w-md mx-auto pt-3 space-y-5 text-center animate-fadeIn">
      
      {/* Trophy & Winner Title */}
      <div className="space-y-3">
        <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-2xl sm:rounded-3xl bg-amber-500/20 border-2 border-amber-500 flex items-center justify-center text-4xl sm:text-5xl mx-auto shadow-2xl animate-bounce">
          🏆
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-amber-400 uppercase tracking-tight">
          {t.game.gameOver.title}
        </h1>
        <div className={`text-xl font-bold px-6 py-2 rounded-full inline-block border shadow-lg ${
          isTeamAWinner
            ? 'bg-rose-500/20 border-rose-500 text-rose-300'
            : 'bg-sky-500/20 border-sky-500 text-sky-300'
        }`}>
          {isTeamAWinner ? '🔴' : '🔵'} {t.game.gameOver.winner(t.common.teams[winner])}
        </div>
      </div>

      {/* Scores Summary Card */}
      <div className="w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          {t.game.gameOver.finalScore}
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30">
            <div className="text-xs font-bold text-rose-400 uppercase">{t.common.teams.A}</div>
            <div className="text-4xl font-black text-white mt-1">{scores.A ?? 0}</div>
            <div className="text-[10px] text-slate-400 mt-1">{t.game.gameOver.points}</div>
          </div>
          <div className="p-4 rounded-2xl bg-sky-500/10 border border-sky-500/30">
            <div className="text-xs font-bold text-sky-400 uppercase">{t.common.teams.B}</div>
            <div className="text-4xl font-black text-white mt-1">{scores.B ?? 0}</div>
            <div className="text-[10px] text-slate-400 mt-1">{t.game.gameOver.points}</div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="self-stretch mt-auto space-y-2 sticky bottom-0 -mx-3 px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-gradient-to-t from-slate-950 via-slate-950 to-slate-950/0">
        {isHost ? (
          <button
            onClick={handleBackToRoom}
            disabled={returning}
            className="w-full py-4 px-6 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-lg rounded-2xl shadow-xl shadow-amber-500/20 transition-all uppercase tracking-wide disabled:opacity-50"
          >
            {returning ? t.game.gameOver.returning : t.game.gameOver.backToRoom}
          </button>
        ) : (
          <div className="text-xs text-slate-400 italic">
            {t.game.gameOver.waitingBackToRoom(hostPlayer?.name || t.common.roles.host.singular)}
          </div>
        )}

        <button
          onClick={() => leaveRoom()}
          className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold rounded-xl text-sm transition-colors"
        >
          {t.game.gameOver.leaveRoom}
        </button>
      </div>

    </div>
  );
};
