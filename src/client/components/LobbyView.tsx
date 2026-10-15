import React, {useState} from 'react';
import {errorText, useI18n} from '../i18n/index.js';
import {roomInviteUrl} from '../services/roomSession.js';
import {useGame} from '../context/GameContext.js';
import {Player} from '../../core/types.js';

export const LobbyView: React.FC = () => {
  const {
    gameState,
    players,
    myPlayer,
    isHost,
    switchTeam,
    startRound,
    error,
    clearError,
  } = useGame();
  const { t } = useI18n();

  const [starting, setStarting] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!gameState) return null;

  const teamAPlayers = players.filter((p: Player) => p.team === 'A');
  const teamBPlayers = players.filter((p: Player) => p.team === 'B');

  const quorumValid = teamAPlayers.length >= 2 && teamBPlayers.length >= 2;

  const handleStartGame = async () => {
    if (!quorumValid || !isHost) return;
    setStarting(true);
    clearError();
    await startRound();
    setStarting(false);
  };

  const handleCopyInviteLink = () => {
    if (typeof window !== 'undefined' && navigator.clipboard) {
      const link = roomInviteUrl(gameState.roomCode);
      navigator.clipboard.writeText(link);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  // Generate sequence preview: A1 -> B1 -> A2 -> B2 ...
  const getTurnOrderSequence = () => {
    const seq: Player[] = [];
    const maxLen = Math.max(teamAPlayers.length, teamBPlayers.length);
    for (let i = 0; i < maxLen; i++) {
      if (teamAPlayers[i]) seq.push(teamAPlayers[i]);
      if (teamBPlayers[i]) seq.push(teamBPlayers[i]);
    }
    return seq;
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 w-full space-y-6">
      
      {/* Top Banner: Room Code & Share */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="text-center sm:text-left">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">{t.lobby.roomCodeLabel}</div>
          <div className="text-4xl font-black font-mono text-amber-400 tracking-widest">{gameState.roomCode}</div>
          <div className="text-xs text-slate-400 mt-0.5">{t.lobby.connectedPlayers(players.length)}</div>
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <button
            onClick={handleCopyInviteLink}
            className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-sm font-semibold text-slate-200 transition-colors flex items-center justify-center space-x-2"
          >
            <span>{copiedLink ? t.lobby.linkCopied : t.lobby.shareLink}</span>
          </button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-sm flex items-center justify-between">
          <span>{errorText(t, error)}</span>
          <button onClick={clearError} aria-label={t.common.dismiss} className="font-bold text-rose-300 ml-2">×</button>
        </div>
      )}

      {/* Teams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Team A */}
        <div className="bg-slate-900/90 border border-rose-500/30 rounded-2xl p-5 shadow-xl flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-rose-500/20 mb-4">
            <div className="flex items-center space-x-2">
              <span className="w-3.5 h-3.5 rounded-full bg-rose-500 shadow-rose-500/50 shadow-md" />
              <h2 className="text-lg font-black text-rose-400 uppercase tracking-wide">{t.common.teams.A}</h2>
            </div>
            <span className="text-xs font-mono font-bold bg-rose-500/10 text-rose-300 px-2.5 py-1 rounded-full border border-rose-500/20">
              {t.lobby.playerCount(teamAPlayers.length)}
            </span>
          </div>

          <div className="space-y-2.5 flex-1 min-h-[160px]">
            {teamAPlayers.map((player: Player) => (
              <PlayerCard
                key={player.id}
                player={player}
                isCurrent={player.id === myPlayer?.id}
                teamColor="rose"
              />
            ))}
            {teamAPlayers.length === 0 && (
              <div className="h-full flex items-center justify-center text-xs text-slate-500 italic py-6">
                {t.lobby.noPlayersYet}
              </div>
            )}
          </div>

          <div className="pt-4 mt-auto">
            <button
              onClick={() => switchTeam('A')}
              disabled={myPlayer?.team === 'A'}
              className="w-full py-2.5 px-4 bg-rose-500/20 hover:bg-rose-500/30 disabled:opacity-40 disabled:cursor-default border border-rose-500/40 text-rose-300 font-bold rounded-xl text-sm transition-all"
            >
              {myPlayer?.team === 'A' ? t.lobby.youAreIn(t.common.teams.A) : t.lobby.switchTo(t.common.teams.A)}
            </button>
          </div>
        </div>

        {/* Team B */}
        <div className="bg-slate-900/90 border border-sky-500/30 rounded-2xl p-5 shadow-xl flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-sky-500/20 mb-4">
            <div className="flex items-center space-x-2">
              <span className="w-3.5 h-3.5 rounded-full bg-sky-500 shadow-sky-500/50 shadow-md" />
              <h2 className="text-lg font-black text-sky-400 uppercase tracking-wide">{t.common.teams.B}</h2>
            </div>
            <span className="text-xs font-mono font-bold bg-sky-500/10 text-sky-300 px-2.5 py-1 rounded-full border border-sky-500/20">
              {t.lobby.playerCount(teamBPlayers.length)}
            </span>
          </div>

          <div className="space-y-2.5 flex-1 min-h-[160px]">
            {teamBPlayers.map((player: Player) => (
              <PlayerCard
                key={player.id}
                player={player}
                isCurrent={player.id === myPlayer?.id}
                teamColor="sky"
              />
            ))}
            {teamBPlayers.length === 0 && (
              <div className="h-full flex items-center justify-center text-xs text-slate-500 italic py-6">
                {t.lobby.noPlayersYet}
              </div>
            )}
          </div>

          <div className="pt-4 mt-auto">
            <button
              onClick={() => switchTeam('B')}
              disabled={myPlayer?.team === 'B'}
              className="w-full py-2.5 px-4 bg-sky-500/20 hover:bg-sky-500/30 disabled:opacity-40 disabled:cursor-default border border-sky-500/40 text-sky-300 font-bold rounded-xl text-sm transition-all"
            >
              {myPlayer?.team === 'B' ? t.lobby.youAreIn(t.common.teams.B) : t.lobby.switchTo(t.common.teams.B)}
            </button>
          </div>
        </div>

      </div>

      {/* Turn Flow Order Preview */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-5">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center space-x-2">
          <span>{t.lobby.turnOrderTitle}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-300">
          {getTurnOrderSequence().map((player, idx, arr) => (
            <React.Fragment key={player.id}>
              <span className={`bg-slate-800 border px-2.5 py-1 rounded-lg ${
                player.team === 'A' ? 'border-rose-500/50' : 'border-sky-500/50'
              }`}>
                {player.name}
              </span>
              {idx < arr.length - 1 && <span className="text-amber-400 font-bold">➔</span>}
            </React.Fragment>
          ))}
          {getTurnOrderSequence().length === 0 && (
            <span className="text-slate-500 italic">{t.lobby.waitingForPlayers}</span>
          )}
        </div>
      </div>

      {/* Quorum / Start Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl text-center space-y-4">
        {!quorumValid ? (
          <div className="flex items-center justify-center space-x-2 text-amber-400 text-sm font-semibold bg-amber-500/10 border border-amber-500/20 py-3 px-4 rounded-xl">
            <span>{t.lobby.quorumMissing}</span>
          </div>
        ) : (
          <div className="flex items-center justify-center space-x-2 text-emerald-400 text-sm font-semibold bg-emerald-500/10 border border-emerald-500/20 py-3 px-4 rounded-xl">
            <span>{t.lobby.quorumReady}</span>
          </div>
        )}

        {isHost ? (
          <button
            onClick={handleStartGame}
            disabled={!quorumValid || starting}
            className="w-full sm:w-80 py-4 px-6 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-black text-lg rounded-xl shadow-lg shadow-amber-500/20 transition-all uppercase tracking-wider"
          >
            {starting ? t.lobby.starting : t.lobby.startGame}
          </button>
        ) : (
          <div className="text-sm text-slate-400 italic">
            {t.lobby.waitingForHostToStart(players.find((p: Player) => p.isHost)?.name || t.common.roles.host.singular)}
          </div>
        )}
      </div>

    </div>
  );
};

const PlayerCard: React.FC<{ player: Player; isCurrent: boolean; teamColor: 'rose' | 'sky' }> = ({
  player,
  isCurrent,
  teamColor,
}) => {
  const { t } = useI18n();
  return (
    <div
      className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
        isCurrent
          ? teamColor === 'rose'
            ? 'bg-rose-500/10 border-rose-500/50 ring-1 ring-rose-500/50'
            : 'bg-sky-500/10 border-sky-500/50 ring-1 ring-sky-500/50'
          : 'bg-slate-800/80 border-slate-700/60'
      }`}
    >
      <div className="flex items-center space-x-2.5">
        <span className="text-xs font-mono font-bold bg-slate-900 border border-slate-700 text-slate-300 w-6 h-6 rounded-full flex items-center justify-center">
          {player.seatIndex + 1}
        </span>
        <span className="font-semibold text-white text-sm">
          {player.name} {isCurrent && <span className="text-amber-400 font-bold text-xs">{t.common.you}</span>}
          {!player.isConnected && (
            <span className="ml-1.5 text-[10px] font-bold uppercase text-slate-500">· {t.common.disconnected}</span>
          )}
        </span>
      </div>

      {player.isHost && (
        <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold flex items-center space-x-1">
          <span>👑</span>
          <span>{t.common.hostBadge}</span>
        </span>
      )}
    </div>
  );
};
