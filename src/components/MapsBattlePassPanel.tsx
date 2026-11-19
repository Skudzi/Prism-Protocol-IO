import React from 'react';
import { Check, Lock, Moon, Shuffle, Sun } from 'lucide-react';
import { BATTLE_PASS_TIERS, MAP_LIST } from '../game/catalog';
import { getBattlePassTier } from '../game/rules';
import { LanguageCode, MapId, PlayerCloudProfile } from '../game/types';
import { t } from '../i18n/translations';

interface MapsPanelProps {
  selectedMap: MapId;
  manualMapSelected: boolean;
  lang: LanguageCode;
  onSelectMap: (id: MapId) => void;
  onDeploy: (id: MapId) => void;
  onEnableRandomMap: () => void;
}

export const MapsPanel: React.FC<MapsPanelProps> = ({
  selectedMap,
  manualMapSelected,
  lang,
  onSelectMap,
  onDeploy,
  onEnableRandomMap,
}) => {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/70 px-4 py-2.5">
        <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
          <Shuffle className={`h-4 w-4 shrink-0 ${!manualMapSelected ? 'text-cyan-500' : 'text-slate-400'}`} />
          <span>
            {!manualMapSelected ? t(lang, 'map.randomActive') : t(lang, 'map.randomMode')}
          </span>
        </div>
        <button
          type="button"
          data-testid="random-map-toggle"
          onClick={onEnableRandomMap}
          disabled={!manualMapSelected}
          className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
            !manualMapSelected
              ? 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-300 cursor-default'
              : 'bg-cyan-500 text-slate-950 hover:bg-cyan-400 cursor-pointer'
          }`}
        >
          {!manualMapSelected ? t(lang, 'cta.equipped') : t(lang, 'map.useRandom')}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {MAP_LIST.map((m) => {
          const active = manualMapSelected && selectedMap === m.id;
          return (
            <div
              key={m.id}
              className={`flex flex-col justify-between rounded-lg border p-4 transition-colors ${
                active
                  ? 'border-cyan-500 bg-cyan-500/10'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/70'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-bold text-slate-900 dark:text-white">
                    {t(lang, m.nameKey as Parameters<typeof t>[1])}
                  </h4>
                  <span
                    className="h-3 w-3 rounded-sm"
                    style={{ backgroundColor: m.accentColor }}
                    aria-hidden="true"
                  />
                </div>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                  {t(lang, m.subtitleKey as Parameters<typeof t>[1])}
                </p>
                {m.isDaylight ? (
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-300">
                    <Sun className="h-3.5 w-3.5" />
                    <span>Daylight</span>
                  </div>
                ) : (
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-300">
                    <Moon className="h-3.5 w-3.5" />
                    <span>Night / Arena</span>
                  </div>
                )}
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => onSelectMap(m.id)}
                  className={`flex-1 rounded px-3 py-1.5 text-xs font-semibold cursor-pointer ${
                    active
                      ? 'bg-cyan-500 text-slate-950'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700'
                  }`}
                >
                  {active ? t(lang, 'cta.equipped') : 'Preview'}
                </button>
                <button
                  type="button"
                  onClick={() => onDeploy(m.id)}
                  className="rounded bg-slate-900 dark:bg-white px-3 py-1.5 text-xs font-semibold text-white dark:text-slate-950 hover:opacity-90 cursor-pointer"
                >
                  {t(lang, 'nav.play')}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

interface BattlePassPanelProps {
  profile: PlayerCloudProfile;
  lang: LanguageCode;
  onUpgradePremium: () => void;
  onClaimTier: (tier: number, track: 'free' | 'premium') => void;
}

export const BattlePassPanel: React.FC<BattlePassPanelProps> = ({
  profile,
  lang,
  onUpgradePremium,
  onClaimTier,
}) => {
  const currentTier = getBattlePassTier(profile.battlePassXp);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/70 p-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            {t(lang, 'bp.title')}
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            {t(lang, 'bp.tier')} {currentTier} / 10 · {profile.battlePassXp} XP · {profile.credits} CR
          </p>
        </div>
        {!profile.battlePassPremium ? (
          <button
            type="button"
            onClick={onUpgradePremium}
            disabled={profile.credits < 600}
            className="rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 disabled:opacity-45 cursor-pointer"
          >
            {t(lang, 'cta.upgradePass')}
          </button>
        ) : (
          <span className="text-xs font-bold text-amber-500">Premium Pass Active</span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
        {BATTLE_PASS_TIERS.map((tier) => {
          const unlocked = profile.battlePassXp >= tier.xpRequired;
          const freeClaimed = profile.claimedFreeTiers.includes(tier.tier);
          const premClaimed = profile.claimedPremiumTiers.includes(tier.tier);

          return (
            <div
              key={tier.tier}
              className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/70 p-3"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900 dark:text-white">
                  {t(lang, 'bp.tier')} {tier.tier}
                </span>
                <span className="font-mono text-slate-500 dark:text-slate-400">
                  {tier.xpRequired} XP
                </span>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <div className="rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/60 p-2">
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    {t(lang, 'bp.freeTrack')}
                  </div>
                  <div className="mt-0.5 text-xs font-semibold text-slate-900 dark:text-slate-100">
                    {tier.freeReward.label}
                  </div>
                  <button
                    type="button"
                    disabled={!unlocked || freeClaimed}
                    onClick={() => onClaimTier(tier.tier, 'free')}
                    className="mt-2 flex w-full items-center justify-center gap-1 rounded bg-cyan-500/20 px-2 py-1 text-[11px] font-semibold text-cyan-700 dark:text-cyan-300 hover:bg-cyan-500/30 disabled:opacity-40 cursor-pointer"
                  >
                    {freeClaimed ? (
                      <>
                        <Check className="h-3 w-3" /> {t(lang, 'cta.claimed')}
                      </>
                    ) : unlocked ? (
                      t(lang, 'cta.claim')
                    ) : (
                      <Lock className="h-3 w-3" />
                    )}
                  </button>
                </div>

                <div className="rounded border border-amber-500/30 bg-amber-500/5 p-2">
                  <div className="text-[11px] text-amber-600 dark:text-amber-400">
                    {t(lang, 'bp.premiumTrack')}
                  </div>
                  <div className="mt-0.5 text-xs font-semibold text-slate-900 dark:text-slate-100">
                    {tier.premiumReward.label}
                  </div>
                  <button
                    type="button"
                    disabled={!unlocked || !profile.battlePassPremium || premClaimed}
                    onClick={() => onClaimTier(tier.tier, 'premium')}
                    className="mt-2 flex w-full items-center justify-center gap-1 rounded bg-amber-500/20 px-2 py-1 text-[11px] font-semibold text-amber-700 dark:text-amber-300 hover:bg-amber-500/30 disabled:opacity-40 cursor-pointer"
                  >
                    {premClaimed ? (
                      <>
                        <Check className="h-3 w-3" /> {t(lang, 'cta.claimed')}
                      </>
                    ) : unlocked && profile.battlePassPremium ? (
                      t(lang, 'cta.claim')
                    ) : (
                      <Lock className="h-3 w-3" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
