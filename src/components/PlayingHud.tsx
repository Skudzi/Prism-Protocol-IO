import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  FastForward,
  Gamepad2,
  MessageSquare,
  Pause,
  RotateCcw,
  Settings as SettingsIcon,
  ShieldCheck,
  Skull,
  Sparkles,
  Users,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { HudSnapshot } from '../engine/ArenaEngine';
import { MAPS, WEAPONS, WEAPON_LIST } from '../game/catalog';
import {
  ChatMessage,
  GameScreenState,
  GameSettings,
  Keybinds,
  LanguageCode,
  MapId,
  MatchSummary,
  WeaponId,
} from '../game/types';
import { t } from '../i18n/translations';
import { Minimap } from './Minimap';
import { SettingsPanel } from './SettingsPanel';

interface PlayingHudProps {
  hud: HudSnapshot;
  screenState: GameScreenState;
  mapId: MapId;
  isTutorial: boolean;
  audioEnabled: boolean;
  showFps: boolean;
  lang: LanguageCode;
  settings: GameSettings;
  keybinds: Keybinds;
  easterEggBannerVisible: boolean;
  matchSummary: MatchSummary | null;
  chatMessages: ChatMessage[];
  chatOpen: boolean;
  onToggleChat: () => void;
  onSendChat: (text: string) => void;
  onToggleMute: () => void;
  onPause: () => void;
  onResume: () => void;
  onRespawn: () => void;
  onRestart: () => void;
  onReturnHub: () => void;
  onSkipTutorial: () => void;
  onSelectWeapon: (id: WeaponId) => void;
  onUpdateSettings: (next: GameSettings) => void;
  onUpdateKeybinds: (next: Keybinds) => void;
}

export const PlayingHud: React.FC<PlayingHudProps> = ({
  hud,
  screenState,
  mapId,
  isTutorial,
  audioEnabled,
  showFps,
  lang,
  settings,
  keybinds,
  easterEggBannerVisible,
  matchSummary,
  chatMessages,
  chatOpen,
  onToggleChat,
  onSendChat,
  onToggleMute,
  onPause,
  onResume,
  onRespawn,
  onRestart,
  onReturnHub,
  onSkipTutorial,
  onSelectWeapon,
  onUpdateSettings,
  onUpdateKeybinds,
}) => {
  const [chatInput, setChatInput] = useState('');
  const [showPauseSettings, setShowPauseSettings] = useState(false);
  const activeWeapon = WEAPONS[hud.weaponId];
  const mapDef = MAPS[mapId];

  useEffect(() => {
    if (screenState !== 'paused') {
      setShowPauseSettings(false);
    }
  }, [screenState]);

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    onSendChat(chatInput.trim());
    setChatInput('');
  };

  if (screenState === 'paused') {
    return (
      <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/75 p-4">
        {showPauseSettings ? (
          <div className="flex max-h-[88vh] w-full max-w-4xl flex-col rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-[#0D131F] shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-5 py-3.5">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowPauseSettings(false)}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  {t(lang, 'match.paused')}
                </button>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {t(lang, 'cta.settings')}
                </h2>
              </div>
              <button
                type="button"
                onClick={onResume}
                className="rounded-lg bg-cyan-500 px-4 py-1.5 text-xs font-semibold text-slate-950 hover:bg-cyan-400 cursor-pointer"
              >
                {t(lang, 'cta.resume')}
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              <SettingsPanel
                settings={settings}
                keybinds={keybinds}
                lang={lang}
                onUpdateSettings={onUpdateSettings}
                onUpdateKeybinds={onUpdateKeybinds}
              />
            </div>
          </div>
        ) : (
          <div className="w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-[#0D131F] p-6 shadow-2xl">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {t(lang, 'match.paused')}
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              {t(lang, mapDef.nameKey as Parameters<typeof t>[1])} · {hud.tags} {t(lang, 'hud.tags')}
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <button
                type="button"
                onClick={onResume}
                className="w-full rounded-lg bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-cyan-400 transition-colors cursor-pointer"
              >
                {t(lang, 'cta.resume')}
              </button>
              <button
                type="button"
                data-testid="pause-settings-btn"
                onClick={() => setShowPauseSettings(true)}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/80 px-4 py-2.5 text-sm font-semibold text-slate-900 dark:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                <SettingsIcon className="h-4 w-4 text-cyan-500" />
                {t(lang, 'cta.settings')}
              </button>
              <button
                type="button"
                onClick={onRestart}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/80 px-4 py-2.5 text-sm font-semibold text-slate-900 dark:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                {t(lang, 'cta.restart')}
              </button>
              <button
                type="button"
                onClick={onReturnHub}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                {t(lang, 'cta.returnHub')}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (screenState === 'gameover' && matchSummary) {
    return (
      <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/75 p-4">
        <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-[#0D131F] p-6 shadow-2xl">
          <p className="text-xs font-semibold tracking-wider text-cyan-600 dark:text-cyan-400">
            {t(lang, MAPS[matchSummary.mapId].nameKey as Parameters<typeof t>[1])}
          </p>
          <h2 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
            {matchSummary.won ? t(lang, 'match.victory') : t(lang, 'match.defeat')}
          </h2>

          <div className="mt-5 grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 p-3">
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {matchSummary.gameMode === 'tdm'
                  ? `${t(lang, 'hud.cyanTeam')} : ${t(lang, 'hud.amberTeam')}`
                  : t(lang, 'hud.tags')}
              </div>
              <div className="mt-1 text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
                {matchSummary.gameMode === 'tdm'
                  ? `${matchSummary.teamScoreCyan ?? 0} : ${matchSummary.teamScoreAmber ?? 0}`
                  : `${matchSummary.tags} / ${matchSummary.deaths}`}
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 p-3">
              <div className="text-xs text-slate-500 dark:text-slate-400">{t(lang, 'match.accuracy')}</div>
              <div className="mt-1 text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
                {matchSummary.accuracy}%
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 p-3">
              <div className="text-xs text-slate-500 dark:text-slate-400">{t(lang, 'match.creditsEarned')}</div>
              <div className="mt-1 text-2xl font-bold tabular-nums text-amber-500">
                +{matchSummary.creditsEarned} CR
              </div>
            </div>
          </div>

          {matchSummary.leaderboard && matchSummary.leaderboard.length > 0 && (
              <div
                data-testid="tdm-leaderboard"
                className="mt-4 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/70"
              >
                <div className="border-b border-slate-200 dark:border-slate-800 px-3.5 py-2 text-xs font-bold tracking-wide text-slate-700 dark:text-slate-200">
                  {t(lang, 'match.leaderboard')}
                </div>
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-200 dark:border-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400">
                    <tr>
                      <th className="px-3.5 py-2 font-semibold">#</th>
                      <th className="px-3.5 py-2 font-semibold">{t(lang, 'match.player')}</th>
                      <th className="px-3.5 py-2 text-right font-semibold">{t(lang, 'match.kills')}</th>
                      <th className="px-3.5 py-2 text-right font-semibold">{t(lang, 'match.deaths')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800/70">
                    {matchSummary.leaderboard.map((entry, idx) => {
                      const isTdm = matchSummary.gameMode === 'tdm';
                      const isAlly = isTdm ? entry.team === 'cyan' : entry.isLocalPlayer;
                      return (
                        <tr
                          key={entry.id}
                          className={
                            entry.isLocalPlayer
                              ? 'bg-blue-500/10 font-semibold'
                              : isTdm
                              ? isAlly
                                ? 'bg-blue-500/[0.03]'
                                : 'bg-rose-500/[0.04]'
                              : ''
                          }
                        >
                          <td className="px-3.5 py-2 font-mono text-slate-500 dark:text-slate-400">
                            {idx + 1}
                          </td>
                          <td className="px-3.5 py-2">
                            <div className="flex items-center gap-2">
                              <span
                                className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                                  isTdm
                                    ? isAlly
                                      ? 'bg-blue-500'
                                      : 'bg-rose-500'
                                    : entry.isLocalPlayer
                                    ? 'bg-cyan-500'
                                    : 'bg-amber-500'
                                }`}
                              />
                              <span className="text-slate-900 dark:text-slate-100">
                                {entry.nickname}
                              </span>
                              {entry.isLocalPlayer && (
                                <span className="rounded bg-blue-500/20 px-1.5 py-0.5 text-[10px] font-bold text-blue-600 dark:text-blue-300">
                                  {t(lang, 'match.you')}
                                </span>
                              )}
                              {entry.isBot && (
                                <span className="rounded bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:text-slate-400">
                                  {t(lang, 'match.bot')}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-3.5 py-2 text-right font-mono font-bold tabular-nums text-slate-900 dark:text-white">
                            {entry.kills}
                          </td>
                          <td className="px-3.5 py-2 text-right font-mono tabular-nums text-slate-600 dark:text-slate-400">
                            {entry.deaths}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

          <div className="mt-3 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
            <span>
              {t(lang, 'match.xpEarned')}: +{matchSummary.xpEarned} XP
              {matchSummary.gameMode === 'tdm' ? ` · ${t(lang, 'hud.tags')}: ${matchSummary.tags}` : ''}
            </span>
            <span>{t(lang, 'account.synced')}</span>
          </div>

          {matchSummary.easterEggFound && (
            <div className="mt-4 rounded-lg border border-cyan-500/40 bg-cyan-500/10 p-3 text-xs text-cyan-700 dark:text-cyan-300">
              {t(lang, 'hud.easterEggTitle')} — {t(lang, 'hud.easterEggDesc')}
            </div>
          )}

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              data-start="true"
              onClick={onRestart}
              className="flex-1 rounded-lg bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-cyan-400 transition-colors cursor-pointer"
            >
              {t(lang, 'cta.restart')}
            </button>
            <button
              type="button"
              onClick={onReturnHub}
              className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-900 dark:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              {t(lang, 'cta.returnHub')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (screenState !== 'playing') return null;

  const mins = Math.floor(hud.timeRemaining / 60);
  const secs = String(hud.timeRemaining % 60).padStart(2, '0');

  return (
    <div className="pointer-events-none fixed inset-0 z-20 overflow-hidden">
      {/* Low-HP / Damage peripheral flash */}
      {hud.damageFlashMs > 0 && (
        <div
          className="fixed inset-0 border-[10px] border-rose-500/45 transition-opacity"
          style={{ opacity: Math.min(1, hud.damageFlashMs / 220) }}
        />
      )}

      {/* Heal Orb Full-Shield Pickup Flash */}
      {hud.healFlashMs > 0 && (
        <>
          <div
            className="fixed inset-0 border-[8px] border-emerald-400/50 transition-opacity"
            style={{ opacity: Math.min(1, hud.healFlashMs / 650) }}
          />
          <div className="fixed left-1/2 top-24 -translate-x-1/2 rounded-md border border-emerald-400/60 bg-[#070B12]/85 px-4 py-1.5 text-xs font-bold tracking-wider text-emerald-300 shadow-lg">
            + {t(lang, 'hud.healRestored')}
          </div>
        </>
      )}

      {/* Precision Scope Overlay: Rebuilt Optical Sniper Scope for Helios Railgun & Holo ADS for other weapons */}
      {!hud.isDead && hud.isScoped && hud.weaponId === 'helios_rail' && (
        <div
          data-testid="railgun-scope-overlay"
          className="fixed inset-0 z-0 flex items-center justify-center"
          style={{
            background:
              'radial-gradient(circle at center, rgba(6, 18, 30, 0.08) 0%, rgba(4, 10, 20, 0.14) 29%, rgba(2, 6, 12, 0.96) 31.5%, rgba(2, 5, 10, 0.99) 100%)',
          }}
        >
          <svg
            viewBox="0 0 600 600"
            className="h-[72vh] w-[72vh] max-h-[620px] max-w-[620px]"
            aria-hidden="true"
          >
            {/* Outer machined optic ring */}
            <circle cx="300" cy="300" r="245" fill="none" stroke="#0f172a" strokeWidth="14" />
            <circle cx="300" cy="300" r="236" fill="none" stroke="#22d3ee" strokeOpacity="0.55" strokeWidth="1.5" />
            <circle cx="300" cy="300" r="165" fill="none" stroke="#38bdf8" strokeOpacity="0.22" strokeWidth="1" strokeDasharray="6 8" />

            {/* Heavy outer stadia posts */}
            <line x1="64" y1="300" x2="180" y2="300" stroke="#0f172a" strokeWidth="4" />
            <line x1="420" y1="300" x2="536" y2="300" stroke="#0f172a" strokeWidth="4" />
            <line x1="300" y1="64" x2="300" y2="180" stroke="#0f172a" strokeWidth="4" />
            <line x1="300" y1="420" x2="300" y2="536" stroke="#0f172a" strokeWidth="4" />

            {/* Fine illuminated crosshairs with central gap */}
            <line x1="80" y1="300" x2="284" y2="300" stroke="#22d3ee" strokeOpacity="0.85" strokeWidth="1.4" />
            <line x1="316" y1="300" x2="520" y2="300" stroke="#22d3ee" strokeOpacity="0.85" strokeWidth="1.4" />
            <line x1="300" y1="80" x2="300" y2="284" stroke="#22d3ee" strokeOpacity="0.85" strokeWidth="1.4" />
            <line x1="300" y1="316" x2="300" y2="520" stroke="#22d3ee" strokeOpacity="0.85" strokeWidth="1.4" />

            {/* Mil-dot elevation & windage ticks */}
            {[-120, -90, -60, -30, 30, 60, 90, 120].map((off) => (
              <g key={`x-${off}`}>
                <line
                  x1={300 + off}
                  y1="295"
                  x2={300 + off}
                  y2="305"
                  stroke="#38bdf8"
                  strokeOpacity="0.75"
                  strokeWidth="1.2"
                />
                <line
                  x1="294"
                  y1={300 + off}
                  x2="306"
                  y2={300 + off}
                  stroke="#38bdf8"
                  strokeOpacity="0.75"
                  strokeWidth="1.2"
                />
              </g>
            ))}

            {/* Rangefinder bracket & glowing center laser dot */}
            <path d="M 278 278 L 288 278 M 278 278 L 278 288" stroke="#fbbf24" strokeWidth="1.5" fill="none" />
            <path d="M 322 278 L 312 278 M 322 278 L 322 288" stroke="#fbbf24" strokeWidth="1.5" fill="none" />
            <path d="M 278 322 L 288 322 M 278 322 L 278 312" stroke="#fbbf24" strokeWidth="1.5" fill="none" />
            <path d="M 322 322 L 312 322 M 322 322 L 322 312" stroke="#fbbf24" strokeWidth="1.5" fill="none" />
            <circle cx="300" cy="300" r="3.2" fill={hud.hitMarkerMs > 0 ? '#fbbf24' : '#f43f5e'} />
          </svg>
          <div className="fixed bottom-20 left-1/2 -translate-x-1/2 rounded border border-cyan-400/40 bg-[#070B12]/90 px-3 py-1 font-mono text-[11px] font-bold tracking-widest text-cyan-300">
            2.0x OPTIC · HELIOS RAIL
          </div>
        </div>
      )}

      {!hud.isDead && hud.isScoped && hud.weaponId !== 'helios_rail' && (
        <div
          data-testid="holo-scope-overlay"
          className="fixed inset-0 z-0 flex items-center justify-center"
          style={{
            background:
              'radial-gradient(circle at center, transparent 36%, rgba(2, 6, 12, 0.55) 75%, rgba(2, 6, 12, 0.8) 100%)',
          }}
        >
          <svg viewBox="0 0 180 180" className="h-44 w-44" aria-hidden="true">
            <circle cx="90" cy="90" r="68" fill="none" stroke="#22d3ee" strokeOpacity="0.4" strokeWidth="1.4" />
            <line x1="28" y1="90" x2="62" y2="90" stroke="#22d3ee" strokeOpacity="0.7" strokeWidth="1.5" />
            <line x1="118" y1="90" x2="152" y2="90" stroke="#22d3ee" strokeOpacity="0.7" strokeWidth="1.5" />
            <line x1="90" y1="28" x2="90" y2="62" stroke="#22d3ee" strokeOpacity="0.7" strokeWidth="1.5" />
            <line x1="90" y1="118" x2="90" y2="152" stroke="#22d3ee" strokeOpacity="0.7" strokeWidth="1.5" />
          </svg>
        </div>
      )}

      {/* Exact (0,0) Center Crosshair (hidden while dead) */}
      {!hud.isDead && (
        <div className="fixed left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2">
        <svg width="42" height="42" viewBox="0 0 42 42" aria-hidden="true">
          <circle
            cx="21"
            cy="21"
            r={hud.hitMarkerMs > 0 && hud.lastHitZone === 'head' ? 3 : 2}
            fill={
              hud.hitMarkerMs > 0
                ? hud.lastHitZone === 'head'
                  ? '#fbbf24'
                  : '#f43f5e'
                : '#22d3ee'
            }
          />
          <line x1="21" y1="5" x2="21" y2="13" stroke="#e2e8f0" strokeWidth="1.8" />
          <line x1="21" y1="29" x2="21" y2="37" stroke="#e2e8f0" strokeWidth="1.8" />
          <line x1="5" y1="21" x2="13" y2="21" stroke="#e2e8f0" strokeWidth="1.8" />
          <line x1="29" y1="21" x2="37" y2="21" stroke="#e2e8f0" strokeWidth="1.8" />
          {hud.hitMarkerMs > 0 && (
            <>
              <line
                x1="11"
                y1="11"
                x2="16"
                y2="16"
                stroke={hud.lastHitZone === 'head' ? '#fbbf24' : '#f43f5e'}
                strokeWidth={hud.lastHitZone === 'head' ? 2.8 : 2.2}
              />
              <line
                x1="31"
                y1="11"
                x2="26"
                y2="16"
                stroke={hud.lastHitZone === 'head' ? '#fbbf24' : '#f43f5e'}
                strokeWidth={hud.lastHitZone === 'head' ? 2.8 : 2.2}
              />
              <line
                x1="11"
                y1="31"
                x2="16"
                y2="26"
                stroke={hud.lastHitZone === 'head' ? '#fbbf24' : '#f43f5e'}
                strokeWidth={hud.lastHitZone === 'head' ? 2.8 : 2.2}
              />
              <line
                x1="31"
                y1="31"
                x2="26"
                y2="26"
                stroke={hud.lastHitZone === 'head' ? '#fbbf24' : '#f43f5e'}
                strokeWidth={hud.lastHitZone === 'head' ? 2.8 : 2.2}
              />
            </>
          )}
        </svg>
        {hud.hitMarkerMs > 0 && hud.lastHitZone === 'head' && (
          <div className="mt-0.5 text-center text-[10px] font-extrabold tracking-widest text-amber-400">
            HEADSHOT 1.75x
          </div>
        )}
        {hud.isReloading && (
          <div className="mt-2 flex flex-col items-center gap-1">
            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-900/90 border border-white/20">
              <div
                className="h-full bg-amber-400 transition-all duration-75"
                style={{ width: `${Math.round(hud.reloadProgress * 100)}%` }}
              />
            </div>
            <span className="text-[10px] font-bold tracking-widest text-amber-300">
              {t(lang, 'hud.reloading')}
            </span>
          </div>
        )}
        </div>
      )}

      {/* Top-Left Tactical Minimap */}
      <Minimap data={hud.minimap} lang={lang} />

      {/* Upper-Right Small White FPS Counter */}
      {showFps && (
        <div
          data-testid="fps-counter"
          className="fixed right-4 top-2.5 font-mono text-[11px] font-semibold tabular-nums text-white drop-shadow"
        >
          {hud.fps} FPS
        </div>
      )}

      {/* Top-Center Match Scoreboard Strip */}
      {hud.gameMode === 'tdm' ? (
        <div className="fixed left-1/2 top-4 -translate-x-1/2 flex items-center gap-5 rounded-lg border border-white/15 bg-[#070B12]/85 px-5 py-2 text-white">
          <div className="text-center">
            <div className="text-[10px] font-bold tracking-widest text-blue-400">
              {t(lang, 'hud.cyanTeam')}
            </div>
            <div
              data-testid="tdm-score-cyan"
              className="hud-numeral text-xl font-bold leading-none text-blue-300"
            >
              {hud.teamScoreCyan}
            </div>
          </div>
          <div className="h-7 w-px bg-white/15" />
          <div className="text-center">
            <div className="text-[10px] tracking-widest text-slate-400">
              {t(lang, mapDef.nameKey as Parameters<typeof t>[1])}
            </div>
            <div className="hud-numeral text-xl font-bold leading-none text-white">
              {mins}:{secs}
            </div>
          </div>
          <div className="h-7 w-px bg-white/15" />
          <div className="text-center">
            <div className="text-[10px] font-bold tracking-widest text-rose-400">
              {t(lang, 'hud.amberTeam')}
            </div>
            <div
              data-testid="tdm-score-amber"
              className="hud-numeral text-xl font-bold leading-none text-rose-300"
            >
              {hud.teamScoreAmber}
            </div>
          </div>
        </div>
      ) : (
        <div className="fixed left-1/2 top-4 -translate-x-1/2 flex items-center gap-6 rounded-lg border border-white/15 bg-[#070B12]/80 px-5 py-2 text-white">
          <div className="text-center">
            <div className="text-[10px] tracking-widest text-slate-400">{t(lang, 'hud.tags')}</div>
            <div className="hud-numeral text-xl font-bold leading-none text-cyan-400">{hud.tags}</div>
          </div>
          <div className="h-6 w-px bg-white/15" />
          <div className="text-center">
            <div className="text-[10px] tracking-widest text-slate-400">
              {t(lang, mapDef.nameKey as Parameters<typeof t>[1])}
            </div>
            <div className="hud-numeral text-xl font-bold leading-none text-white">
              {mins}:{secs}
            </div>
          </div>
        </div>
      )}

      {/* Subtle Hold-Tab & Players Online pill below top-center timer */}
      <div className="fixed left-1/2 top-[76px] -translate-x-1/2 flex items-center gap-2 rounded bg-[#070B12]/75 px-2.5 py-0.5 text-[10px] font-semibold tracking-wider text-slate-300 border border-white/10">
        <span>{t(lang, 'hud.tabScoreboardHint')}</span>
        <span className="text-slate-500">·</span>
        <span className="inline-flex items-center gap-1 text-emerald-300">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          {t(lang, 'hud.playersOnline')}: {hud.playersOnlineCount}
        </span>
      </div>

      {/* Top-Right Compact Utility Controls (positioned cleanly below FPS counter) */}
      <div className="pointer-events-auto fixed right-4 top-9 flex items-center gap-2">
        <button
          type="button"
          tabIndex={-1}
          aria-label="Toggle audio"
          onClick={(e) => {
            e.currentTarget.blur();
            onToggleMute();
          }}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 bg-[#070B12]/80 text-slate-200 hover:bg-slate-800 cursor-pointer"
        >
          {audioEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4 text-rose-400" />}
        </button>
        <button
          type="button"
          tabIndex={-1}
          aria-label="Toggle match chat"
          onClick={(e) => {
            e.currentTarget.blur();
            onToggleChat();
          }}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 bg-[#070B12]/80 text-slate-200 hover:bg-slate-800 cursor-pointer"
        >
          <MessageSquare className="h-4 w-4" />
        </button>
        <button
          type="button"
          tabIndex={-1}
          aria-label="Pause match"
          onClick={(e) => {
            e.currentTarget.blur();
            onPause();
          }}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 bg-[#070B12]/80 text-slate-200 hover:bg-slate-800 cursor-pointer"
        >
          <Pause className="h-4 w-4" />
        </button>
      </div>

      {/* Tutorial Orientation Objective + Skip CTA (positioned cleanly below Minimap) */}
      {isTutorial && (
        <div className="pointer-events-auto fixed left-4 top-48 max-w-sm rounded-lg border border-cyan-500/40 bg-[#070B12]/85 p-3.5 text-white">
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs font-bold tracking-wide text-cyan-400">
              {t(lang, 'hud.tutorialTitle')}
            </span>
            <button
              type="button"
              onClick={onSkipTutorial}
              className="flex items-center gap-1 rounded bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-200 hover:bg-slate-700 cursor-pointer"
            >
              <FastForward className="h-3 w-3" />
              {t(lang, 'cta.skipTutorial')}
            </button>
          </div>
          <p className="mt-1.5 text-xs text-slate-200">
            {hud.tutorialStep === 1 && t(lang, 'hud.tutorialStep1')}
            {hud.tutorialStep === 2 && `${t(lang, 'hud.tutorialStep2')} (${hud.tutorialDronesHit}/3)`}
            {hud.tutorialStep >= 3 && t(lang, 'hud.tutorialDone')}
          </p>
        </div>
      )}

      {/* Kill Feed (top-right under buttons) */}
      {hud.killsFeed.length > 0 && (
        <div className="fixed right-4 top-22 flex flex-col items-end gap-1">
          {hud.killsFeed.map((k) => {
            const isHead = k.text.startsWith('HEADSHOT');
            return (
              <div
                key={k.id}
                className={`rounded bg-[#070B12]/80 px-2.5 py-1 text-xs font-medium ${
                  isHead ? 'border border-amber-400/50 text-amber-300' : 'text-cyan-300'
                }`}
              >
                {k.text}
              </div>
            );
          })}
        </div>
      )}

      {/* Easter Egg Unlocked Banner */}
      {easterEggBannerVisible && (
        <div className="fixed left-1/2 top-20 -translate-x-1/2 rounded-lg border border-amber-400/60 bg-[#070B12]/90 px-5 py-3 text-center text-white shadow-xl">
          <div className="flex items-center justify-center gap-2 text-sm font-bold text-amber-300">
            <Sparkles className="h-4 w-4" />
            {t(lang, 'hud.easterEggTitle')}
          </div>
          <p className="mt-0.5 text-xs text-slate-300">{t(lang, 'hud.easterEggDesc')}</p>
        </div>
      )}

      {/* Bottom-Left Shield & Dash Cluster */}
      <div className="fixed bottom-5 left-5 w-56 space-y-2">
        {!hud.isDead && hud.spawnProtectionRemainingMs > 0 && (
          <div
            data-testid="spawn-protection-badge"
            className="flex items-center justify-between rounded-lg border border-cyan-400/60 bg-cyan-950/85 px-3 py-1.5 text-xs font-bold tracking-wider text-cyan-200 shadow-lg"
          >
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-cyan-300" />
              {t(lang, 'hud.spawnShield')}
            </span>
            <span className="font-mono text-cyan-300">
              {(hud.spawnProtectionRemainingMs / 1000).toFixed(1)}s
            </span>
          </div>
        )}
        <div className="rounded-lg border border-white/15 bg-[#070B12]/80 p-3 text-white">
          <div className="flex items-baseline justify-between">
            <span className="text-[11px] font-semibold tracking-wider text-slate-400">
              {t(lang, 'hud.shield')}
            </span>
            <span className="hud-numeral text-2xl font-bold leading-none text-white">
              {hud.hp}
            </span>
          </div>
          <div className="mt-1.5 h-2 w-full overflow-hidden rounded-sm bg-slate-800">
            <div
              className="h-full bg-cyan-400 transition-all duration-150"
              style={{ width: `${(hud.hp / hud.maxHp) * 100}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
            <span>{t(lang, 'hud.dash')}</span>
            <span className="font-mono text-slate-200">{hud.dashCharge}%</span>
          </div>
        </div>
      </div>

      {/* Bottom-Right Weapon, Magazine Ammo & Loadout Switcher */}
      <div className="pointer-events-auto fixed bottom-5 right-5 w-76 rounded-lg border border-white/15 bg-[#070B12]/85 p-3 text-white">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold text-cyan-300">
            {t(lang, activeWeapon.nameKey as Parameters<typeof t>[1])}
          </span>
          <div className="flex items-center gap-2">
            {/* Distinct Ammo Silhouette per Weapon */}
            {hud.ammoStyle === 'gold_bullet' && (
              <svg width="26" height="14" viewBox="0 0 26 14" aria-hidden="true">
                <path d="M2 4 H16 L24 7 L16 10 H2 Z" fill="#fbbf24" stroke="#fef3c7" strokeWidth="0.8" />
                <rect x="2" y="4" width="4" height="6" fill="#d97706" />
              </svg>
            )}
            {hud.ammoStyle === 'gray_pellets' && (
              <svg width="24" height="16" viewBox="0 0 24 16" aria-hidden="true">
                <circle cx="6" cy="5" r="2.3" fill="#94a3b8" />
                <circle cx="13" cy="4" r="2.3" fill="#cbd5e1" />
                <circle cx="19" cy="7" r="2.3" fill="#94a3b8" />
                <circle cx="7" cy="11" r="2.3" fill="#cbd5e1" />
                <circle cx="14" cy="11" r="2.3" fill="#94a3b8" />
              </svg>
            )}
            {hud.ammoStyle === 'rail_lance' && (
              <svg width="28" height="12" viewBox="0 0 28 12" aria-hidden="true">
                <polygon points="1,6 9,2 27,6 9,10" fill="#f43f5e" stroke="#fda4af" strokeWidth="0.8" />
                <line x1="5" y1="6" x2="24" y2="6" stroke="#22d3ee" strokeWidth="1.4" />
              </svg>
            )}
            {hud.ammoStyle === 'emerald_dart' && (
              <svg width="24" height="12" viewBox="0 0 24 12" aria-hidden="true">
                <polygon points="2,3 14,3 22,6 14,9 2,9" fill="#34d399" />
              </svg>
            )}
            <span data-testid="ammo-counter" className="hud-numeral text-xl font-bold leading-none text-white">
              {hud.ammo}
              <span className="text-xs font-medium text-slate-400"> / {hud.maxAmmo}</span>
            </span>
          </div>
        </div>

        <div className="mt-1.5 h-2 w-full overflow-hidden rounded-sm bg-slate-800">
          <div
            className={`h-full transition-all duration-75 ${
              hud.isReloading
                ? 'bg-amber-400'
                : hud.ammo <= Math.max(1, Math.floor(hud.maxAmmo * 0.25))
                ? 'bg-rose-500'
                : hud.ammoStyle === 'gold_bullet'
                ? 'bg-amber-400'
                : hud.ammoStyle === 'gray_pellets'
                ? 'bg-slate-400'
                : hud.ammoStyle === 'rail_lance'
                ? 'bg-rose-400'
                : 'bg-emerald-400'
            }`}
            style={{
              width: hud.isReloading
                ? `${Math.round(hud.reloadProgress * 100)}%`
                : `${(hud.ammo / Math.max(1, hud.maxAmmo)) * 100}%`,
            }}
          />
        </div>

        <div className="mt-1 flex items-center justify-between text-[10px] font-semibold tracking-wider">
          <span className="text-slate-400">{t(lang, 'hud.ammo')}</span>
          {hud.isReloading ? (
            <span className="text-amber-300">{t(lang, 'hud.reloading')}</span>
          ) : hud.ammo < hud.maxAmmo ? (
            <span className="text-cyan-300">{t(lang, 'hud.reloadHint')}</span>
          ) : (
            <span className="text-emerald-400/90">FULL</span>
          )}
        </div>

        <div className="mt-2 grid grid-cols-4 gap-1.5">
          {WEAPON_LIST.map((w, idx) => (
            <button
              key={w.id}
              type="button"
              tabIndex={-1}
              onClick={(e) => {
                e.currentTarget.blur();
                onSelectWeapon(w.id);
              }}
              className={`rounded px-1.5 py-1 text-[11px] font-semibold transition-colors cursor-pointer ${
                hud.weaponId === w.id
                  ? 'bg-cyan-500 text-slate-950'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              [{idx + 1}]
            </button>
          ))}
        </div>
      </div>

      {/* 3-Second Kill Cam Attacker Perspective Replay Banner (unobstructed center viewport) */}
      {hud.isDead && hud.isKillCam && (
        <div
          data-testid="killcam-overlay"
          className="pointer-events-none fixed inset-0 z-30 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between border-b border-rose-500/40 bg-[#070B12]/85 px-6 py-3 text-white">
            <div className="flex items-center gap-3">
              <span className="inline-block h-2.5 w-2.5 animate-pulse rounded-full bg-rose-500" />
              <span className="font-mono text-sm font-bold tracking-widest text-rose-400">
                {t(lang, 'killcam.title')}
              </span>
              <span className="text-xs text-slate-300">
                {t(lang, 'killcam.sub')}
              </span>
            </div>
            <div
              data-testid="killcam-countdown"
              className="font-mono text-base font-bold tabular-nums text-amber-300"
            >
              {(hud.killCamRemainingMs / 1000).toFixed(1)}s
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-rose-500/35 bg-[#070B12]/85 px-6 py-3 text-white">
            <div className="text-xs text-slate-300">
              {t(lang, 'death.eliminatedBy')}{' '}
              <span className="font-bold text-rose-300">{hud.killedBy ?? 'Arena Bot'}</span>
            </div>
            <div className="font-mono text-xs tracking-wider text-slate-400">
              REPLAY
            </div>
          </div>
        </div>
      )}

      {/* Death Screen Overlay (shown after Kill Cam completes) */}
      {hud.isDead && !hud.isKillCam && (
        <div
          data-testid="death-screen"
          className="pointer-events-auto fixed inset-0 z-30 flex items-center justify-center bg-black/75 p-4"
        >
          <div className="w-full max-w-md rounded-xl border border-rose-500/40 bg-[#0D131F] p-6 text-center text-white shadow-2xl">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-rose-500/40 bg-rose-500/15 text-rose-400">
              <Skull className="h-6 w-6" />
            </div>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-rose-400">
              {t(lang, 'death.title')}
            </h2>
            <p className="mt-1 text-sm text-slate-300">
              {t(lang, 'death.eliminatedBy')}{' '}
              <span className="font-semibold text-white">{hud.killedBy ?? 'Arena Bot'}</span>
            </p>

            <div className="mt-5 rounded-lg border border-slate-800 bg-slate-900/90 px-4 py-3">
              {hud.deathRespawnRemainingMs > 0 ? (
                <div className="text-xs font-medium text-slate-300">
                  {t(lang, 'death.respawnWait')}{' '}
                  <span
                    data-testid="death-countdown"
                    className="font-mono text-base font-bold text-amber-400"
                  >
                    {(hud.deathRespawnRemainingMs / 1000).toFixed(1)}s
                  </span>
                </div>
              ) : (
                <div className="text-xs font-semibold text-emerald-400">
                  {t(lang, 'death.respawnReady')}
                </div>
              )}
            </div>

            <button
              type="button"
              data-testid="respawn-btn"
              disabled={hud.deathRespawnRemainingMs > 0}
              onClick={onRespawn}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-500 px-5 py-3 text-sm font-bold text-slate-950 hover:bg-cyan-400 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <RotateCcw className="h-4 w-4" />
              {hud.deathRespawnRemainingMs > 0
                ? `${t(lang, 'cta.respawn')} (${Math.ceil(hud.deathRespawnRemainingMs / 1000)}s)`
                : t(lang, 'cta.respawn')}
            </button>
          </div>
        </div>
      )}

      {/* Hold-Tab Live Scoreboard & Players Online Overlay */}
      {hud.scoreboardHeld && (
        <div
          data-testid="tab-scoreboard"
          className="fixed inset-0 z-30 flex items-center justify-center bg-black/55 p-4"
        >
          <div className="w-full max-w-2xl overflow-hidden rounded-xl border border-cyan-500/40 bg-[#070B12]/95 text-white shadow-2xl">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-3.5">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-cyan-400">
                  {t(lang, mapDef.nameKey as Parameters<typeof t>[1])} ·{' '}
                  {hud.gameMode === 'tdm' ? t(lang, 'mode.tdm') : t(lang, 'mode.ffa')}
                </div>
                <h3 className="text-base font-bold text-white">
                  {t(lang, 'match.leaderboard')}
                </h3>
              </div>

              <div
                data-testid="players-online-count"
                className="inline-flex items-center gap-2 rounded-lg border border-emerald-400/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-300"
              >
                <Users className="h-3.5 w-3.5" />
                <span>
                  {t(lang, 'hud.playersOnline')}: {hud.playersOnlineCount}
                </span>
              </div>
            </div>

            <div className="max-h-[60vh] overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-white/10 text-[11px] text-slate-400">
                  <tr>
                    <th className="px-4 py-2.5 font-semibold">#</th>
                    <th className="px-4 py-2.5 font-semibold">{t(lang, 'match.player')}</th>
                    <th className="px-4 py-2.5 text-right font-semibold">{t(lang, 'match.kills')}</th>
                    <th className="px-4 py-2.5 text-right font-semibold">{t(lang, 'match.deaths')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {hud.scoreboardEntries.map((entry, idx) => {
                    const isTdm = hud.gameMode === 'tdm';
                    const isAlly = isTdm ? entry.team === 'cyan' : entry.isLocalPlayer;
                    return (
                      <tr
                        key={entry.id}
                        className={
                          entry.isLocalPlayer
                            ? 'bg-cyan-500/15 font-semibold'
                            : isTdm
                            ? isAlly
                              ? 'bg-blue-500/[0.06]'
                              : 'bg-rose-500/[0.06]'
                            : ''
                        }
                      >
                        <td className="px-4 py-2.5 font-mono text-slate-400">{idx + 1}</td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <span
                              className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                                isTdm
                                  ? isAlly
                                    ? 'bg-blue-500'
                                    : 'bg-rose-500'
                                  : entry.isLocalPlayer
                                  ? 'bg-cyan-400'
                                  : 'bg-amber-400'
                              }`}
                            />
                            <span className="text-slate-100">{entry.nickname}</span>
                            {entry.isLocalPlayer && (
                              <span className="rounded bg-cyan-500/25 px-1.5 py-0.5 text-[10px] font-bold text-cyan-300">
                                {t(lang, 'match.you')}
                              </span>
                            )}
                            {entry.online && !entry.isLocalPlayer && (
                              <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-300">
                                {t(lang, 'match.onlineStatus')}
                              </span>
                            )}
                            {entry.isBot && (
                              <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400">
                                {t(lang, 'match.bot')}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono font-bold tabular-nums text-white">
                          {entry.kills}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono tabular-nums text-slate-400">
                          {entry.deaths}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Subtle PointerLock / Controller Hint */}
      {!hud.isDead && hud.hasGamepad ? (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 rounded bg-[#070B12]/80 px-3 py-1 text-[11px] text-cyan-300">
          <Gamepad2 className="h-3.5 w-3.5" />
          <span>[Start] Pause · [A] Jump · [RT] Fire · [LT] Scope · [X] Reload</span>
        </div>
      ) : (
        !hud.isDead &&
        !hud.pointerLocked && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 rounded bg-[#070B12]/75 px-3 py-1 text-[11px] text-slate-300">
            {t(lang, 'hud.clickToAim')}
          </div>
        )
      )}

      {/* In-Game Messaging Drawer */}
      {chatOpen && (
        <div className="pointer-events-auto fixed bottom-32 left-5 w-80 rounded-lg border border-white/15 bg-[#070B12]/90 p-3 text-white shadow-xl">
          <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-300">
            <span>{t(lang, 'social.chat')}</span>
            <button
              type="button"
              onClick={onToggleChat}
              className="text-slate-400 hover:text-white cursor-pointer"
            >
              ×
            </button>
          </div>
          <div className="max-h-36 space-y-1.5 overflow-y-auto pr-1 text-xs">
            {chatMessages.slice(-10).map((m) => (
              <div key={m.id} className="leading-snug">
                <span className="font-semibold text-cyan-400">{m.sender}</span>
                <span className="text-slate-500"> · {m.platform}: </span>
                <span className="text-slate-200">{m.text}</span>
              </div>
            ))}
          </div>
          <form onSubmit={handleChatSubmit} className="mt-2 flex gap-1.5">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="..."
              className="flex-1 rounded border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-white focus:border-cyan-400 focus:outline-none"
            />
            <button
              type="submit"
              className="rounded bg-cyan-500 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-cyan-400 cursor-pointer"
            >
              {t(lang, 'social.send')}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
