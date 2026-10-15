import React, {useState} from 'react';
import {useI18n} from '../../i18n/index.js';
import {useGame} from '../../context/GameContext.js';

export const GameOverView: React.FC = () => {
  const { gameOver, gameState, players, isHost, returnToLobby, leaveRoom } = useGame();
  const { t } = useI18n();
  const [restarting, setRestarting] = useState(false);

  const winner =
    gameOver?.winner ??
    gameState?.winningTeam ??
    ((gameState?.scores.A ?? 0) >= (gameState?.scores.B ?? 0) ? 'A' : 'B');
  const scores = gameOver?.finalScores || gameState?.scores || { A: 0, B: 0 };
  const isTeamAWinner = winner === 'A';
  const hostPlayer = players.find((p) => p.isHost);

  const handlePlayAgain = async () => {
    if (restarting) return;
    setRestarting(true);
    await returnToLobby();
    setRestarting(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] w-full max-w-md mx-auto p-4 space-y-8 text-center animate-fadeIn">
      
      {/* Trophy & Winner Title */}
      <div className="space-y-3">
        <div className="w-24 h-24 rounded-3xl bg-amber-500/20 border-2 border-amber-500 flex items-center justify-center text-5xl mx-auto shadow-2xl animate-bounce">
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
      <div className="w-full space-y-3 pt-2">
        {isHost ? (
          <button
            onClick={handlePlayAgain}
            disabled={restarting}
            className="w-full py-4 px-6 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-lg rounded-2xl shadow-xl shadow-amber-500/20 transition-all uppercase tracking-wide disabled:opacity-50"
          >
            {restarting ? t.game.gameOver.preparing : t.game.gameOver.playAgain}
          </button>
        ) : (
          <div className="text-xs text-slate-400 italic">
            {t.game.gameOver.waitingRematch(hostPlayer?.name || t.common.roles.host.singular)}
          </div>
        )}

        <button
          onClick={() => leaveRoom()}
          className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold rounded-xl text-sm transition-colors"
        >
          {t.game.gameOver.exitToMenu}
        </button>
      </div>

    </div>
  );
};
