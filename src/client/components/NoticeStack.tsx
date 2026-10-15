import React from 'react';
import {Notice, useGame} from '../context/GameContext.js';
import {Messages, useI18n} from '../i18n/index.js';
import {Player, TeamId, TurnState} from '../../core/types.js';

const RIVAL: Record<TeamId, TeamId> = { A: 'B', B: 'A' };

interface NoticeText {
  title: string;
  detail?: string;
  /** Rayos X: la lectura se muestra en grande. */
  big?: boolean;
  tone: 'tool' | 'alert' | 'xray' | 'shield';
}

const TONE: Record<NoticeText['tone'], string> = {
  tool: 'bg-purple-950/95 border-purple-500/50 text-purple-100',
  alert: 'bg-orange-950/95 border-orange-500/60 text-orange-100',
  xray: 'bg-cyan-950/95 border-cyan-300/70 text-cyan-50 ring-2 ring-cyan-300/30',
  shield: 'bg-emerald-950/95 border-emerald-500/60 text-emerald-100',
};

/** Traduce un aviso con el estado actual (nombres de jugadores, quién tiene la bomba). */
function noticeText(
  t: Messages,
  notice: Notice,
  players: Player[],
  myTeam: TeamId | undefined,
  turn: TurnState | null
): NoticeText {
  const labels = t.game.notices;
  const playerName = (id: string) => players.find((p) => p.id === id)?.name ?? t.common.aPlayer;

  switch (notice.kind) {
    case 'AWARDED':
      return {
        title: labels.awarded(t.common.powerUps[notice.powerUp.type].name),
        tone: 'tool',
      };
    case 'ACTIVATED':
      return {
        title: labels.activated(
          playerName(notice.byPlayerId),
          t.common.teams[notice.team],
          t.common.powerUps[notice.type].name
        ),
        tone: 'tool',
      };
    case 'DOUBLE_REVEALED': {
      // El evento dice quién tiene ahora la bomba: no depende de que haya llegado ya el estado
      const holderTeam = notice.holderTeam;
      const holdingIt = !!myTeam && myTeam === holderTeam;
      const wires = labels.doubleRevealed.wires(notice.requiredGuesses);
      if (notice.bounced) {
        return {
          title: holdingIt
            ? labels.doubleRevealed.bouncedToUs
            : labels.doubleRevealed.bounced(holderTeam ? t.common.teams[holderTeam] : t.common.aPlayer),
          detail: wires,
          tone: 'alert',
        };
      }
      return {
        title: holdingIt || !holderTeam
          ? labels.doubleRevealed.ours
          : labels.doubleRevealed.theirs(t.common.teams[holderTeam]),
        detail: wires,
        tone: 'alert',
      };
    }
    case 'XRAY':
      return {
        title: labels.xrayTitle(t.common.powerUps.XRAY.name),
        detail: labels.xray[notice.reading],
        big: true,
        tone: 'xray',
      };
    case 'SHIELDED':
      return {
        title: labels.shielded(t.common.powerUps.SHIELD.name, playerName(notice.playerId)),
        detail: labels.shieldedDetail(t.common.teams[RIVAL[notice.team]]),
        tone: 'shield',
      };
  }
}

/** Avisos de herramientas: arriba, bajo la cabecera, sin tapar el botón principal. */
export const NoticeStack: React.FC = () => {
  const { notices, dismissNotice, players, myPlayer, currentTurn } = useGame();
  const { t } = useI18n();
  if (!notices || notices.length === 0) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-3 top-[calc(3.5rem+env(safe-area-inset-top)+0.5rem)] z-30 max-w-md mx-auto flex flex-col gap-2 pointer-events-none"
    >
      {notices.map((notice) => {
        const text = noticeText(t, notice, players, myPlayer?.team, currentTurn);
        return (
          <button
            key={notice.id}
            type="button"
            onClick={() => dismissNotice(notice.id)}
            title={t.common.dismiss}
            className={`pointer-events-auto w-full min-h-[44px] px-4 py-2.5 rounded-2xl border shadow-2xl text-left animate-fadeIn ${TONE[text.tone]}`}
          >
            <span className={`block font-black ${text.big ? 'text-xs uppercase tracking-widest text-center' : 'text-sm'}`}>
              {text.title}
            </span>
            {text.detail && (
              <span className={`block ${text.big ? 'text-2xl font-black text-center py-1' : 'text-xs opacity-80'}`}>
                {text.detail}
              </span>
            )}
            {text.big && (
              <span className="block text-[10px] text-center opacity-70">{t.game.notices.xrayHint}</span>
            )}
          </button>
        );
      })}
    </div>
  );
};
