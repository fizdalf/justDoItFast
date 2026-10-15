import React, {useState} from 'react';
import {useGame} from '../../context/GameContext.js';
import {useI18n} from '../../i18n/index.js';
import {ALL_POWER_UPS} from '../../../core/settings.js';
import {GameSettings, PowerUpType} from '../../../core/types.js';

// Rangos jugables que ofrece la interfaz (el servidor valida límites más amplios).
const UI_RANGES = {
  targetScore: { min: 3, max: 15, step: 1 },
  minRoundDurationSec: { min: 15, max: 120, step: 5 },
  maxRoundDurationSec: { min: 15, max: 180, step: 5 },
  fastGuessThresholdSec: { min: 2, max: 10, step: 1 },
  maxPowerUpsPerTeam: { min: 1, max: 5, step: 1 },
  freezeDurationSec: { min: 1, max: 10, step: 1 },
  shieldFuseSec: { min: 3, max: 20, step: 1 },
  rewireMinSec: { min: 5, max: 90, step: 5 },
  rewireMaxSec: { min: 5, max: 120, step: 5 },
  disconnectGraceSec: { min: 0, max: 30, step: 5 },
} as const;

type RangedSetting = keyof typeof UI_RANGES;

/** `collapsible`: en la sala se muestra plegado con un resumen, para no alargar la pantalla en el móvil. */
export const RoomSettingsPanel: React.FC<{ collapsible?: boolean }> = ({ collapsible = false }) => {
  const [open, setOpen] = useState(!collapsible);
  const { room, isHost, updateSetup } = useGame();
  const { t } = useI18n();
  const settings = room?.setup.settings;
  if (!settings) return null;

  const labels = t.lobby.settings;

  const change = (changes: Partial<GameSettings>) => {
    if (isHost) void updateSetup({ settings: changes });
  };

  const step = (key: RangedSetting, direction: 1 | -1) => {
    const range = UI_RANGES[key];
    const next = Math.min(range.max, Math.max(range.min, settings[key] + direction * range.step));
    const changes: Partial<GameSettings> = { [key]: next };
    // Mantener mínimo ≤ máximo moviendo el otro extremo si hace falta.
    if (key === 'minRoundDurationSec' && next > settings.maxRoundDurationSec) changes.maxRoundDurationSec = next;
    if (key === 'maxRoundDurationSec' && next < settings.minRoundDurationSec) changes.minRoundDurationSec = next;
    if (key === 'rewireMinSec' && next > settings.rewireMaxSec) changes.rewireMaxSec = next;
    if (key === 'rewireMaxSec' && next < settings.rewireMinSec) changes.rewireMinSec = next;
    change(changes);
  };

  const toggleTool = (type: PowerUpType) => {
    const enabled = settings.enabledPowerUps.includes(type)
      ? settings.enabledPowerUps.filter((t) => t !== type)
      : [...settings.enabledPowerUps, type];
    change({ enabledPowerUps: enabled });
  };

  const stepper = (key: RangedSetting, label: string, format: (n: number) => string = String) => (
    <SettingStepper
      key={key}
      label={label}
      value={format(settings[key])}
      editable={isHost}
      canDecrease={settings[key] > UI_RANGES[key].min}
      canIncrease={settings[key] < UI_RANGES[key].max}
      onDecrease={() => step(key, -1)}
      onIncrease={() => step(key, 1)}
      decreaseLabel={labels.decrease(label)}
      increaseLabel={labels.increase(label)}
    />
  );

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3 sm:p-5 space-y-4">
      {collapsible ? (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="w-full min-h-[44px] flex items-center gap-2 text-left"
        >
          <span className="flex-1 min-w-0">
            <span className="block text-xs font-bold uppercase tracking-wider text-slate-400">{labels.title}</span>
            <span className="block text-sm font-semibold text-amber-300 truncate">
              {labels.summary(
                settings.targetScore,
                settings.minRoundDurationSec,
                settings.maxRoundDurationSec,
                settings.allowPowerUps
              )}
            </span>
          </span>
          <span className={`shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
        </button>
      ) : (
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">{labels.title}</h3>
          {!isHost && <span className="text-[11px] text-slate-500 italic">{labels.hostOnly}</span>}
        </div>
      )}

      {open && (
      <div className="space-y-4">
      {collapsible && !isHost && <p className="text-[11px] text-slate-500 italic">{labels.hostOnly}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {stepper('targetScore', labels.targetScore)}
        {stepper('fastGuessThresholdSec', labels.fastGuess, labels.seconds)}
        {stepper('minRoundDurationSec', labels.minRoundDuration, labels.seconds)}
        {stepper('maxRoundDurationSec', labels.maxRoundDuration, labels.seconds)}
        {stepper('disconnectGraceSec', labels.disconnectGrace, labels.seconds)}
      </div>

      <div className="pt-2 border-t border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">{labels.toolsTitle}</h4>
          <button
            type="button"
            role="switch"
            aria-checked={settings.allowPowerUps}
            aria-label={labels.toolsEnabled}
            disabled={!isHost}
            onClick={() => change({ allowPowerUps: !settings.allowPowerUps })}
            className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors disabled:cursor-default ${
              settings.allowPowerUps
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            {settings.allowPowerUps ? labels.on : labels.off}
          </button>
        </div>

        {settings.allowPowerUps && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {stepper('maxPowerUpsPerTeam', labels.maxTools)}
              {/* Ajustes propios de cada herramienta, solo si puede salir */}
              {settings.enabledPowerUps.includes('FREEZE') &&
                stepper('freezeDurationSec', labels.freezeDuration(t.common.powerUps.FREEZE.name), labels.seconds)}
              {settings.enabledPowerUps.includes('SHIELD') &&
                stepper('shieldFuseSec', labels.shieldFuse(t.common.powerUps.SHIELD.name), labels.seconds)}
              {settings.enabledPowerUps.includes('REWIRE') && (
                <>
                  {stepper('rewireMinSec', labels.rewireMin(t.common.powerUps.REWIRE.name), labels.seconds)}
                  {stepper('rewireMaxSec', labels.rewireMax(t.common.powerUps.REWIRE.name), labels.seconds)}
                </>
              )}
            </div>

            <div>
              <div className="text-[11px] font-semibold text-slate-400 mb-1.5">{labels.availableTools}</div>
              <div className="flex flex-wrap gap-2">
                {ALL_POWER_UPS.map((type) => {
                  const enabled = settings.enabledPowerUps.includes(type);
                  return (
                    <button
                      key={type}
                      type="button"
                      aria-pressed={enabled}
                      disabled={!isHost}
                      onClick={() => toggleTool(type)}
                      title={t.common.powerUps[type].description}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors disabled:cursor-default ${
                        enabled
                          ? 'bg-purple-600/30 border-purple-500/50 text-purple-200'
                          : 'bg-slate-800/60 border-slate-700 text-slate-500 line-through'
                      }`}
                    >
                      {t.common.powerUps[type].name}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
      </div>
      )}
    </div>
  );
};

interface SettingStepperProps {
  label: string;
  value: string;
  editable: boolean;
  canDecrease: boolean;
  canIncrease: boolean;
  onDecrease: () => void;
  onIncrease: () => void;
  decreaseLabel: string;
  increaseLabel: string;
}

const SettingStepper: React.FC<SettingStepperProps> = ({
  label,
  value,
  editable,
  canDecrease,
  canIncrease,
  onDecrease,
  onIncrease,
  decreaseLabel,
  increaseLabel,
}) => (
  <div className="flex items-center justify-between bg-slate-800/60 border border-slate-700/60 rounded-xl px-3 py-2">
    <span className="text-xs font-semibold text-slate-300 pr-2">{label}</span>
    <div className="flex items-center space-x-2 shrink-0">
      {editable && (
        <button
          type="button"
          onClick={onDecrease}
          disabled={!canDecrease}
          aria-label={decreaseLabel}
          className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-30 text-white font-black"
        >
          −
        </button>
      )}
      <span className="min-w-[3rem] text-center font-mono font-bold text-amber-300">{value}</span>
      {editable && (
        <button
          type="button"
          onClick={onIncrease}
          disabled={!canIncrease}
          aria-label={increaseLabel}
          className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-30 text-white font-black"
        >
          +
        </button>
      )}
    </div>
  </div>
);
