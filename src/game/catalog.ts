import {
  AvatarSkinDef,
  BattlePassTier,
  ChestDef,
  ChestId,
  GameSettings,
  Keybinds,
  MapDef,
  MapId,
  MapObstacle,
  MissionDef,
  PlayerCloudProfile,
  PlayerMissionsState,
  RarityMetaDef,
  SkinRarity,
  WeaponDef,
  WeaponId,
  WeaponSkinDef,
  WeaponSkinPattern,
} from './types';

export const WEAPONS: Record<WeaponId, WeaponDef> = {
  pulse_carbine: {
    id: 'pulse_carbine',
    nameKey: 'weapon.pulse_carbine.name',
    roleKey: 'weapon.pulse_carbine.role',
    damage: 22,
    pellets: 1,
    magSize: 30,
    reloadTimeMs: 1450,
    ammoStyle: 'gold_bullet',
    fireIntervalMs: 145,
    energyCost: 0,
    maxEnergy: 100,
    rechargePerSec: 34,
    maxRange: 120,
    spread: 0.008,
    moveMultiplier: 1.0,
    beamColor: '#fbbf24',
    zoomFov: 60,
  },
  volt_scatter: {
    id: 'volt_scatter',
    nameKey: 'weapon.volt_scatter.name',
    roleKey: 'weapon.volt_scatter.role',
    damage: 13,
    pellets: 7,
    magSize: 5,
    reloadTimeMs: 1650,
    ammoStyle: 'gray_pellets',
    fireIntervalMs: 520,
    energyCost: 0,
    maxEnergy: 100,
    rechargePerSec: 32,
    maxRange: 46,
    spread: 0.065,
    moveMultiplier: 0.96,
    beamColor: '#94a3b8',
    zoomFov: 66,
  },
  helios_rail: {
    id: 'helios_rail',
    nameKey: 'weapon.helios_rail.name',
    roleKey: 'weapon.helios_rail.role',
    damage: 74,
    pellets: 1,
    magSize: 3,
    reloadTimeMs: 1950,
    ammoStyle: 'rail_lance',
    fireIntervalMs: 780,
    energyCost: 0,
    maxEnergy: 100,
    rechargePerSec: 28,
    maxRange: 190,
    spread: 0.0005,
    moveMultiplier: 0.92,
    beamColor: '#f43f5e',
    zoomFov: 44,
  },
  arc_repeater: {
    id: 'arc_repeater',
    nameKey: 'weapon.arc_repeater.name',
    roleKey: 'weapon.arc_repeater.role',
    damage: 14,
    pellets: 1,
    magSize: 35,
    reloadTimeMs: 1350,
    ammoStyle: 'emerald_dart',
    fireIntervalMs: 88,
    energyCost: 0,
    maxEnergy: 100,
    rechargePerSec: 40,
    maxRange: 84,
    spread: 0.018,
    moveMultiplier: 1.1,
    beamColor: '#34d399',
    zoomFov: 64,
  },
};

export const WEAPON_LIST: WeaponDef[] = [
  WEAPONS.pulse_carbine,
  WEAPONS.volt_scatter,
  WEAPONS.helios_rail,
  WEAPONS.arc_repeater,
];

export const RARITY_ORDER: SkinRarity[] = [
  'common',
  'uncommon',
  'rare',
  'epic',
  'mythic',
  'legendary',
];

export const RARITY_META: Record<SkinRarity, RarityMetaDef> = {
  common: {
    id: 'common',
    label: 'Common',
    colorHex: '#cbd5e1',
    badgeBg: 'rgba(148, 163, 184, 0.16)',
    borderHex: '#94a3b8',
    salvageCredits: 150,
  },
  uncommon: {
    id: 'uncommon',
    label: 'Uncommon',
    colorHex: '#22c55e',
    badgeBg: 'rgba(34, 197, 94, 0.16)',
    borderHex: '#22c55e',
    salvageCredits: 250,
  },
  rare: {
    id: 'rare',
    label: 'Rare',
    colorHex: '#3b82f6',
    badgeBg: 'rgba(59, 130, 246, 0.16)',
    borderHex: '#3b82f6',
    salvageCredits: 450,
  },
  epic: {
    id: 'epic',
    label: 'Epic',
    colorHex: '#d946ef',
    badgeBg: 'rgba(217, 70, 239, 0.16)',
    borderHex: '#d946ef',
    salvageCredits: 750,
  },
  mythic: {
    id: 'mythic',
    label: 'Mythic',
    colorHex: '#ef4444',
    badgeBg: 'rgba(239, 68, 68, 0.16)',
    borderHex: '#ef4444',
    salvageCredits: 1100,
  },
  legendary: {
    id: 'legendary',
    label: 'Legendary',
    colorHex: '#eab308',
    badgeBg: 'rgba(234, 179, 8, 0.18)',
    borderHex: '#facc15',
    salvageCredits: 1600,
  },
};

const CORE_WEAPON_SKINS: WeaponSkinDef[] = [
  {
    id: 'cobalt_standard',
    name: 'Cobalt Tactical',
    rarity: 'common',
    signatureWeapon: 'pulse_carbine',
    pattern: 'solid_tech',
    primaryColor: '#1e293b',
    secondaryColor: '#475569',
    emissiveColor: '#06b6d4',
    gripColor: '#0f172a',
    scopeColor: '#334155',
    metalness: 0.72,
    roughness: 0.34,
    price: 0,
    unlockSource: 'starter',
    chestEligible: true,
    dropWeight: 18,
  },
  {
    id: 'rainbow_spectrum',
    name: 'Rainbow Spectrum',
    rarity: 'epic',
    signatureWeapon: 'arc_repeater',
    pattern: 'rainbow',
    primaryColor: '#ec4899',
    secondaryColor: '#38bdf8',
    emissiveColor: '#a855f7',
    gripColor: '#18181b',
    scopeColor: '#22d3ee',
    metalness: 0.85,
    roughness: 0.18,
    price: 400,
    unlockSource: 'store',
    chestEligible: true,
    dropWeight: 13,
  },
  {
    id: 'royal_walnut',
    name: 'Golden Walnut',
    rarity: 'mythic',
    signatureWeapon: 'volt_scatter',
    pattern: 'gold_walnut',
    primaryColor: '#eab308',
    secondaryColor: '#fef08a',
    emissiveColor: '#f59e0b',
    gripColor: '#6b3e26',
    scopeColor: '#7c4728',
    metalness: 0.94,
    roughness: 0.16,
    price: 550,
    unlockSource: 'store',
    chestEligible: true,
    dropWeight: 11,
  },
  {
    id: 'solar_flare',
    name: 'Solar Circuit',
    rarity: 'rare',
    signatureWeapon: 'pulse_carbine',
    pattern: 'circuit',
    primaryColor: '#451a03',
    secondaryColor: '#d97706',
    emissiveColor: '#f59e0b',
    gripColor: '#292524',
    scopeColor: '#92400e',
    metalness: 0.82,
    roughness: 0.26,
    price: 300,
    unlockSource: 'store',
    chestEligible: true,
    dropWeight: 15,
  },
  {
    id: 'carbon_phantom',
    name: 'Carbon Hex',
    rarity: 'epic',
    signatureWeapon: 'volt_scatter',
    pattern: 'hex_carbon',
    primaryColor: '#0f172a',
    secondaryColor: '#334155',
    emissiveColor: '#f43f5e',
    gripColor: '#09090b',
    scopeColor: '#1e293b',
    metalness: 0.52,
    roughness: 0.48,
    price: 450,
    unlockSource: 'store',
    chestEligible: true,
    dropWeight: 12,
  },
  {
    id: 'emerald_circuit',
    name: 'Emerald Circuit',
    rarity: 'rare',
    signatureWeapon: 'arc_repeater',
    pattern: 'circuit',
    primaryColor: '#064e3b',
    secondaryColor: '#0f766e',
    emissiveColor: '#10b981',
    gripColor: '#111827',
    scopeColor: '#047857',
    metalness: 0.78,
    roughness: 0.28,
    price: 0,
    unlockSource: 'battlepass',
    chestEligible: true,
    dropWeight: 14,
  },
  {
    id: 'obsidian_gold',
    name: 'Obsidian Gold',
    rarity: 'mythic',
    signatureWeapon: 'helios_rail',
    pattern: 'gold_walnut',
    primaryColor: '#18181b',
    secondaryColor: '#eab308',
    emissiveColor: '#fde047',
    gripColor: '#4a2c18',
    scopeColor: '#ca8a04',
    metalness: 0.92,
    roughness: 0.18,
    price: 750,
    unlockSource: 'store',
    chestEligible: true,
    dropWeight: 9,
  },
  {
    id: 'prism_relic',
    name: 'Prism Relic',
    rarity: 'legendary',
    signatureWeapon: 'helios_rail',
    pattern: 'prism_holo',
    primaryColor: '#e2e8f0',
    secondaryColor: '#6366f1',
    emissiveColor: '#38bdf8',
    gripColor: '#1e1b4b',
    scopeColor: '#818cf8',
    metalness: 0.95,
    roughness: 0.14,
    price: 0,
    unlockSource: 'easter_egg',
    chestEligible: false,
    dropWeight: 0,
  },
];

type SkinSeedTuple = [
  id: string,
  name: string,
  rarity: SkinRarity,
  signatureWeapon: WeaponId,
  pattern: WeaponSkinPattern,
  primary: string,
  secondary: string,
  emissive: string,
  grip: string,
  scope: string,
  dropWeight: number
];

const EXTRA_CHEST_SKINS: SkinSeedTuple[] = [
  // Common (14 new + cobalt_standard = 15 total) — diverse matte/tactical finishes (not restricted to gray)
  ['cmn_slate_issue', 'Slate Standard', 'common', 'pulse_carbine', 'solid_tech', '#334155', '#64748b', '#cbd5e1', '#1e293b', '#475569', 18],
  ['cmn_ash_drifter', 'Desert Khaki', 'common', 'arc_repeater', 'solid_tech', '#786952', '#a8987d', '#e7dfc8', '#292524', '#57534e', 17],
  ['cmn_graphite_line', 'Graphite Carbon', 'common', 'pulse_carbine', 'hex_carbon', '#27272a', '#52525b', '#94a3b8', '#09090b', '#3f3f46', 16],
  ['cmn_chalk_dust', 'Arctic Chalk', 'common', 'volt_scatter', 'solid_tech', '#cbd5e1', '#94a3b8', '#38bdf8', '#334155', '#64748b', 12],
  ['cmn_pewter_mesh', 'Navy Steel', 'common', 'arc_repeater', 'hex_carbon', '#1e3a5f', '#64748b', '#93c5fd', '#0f172a', '#334155', 16],
  ['cmn_iron_primer', 'Rust Primer', 'common', 'pulse_carbine', 'solid_tech', '#6c2d1f', '#9a4633', '#fca5a5', '#1c1917', '#44403c', 18],
  ['cmn_fog_trooper', 'Olive Patrol', 'common', 'volt_scatter', 'solid_tech', '#3f4f32', '#6b7c59', '#d9f99d', '#1c1917', '#4d5b3e', 11],
  ['cmn_basalt_frame', 'Basalt Frame', 'common', 'helios_rail', 'solid_tech', '#262626', '#525252', '#a3a3a3', '#171717', '#404040', 8],
  ['cmn_zinc_oxide', 'Silver Oxide', 'common', 'arc_repeater', 'solid_tech', '#94a3b8', '#e2e8f0', '#38bdf8', '#334155', '#64748b', 15],
  ['cmn_flint_matte', 'Sandstone Matte', 'common', 'pulse_carbine', 'solid_tech', '#92785b', '#c4a882', '#fde68a', '#292524', '#57534e', 17],
  ['cmn_concrete_stripe', 'Urban Stripe', 'common', 'volt_scatter', 'hex_carbon', '#52525b', '#d4d4d8', '#f4f4f5', '#18181b', '#3f3f46', 11],
  ['cmn_nickel_bore', 'Teal Bore', 'common', 'helios_rail', 'solid_tech', '#1f4e5b', '#7a9ca6', '#99f6e4', '#0f172a', '#334155', 7],
  ['cmn_titanium_primer', 'Raw Titanium', 'common', 'pulse_carbine', 'solid_tech', '#475569', '#cbd5e1', '#e2e8f0', '#0f172a', '#64748b', 16],
  ['cmn_smoke_guard', 'Burgundy Field', 'common', 'arc_repeater', 'solid_tech', '#581c28', '#8c3b4a', '#fda4af', '#18181b', '#44403c', 15],

  // Uncommon (15 total) — varied finishes (teal, amber, slate-rose, olive, cobalt)
  ['unc_moss_tactical', 'Moss Tactical', 'uncommon', 'pulse_carbine', 'solid_tech', '#14532d', '#16a34a', '#4ade80', '#052e16', '#15803d', 16],
  ['unc_pine_vector', 'Copper Vector', 'uncommon', 'arc_repeater', 'circuit', '#7c2d12', '#ea580c', '#fdba74', '#1c1917', '#9a3412', 16],
  ['unc_viper_grid', 'Ocean Grid', 'uncommon', 'volt_scatter', 'hex_carbon', '#0c4a6e', '#0284c7', '#7dd3fc', '#0f172a', '#0369a1', 12],
  ['unc_jade_alloy', 'Jade Alloy', 'uncommon', 'pulse_carbine', 'solid_tech', '#065f46', '#34d399', '#a7f3d0', '#064e3b', '#059669', 15],
  ['unc_ranger_leaf', 'Dusk Ranger', 'uncommon', 'helios_rail', 'solid_tech', '#4c1d95', '#8b5cf6', '#c4b5fd', '#1e1b4b', '#6d28d9', 9],
  ['unc_acid_stripe', 'Acid Stripe', 'uncommon', 'arc_repeater', 'hex_carbon', '#365314', '#84cc16', '#bef264', '#1a2e05', '#4d7c0f', 15],
  ['unc_mint_spark', 'Blush Spark', 'uncommon', 'pulse_carbine', 'circuit', '#831843', '#f472b6', '#fbcfe8', '#18181b', '#be185d', 14],
  ['unc_clover_coat', 'Alpine White', 'uncommon', 'volt_scatter', 'solid_tech', '#e2e8f0', '#64748b', '#22d3ee', '#1e293b', '#475569', 12],
  ['unc_fern_ops', 'Fern Ops', 'uncommon', 'arc_repeater', 'solid_tech', '#14532d', '#22c55e', '#4ade80', '#09090b', '#166534', 15],
  ['unc_bunker_olive', 'Amber Bunker', 'uncommon', 'pulse_carbine', 'hex_carbon', '#713f12', '#eab308', '#fef08a', '#1c1917', '#a16207', 14],
  ['unc_seafoam_pulse', 'Seafoam Pulse', 'uncommon', 'volt_scatter', 'circuit', '#0f766e', '#2dd4bf', '#99f6e4', '#134e4a', '#14b8a6', 11],
  ['unc_cactus_edge', 'Crimson Edge', 'uncommon', 'helios_rail', 'hex_carbon', '#7f1d1d', '#ef4444', '#fca5a5', '#18181b', '#b91c1c', 8],
  ['unc_mantis_shell', 'Mantis Shell', 'uncommon', 'arc_repeater', 'circuit', '#1e3a1e', '#22c55e', '#4ade80', '#0f172a', '#15803d', 14],
  ['unc_canopy_shade', 'Cobalt Shade', 'uncommon', 'pulse_carbine', 'solid_tech', '#172554', '#3b82f6', '#93c5fd', '#0f172a', '#1d4ed8', 15],
  ['unc_verdigris_rig', 'Verdigris Rig', 'uncommon', 'volt_scatter', 'solid_tech', '#134e4a', '#10b981', '#6ee7b7', '#042f2e', '#0f766e', 12],

  // Rare (13 new + solar_flare + emerald_circuit = 15 total) — diverse finishes across spectrum
  ['rar_azure_surge', 'Azure Surge', 'rare', 'pulse_carbine', 'circuit', '#1e3a8a', '#3b82f6', '#60a5fa', '#0f172a', '#2563eb', 15],
  ['rar_frost_cobalt', 'Arctic Titanium', 'rare', 'helios_rail', 'solid_tech', '#f1f5f9', '#64748b', '#38bdf8', '#1e293b', '#334155', 11],
  ['rar_storm_tide', 'Rosewood Storm', 'rare', 'volt_scatter', 'hex_carbon', '#881337', '#fb7185', '#fda4af', '#18181b', '#be123c', 13],
  ['rar_cerulean_arc', 'Cerulean Arc', 'rare', 'arc_repeater', 'circuit', '#1e40af', '#2563eb', '#38bdf8', '#0f172a', '#1d4ed8', 14],
  ['rar_deep_ocean', 'Jungle Alloy', 'rare', 'volt_scatter', 'solid_tech', '#064e3b', '#10b981', '#6ee7b7', '#09090b', '#047857', 13],
  ['rar_glacial_edge', 'Glacial Edge', 'rare', 'helios_rail', 'circuit', '#075985', '#38bdf8', '#7dd3fc', '#0c4a6e', '#0284c7', 11],
  ['rar_indigo_wave', 'Violet Carbon', 'rare', 'pulse_carbine', 'hex_carbon', '#3b0764', '#a855f7', '#e879f9', '#09090b', '#7e22ce', 14],
  ['rar_hydro_coil', 'Tangerine Coil', 'rare', 'arc_repeater', 'circuit', '#7c2d12', '#f97316', '#fde047', '#1c1917', '#c2410c', 13],
  ['rar_pacific_drift', 'Pacific Drift', 'rare', 'volt_scatter', 'solid_tech', '#1e3a8a', '#0ea5e9', '#bae6fd', '#0f172a', '#2563eb', 12],
  ['rar_sapphire_plate', 'Obsidian Scarlet', 'rare', 'helios_rail', 'hex_carbon', '#18181b', '#dc2626', '#f87171', '#09090b', '#991b1b', 10],
  ['rar_cyclone_blue', 'Mint Cyclone', 'rare', 'arc_repeater', 'solid_tech', '#115e59', '#2dd4bf', '#ccfbf1', '#0f172a', '#0d9488', 13],
  ['rar_sky_lancer', 'Sky Lancer', 'rare', 'pulse_carbine', 'solid_tech', '#1d4ed8', '#38bdf8', '#e0f2fe', '#172554', '#3b82f6', 14],
  ['rar_polar_vault', 'Amber Vault', 'rare', 'volt_scatter', 'circuit', '#451a03', '#f59e0b', '#fde68a', '#1c1917', '#b45309', 12],

  // Epic (13 new + carbon_phantom + rainbow_spectrum = 15 total) — vibrant mixed palettes
  ['epc_nebula_pink', 'Nebula Rose', 'epic', 'arc_repeater', 'rainbow', '#701a75', '#ec4899', '#f472b6', '#2e1065', '#be185d', 14],
  ['epc_amethyst_core', 'Cyber Cyan', 'epic', 'helios_rail', 'circuit', '#083344', '#06b6d4', '#67e8f9', '#0f172a', '#0e7490', 13],
  ['epc_orchid_pulse', 'Emerald Venom', 'epic', 'volt_scatter', 'hex_carbon', '#052e16', '#22c55e', '#86efac', '#09090b', '#15803d', 12],
  ['epc_violet_mirage', 'Violet Mirage', 'epic', 'pulse_carbine', 'rainbow', '#3b0764', '#a855f7', '#e879f9', '#1e1b4b', '#9333ea', 13],
  ['epc_magenta_spark', 'Solar Blaze', 'epic', 'arc_repeater', 'circuit', '#7c2d12', '#f97316', '#fbbf24', '#18181b', '#ea580c', 13],
  ['epc_twilight_flux', 'Twilight Flux', 'epic', 'helios_rail', 'hex_carbon', '#2e1065', '#7e22ce', '#d946ef', '#09090b', '#6b21a8', 14],
  ['epc_velvet_prism', 'Glacier Ivory', 'epic', 'volt_scatter', 'prism_holo', '#f8fafc', '#38bdf8', '#a5f3fc', '#1e293b', '#0284c7', 12],
  ['epc_cyber_blossom', 'Sakura Blossom', 'epic', 'pulse_carbine', 'circuit', '#fdf2f8', '#ec4899', '#f472b6', '#27272a', '#db2777', 12],
  ['epc_astral_plum', 'Crimson Spec', 'epic', 'helios_rail', 'solid_tech', '#7f1d1d', '#ef4444', '#fda4af', '#18181b', '#b91c1c', 13],
  ['epc_plasma_berry', 'Cobalt Mirage', 'epic', 'volt_scatter', 'circuit', '#1e3a8a', '#60a5fa', '#22d3ee', '#0f172a', '#2563eb', 12],
  ['epc_starlight_iris', 'Starlight Iris', 'epic', 'arc_repeater', 'hex_carbon', '#3b0764', '#9333ea', '#c084fc', '#09090b', '#7e22ce', 12],
  ['epc_hyper_rose', 'Titanium Gold', 'epic', 'pulse_carbine', 'solid_tech', '#334155', '#eab308', '#fef08a', '#18181b', '#a16207', 11],
  ['epc_void_lilac', 'Void Lilac', 'epic', 'helios_rail', 'rainbow', '#312e81', '#a855f7', '#e879f9', '#09090b', '#7c3aed', 13],

  // Mythic (13 new + obsidian_gold + royal_walnut = 15 total) — varied high-contrast prestige finishes
  ['myt_crimson_fang', 'Crimson Fang', 'mythic', 'helios_rail', 'hex_carbon', '#450a0a', '#dc2626', '#f87171', '#18181b', '#b91c1c', 14],
  ['myt_blood_moon', 'Sapphire Forge', 'mythic', 'volt_scatter', 'circuit', '#0f172a', '#2563eb', '#38bdf8', '#09090b', '#1d4ed8', 13],
  ['myt_inferno_crest', 'Inferno Crest', 'mythic', 'pulse_carbine', 'gold_walnut', '#450a0a', '#f97316', '#ef4444', '#292524', '#991b1b', 11],
  ['myt_scarlet_vow', 'Orchid Sovereign', 'mythic', 'arc_repeater', 'circuit', '#500724', '#ec4899', '#f472b6', '#18181b', '#be185d', 12],
  ['myt_ruby_protocol', 'Ruby Protocol', 'mythic', 'helios_rail', 'prism_holo', '#4c0519', '#f43f5e', '#fda4af', '#09090b', '#e11d48', 15],
  ['myt_ember_king', 'Jade Emperor', 'mythic', 'volt_scatter', 'gold_walnut', '#022c22', '#10b981', '#6ee7b7', '#3f2311', '#047857', 13],
  ['myt_hellfire_weave', 'Phantom Violet', 'mythic', 'pulse_carbine', 'hex_carbon', '#18181b', '#8b5cf6', '#d946ef', '#09090b', '#6d28d9', 10],
  ['myt_carnelian_core', 'Arctic Pearl', 'mythic', 'helios_rail', 'circuit', '#f8fafc', '#cbd5e1', '#06b6d4', '#1e293b', '#475569', 14],
  ['myt_redline_apex', 'Redline Apex', 'mythic', 'arc_repeater', 'hex_carbon', '#18181b', '#dc2626', '#ff4d4d', '#09090b', '#991b1b', 11],
  ['myt_magma_breaker', 'Magma Copper', 'mythic', 'volt_scatter', 'prism_holo', '#431407', '#fb923c', '#fde047', '#1c1917', '#c2410c', 13],
  ['myt_garnet_edge', 'Teal Hydra', 'mythic', 'helios_rail', 'solid_tech', '#042f2e', '#14b8a6', '#5eead4', '#0f172a', '#0f766e', 14],
  ['myt_blaze_daemon', 'Blaze Daemon', 'mythic', 'pulse_carbine', 'circuit', '#3b0a0a', '#e11d48', '#fb7185', '#18181b', '#be123c', 10],
  ['myt_crimson_nova', 'Neon Prism', 'mythic', 'volt_scatter', 'rainbow', '#312e81', '#ec4899', '#22d3ee', '#09090b', '#6366f1', 12],

  // Legendary (15 chest-eligible + prism_relic = 16 total) — Yellow NAME only; weapon paint spans Pink, Cyan, Emerald, Violet, Pearl, Crimson & Gold!
  ['aurum_sovereign', 'Aurum Sovereign', 'legendary', 'helios_rail', 'gold_walnut', '#facc15', '#fef08a', '#fde047', '#3f2311', '#ca8a04', 18],
  ['leg_sunfire_crown', 'Neon Orchid Crown', 'legendary', 'volt_scatter', 'prism_holo', '#ec4899', '#fbcfe8', '#f472b6', '#1c1917', '#db2777', 14],
  ['leg_solaris_prime', 'Sakura Hypernova', 'legendary', 'pulse_carbine', 'rainbow', '#db2777', '#f9a8d4', '#38bdf8', '#18181b', '#be185d', 11],
  ['leg_golden_pharaoh', 'Golden Pharaoh', 'legendary', 'helios_rail', 'gold_walnut', '#78350f', '#facc15', '#fde047', '#451a03', '#b45309', 16],
  ['leg_ambrosia_rail', 'Aether Cyan', 'legendary', 'volt_scatter', 'circuit', '#083344', '#06b6d4', '#67e8f9', '#0f172a', '#0284c7', 13],
  ['leg_midas_touch', 'Midas Touch', 'legendary', 'arc_repeater', 'gold_walnut', '#f59e0b', '#fef08a', '#fde047', '#422006', '#d97706', 9],
  ['leg_radiant_halo', 'Glacier Diamond', 'legendary', 'helios_rail', 'prism_holo', '#f8fafc', '#38bdf8', '#22d3ee', '#1e293b', '#0284c7', 15],
  ['leg_citrine_rex', 'Emerald Sovereign', 'legendary', 'volt_scatter', 'hex_carbon', '#022c22', '#10b981', '#34d399', '#09090b', '#059669', 12],
  ['leg_electrum_vault', 'Astral Amethyst', 'legendary', 'pulse_carbine', 'prism_holo', '#4c1d95', '#a855f7', '#e879f9', '#1e1b4b', '#7c3aed', 10],
  ['leg_starburst_gold', 'Chroma Starburst', 'legendary', 'helios_rail', 'rainbow', '#6366f1', '#ec4899', '#22d3ee', '#18181b', '#7c3aed', 15],
  ['leg_imperial_flare', 'Scarlet Emperor', 'legendary', 'volt_scatter', 'hex_carbon', '#450a0a', '#ef4444', '#fb7185', '#18181b', '#b91c1c', 13],
  ['leg_amber_monarch', 'Rose Quartz', 'legendary', 'arc_repeater', 'prism_holo', '#9d174d', '#f472b6', '#fdf2f8', '#1c1917', '#db2777', 8],
  ['leg_zeus_spark', 'Cobalt Tempest', 'legendary', 'helios_rail', 'circuit', '#172554', '#3b82f6', '#93c5fd', '#0f172a', '#1d4ed8', 15],
  ['leg_gilded_horizon', 'Gilded Horizon', 'legendary', 'volt_scatter', 'gold_walnut', '#92400e', '#fde047', '#fef08a', '#292524', '#d97706', 12],
  ['leg_celestial_gold', 'Pearl Valkyrie', 'legendary', 'pulse_carbine', 'prism_holo', '#f1f5f9', '#f43f5e', '#fbbf24', '#1e1b4b', '#be123c', 10],
];

export const WEAPON_SKINS: WeaponSkinDef[] = [
  ...CORE_WEAPON_SKINS,
  ...EXTRA_CHEST_SKINS.map(
    ([
      id,
      name,
      rarity,
      signatureWeapon,
      pattern,
      primaryColor,
      secondaryColor,
      emissiveColor,
      gripColor,
      scopeColor,
      dropWeight,
    ]): WeaponSkinDef => ({
      id,
      name,
      rarity,
      signatureWeapon,
      pattern,
      primaryColor,
      secondaryColor,
      emissiveColor,
      gripColor,
      scopeColor,
      metalness:
        rarity === 'legendary' || rarity === 'mythic'
          ? 0.92
          : rarity === 'epic'
          ? 0.84
          : rarity === 'rare'
          ? 0.76
          : 0.58,
      roughness:
        rarity === 'legendary' || rarity === 'mythic'
          ? 0.16
          : rarity === 'epic'
          ? 0.22
          : rarity === 'rare'
          ? 0.28
          : 0.42,
      price: 0,
      unlockSource: 'chest',
      chestEligible: true,
      dropWeight,
    })
  ),
];

export const CHEST_CATALOG: Record<ChestId, ChestDef> = {
  vanguard_crate: {
    id: 'vanguard_crate',
    name: 'Vanguard Supply Chest',
    subtitle: 'Common to Epic finishes · Balanced weapon pool',
    price: 1000,
    rarityChances: {
      common: 42,
      uncommon: 33,
      rare: 17,
      epic: 8,
      mythic: 0,
      legendary: 0,
    },
  },
  apex_vault: {
    id: 'apex_vault',
    name: 'Apex Crimson Chest',
    subtitle: 'Up to Mythic + 0.5% Aurum Sovereign Legendary',
    price: 1500,
    rarityChances: {
      common: 24.5,
      uncommon: 28,
      rare: 27,
      epic: 14,
      mythic: 6,
      legendary: 0.5,
    },
    featuredLegendarySkinId: 'aurum_sovereign',
  },
  prism_overlord: {
    id: 'prism_overlord',
    name: 'Prism Overlord Chest',
    subtitle: 'Guaranteed Rare – Legendary elite weapon finishes',
    price: 2000,
    rarityChances: {
      common: 0,
      uncommon: 0,
      rare: 52,
      epic: 31,
      mythic: 13,
      legendary: 4,
    },
  },
};

export const CHEST_LIST: ChestDef[] = [
  CHEST_CATALOG.vanguard_crate,
  CHEST_CATALOG.apex_vault,
  CHEST_CATALOG.prism_overlord,
];

export const AVATAR_SKINS: AvatarSkinDef[] = [
  {
    id: 'vanguard_cyan',
    name: 'Vanguard Cyan',
    armorColor: '#1e293b',
    clothingColor: '#334155',
    trimColor: '#38bdf8',
    visorColor: '#06b6d4',
    price: 0,
    unlockSource: 'starter',
  },
  {
    id: 'crimson_striker',
    name: 'Crimson Striker',
    armorColor: '#27272a',
    clothingColor: '#450a0a',
    trimColor: '#ef4444',
    visorColor: '#fb7185',
    price: 350,
    unlockSource: 'store',
  },
  {
    id: 'titanium_prime',
    name: 'Titanium Prime',
    armorColor: '#cbd5e1',
    clothingColor: '#475569',
    trimColor: '#0ea5e9',
    visorColor: '#22d3ee',
    price: 550,
    unlockSource: 'store',
  },
  {
    id: 'stealth_matte',
    name: 'Stealth Ranger',
    armorColor: '#18181b',
    clothingColor: '#14532d',
    trimColor: '#52525b',
    visorColor: '#34d399',
    price: 0,
    unlockSource: 'battlepass',
  },
  {
    id: 'aurora_violet',
    name: 'Aurora Violet',
    armorColor: '#312e81',
    clothingColor: '#1e1b4b',
    trimColor: '#a78bfa',
    visorColor: '#f472b6',
    price: 700,
    unlockSource: 'store',
  },
];

function buildEnterableSideBuilding(side: -1 | 1): MapObstacle[] {
  // 3-story enterable side building spanning X: [46, 64] (or [-64, -46]) and Z: [-48, +48]
  // Features:
  // - 3 walkable floors (F1: 0m, F2: 3.80m, F3: 7.60m) connected by interior staircases + full roof at 11.15m
  // - EXACTLY 3 ground entrances: North end (z = -47.3), opposite South end (z = +47.3), and middle yard doorway (z = 0)
  // - Small tactical peek windows between wide solid concrete hiding sections
  const outerX = side * 64;
  const innerX = side * 46.7;
  const midX = side * 55.35;
  const thick = 1.4;
  const f1H = 3.55;
  const f2Y = 3.8;
  const f2SlabY = 3.55;
  const f3Y = 7.6;
  const f3SlabY = 7.35;
  const slabH = 0.25;
  const roofY = 11.15;

  const obs: MapObstacle[] = [
    // Solid full-height outer wall spanning all 3 floors
    { x: outerX, y: 0, z: 0, w: thick, h: roofY, d: 96, kind: 'building_wall' },

    // North End Wall (z = -47.3): 1 centered ground entrance (4.4m wide) + small F2/F3 end peek windows
    { x: side * 60.25, y: 0, z: -47.3, w: 6.1, h: roofY, d: thick, kind: 'building_wall' },
    { x: side * 50.1, y: 0, z: -47.3, w: 5.4, h: roofY, d: thick, kind: 'building_wall' },
    { x: side * 55.0, y: 3.0, z: -47.3, w: 4.4, h: 0.55, d: thick, kind: 'building_wall' }, // F1 door header
    { x: side * 55.0, y: f2Y, z: -47.3, w: 4.4, h: 1.15, d: thick, kind: 'building_wall' }, // F2 sill
    { x: side * 55.0, y: 6.0, z: -47.3, w: 4.4, h: 1.35, d: thick, kind: 'building_wall' }, // F2 lintel
    { x: side * 55.0, y: f3Y, z: -47.3, w: 4.4, h: 1.15, d: thick, kind: 'building_wall' }, // F3 sill
    { x: side * 55.0, y: 9.8, z: -47.3, w: 4.4, h: 1.35, d: thick, kind: 'building_wall' }, // F3 top lintel

    // Opposite South End Wall (z = +47.3): 1 centered ground entrance (4.4m wide) + small F2/F3 end peek windows
    { x: side * 60.25, y: 0, z: 47.3, w: 6.1, h: roofY, d: thick, kind: 'building_wall' },
    { x: side * 50.1, y: 0, z: 47.3, w: 5.4, h: roofY, d: thick, kind: 'building_wall' },
    { x: side * 55.0, y: 3.0, z: 47.3, w: 4.4, h: 0.55, d: thick, kind: 'building_wall' },
    { x: side * 55.0, y: f2Y, z: 47.3, w: 4.4, h: 1.15, d: thick, kind: 'building_wall' },
    { x: side * 55.0, y: 6.0, z: 47.3, w: 4.4, h: 1.35, d: thick, kind: 'building_wall' },
    { x: side * 55.0, y: f3Y, z: 47.3, w: 4.4, h: 1.15, d: thick, kind: 'building_wall' },
    { x: side * 55.0, y: 9.8, z: 47.3, w: 4.4, h: 1.35, d: thick, kind: 'building_wall' },

    // Floor 2 Slab (walkable at y = 3.80) flush inside walls & stairwell X:[59.8..63.3], Z:[-25.2..-12.8]
    { x: midX, y: f2SlabY, z: -35.9, w: 15.9, h: slabH, d: 21.4, kind: 'building_floor' },
    { x: midX, y: f2SlabY, z: 16.9, w: 15.9, h: slabH, d: 59.4, kind: 'building_floor' },
    { x: side * 53.3, y: f2SlabY, z: -19.0, w: 11.8, h: slabH, d: 12.4, kind: 'building_floor' },

    // Floor 3 Slab (walkable at y = 7.60) flush inside walls & stairwell X:[59.8..63.3], Z:[+12.8..+25.2]
    { x: midX, y: f3SlabY, z: -16.9, w: 15.9, h: slabH, d: 59.4, kind: 'building_floor' },
    { x: midX, y: f3SlabY, z: 35.9, w: 15.9, h: slabH, d: 21.4, kind: 'building_floor' },
    { x: side * 53.3, y: f3SlabY, z: 19.0, w: 11.8, h: slabH, d: 12.4, kind: 'building_floor' },

    // Full Concrete Roof Slab at y = 11.15
    { x: midX, y: roofY, z: 0, w: 19.3, h: 0.55, d: 96, kind: 'building_roof' },
  ];

  // Interior Staircases (12 steps each, <= 0.32m rise per step so players climb smoothly without jumping)
  for (let i = 0; i < 12; i++) {
    // Stairs Floor 1 (y=0) -> Floor 2 (y=3.80) along back strip x = side * 61.5, z = -25..-13
    const h1 = ((i + 1) / 12) * f2Y;
    obs.push({
      x: side * 61.5,
      y: 0,
      z: -24.5 + i * 1.0,
      w: 3.4,
      h: h1,
      d: 1.0,
      kind: 'building_floor',
    });

    // Stairs Floor 2 (y=3.80) -> Floor 3 (y=7.60) along back strip x = side * 61.5, z = +13..+25
    const h2 = ((i + 1) / 12) * (f3Y - f2Y);
    obs.push({
      x: side * 61.5,
      y: f2Y,
      z: 13.5 + i * 1.0,
      w: 3.4,
      h: h2,
      d: 1.0,
      kind: 'building_floor',
    });
  }
  // Stairwell guide / guard walls for hiding behind inside each floor
  obs.push(
    { x: side * 59.5, y: 0, z: -19.0, w: 0.6, h: 4.9, d: 12.4, kind: 'concrete_wall' },
    { x: side * 59.5, y: f2Y, z: 19.0, w: 0.6, h: 4.9, d: 12.4, kind: 'concrete_wall' }
  );

  // Helper: Small peek window on a given floor (2.6m wide, 1.22m high sill, 0.95m tall window slit)
  const addSmallWindow = (zCenter: number, width: number, floorBaseY: number) => {
    obs.push({ x: innerX, y: floorBaseY, z: zCenter, w: thick, h: 1.22, d: width, kind: 'building_wall' });
    obs.push({
      x: innerX,
      y: floorBaseY + 2.17,
      z: zCenter,
      w: thick,
      h: f1H - 2.17,
      d: width,
      kind: 'building_wall',
    });
  };

  // Helper: Solid concrete wall segment spanning full height between windows/entrances
  const addSolidInnerWall = (zMin: number, zMax: number, yBase: number, height: number) => {
    const d = zMax - zMin;
    if (d <= 0.05) return;
    obs.push({
      x: innerX,
      y: yBase,
      z: (zMin + zMax) * 0.5,
      w: thick,
      h: height,
      d,
      kind: 'building_wall',
    });
  };

  // Floor 1 Inner Courtyard Wall: ONLY 1 middle entrance (z = -2.3..+2.3) + 4 small hiding windows
  // Small windows at z = -32.5, -18.5, +18.5, +32.5 (each 2.6m wide); huge solid hiding spans everywhere else!
  addSolidInnerWall(-46.6, -33.8, 0, f1H);
  addSmallWindow(-32.5, 2.6, 0);
  addSolidInnerWall(-31.2, -19.8, 0, f1H);
  addSmallWindow(-18.5, 2.6, 0);
  addSolidInnerWall(-17.2, -2.3, 0, f1H);
  // Middle entrance doorway (z = -2.3..+2.3, 3.0m clear height)
  obs.push({ x: innerX, y: 3.0, z: 0, w: thick, h: f1H - 3.0, d: 4.6, kind: 'building_wall' });
  addSolidInnerWall(2.3, 17.2, 0, f1H);
  addSmallWindow(18.5, 2.6, 0);
  addSolidInnerWall(19.8, 31.2, 0, f1H);
  addSmallWindow(32.5, 2.6, 0);
  addSolidInnerWall(33.8, 46.6, 0, f1H);

  // Floors 2 & 3 Inner Courtyard Walls: zero doorways, 5 small peek windows per floor between solid hiding walls
  for (const fy of [f2Y, f3Y]) {
    addSolidInnerWall(-46.6, -33.8, fy, f1H);
    addSmallWindow(-32.5, 2.6, fy);
    addSolidInnerWall(-31.2, -19.8, fy, f1H);
    addSmallWindow(-18.5, 2.6, fy);
    addSolidInnerWall(-17.2, -1.3, fy, f1H);
    addSmallWindow(0, 2.6, fy);
    addSolidInnerWall(1.3, 17.2, fy, f1H);
    addSmallWindow(18.5, 2.6, fy);
    addSolidInnerWall(19.8, 31.2, fy, f1H);
    addSmallWindow(32.5, 2.6, fy);
    addSolidInnerWall(33.8, 46.6, fy, f1H);
  }

  // Interior Cover across all 3 floors (concrete pillars & varied wooden boxes for hiding)
  obs.push(
    // Floor 1 interior cover
    { x: side * 55.0, y: 0, z: -34, w: 2.0, h: f1H, d: 2.0, kind: 'concrete_wall' },
    { x: side * 55.0, y: 0, z: -7, w: 2.0, h: f1H, d: 2.0, kind: 'concrete_wall' },
    { x: side * 55.0, y: 0, z: 7, w: 2.0, h: f1H, d: 2.0, kind: 'concrete_wall' },
    { x: side * 55.0, y: 0, z: 34, w: 2.0, h: f1H, d: 2.0, kind: 'concrete_wall' },
    { x: side * 51.8, y: 0, z: -27, w: 1.8, h: 1.3, d: 1.8, kind: 'wood_crate' },
    { x: side * 52.0, y: 0, z: 27, w: 2.0, h: 1.4, d: 2.0, kind: 'wood_crate' },
    { x: side * 57.5, y: 0, z: -1, w: 2.2, h: 1.5, d: 2.2, kind: 'wood_crate' },
    // Floor 2 interior cover
    { x: side * 54.0, y: f2Y, z: -32, w: 2.0, h: 1.45, d: 2.0, kind: 'wood_crate' },
    { x: side * 53.0, y: f2Y, z: 0, w: 1.8, h: f1H, d: 1.8, kind: 'concrete_wall' },
    { x: side * 52.5, y: f2Y, z: 32, w: 2.2, h: 1.45, d: 1.8, kind: 'wood_crate' },
    // Floor 3 interior cover
    { x: side * 54.0, y: f3Y, z: -30, w: 2.0, h: 1.45, d: 2.0, kind: 'wood_crate' },
    { x: side * 53.0, y: f3Y, z: 0, w: 1.8, h: f1H, d: 1.8, kind: 'concrete_wall' },
    { x: side * 54.5, y: f3Y, z: -8, w: 1.6, h: 1.2, d: 1.6, kind: 'wood_crate' }
  );

  return obs;
}

function buildSandyardMapObstacles(): MapObstacle[] {
  const obs: MapObstacle[] = [];

  // ============================================================================
  // 1. CENTER 2-FLOOR BUILDING (X: [-20..+20], Z: [-24..+24])
  //    - Floor 1 (y = 0..4.0m), Floor 2 (y = 4.30..8.20m), Roof (y = 8.20m)
  //    - Entrances on BOTH N/S sides on 1st floor (NO windows on entrance sides!)
  //    - Anti-spawncamp barriers right inside North & South entrances
  //    - Outside stairs on Left (-X) & Right (+X) straight to 2nd floor
  //    - 5 bigger windows (3.6m x 1.32m) on Left & Right sides
  //    - >= 25 small + >= 10 big obstacles on EACH floor, placed differently!
  // ============================================================================
  const thick = 1.4;
  const f1H = 4.0;
  const f2SlabY = 4.0;
  const f2Y = 4.3;
  const f2H = 3.9;
  const roofY = 8.2;

  // Floor 2 slab & full roof slab
  obs.push(
    { x: 0, y: f2SlabY, z: 0, w: 40.0, h: 0.3, d: 48.0, kind: 'building_floor' },
    { x: 0, y: roofY, z: 0, w: 41.2, h: 0.45, d: 49.2, kind: 'building_roof' }
  );

  // North (z = -23.3) & South (z = +23.3) Entrance Walls: 1st-floor center doorway (5.6m wide), ZERO windows!
  for (const zSign of [-1, 1]) {
    const zWall = zSign * 23.3;
    obs.push(
      // F1 Left & Right solid wall wings + Door header
      { x: -11.4, y: 0, z: zWall, w: 17.2, h: f1H, d: thick, kind: 'sandstone_wall' },
      { x: 11.4, y: 0, z: zWall, w: 17.2, h: f1H, d: thick, kind: 'sandstone_wall' },
      { x: 0, y: 3.1, z: zWall, w: 5.6, h: f1H - 3.1, d: thick, kind: 'sandstone_wall' },
      // F2 Full solid wall across entire entrance side (no windows!)
      { x: 0, y: f2Y, z: zWall, w: 40.0, h: f2H, d: thick, kind: 'sandstone_wall' },
      // Anti-spawncamp barrier inside Floor 1 right after entrance
      { x: 0, y: 0, z: zSign * 18.5, w: 8.6, h: 2.45, d: 1.35, kind: 'concrete_wall' }
    );
  }

  // Helper for bigger side windows (3.6m wide, 1.12m sill, 1.32m tall opening vs Map 1's 2.6m x 0.95m)
  const addBiggerSideWindow = (xWall: number, zCenter: number, yBase: number, wallH: number) => {
    obs.push(
      { x: xWall, y: yBase, z: zCenter, w: thick, h: 1.12, d: 3.6, kind: 'sandstone_wall' },
      { x: xWall, y: yBase + 2.44, z: zCenter, w: thick, h: wallH - 2.44, d: 3.6, kind: 'sandstone_wall' }
    );
  };
  const addSidePier = (xWall: number, zMin: number, zMax: number, yBase: number, wallH: number) => {
    const d = zMax - zMin;
    if (d <= 0.05) return;
    obs.push({ x: xWall, y: yBase, z: (zMin + zMax) * 0.5, w: thick, h: wallH, d, kind: 'sandstone_wall' });
  };

  // Left (-X) & Right (+X) Side Walls of Mid Building (flush with N/S walls at ±22.6)
  for (const xSide of [-1, 1]) {
    const xWall = xSide * 19.3;
    // Floor 1: 5 bigger windows per side at z = -18, -9, 0, +9, +18
    addSidePier(xWall, -22.6, -19.8, 0, f1H);
    addBiggerSideWindow(xWall, -18.0, 0, f1H);
    addSidePier(xWall, -16.2, -10.8, 0, f1H);
    addBiggerSideWindow(xWall, -9.0, 0, f1H);
    addSidePier(xWall, -7.2, -1.8, 0, f1H);
    addBiggerSideWindow(xWall, 0.0, 0, f1H);
    addSidePier(xWall, 1.8, 7.2, 0, f1H);
    addBiggerSideWindow(xWall, 9.0, 0, f1H);
    addSidePier(xWall, 10.8, 16.2, 0, f1H);
    addBiggerSideWindow(xWall, 18.0, 0, f1H);
    addSidePier(xWall, 19.8, 22.6, 0, f1H);

    // Floor 2: 4 bigger windows (-18, -9.5, +9.5, +18) + centered exterior stair doorway (z = -2.3..+2.3)
    addSidePier(xWall, -22.6, -19.8, f2Y, f2H);
    addBiggerSideWindow(xWall, -18.0, f2Y, f2H);
    addSidePier(xWall, -16.2, -11.3, f2Y, f2H);
    addBiggerSideWindow(xWall, -9.5, f2Y, f2H);
    addSidePier(xWall, -7.7, -2.3, f2Y, f2H);
    // Stair landing doorway header on F2
    obs.push({ x: xWall, y: f2Y + 3.05, z: 0, w: thick, h: f2H - 3.05, d: 4.6, kind: 'sandstone_wall' });
    addSidePier(xWall, 2.3, 7.7, f2Y, f2H);
    addBiggerSideWindow(xWall, 9.5, f2Y, f2H);
    addSidePier(xWall, 11.3, 16.2, f2Y, f2H);
    addBiggerSideWindow(xWall, 18.0, f2Y, f2H);
    addSidePier(xWall, 19.8, 22.6, f2Y, f2H);

    // Outside Left & Right Staircases straight from Ground (y=0) up to Floor 2 doorway (y=4.30m)
    // 14 steps x 0.307m rise (<= 0.38m smooth auto-step climb), 4.6m wide at z = 0
    for (let s = 0; s < 14; s++) {
      const stepH = ((s + 1) / 14) * f2Y;
      obs.push({
        x: xSide * (32.85 - s * 0.95),
        y: 0,
        z: 0,
        w: 0.95,
        h: stepH,
        d: 4.6,
        kind: 'sandstone_wall',
      });
    }
  }

  // FLOOR 1 INTERIOR OBSTACLES (y = 0): 12 Big + 28 Small (distinct cross-room + wing layout)
  const f1Big: Array<[number, number, number, number, number, MapObstacle['kind']]> = [
    [-11.5, -13.5, 3.6, 2.3, 3.0, 'wood_crate'],
    [11.5, -13.5, 4.4, 3.6, 1.3, 'concrete_wall'],
    [-11.5, 13.5, 4.4, 3.6, 1.3, 'concrete_wall'],
    [11.5, 13.5, 3.6, 2.3, 3.0, 'wood_crate'],
    [-9.0, 0, 1.4, 3.6, 5.2, 'concrete_wall'],
    [9.0, 0, 1.4, 3.6, 5.2, 'concrete_wall'],
    [0, -9.5, 4.6, 2.2, 2.8, 'wood_crate'],
    [0, 9.5, 4.6, 2.2, 2.8, 'wood_crate'],
    [-13.5, -5.5, 3.0, 2.1, 2.8, 'wood_crate'],
    [13.5, 5.5, 3.0, 2.1, 2.8, 'wood_crate'],
    [0, 0, 3.6, 2.4, 3.6, 'wood_crate'],
    [-13.5, 5.5, 3.2, 2.0, 2.6, 'sandstone_wall'],
  ];
  for (const [x, z, w, h, d, kind] of f1Big) {
    obs.push({ x, y: 0, z, w, h, d, kind });
  }

  const f1Small: Array<[number, number, number, number, number, MapObstacle['kind']]> = [
    [-6.0, -16.5, 1.4, 1.15, 1.4, 'wood_crate'],
    [6.0, -16.5, 1.5, 1.25, 1.5, 'wood_crate'],
    [-6.0, 16.5, 1.5, 1.25, 1.5, 'wood_crate'],
    [6.0, 16.5, 1.4, 1.15, 1.4, 'wood_crate'],
    [-15.5, -18.5, 1.6, 1.2, 1.2, 'wood_crate'],
    [15.5, -18.5, 1.3, 1.0, 1.3, 'wood_crate'],
    [-15.5, 18.5, 1.3, 1.0, 1.3, 'wood_crate'],
    [15.5, 18.5, 1.6, 1.2, 1.2, 'wood_crate'],
    [-4.5, -12.5, 1.5, 1.2, 1.1, 'concrete_wall'],
    [4.5, -12.5, 1.5, 1.2, 1.1, 'concrete_wall'],
    [-4.5, 12.5, 1.5, 1.2, 1.1, 'concrete_wall'],
    [4.5, 12.5, 1.5, 1.2, 1.1, 'concrete_wall'],
    [-15.5, -9.5, 1.4, 1.05, 1.4, 'wood_crate'],
    [15.5, -9.5, 1.4, 1.05, 1.4, 'wood_crate'],
    [-15.5, 9.5, 1.4, 1.05, 1.4, 'wood_crate'],
    [15.5, 9.5, 1.4, 1.05, 1.4, 'wood_crate'],
    [-5.0, -4.5, 1.3, 1.1, 1.3, 'wood_crate'],
    [5.0, -4.5, 1.6, 1.3, 1.4, 'wood_crate'],
    [-5.0, 4.5, 1.6, 1.3, 1.4, 'wood_crate'],
    [5.0, 4.5, 1.3, 1.1, 1.3, 'wood_crate'],
    [-14.5, -1.5, 1.3, 1.0, 1.3, 'wood_crate'],
    [14.5, 1.5, 1.3, 1.0, 1.3, 'wood_crate'],
    [-8.5, -19.5, 1.7, 1.25, 1.1, 'concrete_wall'],
    [8.5, -19.5, 1.7, 1.25, 1.1, 'concrete_wall'],
    [-8.5, 19.5, 1.7, 1.25, 1.1, 'concrete_wall'],
    [8.5, 19.5, 1.7, 1.25, 1.1, 'concrete_wall'],
    [-2.8, 0, 1.2, 1.0, 1.5, 'wood_crate'],
    [2.8, 0, 1.2, 1.0, 1.5, 'wood_crate'],
  ];
  for (const [x, z, w, h, d, kind] of f1Small) {
    obs.push({ x, y: 0, z, w, h, d, kind });
  }

  // FLOOR 2 INTERIOR OBSTACLES (y = 4.30): 12 Big + 28 Small (completely different diamond & lane bunker layout!)
  const f2Big: Array<[number, number, number, number, number, MapObstacle['kind']]> = [
    [-5.5, -17.0, 4.8, 3.2, 1.3, 'concrete_wall'],
    [5.5, 17.0, 4.8, 3.2, 1.3, 'concrete_wall'],
    [7.5, -15.5, 3.4, 2.2, 3.2, 'wood_crate'],
    [-7.5, 15.5, 3.4, 2.2, 3.2, 'wood_crate'],
    [-13.0, -9.0, 3.2, 2.1, 2.8, 'wood_crate'],
    [13.0, 9.0, 3.2, 2.1, 2.8, 'wood_crate'],
    [-4.5, -5.5, 3.6, 2.4, 1.2, 'concrete_wall'],
    [4.5, 5.5, 3.6, 2.4, 1.2, 'concrete_wall'],
    [4.5, -5.5, 2.8, 2.0, 2.8, 'wood_crate'],
    [-4.5, 5.5, 2.8, 2.0, 2.8, 'wood_crate'],
    [0, -13.0, 3.4, 2.2, 2.8, 'sandstone_wall'],
    [0, 13.0, 3.4, 2.2, 2.8, 'sandstone_wall'],
  ];
  for (const [x, z, w, h, d, kind] of f2Big) {
    obs.push({ x, y: f2Y, z, w, h, d, kind });
  }

  const f2Small: Array<[number, number, number, number, number, MapObstacle['kind']]> = [
    [-13.5, -18.0, 1.5, 1.2, 1.5, 'wood_crate'],
    [13.5, -18.0, 1.6, 1.3, 1.2, 'concrete_wall'],
    [-13.5, 18.0, 1.6, 1.3, 1.2, 'concrete_wall'],
    [13.5, 18.0, 1.5, 1.2, 1.5, 'wood_crate'],
    [-1.5, -19.5, 1.6, 1.15, 1.3, 'wood_crate'],
    [1.5, 19.5, 1.6, 1.15, 1.3, 'wood_crate'],
    [-9.5, -12.0, 1.3, 1.0, 1.3, 'wood_crate'],
    [9.5, -11.5, 1.5, 1.2, 1.5, 'wood_crate'],
    [-9.5, 11.5, 1.5, 1.2, 1.5, 'wood_crate'],
    [9.5, 12.0, 1.3, 1.0, 1.3, 'wood_crate'],
    [-15.5, -4.5, 1.4, 1.1, 1.4, 'wood_crate'],
    [15.5, -4.5, 1.4, 1.1, 1.4, 'wood_crate'],
    [-15.5, 4.5, 1.4, 1.1, 1.4, 'wood_crate'],
    [15.5, 4.5, 1.4, 1.1, 1.4, 'wood_crate'],
    [-10.5, -3.5, 1.6, 1.25, 1.1, 'concrete_wall'],
    [10.5, 3.5, 1.6, 1.25, 1.1, 'concrete_wall'],
    [10.5, -3.5, 1.3, 1.05, 1.3, 'wood_crate'],
    [-10.5, 3.5, 1.3, 1.05, 1.3, 'wood_crate'],
    [-1.5, -8.5, 1.4, 1.1, 1.4, 'wood_crate'],
    [1.5, 8.5, 1.4, 1.1, 1.4, 'wood_crate'],
    [-8.0, 0, 1.5, 1.2, 1.5, 'wood_crate'],
    [8.0, 0, 1.5, 1.2, 1.5, 'wood_crate'],
    [-2.2, 0, 1.3, 1.05, 1.3, 'wood_crate'],
    [2.2, 0, 1.3, 1.05, 1.3, 'wood_crate'],
    [-15.0, -14.0, 1.3, 1.0, 1.3, 'wood_crate'],
    [15.0, 14.0, 1.3, 1.0, 1.3, 'wood_crate'],
    [3.5, -19.0, 1.5, 1.2, 1.1, 'concrete_wall'],
    [-3.5, 19.0, 1.5, 1.2, 1.1, 'concrete_wall'],
  ];
  for (const [x, z, w, h, d, kind] of f2Small) {
    obs.push({ x, y: f2Y, z, w, h, d, kind });
  }

  // ============================================================================
  // 2. SPAWN SNIPER VANTAGE WALLS WITH STAIRS ON BOTH SPAWN SIDES (Z = ±45)
  //    + FULL-WIDTH COURTYARD ARCH WALLS TOUCHING LEFT (-68) & RIGHT (+68) WALLS
  // ============================================================================
  for (const zSign of [-1, 1]) {
    // Center Spawn Shield & Vantage Deck (blocks ground spawn-to-spawn sniping, climbable via stairs to shoot to Mid!)
    obs.push(
      { x: 0, y: 0, z: zSign * 45.0, w: 24.0, h: 2.2, d: 3.6, kind: 'sandstone_wall' },
      { x: 0, y: 2.2, z: zSign * 43.55, w: 24.0, h: 1.05, d: 0.7, kind: 'sandstone_wall' }
    );
    // 7 smooth stairs on spawn-facing side (z = ±51.4 -> ±46.8)
    for (let s = 0; s < 7; s++) {
      const stepH = ((s + 1) / 7) * 2.2;
      obs.push({
        x: 0,
        y: 0,
        z: zSign * (51.35 - s * 0.7),
        w: 6.4,
        h: stepH,
        d: 0.7,
        kind: 'sandstone_wall',
      });
    }

    // Flanking Courtyard Walls touching x = -68 (left border wall) and x = +68 (right border wall)
    obs.push(
      { x: -20.0, y: 0, z: zSign * 45.0, w: 16.0, h: 4.8, d: 1.6, kind: 'sandstone_wall' },
      { x: 20.0, y: 0, z: zSign * 45.0, w: 16.0, h: 4.8, d: 1.6, kind: 'sandstone_wall' },
      { x: -43.0, y: 0, z: zSign * 45.0, w: 18.0, h: 4.8, d: 1.6, kind: 'sandstone_wall' },
      { x: 43.0, y: 0, z: zSign * 45.0, w: 18.0, h: 4.8, d: 1.6, kind: 'sandstone_wall' },
      { x: -63.0, y: 0, z: zSign * 45.0, w: 10.0, h: 4.8, d: 1.6, kind: 'sandstone_wall' },
      { x: 63.0, y: 0, z: zSign * 45.0, w: 10.0, h: 4.8, d: 1.6, kind: 'sandstone_wall' },
      // Staggered anti-sniper baffle walls blocking straight cross-map sightlines through side passages
      { x: -31.0, y: 0, z: zSign * 36.5, w: 7.8, h: 3.1, d: 1.3, kind: 'sandstone_wall' },
      { x: 31.0, y: 0, z: zSign * 36.5, w: 7.8, h: 3.1, d: 1.3, kind: 'sandstone_wall' },
      { x: -55.0, y: 0, z: zSign * 36.5, w: 7.6, h: 3.1, d: 1.3, kind: 'sandstone_wall' },
      { x: 55.0, y: 0, z: zSign * 36.5, w: 7.6, h: 3.1, d: 1.3, kind: 'sandstone_wall' }
    );
  }

  // ============================================================================
  // 3. LEFT & RIGHT SIDE WINGS TOUCHING ARENA WALLS (X = -68 & X = +68)
  // ============================================================================
  // West Covered Shed Alley touching left border wall (x = -68..-42)
  obs.push(
    { x: -42.0, y: 0, z: -18.0, w: 1.5, h: 4.1, d: 16.0, kind: 'sandstone_wall' },
    { x: -42.0, y: 0, z: 0.0, w: 1.5, h: 4.1, d: 10.0, kind: 'sandstone_wall' },
    { x: -42.0, y: 0, z: 18.0, w: 1.5, h: 4.1, d: 16.0, kind: 'sandstone_wall' },
    { x: -55.0, y: 4.1, z: -18.5, w: 26.0, h: 0.35, d: 27.0, kind: 'metal_awning' },
    { x: -55.0, y: 4.1, z: 18.5, w: 26.0, h: 0.35, d: 27.0, kind: 'metal_awning' }
  );

  // East Raised Balcony Deck touching right border wall (x = +42..+68) + stairs + underpass
  obs.push(
    { x: 42.0, y: 0, z: -22.0, w: 1.5, h: 3.4, d: 14.0, kind: 'sandstone_wall' },
    { x: 42.0, y: 0, z: 0.0, w: 1.5, h: 3.05, d: 11.0, kind: 'sandstone_wall' },
    { x: 42.0, y: 0, z: 22.0, w: 1.5, h: 3.4, d: 14.0, kind: 'sandstone_wall' },
    { x: 55.375, y: 3.05, z: 0, w: 25.25, h: 0.35, d: 29.9, kind: 'building_floor' },
    { x: 42.4, y: 3.4, z: -8.0, w: 0.65, h: 1.05, d: 12.0, kind: 'sandstone_wall' },
    { x: 42.4, y: 3.4, z: 8.0, w: 0.65, h: 1.05, d: 12.0, kind: 'sandstone_wall' }
  );
  for (let idx = 0; idx < 10; idx++) {
    const stepH = ((idx + 1) / 10) * 3.4;
    obs.push(
      { x: 55.0, y: 0, z: -24.0 + idx * 0.95, w: 5.0, h: stepH, d: 0.95, kind: 'sandstone_wall' },
      { x: 55.0, y: 0, z: 24.0 - idx * 0.95, w: 5.0, h: stepH, d: 0.95, kind: 'sandstone_wall' }
    );
  }

  // ============================================================================
  // 4. SOLID STREET LIGHTS (unable to shoot or walk through)
  // ============================================================================
  const lightCoords: Array<[number, number]> = [
    [-34, -27],
    [34, -27],
    [-34, 27],
    [34, 27],
    [-13, -33],
    [13, -33],
    [-13, 33],
    [13, 33],
  ];
  for (const [lx, lz] of lightCoords) {
    obs.push({ x: lx, y: 0, z: lz, w: 0.9, h: 6.4, d: 0.9, kind: 'street_light' });
  }

  // ============================================================================
  // 5. 38 VARIED OUTDOOR OBSTACLES ACROSS ALL COURTYARDS & SIDE LANES
  // ============================================================================
  const outdoor: Array<[number, number, number, number, number, number, MapObstacle['kind']]> = [
    // North & South open courtyard cover (outside Mid Building)
    [-9.5, 0, -29.0, 2.8, 1.5, 2.4, 'wood_crate'],
    [9.5, 0, -29.0, 3.4, 2.0, 2.6, 'wood_crate'],
    [9.5, 2.0, -29.0, 1.5, 1.05, 1.5, 'wood_crate'],
    [-9.5, 0, 29.0, 3.4, 2.0, 2.6, 'wood_crate'],
    [-9.5, 2.0, 29.0, 1.5, 1.05, 1.5, 'wood_crate'],
    [9.5, 0, 29.0, 2.8, 1.5, 2.4, 'wood_crate'],
    [0, 0, -34.5, 5.2, 1.35, 1.2, 'concrete_wall'],
    [0, 0, 34.5, 5.2, 1.35, 1.2, 'concrete_wall'],
    [-22.0, 0, -32.0, 2.2, 1.35, 2.0, 'wood_crate'],
    [22.0, 0, 32.0, 2.2, 1.35, 2.0, 'wood_crate'],
    [22.0, 0, -32.0, 1.6, 1.1, 1.6, 'wood_crate'],
    [-22.0, 0, 32.0, 1.6, 1.1, 1.6, 'wood_crate'],
    // West flank open courtyard (between Mid Building & West Shed)
    [-28.5, 0, -14.0, 3.2, 2.1, 2.6, 'wood_crate'],
    [-28.5, 2.1, -14.0, 1.5, 1.0, 1.5, 'wood_crate'],
    [-28.5, 0, 14.0, 3.2, 2.1, 2.6, 'wood_crate'],
    [-28.5, 2.1, 14.0, 1.5, 1.0, 1.5, 'wood_crate'],
    [-36.5, 0, -9.0, 1.3, 1.45, 4.8, 'concrete_wall'],
    [-36.5, 0, 9.0, 1.3, 1.45, 4.8, 'concrete_wall'],
    [-36.0, 0, -19.5, 2.0, 1.25, 2.0, 'wood_crate'],
    [-36.0, 0, 19.5, 2.0, 1.25, 2.0, 'wood_crate'],
    // East flank open courtyard (between Mid Building & East Balcony)
    [28.5, 0, -14.0, 3.2, 2.1, 2.6, 'wood_crate'],
    [28.5, 2.1, -14.0, 1.5, 1.0, 1.5, 'wood_crate'],
    [28.5, 0, 14.0, 3.2, 2.1, 2.6, 'wood_crate'],
    [28.5, 2.1, 14.0, 1.5, 1.0, 1.5, 'wood_crate'],
    [36.5, 0, -9.0, 1.3, 1.45, 4.8, 'concrete_wall'],
    [36.5, 0, 9.0, 1.3, 1.45, 4.8, 'concrete_wall'],
    [36.0, 0, -19.5, 2.0, 1.25, 2.0, 'wood_crate'],
    [36.0, 0, 19.5, 2.0, 1.25, 2.0, 'wood_crate'],
    // West Shed interior cover (touching left wall side)
    [-55.0, 0, -16.0, 3.4, 2.0, 2.8, 'wood_crate'],
    [-59.5, 0, -15.0, 1.5, 1.05, 1.5, 'wood_crate'],
    [-55.0, 0, 16.0, 3.4, 2.0, 2.8, 'wood_crate'],
    [-50.5, 0, 15.0, 1.5, 1.05, 1.5, 'wood_crate'],
    [-55.0, 0, 0, 6.2, 1.4, 1.3, 'concrete_wall'],
    [-61.5, 0, 2.5, 2.2, 1.35, 2.2, 'wood_crate'],
    // East Balcony underpass & upper deck cover (touching right wall side)
    [55.0, 0, 0, 3.2, 1.6, 3.2, 'wood_crate'],
    [60.5, 0, -8.0, 2.2, 1.35, 2.0, 'wood_crate'],
    [50.5, 0, 8.0, 2.2, 1.35, 2.0, 'wood_crate'],
    [55.0, 3.4, -3.5, 2.0, 1.25, 2.0, 'wood_crate'],
    [58.0, 3.4, 6.0, 1.8, 1.15, 1.8, 'wood_crate'],
    // North & South spawn yard supply crates (clear of team spawns & spawn stairs)
    [-12.0, 0, -54.0, 2.8, 1.5, 2.2, 'wood_crate'],
    [12.0, 0, -54.0, 2.2, 1.25, 2.0, 'wood_crate'],
    [-12.0, 0, 54.0, 2.2, 1.25, 2.0, 'wood_crate'],
    [12.0, 0, 54.0, 2.8, 1.5, 2.2, 'wood_crate'],
    [-28.0, 0, -55.0, 3.8, 1.45, 1.2, 'concrete_wall'],
    [28.0, 0, 55.0, 3.8, 1.45, 1.2, 'concrete_wall'],
  ];
  for (const [x, y, z, w, h, d, kind] of outdoor) {
    obs.push({ x, y, z, w, h, d, kind });
  }

  return obs;
}

function buildPerimeterStreetLights(arenaHalfSize: number): MapObstacle[] {
  const sNear = 25;
  const sFar = Math.round(arenaHalfSize * 0.72);
  const spots: Array<[number, number]> = [
    [-4.4, -sNear],
    [4.4, -sFar],
    [-4.4, sFar],
    [4.4, sNear],
    [-sNear, -4.4],
    [sNear, 4.4],
    [-sFar, 4.4],
    [sFar, -4.4],
  ];
  return spots
    .filter(([x, z]) => Math.abs(x) < arenaHalfSize - 1.5 && Math.abs(z) < arenaHalfSize - 1.5)
    .map(([x, z]) => ({
      x,
      y: 0,
      z,
      w: 0.85,
      h: 6.4,
      d: 0.85,
      kind: 'street_light' as const,
    }));
}

function buildNeonFoundryObstacles(): MapObstacle[] {
  const obs: MapObstacle[] = [];
  const f2Y = 4.0;

  // ============================================================================
  // 1. CENTRAL 2-STORY REACTOR BUILDING (X: [-16, +16], Z: [-16, +16])
  //    4 Ground Entrances (N/S/E/W), F2 Walkable Deck (y = 4.0), Overhead Roof
  // ============================================================================
  // North & South Walls (Z = ±15.3) with 6.6m wide center archway
  for (const zSign of [-1, 1]) {
    obs.push(
      { x: -9.65, y: 0, z: zSign * 15.3, w: 12.7, h: 7.7, d: 1.4, kind: 'building_wall' },
      { x: 9.65, y: 0, z: zSign * 15.3, w: 12.7, h: 7.7, d: 1.4, kind: 'building_wall' },
      { x: 0, y: 3.05, z: zSign * 15.3, w: 6.6, h: 0.65, d: 1.4, kind: 'building_wall' }
    );
  }
  // West & East Walls (X = ±15.3, strictly Z: [-14.6, +14.6]) with 6.6m center archway & flush F2 sill at y=4.00
  for (const xSign of [-1, 1]) {
    obs.push(
      { x: xSign * 15.3, y: 0, z: -8.95, w: 1.4, h: 7.7, d: 11.3, kind: 'building_wall' },
      { x: xSign * 15.3, y: 0, z: 8.95, w: 1.4, h: 7.7, d: 11.3, kind: 'building_wall' },
      { x: xSign * 15.3, y: 3.05, z: 0, w: 1.4, h: 0.95, d: 6.6, kind: 'building_wall' }
    );
  }
  // Floor 2 Slab (walkable at y = 4.00) & Overhead Reactor Roof (y = 7.70)
  obs.push(
    { x: 0, y: 3.7, z: 0, w: 29.2, h: 0.3, d: 29.2, kind: 'building_floor' },
    { x: 0, y: 7.7, z: 0, w: 32.0, h: 0.35, d: 32.0, kind: 'building_roof' }
  );

  // Floor 1 Interior Cover (pillars, center reactor monolith, entrance baffles, crates)
  obs.push(
    { x: 0, y: 0, z: 0, w: 4.0, h: 2.8, d: 4.0, kind: 'monolith' },
    { x: -7.5, y: 0, z: -7.5, w: 2.0, h: 3.7, d: 2.0, kind: 'pillar' },
    { x: 7.5, y: 0, z: -7.5, w: 2.0, h: 3.7, d: 2.0, kind: 'pillar' },
    { x: -7.5, y: 0, z: 7.5, w: 2.0, h: 3.7, d: 2.0, kind: 'pillar' },
    { x: 7.5, y: 0, z: 7.5, w: 2.0, h: 3.7, d: 2.0, kind: 'pillar' },
    { x: 0, y: 0, z: -10.8, w: 4.6, h: 1.4, d: 1.1, kind: 'concrete_wall' },
    { x: 0, y: 0, z: 10.8, w: 4.6, h: 1.4, d: 1.1, kind: 'concrete_wall' },
    { x: -10.8, y: 0, z: 0, w: 1.1, h: 1.4, d: 4.6, kind: 'concrete_wall' },
    { x: 10.8, y: 0, z: 0, w: 1.1, h: 1.4, d: 4.6, kind: 'concrete_wall' },
    { x: -5.0, y: 0, z: -11.5, w: 1.6, h: 1.2, d: 1.6, kind: 'wood_crate' },
    { x: 5.0, y: 0, z: 11.5, w: 1.6, h: 1.2, d: 1.6, kind: 'wood_crate' },
    { x: 11.5, y: 0, z: -5.0, w: 1.6, h: 1.2, d: 1.6, kind: 'wood_crate' },
    { x: -11.5, y: 0, z: 5.0, w: 1.6, h: 1.2, d: 1.6, kind: 'wood_crate' }
  );

  // Floor 2 Upper Deck Cover (y = 4.00)
  obs.push(
    { x: 0, y: f2Y, z: 0, w: 4.2, h: 1.9, d: 4.2, kind: 'monolith' },
    { x: -7.5, y: f2Y, z: -7.5, w: 3.8, h: 1.35, d: 1.2, kind: 'concrete_wall' },
    { x: 7.5, y: f2Y, z: -7.5, w: 3.8, h: 1.35, d: 1.2, kind: 'concrete_wall' },
    { x: -7.5, y: f2Y, z: 7.5, w: 3.8, h: 1.35, d: 1.2, kind: 'concrete_wall' },
    { x: 7.5, y: f2Y, z: 7.5, w: 3.8, h: 1.35, d: 1.2, kind: 'concrete_wall' },
    { x: -10.5, y: f2Y, z: 0, w: 2.0, h: 1.2, d: 2.4, kind: 'wood_crate' },
    { x: 10.5, y: f2Y, z: 0, w: 2.0, h: 1.2, d: 2.4, kind: 'wood_crate' },
    { x: 0, y: f2Y, z: -10.5, w: 2.4, h: 1.2, d: 2.0, kind: 'wood_crate' },
    { x: 0, y: f2Y, z: 10.5, w: 2.4, h: 1.2, d: 2.0, kind: 'wood_crate' }
  );

  // ============================================================================
  // 2. WEST & EAST EXTERIOR STAIRCASES TO FLOOR 2 + N/S OVERHEAD SKY BRIDGES
  // ============================================================================
  for (let s = 0; s < 12; s++) {
    const stepH = ((s + 1) / 12) * 4.0;
    obs.push(
      { x: -25.2 + s * 0.8, y: 0, z: 0, w: 0.8, h: stepH, d: 5.0, kind: 'concrete_wall' },
      { x: 25.2 - s * 0.8, y: 0, z: 0, w: 0.8, h: stepH, d: 5.0, kind: 'concrete_wall' }
    );
  }

  // North & South Sky Bridges connecting F2 (z = ±16) to Vantage Decks (z = ±34..±40)
  for (const zSign of [-1, 1]) {
    obs.push(
      { x: 0, y: 3.65, z: zSign * 25.0, w: 5.4, h: 0.35, d: 18.0, kind: 'bridge' },
      { x: 0, y: 0, z: zSign * 37.0, w: 8.4, h: 4.0, d: 6.0, kind: 'platform' }
    );
    // Flanking stairs stepping down East & West off the N/S Vantage Decks (12 smooth steps)
    for (let s = 0; s < 12; s++) {
      const stepH = ((12 - s) / 12) * 4.0;
      obs.push(
        { x: -4.6 - s * 0.8, y: 0, z: zSign * 37.0, w: 0.8, h: stepH, d: 4.2, kind: 'concrete_wall' },
        { x: 4.6 + s * 0.8, y: 0, z: zSign * 37.0, w: 0.8, h: stepH, d: 4.2, kind: 'concrete_wall' }
      );
    }
  }

  // ============================================================================
  // 3. WEST & EAST COVERED FOUNDRY WAREHOUSES (X = ±42, Z = 0)
  // ============================================================================
  for (const xSign of [-1, 1]) {
    obs.push(
      { x: xSign * 42.0, y: 4.2, z: 0, w: 12.0, h: 0.35, d: 16.0, kind: 'metal_awning' },
      { x: xSign * 42.0, y: 0, z: -7.3, w: 12.0, h: 4.2, d: 1.4, kind: 'concrete_wall' },
      { x: xSign * 42.0, y: 0, z: 7.3, w: 12.0, h: 4.2, d: 1.4, kind: 'concrete_wall' },
      { x: xSign * 44.0, y: 0, z: -2.4, w: 2.4, h: 1.4, d: 2.2, kind: 'wood_crate' },
      { x: xSign * 40.0, y: 0, z: 2.4, w: 2.4, h: 1.4, d: 2.2, kind: 'wood_crate' }
    );
  }

  // ============================================================================
  // 4. DENSE QUADRANT BUILDINGS, HUGE BOX PILES, PEEK WALLS & LANE COVER
  // ============================================================================
  const fieldCover: Array<[number, number, number, number, number, number, MapObstacle['kind']]> = [
    // 4 Corner Tactical Houses
    [-33, 0, -27, 7.6, 4.8, 7.6, 'house'],
    [33, 0, 27, 7.6, 4.8, 7.6, 'house'],
    [-33, 0, 27, 7.2, 4.4, 7.2, 'house'],
    [33, 0, -27, 7.2, 4.4, 7.2, 'house'],
    // 4 Giant Stacked Box Piles framing Mid approaches
    [-25, 0, -14, 4.8, 3.8, 4.4, 'box_pile'],
    [25, 0, 14, 4.8, 3.8, 4.4, 'box_pile'],
    [-25, 0, 14, 4.8, 3.8, 4.4, 'box_pile'],
    [25, 0, -14, 4.8, 3.8, 4.4, 'box_pile'],
    // North & South Base Anti-Spawncamp Concrete Peek Bunkers (z = ±50)
    [0, 0, -50, 12.0, 1.45, 1.4, 'concrete_wall'],
    [-16, 0, -49, 6.2, 1.15, 1.4, 'peek_wall'],
    [16, 0, -49, 6.2, 1.15, 1.4, 'peek_wall'],
    [0, 0, 50, 12.0, 1.45, 1.4, 'concrete_wall'],
    [-16, 0, 49, 6.2, 1.15, 1.4, 'peek_wall'],
    [16, 0, 49, 6.2, 1.15, 1.4, 'peek_wall'],
    // Mid-Lane & Courtyard Shipping Containers + Crates + Concrete Barriers
    [-12, 0, -26, 3.6, 2.1, 3.0, 'crate'],
    [12, 0, -26, 2.8, 1.6, 2.4, 'wood_crate'],
    [-12, 0, 26, 2.8, 1.6, 2.4, 'wood_crate'],
    [12, 0, 26, 3.6, 2.1, 3.0, 'crate'],
    [-19, 0, -44, 3.2, 1.9, 2.6, 'crate'],
    [19, 0, -44, 2.4, 1.35, 2.2, 'wood_crate'],
    [-19, 0, 44, 2.4, 1.35, 2.2, 'wood_crate'],
    [19, 0, 44, 3.2, 1.9, 2.6, 'crate'],
    // West & East Side Flank Peek Walls & Cover Crates
    [-32, 0, -15, 1.3, 1.5, 5.2, 'concrete_wall'],
    [-32, 0, 15, 1.3, 1.5, 5.2, 'concrete_wall'],
    [32, 0, -15, 1.3, 1.5, 5.2, 'concrete_wall'],
    [32, 0, 15, 1.3, 1.5, 5.2, 'concrete_wall'],
    [-47, 0, -22, 3.4, 2.1, 2.8, 'crate'],
    [-47, 0, 22, 3.4, 2.1, 2.8, 'crate'],
    [47, 0, -22, 3.4, 2.1, 2.8, 'crate'],
    [47, 0, 22, 3.4, 2.1, 2.8, 'crate'],
    // Outer Lane Cargo Cover (eliminating empty perimeter zones)
    [-56, 0, -16, 2.6, 1.5, 2.6, 'wood_crate'],
    [-56, 0, 16, 2.6, 1.5, 2.6, 'wood_crate'],
    [56, 0, -16, 2.6, 1.5, 2.6, 'wood_crate'],
    [56, 0, 16, 2.6, 1.5, 2.6, 'wood_crate'],
    [-50, 0, -40, 5.4, 1.6, 1.4, 'concrete_wall'],
    [50, 0, -40, 5.4, 1.6, 1.4, 'concrete_wall'],
    [-50, 0, 40, 5.4, 1.6, 1.4, 'concrete_wall'],
    [50, 0, 40, 5.4, 1.6, 1.4, 'concrete_wall'],
    [-34, 0, -48, 2.8, 1.5, 2.4, 'wood_crate'],
    [34, 0, -48, 2.8, 1.5, 2.4, 'wood_crate'],
    [-34, 0, 48, 2.8, 1.5, 2.4, 'wood_crate'],
    [34, 0, 48, 2.8, 1.5, 2.4, 'wood_crate'],
    [-12, 0, -56, 2.4, 1.3, 2.2, 'wood_crate'],
    [12, 0, -56, 2.4, 1.3, 2.2, 'wood_crate'],
    [-12, 0, 56, 2.4, 1.3, 2.2, 'wood_crate'],
    [12, 0, 56, 2.4, 1.3, 2.2, 'wood_crate'],
  ];
  for (const [x, y, z, w, h, d, kind] of fieldCover) {
    obs.push({ x, y, z, w, h, d, kind });
  }

  // Solid Courtyard Street Lights (clear of obstacles & roads)
  const lightCoords: Array<[number, number]> = [
    [-20, -31],
    [20, -31],
    [-20, 31],
    [20, 31],
    [-45, -34],
    [45, -34],
    [-45, 34],
    [45, 34],
  ];
  for (const [lx, lz] of lightCoords) {
    obs.push({ x: lx, y: 0, z: lz, w: 0.9, h: 6.4, d: 0.9, kind: 'street_light' });
  }

  return obs;
}

export const MAPS: Record<MapId, MapDef> = {
  hyperion_atrium: {
    id: 'hyperion_atrium',
    nameKey: 'map.hyperion_atrium.name',
    subtitleKey: 'map.hyperion_atrium.sub',
    arenaHalfSize: 68,
    isOutdoor: true,
    isDaylight: true,
    floorStyle: 'trampled_earth',
    hasRoads: false,
    hasTrees: false,
    hasStreetLights: false,
    skyTopColor: '#5485ba',
    skyHorizonColor: '#cedbe6',
    skyColor: '#a6c0d6',
    fogColor: '#c3d2df',
    fogDensity: 0.0029,
    floorColor: '#6d4f33',
    wallColor: '#7a7f87',
    accentColor: '#d97706',
    keyLightColor: '#fff5e4',
    hemiSkyColor: '#d8e9f8',
    hemiGroundColor: '#5c422a',
    obstacles: [
      // Two long 3-story enterable buildings along West (-X) and East (+X) sides
      ...buildEnterableSideBuilding(-1),
      ...buildEnterableSideBuilding(1),

      // Central Square Platform + step-up wooden crates & cover boxes on top
      { x: 0, y: 0, z: 0, w: 11.0, h: 1.35, d: 11.0, kind: 'platform' },
      { x: -6.4, y: 0, z: 0, w: 1.8, h: 0.72, d: 2.8, kind: 'wood_crate' },
      { x: 6.4, y: 0, z: 0, w: 1.8, h: 0.72, d: 2.8, kind: 'wood_crate' },
      { x: -3.5, y: 1.35, z: -3.5, w: 1.7, h: 1.1, d: 1.7, kind: 'wood_crate' },
      { x: 3.5, y: 1.35, z: 3.5, w: 1.7, h: 1.1, d: 1.7, kind: 'wood_crate' },
      { x: 3.4, y: 1.35, z: -3.4, w: 1.3, h: 0.85, d: 1.3, kind: 'wood_crate' },
      { x: -3.4, y: 1.35, z: 3.4, w: 1.3, h: 0.85, d: 1.3, kind: 'wood_crate' },

      // Non-building North (-Z, Red Team) & South (+Z, Blue Team) Concrete Peek Walls
      { x: 0, y: 0, z: -46, w: 8.4, h: 1.05, d: 1.3, kind: 'concrete_wall' },
      { x: -5.0, y: 0, z: -46, w: 1.6, h: 2.85, d: 1.5, kind: 'concrete_wall' },
      { x: 5.0, y: 0, z: -46, w: 1.6, h: 2.85, d: 1.5, kind: 'concrete_wall' },
      { x: 0, y: 2.25, z: -46, w: 8.4, h: 0.65, d: 1.35, kind: 'concrete_wall' },
      { x: -19, y: 0, z: -47, w: 8.6, h: 1.32, d: 1.25, kind: 'concrete_wall' },
      { x: 19, y: 0, z: -47, w: 8.6, h: 1.32, d: 1.25, kind: 'concrete_wall' },
      { x: -30, y: 0, z: -45, w: 4.8, h: 2.6, d: 1.3, kind: 'concrete_wall' },
      { x: 30, y: 0, z: -45, w: 4.8, h: 2.6, d: 1.3, kind: 'concrete_wall' },

      { x: 0, y: 0, z: 46, w: 8.4, h: 1.05, d: 1.3, kind: 'concrete_wall' },
      { x: -5.0, y: 0, z: 46, w: 1.6, h: 2.85, d: 1.5, kind: 'concrete_wall' },
      { x: 5.0, y: 0, z: 46, w: 1.6, h: 2.85, d: 1.5, kind: 'concrete_wall' },
      { x: 0, y: 2.25, z: 46, w: 8.4, h: 0.65, d: 1.35, kind: 'concrete_wall' },
      { x: -19, y: 0, z: 47, w: 8.6, h: 1.32, d: 1.25, kind: 'concrete_wall' },
      { x: 19, y: 0, z: 47, w: 8.6, h: 1.32, d: 1.25, kind: 'concrete_wall' },
      { x: -30, y: 0, z: 45, w: 4.8, h: 2.6, d: 1.3, kind: 'concrete_wall' },
      { x: 30, y: 0, z: 45, w: 4.8, h: 2.6, d: 1.3, kind: 'concrete_wall' },

      // Dense Inner Ring Concrete Walls & Varied Wooden Boxes around Central Square Platform
      { x: 0, y: 0, z: -17, w: 6.2, h: 1.38, d: 1.1, kind: 'concrete_wall' },
      { x: 0, y: 0, z: 17, w: 6.2, h: 1.38, d: 1.1, kind: 'concrete_wall' },
      { x: -16, y: 0, z: 0, w: 1.15, h: 2.1, d: 6.8, kind: 'concrete_wall' },
      { x: 16, y: 0, z: 0, w: 1.15, h: 2.1, d: 6.8, kind: 'concrete_wall' },
      { x: -8.5, y: 0, z: -9, w: 1.9, h: 1.25, d: 1.9, kind: 'wood_crate' },
      { x: 8.5, y: 0, z: 9, w: 1.9, h: 1.25, d: 1.9, kind: 'wood_crate' },
      { x: 8.5, y: 0, z: -9, w: 1.4, h: 0.95, d: 1.4, kind: 'wood_crate' },
      { x: -8.5, y: 0, z: 9, w: 1.4, h: 0.95, d: 1.4, kind: 'wood_crate' },

      // 4 Huge House-Sized Wooden Box Piles in Quadrants + Stacked Crates
      { x: -14.5, y: 0, z: -13.5, w: 5.4, h: 4.5, d: 5.0, kind: 'box_pile' },
      { x: -10.5, y: 0, z: -14.2, w: 1.8, h: 1.2, d: 1.8, kind: 'wood_crate' },
      { x: 14.5, y: 0, z: 13.5, w: 5.4, h: 4.5, d: 5.0, kind: 'box_pile' },
      { x: 10.5, y: 0, z: 14.2, w: 1.8, h: 1.2, d: 1.8, kind: 'wood_crate' },

      { x: 14, y: 0, z: -13, w: 3.2, h: 1.8, d: 2.6, kind: 'wood_crate' },
      { x: 17.0, y: 0, z: -13.5, w: 1.5, h: 1.05, d: 1.5, kind: 'wood_crate' },
      { x: -14, y: 0, z: 13, w: 3.2, h: 1.8, d: 2.6, kind: 'wood_crate' },
      { x: -17.0, y: 0, z: 13.5, w: 1.5, h: 1.05, d: 1.5, kind: 'wood_crate' },

      // Extra Mid-Field Concrete Cover Bunkers & House-Sized Crate Piles
      { x: -24, y: 0, z: -6, w: 4.2, h: 1.5, d: 1.15, kind: 'concrete_wall' },
      { x: 24, y: 0, z: 6, w: 4.2, h: 1.5, d: 1.15, kind: 'concrete_wall' },
      { x: -24, y: 0, z: 6, w: 2.4, h: 1.4, d: 2.2, kind: 'wood_crate' },
      { x: 24, y: 0, z: -6, w: 2.4, h: 1.4, d: 2.2, kind: 'wood_crate' },
      { x: -27, y: 0, z: -22, w: 5.5, h: 1.65, d: 1.15, kind: 'concrete_wall' },
      { x: 27, y: 0, z: 22, w: 5.5, h: 1.65, d: 1.15, kind: 'concrete_wall' },
      { x: 27, y: 0, z: -22, w: 5.4, h: 4.5, d: 5.0, kind: 'box_pile' },
      { x: 23.0, y: 0, z: -20.5, w: 1.4, h: 1.0, d: 1.4, kind: 'wood_crate' },
      { x: -27, y: 0, z: 22, w: 5.4, h: 4.5, d: 5.0, kind: 'box_pile' },
      { x: -23.0, y: 0, z: 20.5, w: 1.4, h: 1.0, d: 1.4, kind: 'wood_crate' },

      // Additional Scattered Outdoor Cover along Approaches & Flanking Yard
      { x: -8, y: 0, z: -29, w: 2.6, h: 1.5, d: 2.2, kind: 'wood_crate' },
      { x: -5.5, y: 0, z: -29.4, w: 1.3, h: 0.95, d: 1.3, kind: 'wood_crate' },
      { x: 8, y: 0, z: 29, w: 2.6, h: 1.5, d: 2.2, kind: 'wood_crate' },
      { x: 5.5, y: 0, z: 29.4, w: 1.3, h: 0.95, d: 1.3, kind: 'wood_crate' },

      { x: 10, y: 0, z: -32, w: 2.2, h: 1.35, d: 2.2, kind: 'wood_crate' },
      { x: -10, y: 0, z: 32, w: 2.2, h: 1.35, d: 2.2, kind: 'wood_crate' },
      { x: 0, y: 0, z: -36, w: 5.2, h: 1.45, d: 1.1, kind: 'concrete_wall' },
      { x: 0, y: 0, z: 36, w: 5.2, h: 1.45, d: 1.1, kind: 'concrete_wall' },

      { x: -35, y: 0, z: -12, w: 2.8, h: 1.6, d: 2.4, kind: 'wood_crate' },
      { x: -38, y: 0, z: -10.5, w: 1.5, h: 1.05, d: 1.5, kind: 'wood_crate' },
      { x: 35, y: 0, z: 12, w: 2.8, h: 1.6, d: 2.4, kind: 'wood_crate' },
      { x: 38, y: 0, z: 10.5, w: 1.5, h: 1.05, d: 1.5, kind: 'wood_crate' },

      { x: -35, y: 0, z: 12, w: 1.2, h: 1.55, d: 5.4, kind: 'concrete_wall' },
      { x: 35, y: 0, z: -12, w: 1.2, h: 1.55, d: 5.4, kind: 'concrete_wall' },

      { x: -37, y: 0, z: -29, w: 2.4, h: 1.4, d: 2.4, kind: 'wood_crate' },
      { x: -39.5, y: 0, z: -28.0, w: 1.3, h: 0.9, d: 1.3, kind: 'wood_crate' },
      { x: 37, y: 0, z: 29, w: 2.4, h: 1.4, d: 2.4, kind: 'wood_crate' },
      { x: 39.5, y: 0, z: 28.0, w: 1.3, h: 0.9, d: 1.3, kind: 'wood_crate' },
      { x: -37, y: 0, z: 29, w: 1.2, h: 1.6, d: 5.0, kind: 'concrete_wall' },
      { x: 37, y: 0, z: -29, w: 1.2, h: 1.6, d: 5.0, kind: 'concrete_wall' },
      { x: -19, y: 0, z: -36, w: 2.6, h: 1.4, d: 2.0, kind: 'wood_crate' },
      { x: 19, y: 0, z: 36, w: 2.6, h: 1.4, d: 2.0, kind: 'wood_crate' },

      // Team Base Yard Crates (behind N/S walls, clear of spawn coordinates)
      { x: -10, y: 0, z: -53, w: 2.6, h: 1.45, d: 2.0, kind: 'wood_crate' },
      { x: 10, y: 0, z: -53, w: 1.9, h: 1.2, d: 1.9, kind: 'wood_crate' },
      { x: -10, y: 0, z: 53, w: 1.9, h: 1.2, d: 1.9, kind: 'wood_crate' },
      { x: 10, y: 0, z: 53, w: 2.6, h: 1.45, d: 2.0, kind: 'wood_crate' },
      { x: -24, y: 0, z: -54, w: 3.4, h: 1.4, d: 1.1, kind: 'concrete_wall' },
      { x: 24, y: 0, z: 54, w: 3.4, h: 1.4, d: 1.1, kind: 'concrete_wall' },
    ],
    jumpPads: [
      { x: -28, y: 0, z: 0, radius: 1.7, boostY: 13.8 },
      { x: 28, y: 0, z: 0, radius: 1.7, boostY: 13.8 },
      { x: -17, y: 0, z: -28, radius: 1.7, boostY: 13.8 },
      { x: 17, y: 0, z: 28, radius: 1.7, boostY: 13.8 },
    ],
    spawns: [
      { x: 0, y: 0, z: 58, yaw: 0 },
      { x: 0, y: 0, z: -58, yaw: Math.PI },
      { x: -18, y: 0, z: 58, yaw: 0 },
      { x: 18, y: 0, z: -58, yaw: Math.PI },
      { x: -34, y: 0, z: 32, yaw: -Math.PI / 4 },
      { x: 34, y: 0, z: -32, yaw: (3 * Math.PI) / 4 },
    ],
    teamSpawns: {
      // Blue Team (South non-building base, facing North)
      cyan: [
        { x: -16, y: 0, z: 58, yaw: 0 },
        { x: -5, y: 0, z: 59, yaw: 0 },
        { x: 5, y: 0, z: 59, yaw: 0 },
        { x: 16, y: 0, z: 58, yaw: 0 },
      ],
      // Red Team (North non-building base, facing South)
      amber: [
        { x: -16, y: 0, z: -58, yaw: Math.PI },
        { x: -5, y: 0, z: -59, yaw: Math.PI },
        { x: 5, y: 0, z: -59, yaw: Math.PI },
        { x: 16, y: 0, z: -58, yaw: Math.PI },
      ],
    },
  },
  orbital_hangar: {
    id: 'orbital_hangar',
    nameKey: 'map.orbital_hangar.name',
    subtitleKey: 'map.orbital_hangar.sub',
    arenaHalfSize: 68,
    isOutdoor: true,
    isDaylight: true,
    floorStyle: 'sandyard',
    hasRoads: false,
    hasTrees: false,
    hasStreetLights: true,
    skyTopColor: '#4c82b6',
    skyHorizonColor: '#e6d4b8',
    skyColor: '#d4c3a8',
    fogColor: '#dacbb2',
    fogDensity: 0.0028,
    floorColor: '#c8a577',
    wallColor: '#cfa97a',
    accentColor: '#d97706',
    keyLightColor: '#fff1d6',
    hemiSkyColor: '#e0efff',
    hemiGroundColor: '#9c7852',
    obstacles: buildSandyardMapObstacles(),
    jumpPads: [
      { x: -27, y: 0, z: -19, radius: 1.7, boostY: 13.8 },
      { x: 27, y: 0, z: 19, radius: 1.7, boostY: 13.8 },
      { x: -46, y: 0, z: 0, radius: 1.7, boostY: 13.5 },
      { x: 35, y: 0, z: 0, radius: 1.7, boostY: 13.5 },
    ],
    spawns: [
      { x: -6, y: 0, z: 58, yaw: 0 },
      { x: 6, y: 0, z: -58, yaw: Math.PI },
      { x: -42, y: 0, z: 56, yaw: -0.25 },
      { x: 42, y: 0, z: -56, yaw: 2.9 },
      { x: -22, y: 0, z: 58, yaw: 0 },
      { x: 22, y: 0, z: -58, yaw: Math.PI },
    ],
    teamSpawns: {
      cyan: [
        { x: -20, y: 0, z: 59, yaw: 0 },
        { x: -7, y: 0, z: 60, yaw: 0 },
        { x: 7, y: 0, z: 60, yaw: 0 },
        { x: 20, y: 0, z: 59, yaw: 0 },
      ],
      amber: [
        { x: -20, y: 0, z: -59, yaw: Math.PI },
        { x: -7, y: 0, z: -60, yaw: Math.PI },
        { x: 7, y: 0, z: -60, yaw: Math.PI },
        { x: 20, y: 0, z: -59, yaw: Math.PI },
      ],
    },
  },
  obsidian_vault: {
    id: 'obsidian_vault',
    nameKey: 'map.obsidian_vault.name',
    subtitleKey: 'map.obsidian_vault.sub',
    arenaHalfSize: 68,
    isOutdoor: true,
    isDaylight: false,
    hasTrees: false,
    hasStreetLights: true,
    skyTopColor: '#16091c',
    skyHorizonColor: '#3b152d',
    skyColor: '#1d0d1d',
    fogColor: '#1d0d1d',
    fogDensity: 0.0048,
    floorColor: '#17131e',
    wallColor: '#292136',
    accentColor: '#f43f5e',
    keyLightColor: '#ffedd5',
    hemiSkyColor: '#fb7185',
    hemiGroundColor: '#1c1917',
    obstacles: [
      { x: 0, y: 0, z: -42, w: 11, h: 5.6, d: 3.0, kind: 'monolith' },
      { x: -18, y: 0, z: -18, w: 4.5, h: 2.2, d: 4.5, kind: 'crate' },
      { x: 18, y: 0, z: -18, w: 4.5, h: 2.2, d: 4.5, kind: 'crate' },
      { x: -18, y: 0, z: 18, w: 4.5, h: 2.2, d: 4.5, kind: 'crate' },
      { x: 18, y: 0, z: 18, w: 4.5, h: 2.2, d: 4.5, kind: 'crate' },
      { x: -30, y: 0, z: -28, w: 7.4, h: 4.8, d: 7.4, kind: 'house' },
      { x: 30, y: 0, z: -28, w: 7.4, h: 4.8, d: 7.4, kind: 'house' },
      { x: -30, y: 0, z: 28, w: 7.4, h: 4.6, d: 7.4, kind: 'house' },
      { x: 30, y: 0, z: 28, w: 7.4, h: 4.6, d: 7.4, kind: 'house' },
      { x: 0, y: 0, z: 0, w: 7, h: 1.4, d: 7, kind: 'crate' },
      { x: 0, y: 2.9, z: 0, w: 18, h: 0.6, d: 4.2, kind: 'bridge' },
      { x: -34, y: 0, z: 0, w: 2.0, h: 1.25, d: 13.0, kind: 'peek_wall' },
      { x: 34, y: 0, z: 0, w: 2.0, h: 1.25, d: 13.0, kind: 'peek_wall' },
      { x: 0, y: 0, z: 28, w: 5.8, h: 1.05, d: 1.4, kind: 'peek_wall' },
      { x: -3.8, y: 0, z: 28, w: 1.6, h: 2.7, d: 1.64, kind: 'peek_wall' },
      { x: 3.8, y: 0, z: 28, w: 1.6, h: 2.7, d: 1.64, kind: 'peek_wall' },
      { x: -46, y: 0, z: 0, w: 4.5, h: 3.4, d: 7.5, kind: 'monolith' },
      { x: 46, y: 0, z: 0, w: 4.5, h: 3.4, d: 7.5, kind: 'monolith' },
      // Secluded NE basalt alcove concealing the hidden vault relic at (58.5, 1.9, -58.5)
      { x: 52.5, y: 0, z: -57.5, w: 1.8, h: 4.2, d: 8.8, kind: 'monolith' },
      { x: 57.65, y: 0, z: -52.5, w: 8.5, h: 4.2, d: 1.8, kind: 'monolith' },
      ...buildPerimeterStreetLights(68),
    ],
    jumpPads: [
      { x: -24, y: 0, z: 0, radius: 1.7, boostY: 14.0 },
      { x: 24, y: 0, z: 0, radius: 1.7, boostY: 14.0 },
      { x: 0, y: 0, z: -24, radius: 1.7, boostY: 14.0 },
      { x: 0, y: 0, z: 20, radius: 1.7, boostY: 13.8 },
    ],
    spawns: [
      { x: 0, y: 0, z: 54, yaw: 0 },
      { x: -44, y: 0, z: -44, yaw: -Math.PI * 0.75 },
      { x: 42, y: 0, z: -42, yaw: Math.PI * 0.75 },
      { x: -54, y: 0, z: 12, yaw: -Math.PI / 2 },
      { x: 54, y: 0, z: 12, yaw: Math.PI / 2 },
      { x: 0, y: 0, z: 18, yaw: 0 },
    ],
    easterEgg: {
      id: 'obsidian_resonance_prism',
      x: 58.5,
      y: 1.9,
      z: -58.5,
      radius: 0.85,
      requiredWeaponId: 'helios_rail',
      rewardSkinId: 'prism_relic',
      bonusCredits: 500,
    },
  },
  solace_courtyard: {
    id: 'solace_courtyard',
    nameKey: 'map.solace_courtyard.name',
    subtitleKey: 'map.solace_courtyard.sub',
    arenaHalfSize: 78,
    isOutdoor: true,
    isDaylight: false,
    hasRoads: true,
    hasTrees: true,
    hasStreetLights: true,
    skyTopColor: '#13315c',
    skyHorizonColor: '#f59e0b',
    skyColor: '#25425e',
    fogColor: '#2a4359',
    fogDensity: 0.0038,
    floorColor: '#2c3d32',
    wallColor: '#485751',
    accentColor: '#34d399',
    keyLightColor: '#fde68a',
    hemiSkyColor: '#93c5fd',
    hemiGroundColor: '#29382f',
    obstacles: [
      // Central Urban Overpass & Cargo Parkour Base
      { x: 0, y: 0, z: 0, w: 8.0, h: 1.5, d: 8.0, kind: 'crate' },
      { x: 0, y: 3.2, z: 0, w: 24, h: 0.65, d: 4.8, kind: 'bridge' },
      // Houses framing the inner boulevard plaza
      { x: -28, y: 0, z: -26, w: 9.5, h: 5.4, d: 9.5, kind: 'house' },
      { x: 28, y: 0, z: 26, w: 9.5, h: 5.4, d: 9.5, kind: 'house' },
      { x: -28, y: 0, z: 26, w: 8.4, h: 4.6, d: 8.4, kind: 'house' },
      { x: 28, y: 0, z: -26, w: 8.4, h: 4.6, d: 8.4, kind: 'house' },
      // Outer perimeter buildings
      { x: -50, y: 0, z: -42, w: 8.0, h: 4.8, d: 8.0, kind: 'house' },
      { x: 50, y: 0, z: 42, w: 8.0, h: 4.8, d: 8.0, kind: 'house' },
      // Stepping shipping crates beside houses
      { x: -19, y: 0, z: -20, w: 4.5, h: 2.2, d: 4.5, kind: 'crate' },
      { x: 19, y: 0, z: 20, w: 4.5, h: 2.2, d: 4.5, kind: 'crate' },
      // Tactical Windowed Peek Bunkers along N/S road
      { x: 0, y: 0, z: -34, w: 5.8, h: 1.05, d: 1.24, kind: 'peek_wall' },
      { x: -3.8, y: 0, z: -34, w: 1.6, h: 2.8, d: 1.5, kind: 'peek_wall' },
      { x: 3.8, y: 0, z: -34, w: 1.6, h: 2.8, d: 1.5, kind: 'peek_wall' },
      { x: 0, y: 2.2, z: -34, w: 5.8, h: 0.6, d: 1.36, kind: 'peek_wall' },
      { x: 0, y: 0, z: 34, w: 5.8, h: 1.05, d: 1.24, kind: 'peek_wall' },
      { x: -3.8, y: 0, z: 34, w: 1.6, h: 2.8, d: 1.5, kind: 'peek_wall' },
      { x: 3.8, y: 0, z: 34, w: 1.6, h: 2.8, d: 1.5, kind: 'peek_wall' },
      { x: 0, y: 2.2, z: 34, w: 5.8, h: 0.6, d: 1.36, kind: 'peek_wall' },
      // Flank Cover
      { x: -44, y: 0, z: 0, w: 3.0, h: 2.8, d: 7.5, kind: 'crate' },
      { x: 44, y: 0, z: 0, w: 3.0, h: 2.8, d: 7.5, kind: 'crate' },
      { x: 0, y: 0, z: -52, w: 11.0, h: 1.25, d: 1.8, kind: 'peek_wall' },
      { x: 0, y: 0, z: 52, w: 11.0, h: 1.25, d: 1.8, kind: 'peek_wall' },
      ...buildPerimeterStreetLights(78),
    ],
    jumpPads: [
      { x: -20, y: 0, z: 0, radius: 1.7, boostY: 14.2 },
      { x: 20, y: 0, z: 0, radius: 1.7, boostY: 14.2 },
      { x: 0, y: 0, z: -24, radius: 1.7, boostY: 13.8 },
      { x: 0, y: 0, z: 24, radius: 1.7, boostY: 13.8 },
      { x: -46, y: 0, z: 20, radius: 1.7, boostY: 14.2 },
      { x: 46, y: 0, z: -20, radius: 1.7, boostY: 14.2 },
    ],
    spawns: [
      { x: 0, y: 0, z: 62, yaw: 0 },
      { x: 0, y: 0, z: -62, yaw: Math.PI },
      { x: -62, y: 0, z: 0, yaw: -Math.PI / 2 },
      { x: 62, y: 0, z: 0, yaw: Math.PI / 2 },
      { x: -50, y: 0, z: -52, yaw: -Math.PI * 0.75 },
      { x: 50, y: 0, z: 52, yaw: Math.PI / 4 },
    ],
  },
  neon_foundry: {
    id: 'neon_foundry',
    nameKey: 'map.neon_foundry.name',
    subtitleKey: 'map.neon_foundry.sub',
    arenaHalfSize: 72,
    isOutdoor: true,
    isDaylight: false,
    hasRoads: true,
    hasTrees: false,
    hasStreetLights: true,
    skyTopColor: '#070f24',
    skyHorizonColor: '#1e3a5f',
    skyColor: '#0e1d36',
    fogColor: '#10203a',
    fogDensity: 0.0038,
    floorColor: '#1e293b',
    wallColor: '#334155',
    accentColor: '#38bdf8',
    keyLightColor: '#e2e8f0',
    hemiSkyColor: '#60a5fa',
    hemiGroundColor: '#1e293b',
    obstacles: buildNeonFoundryObstacles(),
    jumpPads: [
      { x: -21, y: 0, z: -21, radius: 1.7, boostY: 14.4 },
      { x: 21, y: 0, z: 21, radius: 1.7, boostY: 14.4 },
      { x: -21, y: 0, z: 21, radius: 1.7, boostY: 14.4 },
      { x: 21, y: 0, z: -21, radius: 1.7, boostY: 14.4 },
      { x: -53, y: 0, z: 0, radius: 1.7, boostY: 14.0 },
      { x: 53, y: 0, z: 0, radius: 1.7, boostY: 14.0 },
    ],
    spawns: [
      { x: 0, y: 0, z: 62, yaw: 0 },
      { x: 0, y: 0, z: -62, yaw: Math.PI },
      { x: -62, y: 0, z: 0, yaw: -Math.PI / 2 },
      { x: 62, y: 0, z: 0, yaw: Math.PI / 2 },
      { x: -56, y: 0, z: -56, yaw: -Math.PI * 0.75 },
      { x: 56, y: 0, z: 56, yaw: Math.PI / 4 },
    ],
    teamSpawns: {
      cyan: [
        { x: -22, y: 0, z: 61, yaw: 0 },
        { x: -6, y: 0, z: 62, yaw: 0 },
        { x: 6, y: 0, z: 62, yaw: 0 },
        { x: 22, y: 0, z: 61, yaw: 0 },
      ],
      amber: [
        { x: -22, y: 0, z: -61, yaw: Math.PI },
        { x: -6, y: 0, z: -62, yaw: Math.PI },
        { x: 6, y: 0, z: -62, yaw: Math.PI },
        { x: 22, y: 0, z: -61, yaw: Math.PI },
      ],
    },
  },
  veridian_park: {
    id: 'veridian_park',
    nameKey: 'map.veridian_park.name',
    subtitleKey: 'map.veridian_park.sub',
    arenaHalfSize: 74,
    isOutdoor: true,
    isDaylight: true,
    hasRoads: true,
    hasTrees: true,
    hasStreetLights: true,
    skyTopColor: '#4c80b3',
    skyHorizonColor: '#bfd4e6',
    skyColor: '#9ab9d4',
    fogColor: '#b7cde0',
    fogDensity: 0.0032,
    floorColor: '#3f5946',
    wallColor: '#56645e',
    accentColor: '#0284c7',
    keyLightColor: '#fff5e4',
    hemiSkyColor: '#c7dff2',
    hemiGroundColor: '#435246',
    obstacles: [
      { x: 0, y: 0, z: 0, w: 7.5, h: 1.4, d: 7.5, kind: 'crate' },
      { x: 0, y: 3.0, z: 0, w: 22, h: 0.6, d: 4.5, kind: 'bridge' },
      { x: -28, y: 0, z: -28, w: 8.6, h: 4.8, d: 8.6, kind: 'house' },
      { x: 28, y: 0, z: 28, w: 8.6, h: 4.8, d: 8.6, kind: 'house' },
      { x: -28, y: 0, z: 28, w: 7.6, h: 4.2, d: 7.6, kind: 'house' },
      { x: 28, y: 0, z: -28, w: 7.6, h: 4.2, d: 7.6, kind: 'house' },
      { x: -48, y: 0, z: -18, w: 6.8, h: 4.2, d: 6.8, kind: 'house' },
      { x: 48, y: 0, z: 18, w: 6.8, h: 4.2, d: 6.8, kind: 'house' },
      { x: -18, y: 0, z: -18, w: 4.2, h: 2.0, d: 4.2, kind: 'crate' },
      { x: 18, y: 0, z: 18, w: 4.2, h: 2.0, d: 4.2, kind: 'crate' },
      { x: 0, y: 0, z: -34, w: 5.8, h: 1.05, d: 1.24, kind: 'peek_wall' },
      { x: -3.8, y: 0, z: -34, w: 1.6, h: 2.7, d: 1.44, kind: 'peek_wall' },
      { x: 3.8, y: 0, z: -34, w: 1.6, h: 2.7, d: 1.44, kind: 'peek_wall' },
      { x: 0, y: 0, z: 34, w: 5.8, h: 1.05, d: 1.24, kind: 'peek_wall' },
      { x: -3.8, y: 0, z: 34, w: 1.6, h: 2.7, d: 1.44, kind: 'peek_wall' },
      { x: 3.8, y: 0, z: 34, w: 1.6, h: 2.7, d: 1.44, kind: 'peek_wall' },
      { x: -40, y: 0, z: 0, w: 2.0, h: 1.25, d: 11.0, kind: 'peek_wall' },
      { x: 40, y: 0, z: 0, w: 2.0, h: 1.25, d: 11.0, kind: 'peek_wall' },
      { x: 0, y: 0, z: -50, w: 9.5, h: 1.25, d: 1.8, kind: 'peek_wall' },
      { x: 0, y: 0, z: 50, w: 9.5, h: 1.25, d: 1.8, kind: 'peek_wall' },
      ...buildPerimeterStreetLights(74),
    ],
    jumpPads: [
      { x: -20, y: 0, z: 0, radius: 1.7, boostY: 14.0 },
      { x: 20, y: 0, z: 0, radius: 1.7, boostY: 14.0 },
      { x: 0, y: 0, z: -22, radius: 1.7, boostY: 13.6 },
      { x: 0, y: 0, z: 22, radius: 1.7, boostY: 13.6 },
      { x: -42, y: 0, z: 24, radius: 1.7, boostY: 14.0 },
      { x: 42, y: 0, z: -24, radius: 1.7, boostY: 14.0 },
    ],
    spawns: [
      { x: 0, y: 0, z: 58, yaw: 0 },
      { x: 0, y: 0, z: -58, yaw: Math.PI },
      { x: -58, y: 0, z: 0, yaw: -Math.PI / 2 },
      { x: 58, y: 0, z: 0, yaw: Math.PI / 2 },
      { x: -46, y: 0, z: 46, yaw: -Math.PI / 4 },
      { x: 46, y: 0, z: -46, yaw: (3 * Math.PI) / 4 },
    ],
  },
  sandstone_bazaar: {
    id: 'sandstone_bazaar',
    nameKey: 'map.sandstone_bazaar.name',
    subtitleKey: 'map.sandstone_bazaar.sub',
    arenaHalfSize: 74,
    isOutdoor: true,
    isDaylight: true,
    hasRoads: true,
    hasTrees: true,
    hasStreetLights: false,
    skyTopColor: '#5b88b5',
    skyHorizonColor: '#dfd3be',
    skyColor: '#c8c3b8',
    fogColor: '#d3cab9',
    fogDensity: 0.0034,
    floorColor: '#8d7a62',
    wallColor: '#735e4a',
    accentColor: '#d97706',
    keyLightColor: '#ffeed6',
    hemiSkyColor: '#dbeafe',
    hemiGroundColor: '#695642',
    obstacles: [
      { x: 0, y: 0, z: 0, w: 8.5, h: 2.2, d: 8.5, kind: 'crate' },
      { x: -16, y: 0, z: 0, w: 4.8, h: 1.3, d: 4.8, kind: 'crate' },
      { x: 16, y: 0, z: 0, w: 4.8, h: 1.3, d: 4.8, kind: 'crate' },
      { x: 0, y: 3.0, z: -14, w: 5.0, h: 0.6, d: 15, kind: 'bridge' },
      { x: 0, y: 3.0, z: 14, w: 5.0, h: 0.6, d: 15, kind: 'bridge' },
      { x: -30, y: 0, z: -26, w: 9.0, h: 5.0, d: 8.4, kind: 'house' },
      { x: 30, y: 0, z: 26, w: 9.0, h: 5.0, d: 8.4, kind: 'house' },
      { x: 30, y: 0, z: -26, w: 8.0, h: 4.4, d: 8.0, kind: 'house' },
      { x: -30, y: 0, z: 26, w: 8.0, h: 4.4, d: 8.0, kind: 'house' },
      { x: -48, y: 0, z: 28, w: 7.0, h: 4.2, d: 7.0, kind: 'house' },
      { x: 48, y: 0, z: -28, w: 7.0, h: 4.2, d: 7.0, kind: 'house' },
      { x: -34, y: 0, z: 0, w: 2.2, h: 1.2, d: 11.5, kind: 'peek_wall' },
      { x: 34, y: 0, z: 0, w: 2.2, h: 1.2, d: 11.5, kind: 'peek_wall' },
      { x: 0, y: 0, z: -40, w: 9.0, h: 1.2, d: 1.8, kind: 'peek_wall' },
      { x: 0, y: 0, z: 40, w: 9.0, h: 1.2, d: 1.8, kind: 'peek_wall' },
    ],
    jumpPads: [
      { x: -24, y: 0, z: -9, radius: 1.7, boostY: 14.0 },
      { x: 24, y: 0, z: 9, radius: 1.7, boostY: 14.0 },
      { x: 0, y: 0, z: -30, radius: 1.7, boostY: 14.0 },
      { x: 0, y: 0, z: 30, radius: 1.7, boostY: 14.0 },
    ],
    spawns: [
      { x: 0, y: 0, z: 58, yaw: 0 },
      { x: 0, y: 0, z: -58, yaw: Math.PI },
      { x: -58, y: 0, z: 0, yaw: -Math.PI / 2 },
      { x: 58, y: 0, z: 0, yaw: Math.PI / 2 },
      { x: -46, y: 0, z: -46, yaw: -Math.PI * 0.75 },
      { x: 46, y: 0, z: 46, yaw: Math.PI / 4 },
    ],
  },
  skyline_terrace: {
    id: 'skyline_terrace',
    nameKey: 'map.skyline_terrace.name',
    subtitleKey: 'map.skyline_terrace.sub',
    arenaHalfSize: 70,
    isOutdoor: true,
    isDaylight: false,
    hasRoads: true,
    hasTrees: true,
    hasStreetLights: true,
    skyTopColor: '#0c1628',
    skyHorizonColor: '#1f3654',
    skyColor: '#142236',
    fogColor: '#16263b',
    fogDensity: 0.0042,
    floorColor: '#252e3a',
    wallColor: '#374252',
    accentColor: '#14b8a6',
    keyLightColor: '#cbd5e1',
    hemiSkyColor: '#38bdf8',
    hemiGroundColor: '#1e293b',
    obstacles: [
      { x: 0, y: 0, z: 0, w: 7.2, h: 1.5, d: 7.2, kind: 'crate' },
      { x: -18, y: 0, z: -18, w: 5.5, h: 2.4, d: 5.5, kind: 'crate' },
      { x: 18, y: 0, z: 18, w: 5.5, h: 2.4, d: 5.5, kind: 'crate' },
      { x: -18, y: 0, z: 18, w: 5.5, h: 2.4, d: 5.5, kind: 'crate' },
      { x: 18, y: 0, z: -18, w: 5.5, h: 2.4, d: 5.5, kind: 'crate' },
      { x: 0, y: 3.1, z: -18, w: 22, h: 0.6, d: 4.2, kind: 'bridge' },
      { x: 0, y: 3.1, z: 18, w: 22, h: 0.6, d: 4.2, kind: 'bridge' },
      { x: -34, y: 0, z: -30, w: 8.2, h: 4.8, d: 8.2, kind: 'house' },
      { x: 34, y: 0, z: 30, w: 8.2, h: 4.8, d: 8.2, kind: 'house' },
      { x: -34, y: 0, z: 30, w: 7.8, h: 4.2, d: 7.8, kind: 'house' },
      { x: 34, y: 0, z: -30, w: 7.8, h: 4.2, d: 7.8, kind: 'house' },
      { x: -38, y: 0, z: 0, w: 2.0, h: 1.25, d: 11.5, kind: 'peek_wall' },
      { x: 38, y: 0, z: 0, w: 2.0, h: 1.25, d: 11.5, kind: 'peek_wall' },
      { x: 0, y: 0, z: -46, w: 10.0, h: 1.25, d: 1.8, kind: 'peek_wall' },
      { x: 0, y: 0, z: 46, w: 10.0, h: 1.25, d: 1.8, kind: 'peek_wall' },
      ...buildPerimeterStreetLights(70),
    ],
    jumpPads: [
      { x: -18, y: 0, z: 0, radius: 1.7, boostY: 14.0 },
      { x: 18, y: 0, z: 0, radius: 1.7, boostY: 14.0 },
      { x: 0, y: 0, z: -32, radius: 1.7, boostY: 13.8 },
      { x: 0, y: 0, z: 32, radius: 1.7, boostY: 13.8 },
    ],
    spawns: [
      { x: 0, y: 0, z: 56, yaw: 0 },
      { x: 0, y: 0, z: -56, yaw: Math.PI },
      { x: -56, y: 0, z: 0, yaw: -Math.PI / 2 },
      { x: 56, y: 0, z: 0, yaw: Math.PI / 2 },
      { x: -46, y: 0, z: -46, yaw: -Math.PI * 0.75 },
      { x: 46, y: 0, z: 46, yaw: Math.PI / 4 },
    ],
  },
};

export const MAP_LIST: MapDef[] = [
  MAPS.hyperion_atrium,
  MAPS.orbital_hangar,
  MAPS.obsidian_vault,
  MAPS.solace_courtyard,
  MAPS.neon_foundry,
  MAPS.veridian_park,
  MAPS.sandstone_bazaar,
  MAPS.skyline_terrace,
];

export const BATTLE_PASS_TIERS: BattlePassTier[] = [
  {
    tier: 1,
    xpRequired: 200,
    freeReward: { type: 'credits', amount: 150, label: '150 CR' },
    premiumReward: { type: 'credits', amount: 250, label: '250 CR' },
  },
  {
    tier: 2,
    xpRequired: 450,
    freeReward: { type: 'title', itemId: 'Prism Initiate', label: 'Title: Prism Initiate' },
    premiumReward: { type: 'weapon_skin', itemId: 'emerald_circuit', label: 'Skin: Emerald Circuit' },
  },
  {
    tier: 3,
    xpRequired: 750,
    freeReward: { type: 'credits', amount: 200, label: '200 CR' },
    premiumReward: { type: 'credits', amount: 300, label: '300 CR' },
  },
  {
    tier: 4,
    xpRequired: 1100,
    freeReward: { type: 'avatar_skin', itemId: 'stealth_matte', label: 'Armor: Stealth Ranger' },
    premiumReward: { type: 'credits', amount: 350, label: '350 CR' },
  },
  {
    tier: 5,
    xpRequired: 1500,
    freeReward: { type: 'credits', amount: 250, label: '250 CR' },
    premiumReward: { type: 'weapon_skin', itemId: 'royal_walnut', label: 'Skin: Golden Walnut' },
  },
  {
    tier: 6,
    xpRequired: 2000,
    freeReward: { type: 'title', itemId: 'Vector Ace', label: 'Title: Vector Ace' },
    premiumReward: { type: 'avatar_skin', itemId: 'crimson_striker', label: 'Armor: Crimson Striker' },
  },
  {
    tier: 7,
    xpRequired: 2600,
    freeReward: { type: 'credits', amount: 300, label: '300 CR' },
    premiumReward: { type: 'credits', amount: 500, label: '500 CR' },
  },
  {
    tier: 8,
    xpRequired: 3300,
    freeReward: { type: 'weapon_skin', itemId: 'carbon_phantom', label: 'Skin: Carbon Hex' },
    premiumReward: { type: 'avatar_skin', itemId: 'aurora_violet', label: 'Armor: Aurora Violet' },
  },
  {
    tier: 9,
    xpRequired: 4100,
    freeReward: { type: 'credits', amount: 400, label: '400 CR' },
    premiumReward: { type: 'weapon_skin', itemId: 'rainbow_spectrum', label: 'Skin: Rainbow Spectrum' },
  },
  {
    tier: 10,
    xpRequired: 5000,
    freeReward: { type: 'title', itemId: 'Refraction Legend', label: 'Title: Refraction Legend' },
    premiumReward: { type: 'credits', amount: 1000, label: '1000 CR' },
  },
];

export const DEFAULT_KEYBINDS: Keybinds = {
  moveForward: 'KeyW',
  moveBackward: 'KeyS',
  moveLeft: 'KeyA',
  moveRight: 'KeyD',
  jump: 'Space',
  dash: 'ShiftLeft',
  reload: 'KeyR',
  chat: 'KeyT',
  pause: 'KeyP',
  slot1: 'Digit1',
  slot2: 'Digit2',
  slot3: 'Digit3',
  slot4: 'Digit4',
};

export const DEFAULT_SETTINGS: GameSettings = {
  graphicsQuality: 'high',
  shadowQuality: 'high',
  renderDistance: 180,
  vsync: false,
  showFps: true,
  fpsCap: 'unlimited',
  fov: 82,
  mouseSensitivity: 1.0,
  aimMode: 'hold',
  shadowsEnabled: true,
  particlesEnabled: true,
  audioEnabled: true,
  masterVolume: 0.7,
  controllerEnabled: true,
  controllerSensitivity: 1.0,
  controllerDeadzone: 0.15,
  controllerInvertY: false,
  controllerVibration: true,
  darkMode: true,
  language: 'en',
  crossPlatformEnabled: true,
};

export const PASS_SEASON_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

export const DEFAULT_EQUIPPED_WEAPON_SKINS: Record<WeaponId, string> = {
  pulse_carbine: 'cobalt_standard',
  volt_scatter: 'cobalt_standard',
  helios_rail: 'cobalt_standard',
  arc_repeater: 'cobalt_standard',
};

export function createDefaultEquippedWeaponSkins(): Record<WeaponId, string> {
  return { ...DEFAULT_EQUIPPED_WEAPON_SKINS };
}

export function createDefaultWeaponStats() {
  return {
    pulse_carbine: { kills: 0, shotsFired: 0, shotsHit: 0 },
    volt_scatter: { kills: 0, shotsFired: 0, shotsHit: 0 },
    helios_rail: { kills: 0, shotsFired: 0, shotsHit: 0 },
    arc_repeater: { kills: 0, shotsFired: 0, shotsHit: 0 },
  };
}

export const DAILY_MISSIONS: MissionDef[] = [
  {
    id: 'daily_tags_in_match',
    period: 'daily',
    kind: 'daily_tags_in_match',
    target: 5,
    rewardCredits: 120,
    title: 'Single-Match Surge',
    description: 'Get 5 tags in one match',
  },
  {
    id: 'daily_play_games',
    period: 'daily',
    kind: 'daily_play_games',
    target: 2,
    rewardCredits: 100,
    title: 'Arena Regular',
    description: 'Play 2 games',
  },
  {
    id: 'daily_total_tags',
    period: 'daily',
    kind: 'daily_total_tags',
    target: 12,
    rewardCredits: 150,
    title: 'Precision Routine',
    description: 'Score 12 tags today across matches',
  },
];

export const WEEKLY_MISSIONS: MissionDef[] = [
  {
    id: 'weekly_kills_pulse_carbine',
    period: 'weekly',
    kind: 'weekly_weapon_kills',
    weaponId: 'pulse_carbine',
    target: 200,
    rewardCredits: 600,
    title: 'AR Marksman (200 Tags)',
    description: 'Get 200 kills/tags with Pulse Carbine (AR)',
  },
  {
    id: 'weekly_kills_volt_scatter',
    period: 'weekly',
    kind: 'weekly_weapon_kills',
    weaponId: 'volt_scatter',
    target: 200,
    rewardCredits: 650,
    title: 'Shotgun Breacher (200 Tags)',
    description: 'Get 200 kills/tags with Volt Scattergun (Shotgun)',
  },
  {
    id: 'weekly_kills_helios_rail',
    period: 'weekly',
    kind: 'weekly_weapon_kills',
    weaponId: 'helios_rail',
    target: 200,
    rewardCredits: 700,
    title: 'Sniper Ace (200 Tags)',
    description: 'Get 200 kills/tags with Helios Railgun (Sniper)',
  },
  {
    id: 'weekly_kills_arc_repeater',
    period: 'weekly',
    kind: 'weekly_weapon_kills',
    weaponId: 'arc_repeater',
    target: 200,
    rewardCredits: 600,
    title: 'SMG Striker (200 Tags)',
    description: 'Get 200 kills/tags with Arc Repeater (SMG)',
  },
];

export const ALL_MISSIONS: MissionDef[] = [...DAILY_MISSIONS, ...WEEKLY_MISSIONS];

export function getDailyDateKeyFromMs(nowMs = Date.now()): string {
  return new Date(nowMs).toISOString().slice(0, 10);
}

export function getWeeklyKeyFromMs(nowMs = Date.now()): string {
  const d = new Date(nowMs);
  const utc = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNum = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((utc.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${utc.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

export function createDefaultMissionsState(nowMs = Date.now()): PlayerMissionsState {
  return {
    dailyDateKey: getDailyDateKeyFromMs(nowMs),
    weeklyKey: getWeeklyKeyFromMs(nowMs),
    dailyGamesPlayed: 0,
    dailyBestMatchTags: 0,
    dailyTotalTags: 0,
    dailyClaimedIds: [],
    weeklyWeaponKills: {
      pulse_carbine: 0,
      volt_scatter: 0,
      helios_rail: 0,
      arc_repeater: 0,
    },
    weeklyClaimedIds: [],
  };
}

export function createDefaultProfile(nickname = 'Vanguard01'): PlayerCloudProfile {
  const nowMs = Date.now();
  return {
    accountId: `local-${nickname.toLowerCase()}`,
    nickname,
    platform: 'Web',
    credits: 100,
    xp: 0,
    battlePassXp: 0,
    battlePassPremium: false,
    passSeasonNumber: 1,
    passSeasonEndsAt: new Date(nowMs + PASS_SEASON_DURATION_MS).toISOString(),
    claimedFreeTiers: [],
    claimedPremiumTiers: [],
    unlockedWeaponSkins: ['cobalt_standard'],
    unlockedAvatarSkins: ['vanguard_cyan'],
    equippedWeaponId: 'pulse_carbine',
    equippedWeaponSkinId: 'cobalt_standard',
    equippedWeaponSkins: createDefaultEquippedWeaponSkins(),
    equippedAvatarSkinId: 'vanguard_cyan',
    tutorialCompleted: false,
    easterEggUnlocked: false,
    missions: createDefaultMissionsState(nowMs),
    stats: {
      matchesPlayed: 0,
      wins: 0,
      tags: 0,
      deaths: 0,
      shotsFired: 0,
      shotsHit: 0,
      weaponStats: createDefaultWeaponStats(),
    },
    settings: { ...DEFAULT_SETTINGS },
    keybinds: { ...DEFAULT_KEYBINDS },
    lastSyncedAt: new Date(nowMs).toISOString(),
  };
}
