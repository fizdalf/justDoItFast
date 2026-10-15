import React, {useState} from 'react';
import {useGame} from '../../context/GameContext.js';
import {useI18n} from '../../i18n/index.js';
import {canUsePowerUp, POWER_UP_USAGE} from '../../../core/powerUpRules.js';
import {PowerUp, PowerUpType} from '../../../core/types.js';
import {HoldButton} from '../HoldButton.js';

export const TOOL_ICON: Record<PowerUpType, string> = {
  REVERSE: '↩️',
  SKIP: '🔀',
  DOUBLE_BURDEN: '🧨',
  FREEZE: '❄️',
  SHIELD: '🦺',
  XRAY: '🩻',
  REWIRE: '⏱️',
};

/**
 * Herramientas del propio equipo (las del rival son secretas). Se usan manteniendo pulsado;
 * las que ahora no se pueden usar se ven apagadas con una pista de cuándo sí.
 */
export const ToolsBar: React.FC = () => {
  const { inventory, myPlayer, usePowerUp, game, currentTurn } = useGame();
  const { t } = useI18n();
  const [usingId, setUsingId] = useState<string | null>(null);
  const tools = myPlayer ? inventory?.[myPlayer.team] ?? [] : [];
  if (!myPlayer || tools.length === 0) return null;

  const labels = t.game.tools;
  const status = game?.status;
  const ctx = {
    status: status ?? 'ROUND_OVER',
    myPlayerId: myPlayer.id,
    myTeam: myPlayer.team,
    holderId: currentTurn?.activePlayerId,
    holderTeam: currentTurn?.activeTeam,
  } as const;

  const use = async (tool: PowerUp) => {
    if (usingId) return;
    setUsingId(tool.id);
    try {
      await usePowerUp(tool.id);
    } finally {
      setUsingId(null);
    }
  };

  const hasUsable = tools.some((tool) => canUsePowerUp(tool.type, ctx));

  return (
    <div className="space-y-1">
      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 text-center">
        {t.common.yourTeamTools}
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-3 px-3 snap-x [scrollbar-width:none]">
        {tools.map((tool) => {
          const usage = POWER_UP_USAGE[tool.type];
          const name = t.common.powerUps[tool.type].name;
          const description = t.common.powerUps[tool.type].description;

          if (usage === 'PASSIVE') {
            return (
              <div
                key={tool.id}
                title={description}
                className="shrink-0 snap-start min-h-[44px] px-3 py-1 rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-200 flex items-center gap-2"
              >
                <span className="text-lg" aria-hidden>{TOOL_ICON[tool.type]}</span>
                <span className="flex flex-col text-left leading-tight">
                  <span className="text-xs font-bold">{name}</span>
                  <span className="text-[10px] text-emerald-300/80">{labels.usageHints.PASSIVE}</span>
                </span>
              </div>
            );
          }

          const usable = canUsePowerUp(tool.type, ctx);
          const hint = status !== 'PLAYING' ? labels.notPlaying : labels.usageHints[usage];
          return (
            <HoldButton
              key={tool.id}
              onHold={() => void use(tool)}
              disabled={!usable || !!usingId}
              fillClassName="bg-purple-300/40"
              className={`shrink-0 snap-start min-h-[44px] px-3 py-1 rounded-xl border text-left transition-colors ${
                usable
                  ? 'bg-purple-600/30 border-purple-500/50 text-purple-100 active:bg-purple-600/50'
                  : 'bg-slate-800/50 border-slate-700 text-slate-500 opacity-60'
              }`}
            >
              <span className="text-lg" aria-hidden>{TOOL_ICON[tool.type]}</span>
              <span className="flex flex-col leading-tight">
                <span className="text-xs font-bold whitespace-nowrap" title={description}>{name}</span>
                {!usable && <span className="text-[10px] whitespace-nowrap">{hint}</span>}
              </span>
            </HoldButton>
          );
        })}
      </div>
      {hasUsable && <p className="text-center text-[10px] text-slate-500">{labels.holdHint}</p>}
    </div>
  );
};
