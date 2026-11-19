import {
  AvatarSkinDef,
  BattlePassTier,
  GameSettings,
  Keybinds,
  MapDef,
  MapId,
  MapObstacle,
  PlayerCloudProfile,
  WeaponDef,
  WeaponId,
  WeaponSkinDef,
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

export const WEAPON_SKINS: WeaponSkinDef[] = [
  {
    id: 'cobalt_standard',
    name: 'Cobalt Tactical',
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
  },
  {
    id: 'rainbow_spectrum',
    name: 'Rainbow Spectrum',
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
  },
  {
    id: 'royal_walnut',
    name: 'Golden Walnut',
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
  },
  {
    id: 'solar_flare',
    name: 'Solar Circuit',
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
  },
  {
    id: 'carbon_phantom',
    name: 'Carbon Hex',
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
  },
  {
    id: 'emerald_circuit',
    name: 'Emerald Circuit',
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
  },
  {
    id: 'obsidian_gold',
    name: 'Obsidian Gold',
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
  },
  {
    id: 'prism_relic',
    name: 'Prism Relic',
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
  },
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
    { x: side * 60.6, y: 0, z: -47.3, w: 6.8, h: roofY, d: thick, kind: 'building_wall' },
    { x: side * 49.4, y: 0, z: -47.3, w: 6.8, h: roofY, d: thick, kind: 'building_wall' },
    { x: side * 55.0, y: 3.0, z: -47.3, w: 4.4, h: 2.0, d: thick, kind: 'building_wall' }, // F1 door header + F2 sill
    { x: side * 55.0, y: 6.0, z: -47.3, w: 4.4, h: 2.8, d: thick, kind: 'building_wall' }, // F2 lintel + F3 sill
    { x: side * 55.0, y: 9.8, z: -47.3, w: 4.4, h: 1.35, d: thick, kind: 'building_wall' }, // F3 top lintel

    // Opposite South End Wall (z = +47.3): 1 centered ground entrance (4.4m wide) + small F2/F3 end peek windows
    { x: side * 60.6, y: 0, z: 47.3, w: 6.8, h: roofY, d: thick, kind: 'building_wall' },
    { x: side * 49.4, y: 0, z: 47.3, w: 6.8, h: roofY, d: thick, kind: 'building_wall' },
    { x: side * 55.0, y: 3.0, z: 47.3, w: 4.4, h: 2.0, d: thick, kind: 'building_wall' },
    { x: side * 55.0, y: 6.0, z: 47.3, w: 4.4, h: 2.8, d: thick, kind: 'building_wall' },
    { x: side * 55.0, y: 9.8, z: 47.3, w: 4.4, h: 1.35, d: thick, kind: 'building_wall' },

    // Floor 2 Slab (walkable at y = 3.80) leaving open stairwell X:[59.6..63.3], Z:[-25.2..-12.8]
    { x: midX, y: f2SlabY, z: -36.0, w: 17.5, h: slabH, d: 21.6, kind: 'building_floor' },
    { x: midX, y: f2SlabY, z: 17.0, w: 17.5, h: slabH, d: 59.6, kind: 'building_floor' },
    { x: side * 53.5, y: f2SlabY, z: -19.0, w: 12.2, h: slabH, d: 12.4, kind: 'building_floor' },

    // Floor 3 Slab (walkable at y = 7.60) leaving open stairwell X:[59.6..63.3], Z:[+12.8..+25.2]
    { x: midX, y: f3SlabY, z: -17.0, w: 17.5, h: slabH, d: 59.6, kind: 'building_floor' },
    { x: midX, y: f3SlabY, z: 36.0, w: 17.5, h: slabH, d: 21.6, kind: 'building_floor' },
    { x: side * 53.5, y: f3SlabY, z: 19.0, w: 12.2, h: slabH, d: 12.4, kind: 'building_floor' },

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
  addSolidInnerWall(-48.0, -33.8, 0, f1H);
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
  addSolidInnerWall(33.8, 48.0, 0, f1H);

  // Floors 2 & 3 Inner Courtyard Walls: zero doorways, 5 small peek windows per floor between solid hiding walls
  for (const fy of [f2Y, f3Y]) {
    addSolidInnerWall(-48.0, -33.8, fy, f1H);
    addSmallWindow(-32.5, 2.6, fy);
    addSolidInnerWall(-31.2, -19.8, fy, f1H);
    addSmallWindow(-18.5, 2.6, fy);
    addSolidInnerWall(-17.2, -1.3, fy, f1H);
    addSmallWindow(0, 2.6, fy);
    addSolidInnerWall(1.3, 17.2, fy, f1H);
    addSmallWindow(18.5, 2.6, fy);
    addSolidInnerWall(19.8, 31.2, fy, f1H);
    addSmallWindow(32.5, 2.6, fy);
    addSolidInnerWall(33.8, 48.0, fy, f1H);
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

      // Large + Stacked Wooden Box Clusters in Quadrants
      { x: -14, y: 0, z: -13, w: 3.8, h: 2.2, d: 3.4, kind: 'wood_crate' },
      { x: -14, y: 2.2, z: -13, w: 1.7, h: 1.15, d: 1.7, kind: 'wood_crate' },
      { x: -10.8, y: 0, z: -14.2, w: 1.8, h: 1.2, d: 1.8, kind: 'wood_crate' },
      { x: 14, y: 0, z: 13, w: 3.8, h: 2.2, d: 3.4, kind: 'wood_crate' },
      { x: 14, y: 2.2, z: 13, w: 1.7, h: 1.15, d: 1.7, kind: 'wood_crate' },
      { x: 10.8, y: 0, z: 14.2, w: 1.8, h: 1.2, d: 1.8, kind: 'wood_crate' },

      { x: 14, y: 0, z: -13, w: 3.2, h: 1.8, d: 2.6, kind: 'wood_crate' },
      { x: 17.0, y: 0, z: -13.5, w: 1.5, h: 1.05, d: 1.5, kind: 'wood_crate' },
      { x: -14, y: 0, z: 13, w: 3.2, h: 1.8, d: 2.6, kind: 'wood_crate' },
      { x: -17.0, y: 0, z: 13.5, w: 1.5, h: 1.05, d: 1.5, kind: 'wood_crate' },

      // Extra Mid-Field Concrete Cover Bunkers & Stacked Crates
      { x: -24, y: 0, z: -6, w: 4.2, h: 1.5, d: 1.15, kind: 'concrete_wall' },
      { x: 24, y: 0, z: 6, w: 4.2, h: 1.5, d: 1.15, kind: 'concrete_wall' },
      { x: -24, y: 0, z: 6, w: 2.4, h: 1.4, d: 2.2, kind: 'wood_crate' },
      { x: 24, y: 0, z: -6, w: 2.4, h: 1.4, d: 2.2, kind: 'wood_crate' },
      { x: -27, y: 0, z: -22, w: 5.5, h: 1.65, d: 1.15, kind: 'concrete_wall' },
      { x: 27, y: 0, z: 22, w: 5.5, h: 1.65, d: 1.15, kind: 'concrete_wall' },
      { x: 27, y: 0, z: -22, w: 4.0, h: 2.35, d: 3.6, kind: 'wood_crate' },
      { x: 27, y: 2.35, z: -22, w: 1.6, h: 1.1, d: 1.6, kind: 'wood_crate' },
      { x: 24.0, y: 0, z: -20.5, w: 1.4, h: 1.0, d: 1.4, kind: 'wood_crate' },
      { x: -27, y: 0, z: 22, w: 4.0, h: 2.35, d: 3.6, kind: 'wood_crate' },
      { x: -27, y: 2.35, z: 22, w: 1.6, h: 1.1, d: 1.6, kind: 'wood_crate' },
      { x: -24.0, y: 0, z: 20.5, w: 1.4, h: 1.0, d: 1.4, kind: 'wood_crate' },

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
    hasStreetLights: false,
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
    obstacles: [
      // Standoff 2 Sandyard-inspired Compound:
      // 1. North (Red Spawn) & South (Blue Spawn) Sandstone Courtyard Archways
      // North yard wall at z = -42 with 3 open arch lanes (West, Mid, East)
      { x: -34, y: 0, z: -42, w: 12, h: 4.8, d: 1.6, kind: 'sandstone_wall' },
      { x: -13, y: 0, z: -42, w: 10, h: 4.8, d: 1.6, kind: 'sandstone_wall' },
      { x: 13, y: 0, z: -42, w: 10, h: 4.8, d: 1.6, kind: 'sandstone_wall' },
      { x: 34, y: 0, z: -42, w: 12, h: 4.8, d: 1.6, kind: 'sandstone_wall' },
      { x: 0, y: 3.4, z: -42, w: 16, h: 1.4, d: 1.6, kind: 'sandstone_wall' }, // Mid archway lintel

      // South yard wall at z = +42 with 3 open arch lanes
      { x: -34, y: 0, z: 42, w: 12, h: 4.8, d: 1.6, kind: 'sandstone_wall' },
      { x: -13, y: 0, z: 42, w: 10, h: 4.8, d: 1.6, kind: 'sandstone_wall' },
      { x: 13, y: 0, z: 42, w: 10, h: 4.8, d: 1.6, kind: 'sandstone_wall' },
      { x: 34, y: 0, z: 42, w: 12, h: 4.8, d: 1.6, kind: 'sandstone_wall' },
      { x: 0, y: 3.4, z: 42, w: 16, h: 1.4, d: 1.6, kind: 'sandstone_wall' },

      // 2. Central Mid Yard Iconic Stacked Wooden Cargo Crates & Sandstone Dividers
      { x: 0, y: 0, z: 0, w: 4.8, h: 2.3, d: 4.2, kind: 'wood_crate' },
      { x: 0, y: 2.3, z: 0, w: 2.5, h: 1.4, d: 2.4, kind: 'wood_crate' },
      { x: -4.1, y: 0, z: 1.4, w: 2.2, h: 1.35, d: 2.0, kind: 'wood_crate' },
      { x: 4.1, y: 0, z: -1.4, w: 2.2, h: 1.35, d: 2.0, kind: 'wood_crate' },
      { x: 0, y: 0, z: -14, w: 6.4, h: 1.32, d: 1.2, kind: 'sandstone_wall' },
      { x: 0, y: 0, z: 14, w: 6.4, h: 1.32, d: 1.2, kind: 'sandstone_wall' },
      { x: -11, y: 0, z: -8, w: 3.4, h: 2.1, d: 3.0, kind: 'wood_crate' },
      { x: -11, y: 2.1, z: -8, w: 1.6, h: 1.1, d: 1.6, kind: 'wood_crate' },
      { x: 11, y: 0, z: 8, w: 3.4, h: 2.1, d: 3.0, kind: 'wood_crate' },
      { x: 11, y: 2.1, z: 8, w: 1.6, h: 1.1, d: 1.6, kind: 'wood_crate' },
      { x: 10, y: 0, z: -19, w: 2.8, h: 1.5, d: 2.2, kind: 'wood_crate' },
      { x: -10, y: 0, z: 19, w: 2.8, h: 1.5, d: 2.2, kind: 'wood_crate' },
      { x: -12, y: 0, z: -28, w: 5.0, h: 1.35, d: 1.2, kind: 'concrete_wall' },
      { x: 12, y: 0, z: 28, w: 5.0, h: 1.35, d: 1.2, kind: 'concrete_wall' },

      // 3. West Covered Shed Alley (x: -48..-24, z: -32..+32) with Corrugated Metal Awning Roof
      { x: -24, y: 0, z: -24, w: 1.5, h: 4.2, d: 14, kind: 'sandstone_wall' },
      { x: -24, y: 0, z: 0, w: 1.5, h: 4.2, d: 10, kind: 'sandstone_wall' },
      { x: -24, y: 0, z: 24, w: 1.5, h: 4.2, d: 14, kind: 'sandstone_wall' },
      { x: -50, y: 0, z: 0, w: 1.6, h: 4.5, d: 64, kind: 'sandstone_wall' },
      // Corrugated metal shed awnings overhead (y = 4.0) casting desert shadow
      { x: -37, y: 4.0, z: -18, w: 25.5, h: 0.35, d: 26, kind: 'metal_awning' },
      { x: -37, y: 4.0, z: 18, w: 25.5, h: 0.35, d: 26, kind: 'metal_awning' },
      // Supply crates & concrete blocks inside West shed lane
      { x: -36, y: 0, z: -16, w: 3.4, h: 2.0, d: 2.8, kind: 'wood_crate' },
      { x: -39, y: 0, z: -14, w: 1.6, h: 1.1, d: 1.6, kind: 'wood_crate' },
      { x: -36, y: 0, z: 16, w: 3.4, h: 2.0, d: 2.8, kind: 'wood_crate' },
      { x: -33, y: 0, z: 14, w: 1.6, h: 1.1, d: 1.6, kind: 'wood_crate' },
      { x: -36, y: 0, z: 0, w: 5.5, h: 1.35, d: 1.3, kind: 'concrete_wall' },

      // 4. East Raised Balcony & Underpass Corridor (x: +24..+50)
      { x: 50, y: 0, z: 0, w: 1.6, h: 6.0, d: 64, kind: 'sandstone_wall' },
      // Inner partition wall between Mid Yard and East Balcony lane (with mid & end passages)
      { x: 24, y: 0, z: -24, w: 1.5, h: 4.2, d: 14, kind: 'sandstone_wall' },
      { x: 24, y: 0, z: 0, w: 1.5, h: 3.0, d: 12, kind: 'sandstone_wall' },
      { x: 24, y: 0, z: 24, w: 1.5, h: 4.2, d: 14, kind: 'sandstone_wall' },
      // Elevated East Balcony Catwalk (walkable at y = 3.2m, clear underneath at ground level!)
      { x: 35, y: 2.85, z: 0, w: 9.0, h: 0.35, d: 34, kind: 'building_floor' },
      // Low sandstone parapet along balcony inner edge so players can peek & shoot over at Mid Yard
      { x: 30.8, y: 3.2, z: -8, w: 0.65, h: 1.05, d: 12, kind: 'sandstone_wall' },
      { x: 30.8, y: 3.2, z: 8, w: 0.65, h: 1.05, d: 12, kind: 'sandstone_wall' },
      // Crates under & beside East balcony
      { x: 36, y: 0, z: 0, w: 2.8, h: 1.5, d: 2.8, kind: 'wood_crate' },
      { x: 37, y: 3.2, z: -3, w: 1.8, h: 1.2, d: 1.8, kind: 'wood_crate' },

      // Climbable North & South Sandstone Staircases up to East Balcony (10 steps each, 0.32m rise)
      ...Array.from({ length: 10 }, (_, idx) => {
        const stepH = ((idx + 1) / 10) * 3.2;
        return [
          {
            x: 35,
            y: 0,
            z: -26.5 + idx * 0.95,
            w: 4.2,
            h: stepH,
            d: 0.95,
            kind: 'sandstone_wall' as const,
          },
          {
            x: 35,
            y: 0,
            z: 26.5 - idx * 0.95,
            w: 4.2,
            h: stepH,
            d: 0.95,
            kind: 'sandstone_wall' as const,
          },
        ];
      }).flat(),

      // 5. Base Yard Supply Cover (Blue South & Red North yards)
      { x: -10, y: 0, z: -50, w: 2.8, h: 1.45, d: 2.2, kind: 'wood_crate' },
      { x: 10, y: 0, z: -50, w: 2.2, h: 1.2, d: 2.0, kind: 'wood_crate' },
      { x: -10, y: 0, z: 50, w: 2.2, h: 1.2, d: 2.0, kind: 'wood_crate' },
      { x: 10, y: 0, z: 50, w: 2.8, h: 1.45, d: 2.2, kind: 'wood_crate' },
    ],
    jumpPads: [
      { x: -17, y: 0, z: 0, radius: 1.7, boostY: 13.8 },
      { x: 17, y: 0, z: 0, radius: 1.7, boostY: 13.8 },
      { x: 0, y: 0, z: -26, radius: 1.7, boostY: 13.5 },
      { x: 0, y: 0, z: 26, radius: 1.7, boostY: 13.5 },
    ],
    spawns: [
      { x: 0, y: 0, z: 54, yaw: 0 },
      { x: 0, y: 0, z: -54, yaw: Math.PI },
      { x: -38, y: 0, z: 34, yaw: -0.35 },
      { x: 38, y: 0, z: -34, yaw: 2.8 },
      { x: -18, y: 0, z: 54, yaw: 0 },
      { x: 18, y: 0, z: -54, yaw: Math.PI },
    ],
    teamSpawns: {
      cyan: [
        { x: -16, y: 0, z: 55, yaw: 0 },
        { x: -5, y: 0, z: 56, yaw: 0 },
        { x: 5, y: 0, z: 56, yaw: 0 },
        { x: 16, y: 0, z: 55, yaw: 0 },
      ],
      amber: [
        { x: -16, y: 0, z: -55, yaw: Math.PI },
        { x: -5, y: 0, z: -56, yaw: Math.PI },
        { x: 5, y: 0, z: -56, yaw: Math.PI },
        { x: 16, y: 0, z: -55, yaw: Math.PI },
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
      { x: 57.5, y: 0, z: -52.5, w: 8.8, h: 4.2, d: 1.8, kind: 'monolith' },
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
  cryo_spire: {
    id: 'cryo_spire',
    nameKey: 'map.cryo_spire.name',
    subtitleKey: 'map.cryo_spire.sub',
    arenaHalfSize: 70,
    isOutdoor: true,
    isDaylight: false,
    hasTrees: true,
    hasStreetLights: true,
    skyTopColor: '#041426',
    skyHorizonColor: '#0e4a6b',
    skyColor: '#092438',
    fogColor: '#092438',
    fogDensity: 0.0046,
    floorColor: '#132a3d',
    wallColor: '#1f3f59',
    accentColor: '#38bdf8',
    keyLightColor: '#e0f2fe',
    hemiSkyColor: '#7dd3fc',
    hemiGroundColor: '#0f172a',
    obstacles: [
      { x: 0, y: 0, z: 0, w: 6.0, h: 6.8, d: 6.0, kind: 'ice' },
      { x: -18, y: 0, z: 0, w: 4.6, h: 3.4, d: 4.6, kind: 'ice' },
      { x: 18, y: 0, z: 0, w: 4.6, h: 3.4, d: 4.6, kind: 'ice' },
      { x: 0, y: 0, z: -19, w: 4.6, h: 3.4, d: 4.6, kind: 'ice' },
      { x: 0, y: 0, z: 19, w: 4.6, h: 3.4, d: 4.6, kind: 'ice' },
      { x: -30, y: 0, z: -30, w: 7.4, h: 4.6, d: 7.4, kind: 'house' },
      { x: 30, y: 0, z: 30, w: 7.4, h: 4.6, d: 7.4, kind: 'house' },
      { x: -30, y: 0, z: 30, w: 6.5, h: 4.2, d: 6.5, kind: 'house' },
      { x: 30, y: 0, z: -30, w: 6.5, h: 4.2, d: 6.5, kind: 'house' },
      { x: -20, y: 0, z: -20, w: 4.0, h: 1.6, d: 4.0, kind: 'crate' },
      { x: 20, y: 0, z: 20, w: 4.0, h: 1.6, d: 4.0, kind: 'crate' },
      { x: 0, y: 2.9, z: -30, w: 18, h: 0.6, d: 4.2, kind: 'bridge' },
      { x: 0, y: 2.9, z: 30, w: 18, h: 0.6, d: 4.2, kind: 'bridge' },
      { x: -42, y: 0, z: 10, w: 7.5, h: 1.2, d: 1.8, kind: 'peek_wall' },
      { x: 42, y: 0, z: -10, w: 7.5, h: 1.2, d: 1.8, kind: 'peek_wall' },
      { x: 0, y: 0, z: -46, w: 9.0, h: 1.2, d: 1.8, kind: 'peek_wall' },
      { x: 0, y: 0, z: 46, w: 9.0, h: 1.2, d: 1.8, kind: 'peek_wall' },
    ],
    jumpPads: [
      { x: -11, y: 0, z: -30, radius: 1.7, boostY: 14.0 },
      { x: 11, y: 0, z: 30, radius: 1.7, boostY: 14.0 },
      { x: -30, y: 0, z: 0, radius: 1.7, boostY: 14.0 },
      { x: 30, y: 0, z: 0, radius: 1.7, boostY: 14.0 },
    ],
    spawns: [
      { x: 0, y: 0, z: 56, yaw: 0 },
      { x: 0, y: 0, z: -56, yaw: Math.PI },
      { x: -56, y: 0, z: 0, yaw: -Math.PI / 2 },
      { x: 56, y: 0, z: 0, yaw: Math.PI / 2 },
      { x: -48, y: 0, z: -48, yaw: -Math.PI * 0.75 },
      { x: 48, y: 0, z: 48, yaw: Math.PI / 4 },
    ],
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
  MAPS.cryo_spire,
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

export function createDefaultProfile(nickname = 'Vanguard01'): PlayerCloudProfile {
  return {
    accountId: `local-${nickname.toLowerCase()}`,
    nickname,
    platform: 'Web',
    credits: 100,
    xp: 0,
    battlePassXp: 0,
    battlePassPremium: false,
    claimedFreeTiers: [],
    claimedPremiumTiers: [],
    unlockedWeaponSkins: ['cobalt_standard'],
    unlockedAvatarSkins: ['vanguard_cyan'],
    equippedWeaponId: 'pulse_carbine',
    equippedWeaponSkinId: 'cobalt_standard',
    equippedAvatarSkinId: 'vanguard_cyan',
    tutorialCompleted: false,
    easterEggUnlocked: false,
    stats: {
      matchesPlayed: 0,
      wins: 0,
      tags: 0,
      deaths: 0,
      shotsFired: 0,
      shotsHit: 0,
    },
    settings: { ...DEFAULT_SETTINGS },
    keybinds: { ...DEFAULT_KEYBINDS },
    lastSyncedAt: new Date().toISOString(),
  };
}
