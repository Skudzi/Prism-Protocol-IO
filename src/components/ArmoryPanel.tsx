import React, { useMemo, useState } from 'react';
import { Check, Crosshair, Eye, Layers, Lock, Package, Sparkles } from 'lucide-react';
import {
  AVATAR_SKINS,
  CHEST_LIST,
  RARITY_META,
  RARITY_ORDER,
  WEAPON_LIST,
  WEAPON_SKINS,
} from '../game/catalog';
import {
  getChestRarityPercentages,
  getChestWeaponPercentages,
  normalizeEquippedWeaponSkins,
} from '../game/rules';
import {
  ChestId,
  ChestOpenResult,
  LanguageCode,
  PlayerCloudProfile,
  SkinRarity,
  WeaponId,
  WeaponSkinDef,
} from '../game/types';
import { t } from '../i18n/translations';
import { OperatorPreviewCanvas } from './OperatorPreviewCanvas';
import { WeaponSkinPreviewCanvas } from './WeaponSkinPreviewCanvas';

interface ArmoryPanelProps {
  profile: PlayerCloudProfile;
  lang: LanguageCode;
  onEquipWeapon: (id: WeaponId) => void;
  onActionSkin: (
    type: 'weapon_skin' | 'avatar_skin',
    id: string,
    targetWeaponId?: WeaponId
  ) => void;
  onOpenChest: (chestId: ChestId) => ChestOpenResult | undefined;
}

type ArmorySubTab = 'loadout' | 'all_skins' | 'chests';

const WEAPON_SHORT_LABELS: Record<WeaponId, string> = {
  pulse_carbine: 'AR · Carbine',
  volt_scatter: 'Shotgun · Scatter',
  helios_rail: 'Sniper · Rail',
  arc_repeater: 'SMG · Repeater',
};

const WEAPON_TINY_LABELS: Record<WeaponId, string> = {
  pulse_carbine: 'AR',
  volt_scatter: 'Shotgun',
  helios_rail: 'Sniper',
  arc_repeater: 'SMG',
};

function getSkinSwatchBackground(skin: WeaponSkinDef): string {
  if (skin.pattern === 'rainbow') {
    return 'linear-gradient(135deg, #ef4444 0%, #f59e0b 20%, #10b981 42%, #06b6d4 65%, #6366f1 82%, #ec4899 100%)';
  }
  if (skin.pattern === 'gold_walnut') {
    return skin.id === 'royal_walnut'
      ? `linear-gradient(135deg, #fef08a 0%, ${skin.primaryColor} 44%, ${skin.gripColor} 58%, #3b1e08 100%)`
      : `linear-gradient(135deg, ${skin.primaryColor} 0%, ${skin.secondaryColor} 55%, ${skin.emissiveColor} 100%)`;
  }
  if (skin.pattern === 'hex_carbon') {
    return `repeating-linear-gradient(45deg, ${skin.primaryColor}, ${skin.primaryColor} 6px, ${skin.secondaryColor} 6px, ${skin.secondaryColor} 10px)`;
  }
  if (skin.pattern === 'prism_holo') {
    return `linear-gradient(135deg, #f8fafc 0%, ${skin.emissiveColor} 50%, ${skin.secondaryColor} 100%)`;
  }
  return `linear-gradient(135deg, ${skin.primaryColor} 45%, ${skin.emissiveColor} 100%)`;
}

export const ArmoryPanel: React.FC<ArmoryPanelProps> = ({
  profile,
  lang,
  onEquipWeapon,
  onActionSkin,
  onOpenChest,
}) => {
  const [armoryTab, setArmoryTab] = useState<ArmorySubTab>('loadout');
  const [lastChestResult, setLastChestResult] = useState<ChestOpenResult | null>(null);
  const [rarityFilter, setRarityFilter] = useState<'all' | SkinRarity>('all');
  const [weaponFilter, setWeaponFilter] = useState<'all' | WeaponId>('all');
  const [applyTargetMode, setApplyTargetMode] = useState<'signature' | WeaponId>('signature');

  const equippedWeaponSkins = useMemo(
    () =>
      normalizeEquippedWeaponSkins(
        profile.equippedWeaponSkins,
        profile.equippedWeaponSkinId,
        profile.equippedWeaponId
      ),
    [profile.equippedWeaponSkins, profile.equippedWeaponSkinId, profile.equippedWeaponId]
  );

  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [inspectedSkinId, setInspectedSkinId] = useState<string>(
    () => equippedWeaponSkins[profile.equippedWeaponId] ?? profile.equippedWeaponSkinId
  );
  const [inspectedWeaponId, setInspectedWeaponId] = useState<WeaponId>(
    () => profile.equippedWeaponId
  );

  const inspectedSkin =
    WEAPON_SKINS.find((s) => s.id === inspectedSkinId) ??
    WEAPON_SKINS.find((s) => s.id === equippedWeaponSkins[profile.equippedWeaponId]) ??
    WEAPON_SKINS[0];

  const equippedAvatarSkin =
    AVATAR_SKINS.find((s) => s.id === profile.equippedAvatarSkinId) ?? AVATAR_SKINS[0];

  const visibleAllWeaponSkins = useMemo(() => {
    const equippedSet = new Set(Object.values(equippedWeaponSkins));
    return WEAPON_SKINS.filter((skin) => {
      if (
        skin.unlockSource === 'easter_egg' &&
        !profile.unlockedWeaponSkins.includes(skin.id)
      ) {
        return false;
      }
      if (rarityFilter !== 'all' && skin.rarity !== rarityFilter) {
        return false;
      }
      if (weaponFilter !== 'all' && skin.signatureWeapon !== weaponFilter) {
        return false;
      }
      return true;
    }).sort((a, b) => {
      const aEq = equippedSet.has(a.id) ? 1 : 0;
      const bEq = equippedSet.has(b.id) ? 1 : 0;
      if (aEq !== bEq) return bEq - aEq;
      const aUn = profile.unlockedWeaponSkins.includes(a.id) ? 1 : 0;
      const bUn = profile.unlockedWeaponSkins.includes(b.id) ? 1 : 0;
      if (aUn !== bUn) return bUn - aUn;
      return RARITY_ORDER.indexOf(b.rarity) - RARITY_ORDER.indexOf(a.rarity);
    });
  }, [
    equippedWeaponSkins,
    profile.unlockedWeaponSkins,
    rarityFilter,
    weaponFilter,
  ]);

  const visibleOwnedWeaponSkins = useMemo(() => {
    const equippedSet = new Set(Object.values(equippedWeaponSkins));
    return WEAPON_SKINS.filter((skin) => {
      if (!profile.unlockedWeaponSkins.includes(skin.id)) return false;
      if (rarityFilter !== 'all' && skin.rarity !== rarityFilter) return false;
      if (weaponFilter !== 'all' && skin.signatureWeapon !== weaponFilter) return false;
      return true;
    }).sort((a, b) => {
      const aEq = equippedSet.has(a.id) ? 1 : 0;
      const bEq = equippedSet.has(b.id) ? 1 : 0;
      if (aEq !== bEq) return bEq - aEq;
      return RARITY_ORDER.indexOf(b.rarity) - RARITY_ORDER.indexOf(a.rarity);
    });
  }, [
    equippedWeaponSkins,
    profile.unlockedWeaponSkins,
    rarityFilter,
    weaponFilter,
  ]);

  const ownedAvatarSkins = useMemo(
    () => AVATAR_SKINS.filter((s) => profile.unlockedAvatarSkins.includes(s.id)),
    [profile.unlockedAvatarSkins]
  );

  const handleChestClick = (chestId: ChestId) => {
    const res = onOpenChest(chestId);
    if (res) {
      setLastChestResult(res);
      if (res.ok && res.skin) {
        setInspectedSkinId(res.skin.id);
        setInspectedWeaponId(res.skin.signatureWeapon);
      }
    }
  };

  const handleInspectSkin = (skin: WeaponSkinDef, weaponOverride?: WeaponId) => {
    setInspectedSkinId(skin.id);
    setInspectedWeaponId(weaponOverride ?? skin.signatureWeapon);
    setInspectorOpen(true);
  };

  const renderSkinFilterBar = () => (
    <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/70 px-3 py-2.5">
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={() => setRarityFilter('all')}
          className={`rounded px-2.5 py-1 text-[11px] font-semibold cursor-pointer ${
            rarityFilter === 'all'
              ? 'bg-cyan-500 text-slate-950'
              : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
          }`}
        >
          {t(lang, 'armory.allRarities')}
        </button>
        {RARITY_ORDER.map((r) => {
          const meta = RARITY_META[r];
          const active = rarityFilter === r;
          return (
            <button
              key={r}
              type="button"
              data-testid={`rarity-filter-${r}`}
              onClick={() => setRarityFilter(active ? 'all' : r)}
              className="flex items-center gap-1 rounded border px-2 py-1 text-[11px] font-semibold cursor-pointer transition-opacity"
              style={{
                borderColor: active ? meta.borderHex : 'rgba(148,163,184,0.35)',
                backgroundColor: '#0f172a',
                color: meta.colorHex,
                opacity: active || rarityFilter === 'all' ? 1 : 0.68,
              }}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: meta.colorHex }}
              />
              <span>{meta.label}</span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select
          aria-label="Filter by weapon"
          value={weaponFilter}
          onChange={(e) => setWeaponFilter(e.target.value as 'all' | WeaponId)}
          className="rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1 text-[11px] font-medium text-slate-800 dark:text-slate-200 cursor-pointer"
        >
          <option value="all">All Weapons</option>
          {WEAPON_LIST.map((w) => (
            <option key={w.id} value={w.id}>
              {WEAPON_SHORT_LABELS[w.id]}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-1.5">
          <label
            htmlFor="apply-skin-target-select"
            className="text-[11px] font-semibold text-slate-600 dark:text-slate-400"
          >
            {t(lang, 'armory.applyToSlot')}:
          </label>
          <select
            id="apply-skin-target-select"
            data-testid="apply-skin-target-select"
            value={applyTargetMode}
            onChange={(e) => setApplyTargetMode(e.target.value as 'signature' | WeaponId)}
            className="rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1 text-[11px] font-medium text-slate-800 dark:text-slate-200 cursor-pointer"
          >
            <option value="signature">
              {t(lang, 'armory.signatureSlot')} (Auto)
            </option>
            {WEAPON_LIST.map((w) => (
              <option key={w.id} value={w.id}>
                {WEAPON_SHORT_LABELS[w.id]}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );

  const renderSkinCard = (skin: WeaponSkinDef) => {
    const unlocked = profile.unlockedWeaponSkins.includes(skin.id);
    const targetWeapon: WeaponId =
      applyTargetMode === 'signature' ? skin.signatureWeapon : applyTargetMode;
    const equippedOnTarget = equippedWeaponSkins[targetWeapon] === skin.id;
    const equippedSlots = WEAPON_LIST.filter(
      (w) => equippedWeaponSkins[w.id] === skin.id
    );
    const meta = RARITY_META[skin.rarity];

    return (
      <div
        key={skin.id}
        data-testid={`skin-card-${skin.id}`}
        className="flex flex-col justify-between gap-2.5 rounded-lg border bg-slate-900/95 p-3 text-slate-100"
        style={{
          borderColor: equippedSlots.length > 0 ? '#06b6d4' : meta.borderHex,
        }}
      >
        <div className="flex min-w-0 items-center gap-3">
          <div
            className="h-10 w-10 shrink-0 rounded-md border border-white/25 shadow-inner"
            style={{ background: getSkinSwatchBackground(skin) }}
          />
          <div className="min-w-0">
            {/* Rarity color ONLY on Skin Name & Rarity Label (never on 3D paint!) */}
            <div
              data-testid={`skin-name-${skin.id}`}
              className="truncate text-sm font-bold"
              style={{ color: meta.colorHex }}
            >
              {skin.name}
            </div>
            <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
              <span
                className="font-bold uppercase tracking-wide"
                style={{ color: meta.colorHex }}
              >
                {meta.label}
              </span>
              <span className="text-slate-500">·</span>
              <span className="text-slate-300">
                {WEAPON_SHORT_LABELS[skin.signatureWeapon]}
              </span>
            </div>
            <div className="text-xs text-slate-400">
              {unlocked
                ? equippedSlots.length > 0
                  ? `${t(lang, 'cta.equipped')} · ${equippedSlots
                      .map((w) => WEAPON_TINY_LABELS[w.id])
                      .join(', ')}`
                  : 'Unlocked'
                : skin.unlockSource === 'easter_egg'
                ? 'Obsidian Vault Easter Egg'
                : skin.unlockSource === 'battlepass'
                ? 'Battle Pass Reward'
                : skin.unlockSource === 'chest'
                ? 'Supply Chest Drop'
                : `${skin.price} CR`}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-1.5 border-t border-slate-800/80 pt-2">
          <button
            type="button"
            data-testid={`inspect-skin-${skin.id}`}
            onClick={() => handleInspectSkin(skin, targetWeapon)}
            className="inline-flex items-center gap-1 rounded border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-[11px] font-semibold text-slate-200 hover:bg-slate-700 cursor-pointer"
          >
            <Eye className="h-3 w-3" />
            <span>{t(lang, 'armory.inspectSkin')}</span>
          </button>
          <button
            type="button"
            data-testid={`equip-skin-${skin.id}`}
            aria-label={
              !unlocked && skin.unlockSource !== 'store'
                ? `Locked (${skin.name})`
                : undefined
            }
            disabled={!unlocked && skin.unlockSource !== 'store'}
            onClick={() => onActionSkin('weapon_skin', skin.id, targetWeapon)}
            className={`flex shrink-0 items-center gap-1 whitespace-nowrap rounded px-3 py-1.5 text-xs font-semibold cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed ${
              equippedOnTarget
                ? 'bg-cyan-500 text-slate-950'
                : unlocked
                ? 'bg-slate-800 text-slate-100 hover:bg-slate-700 border border-slate-700'
                : 'bg-amber-500 text-slate-950 hover:bg-amber-400'
            }`}
          >
            {equippedOnTarget ? (
              <>
                <Check className="h-3.5 w-3.5" />
                {t(lang, 'cta.equipped')} · {WEAPON_TINY_LABELS[targetWeapon]}
              </>
            ) : unlocked ? (
              `${t(lang, 'cta.equip')} · ${WEAPON_TINY_LABELS[targetWeapon]}`
            ) : skin.unlockSource === 'store' ? (
              `${t(lang, 'cta.unlock')} · ${skin.price}`
            ) : (
              <Lock className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>
    );
  };

  const renderAvatarSkinsGrid = (list: typeof AVATAR_SKINS) => (
    <div className="mt-2.5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {list.map((skin) => {
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
  );

  return (
    <div className="space-y-5">
      {/* Under-Tabs Navigation + Balance */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div
          data-testid="armory-subtabs"
          role="tablist"
          aria-label="Armory sections"
          className="flex flex-wrap items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900/90 p-1"
        >
          <button
            type="button"
            role="tab"
            aria-selected={armoryTab === 'loadout'}
            data-testid="armory-subtab-loadout"
            onClick={() => setArmoryTab('loadout')}
            className={`inline-flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
              armoryTab === 'loadout'
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800'
            }`}
          >
            <Crosshair className="h-3.5 w-3.5" />
            <span>{t(lang, 'armory.tabLoadout')}</span>
            <span className="rounded bg-black/15 px-1.5 py-0.5 font-mono text-[10px]">
              {profile.unlockedWeaponSkins.length}
            </span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={armoryTab === 'all_skins'}
            data-testid="armory-subtab-all_skins"
            onClick={() => setArmoryTab('all_skins')}
            className={`inline-flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
              armoryTab === 'all_skins'
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>{t(lang, 'armory.tabAllSkins')}</span>
            <span className="rounded bg-black/15 px-1.5 py-0.5 font-mono text-[10px]">
              {WEAPON_SKINS.length}
            </span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={armoryTab === 'chests'}
            data-testid="armory-subtab-chests"
            onClick={() => setArmoryTab('chests')}
            className={`inline-flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
              armoryTab === 'chests'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800'
            }`}
          >
            <Package className="h-3.5 w-3.5" />
            <span>{t(lang, 'armory.tabChests')}</span>
            <span className="rounded bg-black/15 px-1.5 py-0.5 font-mono text-[10px]">
              {CHEST_LIST.length}
            </span>
          </button>
        </div>

        <span className="font-mono text-sm font-bold text-amber-500">
          {profile.credits} CR
        </span>
      </div>

      {/* UNDER-TAB 1: CURRENT LOADOUT & OWNED SKINS */}
      {armoryTab === 'loadout' && (
        <div data-testid="armory-panel-loadout" className="space-y-6">
          {/* Primary Weapons + Live 3D Operator Preview */}
          <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:col-span-2">
              {WEAPON_LIST.map((w) => {
                const equipped = profile.equippedWeaponId === w.id;
                const slotSkinId = equippedWeaponSkins[w.id];
                const slotSkin =
                  WEAPON_SKINS.find((s) => s.id === slotSkinId) ?? WEAPON_SKINS[0];
                const slotMeta = RARITY_META[slotSkin.rarity];

                return (
                  <div
                    key={w.id}
                    className={`flex flex-col justify-between rounded-lg border p-3.5 transition-colors ${
                      equipped
                        ? 'border-cyan-500 bg-cyan-500/10'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/70'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-sm text-slate-900 dark:text-white">
                          {t(lang, w.nameKey as Parameters<typeof t>[1])}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                        {t(lang, w.roleKey as Parameters<typeof t>[1])}
                      </p>
                      <button
                        type="button"
                        onClick={() => handleInspectSkin(slotSkin, w.id)}
                        className="mt-2 inline-flex items-center gap-1.5 rounded border border-slate-700/80 bg-slate-900/95 px-2 py-0.5 text-[11px] font-semibold cursor-pointer hover:border-cyan-400"
                      >
                        <span
                          className="h-2.5 w-2.5 rounded-sm border border-white/25"
                          style={{ background: getSkinSwatchBackground(slotSkin) }}
                        />
                        <span style={{ color: slotMeta.colorHex }}>{slotSkin.name}</span>
                        <Eye className="h-3 w-3 text-cyan-400" />
                      </button>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span>
                        DMG {w.damage * w.pellets} · RNG {w.maxRange}m
                      </span>
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
            <OperatorPreviewCanvas
              weaponId={profile.equippedWeaponId}
              avatarSkin={equippedAvatarSkin}
              lang={lang}
            />
          </section>

          {/* Equipped Weapon Skins Summary (4 Independent Slots) */}
          <section
            data-testid="equipped-weapon-skins-bar"
            className="rounded-lg border border-slate-800 bg-slate-900/95 p-4 text-slate-100"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                {t(lang, 'armory.equippedLoadoutSkins')}
              </h4>
              <span className="text-[11px] text-slate-400">
                {t(lang, 'armory.inspectSkin')} (Fullscreen 3D)
              </span>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
              {WEAPON_LIST.map((w) => {
                const skinId = equippedWeaponSkins[w.id];
                const slotSkin = WEAPON_SKINS.find((s) => s.id === skinId) ?? WEAPON_SKINS[0];
                const meta = RARITY_META[slotSkin.rarity];

                return (
                  <button
                    key={w.id}
                    type="button"
                    data-testid={`equipped-slot-${w.id}`}
                    onClick={() => handleInspectSkin(slotSkin, w.id)}
                    className="flex w-full items-center justify-between gap-2 rounded-md border border-slate-800 bg-slate-950/85 px-3 py-2.5 text-left transition-colors hover:border-cyan-400 cursor-pointer"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <div
                        className="h-8 w-8 shrink-0 rounded border border-white/25"
                        style={{ background: getSkinSwatchBackground(slotSkin) }}
                      />
                      <div className="min-w-0">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          {WEAPON_SHORT_LABELS[w.id]}
                        </div>
                        <div
                          className="truncate text-xs font-bold"
                          style={{ color: meta.colorHex }}
                        >
                          {slotSkin.name}
                        </div>
                      </div>
                    </div>
                    <Eye className="h-3.5 w-3.5 shrink-0 text-cyan-400" />
                  </button>
                );
              })}
            </div>
          </section>

          {/* Owned Weapon Skins */}
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {t(lang, 'armory.ownedFinishes')} ({visibleOwnedWeaponSkins.length})
              </h4>
            </div>
            {renderSkinFilterBar()}
            {visibleOwnedWeaponSkins.length > 0 ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {visibleOwnedWeaponSkins.map(renderSkinCard)}
              </div>
            ) : (
              <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-4 text-xs text-slate-600 dark:text-slate-400">
                {t(lang, 'armory.noOwnedHint')}
              </div>
            )}
          </section>

          {/* Owned Avatar Armor & Visors */}
          <section>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Avatar Armor & Visors ({ownedAvatarSkins.length} / {AVATAR_SKINS.length})
            </h4>
            {renderAvatarSkinsGrid(ownedAvatarSkins)}
          </section>
        </div>
      )}

      {/* UNDER-TAB 2: ALL SKINS CATALOG */}
      {armoryTab === 'all_skins' && (
        <div data-testid="armory-panel-all_skins" className="space-y-5">
          <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {t(lang, 'armory.finishes')} ({visibleAllWeaponSkins.length})
              </h4>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {profile.unlockedWeaponSkins.length} / {WEAPON_SKINS.length} Unlocked
              </span>
            </div>
            {renderSkinFilterBar()}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {visibleAllWeaponSkins.map(renderSkinCard)}
            </div>
          </section>

          <section>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Avatar Armor & Visors ({AVATAR_SKINS.length})
            </h4>
            {renderAvatarSkinsGrid(AVATAR_SKINS)}
          </section>
        </div>
      )}

      {/* UNDER-TAB 3: SUPPLY CHESTS */}
      {armoryTab === 'chests' && (
        <section data-testid="armory-panel-chests" className="space-y-4">
          <div
            data-testid="supply-chests-section"
            className="flex items-center justify-between gap-2"
          >
            <h4 className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-200">
              <Package className="h-4 w-4 text-amber-500" />
              <span>{t(lang, 'armory.chests')}</span>
            </h4>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {profile.unlockedWeaponSkins.length} / {WEAPON_SKINS.length} Unlocked
            </span>
          </div>

          {lastChestResult?.ok && lastChestResult.skin && (
            <div
              data-testid="chest-drop-reveal"
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border-2 bg-slate-900/95 p-3.5 text-slate-100 shadow-lg"
              style={{
                borderColor: RARITY_META[lastChestResult.skin.rarity].borderHex,
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="h-12 w-12 shrink-0 rounded-md border border-white/30 shadow-inner"
                  style={{ background: getSkinSwatchBackground(lastChestResult.skin) }}
                />
                <div>
                  <div className="flex items-center gap-2">
                    <Sparkles
                      className="h-3.5 w-3.5"
                      style={{ color: RARITY_META[lastChestResult.skin.rarity].colorHex }}
                    />
                    <span
                      className="text-xs font-bold uppercase tracking-wider"
                      style={{ color: RARITY_META[lastChestResult.skin.rarity].colorHex }}
                    >
                      {RARITY_META[lastChestResult.skin.rarity].label}
                    </span>
                    <span className="text-xs text-slate-300">
                      · {WEAPON_SHORT_LABELS[lastChestResult.skin.signatureWeapon]}
                    </span>
                  </div>
                  <div
                    className="text-base font-bold"
                    style={{ color: RARITY_META[lastChestResult.skin.rarity].colorHex }}
                  >
                    {lastChestResult.skin.name}
                  </div>
                  {lastChestResult.isDuplicate && (
                    <div className="text-xs font-medium text-amber-300">
                      {t(lang, 'armory.duplicateRefund')}: +{lastChestResult.refundCredits} CR
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (lastChestResult.skin) {
                      handleInspectSkin(lastChestResult.skin);
                    }
                  }}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-100 hover:bg-slate-700 cursor-pointer"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>{t(lang, 'armory.inspectSkin')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (lastChestResult.skin) {
                      onActionSkin(
                        'weapon_skin',
                        lastChestResult.skin.id,
                        lastChestResult.skin.signatureWeapon
                      );
                    }
                  }}
                  className="rounded-lg bg-cyan-500 px-3.5 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-400 cursor-pointer"
                >
                  {equippedWeaponSkins[lastChestResult.skin.signatureWeapon] === lastChestResult.skin.id
                    ? t(lang, 'cta.equipped')
                    : t(lang, 'armory.equipNow')}
                </button>
              </div>
            </div>
          )}

          {lastChestResult && !lastChestResult.ok && lastChestResult.reason && (
            <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3.5 py-2 text-xs font-medium text-rose-500">
              {lastChestResult.reason}
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
            {CHEST_LIST.map((chest) => {
              const rarityRows = getChestRarityPercentages(chest.id).filter(
                (r) => r.chancePct > 0
              );
              const weaponOdds = getChestWeaponPercentages(chest.id);
              const canAfford = profile.credits >= chest.price;
              const accentHex =
                chest.id === 'prism_overlord'
                  ? RARITY_META.legendary.borderHex
                  : chest.id === 'apex_vault'
                  ? RARITY_META.mythic.borderHex
                  : RARITY_META.epic.borderHex;

              return (
                <div
                  key={chest.id}
                  data-testid={`chest-card-${chest.id}`}
                  className="flex flex-col justify-between rounded-lg border bg-slate-50 dark:bg-slate-900/80 p-4"
                  style={{ borderColor: accentHex }}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h5 className="text-sm font-bold text-slate-900 dark:text-white">
                          {chest.name}
                        </h5>
                        <p className="mt-0.5 text-[11px] text-slate-600 dark:text-slate-400">
                          {chest.subtitle}
                        </p>
                      </div>
                      <span className="shrink-0 rounded bg-amber-500/15 px-2 py-0.5 font-mono text-xs font-bold text-amber-600 dark:text-amber-300">
                        {chest.price} CR
                      </span>
                    </div>

                    <div className="mt-3">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        {t(lang, 'armory.rarityOdds')}
                      </div>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {rarityRows.map((row) => {
                          const meta = RARITY_META[row.rarity];
                          return (
                            <span
                              key={row.rarity}
                              className="inline-flex items-center gap-1 rounded border bg-slate-900/95 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums"
                              style={{
                                borderColor: meta.borderHex,
                                color: meta.colorHex,
                              }}
                            >
                              <span>{meta.label}</span>
                              <span className="font-mono">{row.chancePct}%</span>
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    <div className="mt-3 border-t border-slate-200/80 dark:border-slate-800 pt-2.5">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        {t(lang, 'armory.weaponOdds')}
                      </div>
                      <div className="mt-1 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
                        {WEAPON_LIST.map((w) => (
                          <div
                            key={w.id}
                            className="flex items-center justify-between text-slate-600 dark:text-slate-300"
                          >
                            <span className="truncate">{WEAPON_SHORT_LABELS[w.id]}</span>
                            <span className="font-mono font-semibold text-cyan-600 dark:text-cyan-400">
                              {weaponOdds[w.id]}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    data-testid={`open-chest-${chest.id}`}
                    disabled={!canAfford}
                    onClick={() => handleChestClick(chest.id)}
                    className="mt-4 w-full rounded-lg bg-amber-500 px-3 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    {t(lang, 'armory.openChest')} · {chest.price} CR
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Fullscreen 3D Weapon Finish Inspector Modal */}
      <WeaponSkinPreviewCanvas
        isOpen={inspectorOpen}
        weaponId={inspectedWeaponId}
        skin={inspectedSkin}
        avatarSkin={equippedAvatarSkin}
        unlocked={profile.unlockedWeaponSkins.includes(inspectedSkin.id)}
        equippedOnSlot={equippedWeaponSkins[inspectedWeaponId] === inspectedSkin.id}
        lang={lang}
        onChangeWeapon={(wId) => setInspectedWeaponId(wId)}
        onEquipOrUnlock={(skin, wId) => onActionSkin('weapon_skin', skin.id, wId)}
        onClose={() => setInspectorOpen(false)}
      />
    </div>
  );
};
