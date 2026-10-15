import React, {useState} from 'react';
import {useGame} from '../../context/GameContext.js';
import {useI18n} from '../../i18n/index.js';
import {canUsePowerUp} from '../../../core/powerUpRules.js';
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
 * Herramientas del propio equipo que se pueden usar AHORA (las demás no se muestran, para
 * no llenar la pantalla). Se usan manteniendo pulsado. El Traje es pasivo: no aparece.
 */
export const ToolsBar: React.FC = () => {
  const { inventory, myPlayer, usePowerUp, game, currentTurn } = useGame();
  const { t } = useI18n();
  const [usingId, setUsingId] = useState<string | null>(null);
  if (!myPlayer) return null;

  const ctx = {
    status: game?.status ?? 'ROUND_OVER',
    myPlayerId: myPlayer.id,
    myTeam: myPlayer.team,
    holderId: currentTurn?.activePlayerId,
    holderTeam: currentTurn?.activeTeam,
  } as const;
  const usable = (inventory?.[myPlayer.team] ?? []).filter((tool) => canUsePowerUp(tool.type, ctx));
  if (usable.length === 0) return null;

  const use = async (tool: PowerUp) => {
    if (usingId) return;
    setUsingId(tool.id);
    try {
      await usePowerUp(tool.id);
    } finally {
      setUsingId(null);
    }
  };

  return (
    <div className="flex gap-2 overflow-x-auto -mx-3 px-3 [scrollbar-width:none] justify-center">
      {usable.map((tool) => (
        <HoldButton
          key={tool.id}
          onHold={() => void use(tool)}
          disabled={!!usingId}
          fillClassName="bg-purple-300/40"
          className="shrink-0 min-h-[48px] px-3 py-1 rounded-xl border bg-purple-600/30 border-purple-500/50 text-purple-100"
        >
          <span className="text-lg" aria-hidden>{TOOL_ICON[tool.type]}</span>
          <span className="flex flex-col leading-tight text-left">
            <span className="text-xs font-bold whitespace-nowrap">{t.common.powerUps[tool.type].name}</span>
            <span className="text-[10px] text-purple-200/70 whitespace-nowrap">{t.game.tools.holdToUse}</span>
          </span>
        </HoldButton>
      ))}
    </div>
  );
};
