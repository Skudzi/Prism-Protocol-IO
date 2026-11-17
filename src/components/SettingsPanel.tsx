import React, { useEffect, useState } from 'react';
import { DEFAULT_KEYBINDS } from '../game/catalog';
import {
  FpsCapMode,
  GameSettings,
  Keybinds,
  LanguageCode,
  ShadowQuality,
} from '../game/types';
import { LANGUAGES, t } from '../i18n/translations';

interface SettingsPanelProps {
  settings: GameSettings;
  keybinds: Keybinds;
  lang: LanguageCode;
  onUpdateSettings: (next: GameSettings) => void;
  onUpdateKeybinds: (next: Keybinds) => void;
}

const KEYBIND_LABELS: Array<{ key: keyof Keybinds; label: string }> = [
  { key: 'moveForward', label: 'Move Forward' },
  { key: 'moveBackward', label: 'Move Backward' },
  { key: 'moveLeft', label: 'Strafe Left' },
  { key: 'moveRight', label: 'Strafe Right' },
  { key: 'jump', label: 'Jump' },
  { key: 'dash', label: 'Boost / Dash' },
  { key: 'reload', label: 'Reload' },
  { key: 'chat', label: 'In-Game Chat' },
  { key: 'pause', label: 'Pause Menu' },
  { key: 'slot1', label: 'Loadout 1' },
  { key: 'slot2', label: 'Loadout 2' },
  { key: 'slot3', label: 'Loadout 3' },
  { key: 'slot4', label: 'Loadout 4' },
];

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  settings,
  keybinds,
  lang,
  onUpdateSettings,
  onUpdateKeybinds,
}) => {
  const [listeningKey, setListeningKey] = useState<keyof Keybinds | null>(null);

  useEffect(() => {
    if (!listeningKey) return;
    const handler = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onUpdateKeybinds({ ...keybinds, [listeningKey]: e.code });
      setListeningKey(null);
    };
    window.addEventListener('keydown', handler, { once: true });
    return () => window.removeEventListener('keydown', handler);
  }, [listeningKey, keybinds, onUpdateKeybinds]);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Graphics, Display, Language, Theme */}
      <div className="space-y-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/70 p-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          {t(lang, 'settings.graphics')}
        </h3>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="set-quality"
              className="block text-xs font-medium text-slate-600 dark:text-slate-400"
            >
              {t(lang, 'settings.quality')}
            </label>
            <select
              id="set-quality"
              value={settings.graphicsQuality}
              onChange={(e) => {
                const q = e.target.value as GameSettings['graphicsQuality'];
                onUpdateSettings({
                  ...settings,
                  graphicsQuality: q,
                  shadowQuality: q === 'low' ? 'low' : q,
                  shadowsEnabled: q !== 'low',
                  particlesEnabled: q !== 'low',
                });
              }}
              className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-2.5 py-2 text-sm text-slate-900 dark:text-white"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="ultra">Ultra</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="set-lang"
              className="block text-xs font-medium text-slate-600 dark:text-slate-400"
            >
              {t(lang, 'settings.language')}
            </label>
            <select
              id="set-lang"
              value={settings.language}
              onChange={(e) =>
                onUpdateSettings({
                  ...settings,
                  language: e.target.value as LanguageCode,
                })
              }
              className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-2.5 py-2 text-sm text-slate-900 dark:text-white"
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="set-shadow-quality"
              className="block text-xs font-medium text-slate-600 dark:text-slate-400"
            >
              {t(lang, 'settings.shadowQuality')}
            </label>
            <select
              id="set-shadow-quality"
              value={settings.shadowQuality}
              onChange={(e) => {
                const sq = e.target.value as ShadowQuality;
                onUpdateSettings({
                  ...settings,
                  shadowQuality: sq,
                  shadowsEnabled: sq !== 'off',
                });
              }}
              className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-2.5 py-2 text-sm text-slate-900 dark:text-white"
            >
              <option value="off">Off</option>
              <option value="low">Low (512)</option>
              <option value="medium">Medium (1024)</option>
              <option value="high">High (2048)</option>
              <option value="ultra">Ultra (4096)</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="set-fps-cap"
              className="block text-xs font-medium text-slate-600 dark:text-slate-400"
            >
              {t(lang, 'settings.fpsCap')}
            </label>
            <select
              id="set-fps-cap"
              value={settings.fpsCap}
              onChange={(e) =>
                onUpdateSettings({
                  ...settings,
                  fpsCap: e.target.value as FpsCapMode,
                })
              }
              className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-2.5 py-2 text-sm text-slate-900 dark:text-white"
            >
              <option value="unlimited">Unlimited</option>
              <option value="screen_locked">Screen Locked</option>
              <option value="60">60 FPS</option>
              <option value="120">120 FPS</option>
              <option value="165">165 FPS</option>
              <option value="240">240 FPS</option>
            </select>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
            <label htmlFor="set-render-dist">{t(lang, 'settings.renderDistance')}</label>
            <span className="font-mono">{settings.renderDistance}m</span>
          </div>
          <input
            id="set-render-dist"
            type="range"
            min={60}
            max={260}
            step={10}
            value={settings.renderDistance}
            onChange={(e) =>
              onUpdateSettings({ ...settings, renderDistance: Number(e.target.value) })
            }
            className="mt-1 w-full accent-cyan-500"
          />
        </div>

        <div>
          <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
            <label htmlFor="set-fov">{t(lang, 'settings.fov')}</label>
            <span className="font-mono">{settings.fov}°</span>
          </div>
          <input
            id="set-fov"
            type="range"
            min={70}
            max={110}
            value={settings.fov}
            onChange={(e) =>
              onUpdateSettings({ ...settings, fov: Number(e.target.value) })
            }
            className="mt-1 w-full accent-cyan-500"
          />
        </div>

        <div>
          <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
            <label htmlFor="set-sens">{t(lang, 'settings.sensitivity')}</label>
            <span className="font-mono">{settings.mouseSensitivity.toFixed(1)}x</span>
          </div>
          <input
            id="set-sens"
            type="range"
            min={0.3}
            max={2.5}
            step={0.1}
            value={settings.mouseSensitivity}
            onChange={(e) =>
              onUpdateSettings({ ...settings, mouseSensitivity: Number(e.target.value) })
            }
            className="mt-1 w-full accent-cyan-500"
          />
        </div>

        <div className="space-y-2.5 pt-1 text-sm">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-slate-700 dark:text-slate-300">
              {t(lang, 'settings.vsync')}
            </span>
            <input
              id="set-vsync"
              type="checkbox"
              checked={settings.vsync}
              onChange={(e) =>
                onUpdateSettings({ ...settings, vsync: e.target.checked })
              }
              className="h-4 w-4 accent-cyan-500"
            />
          </label>
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-slate-700 dark:text-slate-300">
              {t(lang, 'settings.showFps')}
            </span>
            <input
              id="set-show-fps"
              type="checkbox"
              checked={settings.showFps}
              onChange={(e) =>
                onUpdateSettings({ ...settings, showFps: e.target.checked })
              }
              className="h-4 w-4 accent-cyan-500"
            />
          </label>
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-slate-700 dark:text-slate-300">
              {t(lang, 'settings.darkMode')}
            </span>
            <input
              type="checkbox"
              checked={settings.darkMode}
              onChange={(e) =>
                onUpdateSettings({ ...settings, darkMode: e.target.checked })
              }
              className="h-4 w-4 accent-cyan-500"
            />
          </label>
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-slate-700 dark:text-slate-300">
              {t(lang, 'settings.particles')}
            </span>
            <input
              type="checkbox"
              checked={settings.particlesEnabled}
              onChange={(e) =>
                onUpdateSettings({ ...settings, particlesEnabled: e.target.checked })
              }
              className="h-4 w-4 accent-cyan-500"
            />
          </label>
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-slate-700 dark:text-slate-300">
              {t(lang, 'settings.crossPlatform')}
            </span>
            <input
              type="checkbox"
              checked={settings.crossPlatformEnabled}
              onChange={(e) =>
                onUpdateSettings({ ...settings, crossPlatformEnabled: e.target.checked })
              }
              className="h-4 w-4 accent-cyan-500"
            />
          </label>
        </div>
      </div>

      {/* Keybinds */}
      <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/70 p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            {t(lang, 'settings.keybinds')}
          </h3>
          <button
            type="button"
            onClick={() => onUpdateKeybinds({ ...DEFAULT_KEYBINDS })}
            className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 hover:underline cursor-pointer"
          >
            Reset
          </button>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          {KEYBIND_LABELS.map((item) => {
            const isListening = listeningKey === item.key;
            return (
              <div
                key={item.key}
                className="flex items-center justify-between rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/70 px-3 py-1.5"
              >
                <span className="text-xs text-slate-700 dark:text-slate-300">
                  {item.label}
                </span>
                <button
                  type="button"
                  onClick={() => setListeningKey(item.key)}
                  className={`rounded px-2 py-0.5 font-mono text-xs font-semibold cursor-pointer ${
                    isListening
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-cyan-300'
                  }`}
                >
                  {isListening ? t(lang, 'settings.pressKey') : keybinds[item.key]}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
