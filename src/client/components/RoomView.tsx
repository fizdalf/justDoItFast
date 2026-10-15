import React, {useState} from 'react';
import {errorText, useI18n} from '../i18n/index.js';
import {roomInviteUrl} from '../services/roomSession.js';
import {InviteQr} from './lobby/InviteQr.js';
import {PackSelector} from './lobby/PackSelector.js';
import {RoomSettingsPanel} from './lobby/RoomSettingsPanel.js';
import {RoomHistoryPanel} from './lobby/RoomHistoryPanel.js';
import {useGame} from '../context/GameContext.js';
import {Player, TeamId} from '../../core/types.js';

const TEAM_STYLE: Record<TeamId, { border: string; text: string; dot: string; me: string }> = {
  A: { border: 'border-rose-500/30', text: 'text-rose-400', dot: 'bg-rose-500', me: 'bg-rose-500/15 ring-1 ring-rose-500/60' },
  B: { border: 'border-sky-500/30', text: 'text-sky-400', dot: 'bg-sky-500', me: 'bg-sky-500/15 ring-1 ring-sky-500/60' },
};

/** La sala reunida entre partidas: equipos, preparación de la próxima partida e historial. */
export const RoomView: React.FC = () => {
  const { room, players, myPlayer, hostPlayer, isHost, switchTeam, startGame, error, clearError } = useGame();
  const { t } = useI18n();

  const [starting, setStarting] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showQr, setShowQr] = useState(false);

  if (!room) return null;

  const teamPlayers = (team: TeamId) => players.filter((p: Player) => p.team === team);
  // Solo cuentan los conectados: quien se ha caído no puede jugar.
  const connectedIn = (team: TeamId) => teamPlayers(team).filter((p) => p.isConnected).length;
  const quorumValid = connectedIn('A') >= 2 && connectedIn('B') >= 2;
  const nextGameNumber = room.history.reduce((max, g) => Math.max(max, g.gameNumber), 0) + 1;
  const otherTeam: TeamId = myPlayer?.team === 'A' ? 'B' : 'A';

  const handleStartGame = async () => {
    if (!quorumValid || !isHost) return;
    setStarting(true);
    clearError();
    await startGame();
    setStarting(false);
  };

  const handleCopyInviteLink = () => {
    if (typeof window !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(roomInviteUrl(room.roomCode));
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  // Orden de pases: A1 → B1 → A2 → B2 ...
  const turnOrder: Player[] = [];
  const [teamA, teamB] = [teamPlayers('A'), teamPlayers('B')];
  for (let i = 0; i < Math.max(teamA.length, teamB.length); i++) {
    if (teamA[i]) turnOrder.push(teamA[i]);
    if (teamB[i]) turnOrder.push(teamB[i]);
  }

  return (
    <div className="flex-1 w-full max-w-2xl flex flex-col gap-3">
      {/* Código e invitación */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{t.lobby.roomCodeLabel}</div>
          <div className="text-3xl font-black font-mono text-amber-400 tracking-widest leading-tight">{room.roomCode}</div>
          <div className="text-[11px] text-slate-400">{t.lobby.connectedPlayers(players.length)}</div>
        </div>
        <button
          onClick={handleCopyInviteLink}
          title={t.lobby.shareLink}
          className="min-h-[44px] px-3 bg-slate-800 active:bg-slate-700 border border-slate-700 rounded-xl text-sm font-semibold text-slate-200"
        >
          {copiedLink ? t.lobby.linkCopied : t.lobby.invite.linkShort}
        </button>
        <button
          onClick={() => setShowQr((v) => !v)}
          aria-expanded={showQr}
          title={showQr ? t.lobby.invite.hideQr : t.lobby.invite.showQr}
          className={`min-h-[44px] px-3 border rounded-xl text-sm font-semibold ${
            showQr ? 'bg-amber-500 border-amber-400 text-slate-950' : 'bg-slate-800 active:bg-slate-700 border-slate-700 text-slate-200'
          }`}
        >
          {t.lobby.invite.qrShort}
        </button>
      </div>

      {showQr && <InviteQr roomCode={room.roomCode} />}

      {error && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-sm flex items-center justify-between">
          <span>{errorText(t, error)}</span>
          <button onClick={clearError} aria-label={t.common.dismiss} className="font-bold text-rose-300 ml-2 px-2">×</button>
        </div>
      )}

      {/* Equipos, uno al lado del otro también en el móvil */}
      <div className="grid grid-cols-2 gap-2">
        {(['A', 'B'] as TeamId[]).map((team) => {
          const members = teamPlayers(team);
          const style = TEAM_STYLE[team];
          return (
            <section key={team} className={`bg-slate-900/90 border ${style.border} rounded-2xl p-2.5 flex flex-col gap-1.5`}>
              <div className="flex items-center gap-1.5 px-1 pb-1">
                <span className={`w-2.5 h-2.5 shrink-0 rounded-full ${style.dot}`} />
                <h2 className={`flex-1 min-w-0 truncate text-sm font-black uppercase tracking-wide ${style.text}`}>
                  {t.common.teams[team]}
                </h2>
                <span className="text-[11px] font-mono font-bold text-slate-400">{members.length}</span>
              </div>
              {members.map((player) => (
                <PlayerRow
                  key={player.id}
                  player={player}
                  isCurrent={player.id === myPlayer?.id}
                  isRoomHost={player.id === room.hostPlayerId}
                  meStyle={style.me}
                />
              ))}
              {members.length === 0 && (
                <div className="text-[11px] text-slate-500 italic text-center py-3">{t.lobby.noPlayersYet}</div>
              )}
            </section>
          );
        })}
      </div>

      {myPlayer && (
        <button
          onClick={() => switchTeam(otherTeam)}
          className={`w-full min-h-[44px] rounded-xl border text-sm font-bold transition-colors ${
            otherTeam === 'A'
              ? 'bg-rose-500/15 active:bg-rose-500/30 border-rose-500/40 text-rose-300'
              : 'bg-sky-500/15 active:bg-sky-500/30 border-sky-500/40 text-sky-300'
          }`}
        >
          {t.lobby.switchTo(t.common.teams[otherTeam])}
        </button>
      )}

      {turnOrder.length > 1 && (
        <div className="space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{t.lobby.turnOrderTitle}</div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-medium text-slate-300">
            {turnOrder.map((player, idx) => (
              <React.Fragment key={player.id}>
                <span
                  className={`shrink-0 bg-slate-800 border px-2 py-1 rounded-lg ${
                    player.team === 'A' ? 'border-rose-500/50' : 'border-sky-500/50'
                  }`}
                >
                  {player.name}
                </span>
                {idx < turnOrder.length - 1 && <span className="shrink-0 text-amber-400 font-bold">→</span>}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      <PackSelector />
      <RoomSettingsPanel collapsible />
      {room.history.length > 0 && <RoomHistoryPanel />}

      {/* Acción principal fija abajo */}
      <div className="sticky bottom-0 -mx-3 px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] mt-auto bg-slate-950/95 backdrop-blur border-t border-slate-800/80 space-y-2 text-center">
        {isHost ? (
          <>
            {!quorumValid && <p className="text-xs font-semibold text-amber-400">{t.lobby.quorumMissing}</p>}
            <button
              onClick={handleStartGame}
              disabled={!quorumValid || starting}
              className="w-full min-h-[60px] px-6 bg-gradient-to-r from-amber-500 to-amber-600 active:from-amber-400 active:to-amber-500 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-black text-lg rounded-2xl shadow-lg shadow-amber-500/20 transition-all uppercase tracking-wide"
            >
              {starting ? t.lobby.starting : t.lobby.startGame}
            </button>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{t.lobby.nextGame(nextGameNumber)}</div>
          </>
        ) : (
          <div className="py-2 text-sm text-slate-400 italic bg-slate-900/90 border border-slate-800 rounded-2xl px-3">
            {quorumValid
              ? t.lobby.waitingForHostToStart(hostPlayer?.name || t.common.roles.host.singular)
              : t.lobby.quorumMissing}
          </div>
        )}
      </div>
    </div>
  );
};

const PlayerRow: React.FC<{ player: Player; isCurrent: boolean; isRoomHost: boolean; meStyle: string }> = ({
  player,
  isCurrent,
  isRoomHost,
  meStyle,
}) => {
  const { t } = useI18n();
  return (
    <div
      className={`min-h-[40px] px-2 rounded-lg flex items-center gap-1.5 text-sm ${
        isCurrent ? meStyle : 'bg-slate-800/70'
      } ${player.isConnected ? '' : 'opacity-50'}`}
      title={player.isConnected ? undefined : t.common.disconnected}
    >
      <span className="flex-1 min-w-0 truncate font-semibold text-white">
        {player.name}
        {isCurrent && <span className="ml-1 text-amber-400 font-bold text-[11px]">{t.common.you}</span>}
      </span>
      {!player.isConnected && <span className="sr-only">{t.common.disconnected}</span>}
      {isRoomHost && (
        <span title={t.common.hostBadge} aria-label={t.common.hostBadge} className="shrink-0">
          👑
        </span>
      )}
    </div>
  );
};
