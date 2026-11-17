import React from 'react';
import { Check, Lock } from 'lucide-react';
import { AVATAR_SKINS, WEAPON_LIST, WEAPON_SKINS } from '../game/catalog';
import { LanguageCode, PlayerCloudProfile, WeaponId } from '../game/types';
import { t } from '../i18n/translations';

interface ArmoryPanelProps {
  profile: PlayerCloudProfile;
  lang: LanguageCode;
  onEquipWeapon: (id: WeaponId) => void;
  onActionSkin: (type: 'weapon_skin' | 'avatar_skin', id: string) => void;
}

export const ArmoryPanel: React.FC<ArmoryPanelProps> = ({
  profile,
  lang,
  onEquipWeapon,
  onActionSkin,
}) => {
  return (
    <div className="space-y-6">
      {/* Primary Loadouts */}
      <section>
        <div className="flex items-baseline justify-between">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            {t(lang, 'nav.loadout')}
          </h3>
          <span className="font-mono text-sm font-semibold text-amber-500">
            {profile.credits} CR
          </span>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {WEAPON_LIST.map((w) => {
            const equipped = profile.equippedWeaponId === w.id;
            return (
              <div
                key={w.id}
                className={`rounded-lg border p-3.5 transition-colors ${
                  equipped
                    ? 'border-cyan-500 bg-cyan-500/10'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/70'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-sm text-slate-900 dark:text-white">
                    {t(lang, w.nameKey as Parameters<typeof t>[1])}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                  {t(lang, w.roleKey as Parameters<typeof t>[1])}
                </p>
                <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>DMG {w.damage * w.pellets} · RNG {w.maxRange}m</span>
                  <button
                    type="button"
                    onClick={() => onEquipWeapon(w.id)}
                    className={`rounded px-2.5 py-1 text-xs font-semibold cursor-pointer ${
                      equipped
                        ? 'bg-cyan-500 text-slate-950'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700'
                    }`}
                  >
                    {equipped ? t(lang, 'cta.equipped') : t(lang, 'cta.equip')}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Weapon Skins */}
      <section>
        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
          Weapon Finishes
        </h4>
        <div className="mt-2.5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {WEAPON_SKINS.filter(
            (skin) =>
              skin.unlockSource !== 'easter_egg' ||
              profile.unlockedWeaponSkins.includes(skin.id)
          ).map((skin) => {
            const unlocked = profile.unlockedWeaponSkins.includes(skin.id);
            const equipped = profile.equippedWeaponSkinId === skin.id;
            const swatchBg =
              skin.pattern === 'rainbow'
                ? 'linear-gradient(135deg, #ef4444 0%, #f59e0b 20%, #10b981 42%, #06b6d4 65%, #6366f1 82%, #ec4899 100%)'
                : skin.pattern === 'gold_walnut'
                ? `linear-gradient(135deg, ${skin.primaryColor} 0%, ${skin.secondaryColor} 48%, ${skin.gripColor} 52%, ${skin.scopeColor} 100%)`
                : skin.pattern === 'hex_carbon'
                ? `repeating-linear-gradient(45deg, ${skin.primaryColor}, ${skin.primaryColor} 6px, ${skin.secondaryColor} 6px, ${skin.secondaryColor} 10px)`
                : skin.pattern === 'prism_holo'
                ? `linear-gradient(135deg, #e2e8f0 0%, ${skin.emissiveColor} 50%, ${skin.secondaryColor} 100%)`
                : `linear-gradient(135deg, ${skin.primaryColor} 45%, ${skin.emissiveColor} 100%)`;

            const patternLabel =
              skin.pattern === 'rainbow'
                ? 'Rainbow Pattern'
                : skin.pattern === 'gold_walnut'
                ? 'Gold · Wood Handle & Scope'
                : skin.pattern === 'hex_carbon'
                ? 'Carbon Hex Pattern'
                : skin.pattern === 'circuit'
                ? 'Circuit Pattern'
                : skin.pattern === 'prism_holo'
                ? 'Holographic Prism'
                : 'Tactical Finish';

            return (
              <div
                key={skin.id}
                className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/70 p-3"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="h-10 w-10 shrink-0 rounded-md border border-white/25 shadow-inner"
                    style={{ background: swatchBg }}
                  />
                  <div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">
                      {skin.name}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      {patternLabel}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {unlocked
                        ? equipped
                          ? t(lang, 'cta.equipped')
                          : 'Unlocked'
                        : skin.unlockSource === 'easter_egg'
                        ? 'Obsidian Vault Easter Egg'
                        : skin.unlockSource === 'battlepass'
                        ? 'Battle Pass Reward'
                        : `${skin.price} CR`}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={!unlocked && skin.unlockSource !== 'store'}
                  onClick={() => onActionSkin('weapon_skin', skin.id)}
                  className={`flex shrink-0 items-center gap-1 whitespace-nowrap rounded px-3 py-1.5 text-xs font-semibold cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed ${
                    equipped
                      ? 'bg-cyan-500 text-slate-950'
                      : unlocked
                      ? 'bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:bg-slate-300 dark:hover:bg-slate-700'
                      : 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                  }`}
                >
                  {equipped ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      {t(lang, 'cta.equipped')}
                    </>
                  ) : unlocked ? (
                    t(lang, 'cta.equip')
                  ) : skin.unlockSource === 'store' ? (
                    `${t(lang, 'cta.unlock')} · ${skin.price}`
                  ) : (
                    <Lock className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Avatar Armor Skins */}
      <section>
        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
          Avatar Armor & Visors
        </h4>
        <div className="mt-2.5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {AVATAR_SKINS.map((skin) => {
            const unlocked = profile.unlockedAvatarSkins.includes(skin.id);
            const equipped = profile.equippedAvatarSkinId === skin.id;
            return (
              <div
                key={skin.id}
                className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/70 p-3"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="h-9 w-9 shrink-0 rounded-md border border-white/20"
                    style={{
                      background: `linear-gradient(135deg, ${skin.armorColor} 45%, ${skin.visorColor} 100%)`,
                    }}
                  />
                  <div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">
                      {skin.name}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {unlocked
                        ? equipped
                          ? t(lang, 'cta.equipped')
                          : 'Unlocked'
                        : skin.unlockSource === 'battlepass'
                        ? 'Battle Pass Reward'
                        : `${skin.price} CR`}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={!unlocked && skin.unlockSource !== 'store'}
                  onClick={() => onActionSkin('avatar_skin', skin.id)}
                  className={`shrink-0 whitespace-nowrap rounded px-3 py-1.5 text-xs font-semibold cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed ${
                    equipped
                      ? 'bg-cyan-500 text-slate-950'
                      : unlocked
                      ? 'bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:bg-slate-300 dark:hover:bg-slate-700'
                      : 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                  }`}
                >
                  {equipped
                    ? t(lang, 'cta.equipped')
                    : unlocked
                    ? t(lang, 'cta.equip')
                    : skin.unlockSource === 'store'
                    ? `${t(lang, 'cta.unlock')} · ${skin.price}`
                    : 'BP'}
                </button>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
