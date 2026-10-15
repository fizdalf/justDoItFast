import React, {useState} from 'react';
import {useGame} from '../../context/GameContext.js';
import {useI18n} from '../../i18n/index.js';
import {PowerUp} from '../../../core/types.js';

/** Herramientas del propio equipo (las del rival son secretas). */
export const ToolsBar: React.FC = () => {
  const { inventory, myPlayer, usePowerUp } = useGame();
  const { t } = useI18n();
  const [usingId, setUsingId] = useState<string | null>(null);
  const tools = myPlayer ? inventory[myPlayer.team] ?? [] : [];
  if (tools.length === 0) return null;

  const use = async (tool: PowerUp) => {
    if (usingId) return;
    setUsingId(tool.id);
    await usePowerUp(tool.id);
    setUsingId(null);
  };

  return (
    <div className="space-y-1.5">
      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 text-center">
        {t.common.yourTeamTools}
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 justify-center">
        {tools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => use(tool)}
            title={t.common.powerUps[tool.type].description}
            disabled={!!usingId}
            className="shrink-0 min-h-[44px] px-3 bg-purple-600/30 active:bg-purple-600/60 border border-purple-500/40 rounded-xl text-xs font-bold text-purple-200 transition-colors flex items-center gap-1"
          >
            <span>⚡</span>
            <span>{t.common.powerUps[tool.type].name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
