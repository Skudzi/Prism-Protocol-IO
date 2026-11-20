export type LanguageCode = 'en' | 'es' | 'sk' | 'fr' | 'ja';

export type WeaponId = 'pulse_carbine' | 'volt_scatter' | 'helios_rail' | 'arc_repeater';

export type MapId =
  | 'hyperion_atrium'
  | 'orbital_hangar'
  | 'obsidian_vault'
  | 'solace_courtyard'
  | 'cryo_spire'
  | 'veridian_park'
  | 'sandstone_bazaar'
  | 'skyline_terrace';

export type GraphicsQuality = 'low' | 'medium' | 'high' | 'ultra';

export type ShadowQuality = 'off' | 'low' | 'medium' | 'high' | 'ultra';

export type FpsCapMode = 'screen_locked' | '60' | '120' | '165' | '240' | 'unlimited';

export type PlatformType = 'PC' | 'Web' | 'Mobile' | 'Console';

export type GameScreenState = 'title' | 'playing' | 'paused' | 'gameover';

export type GameMode = 'ffa' | 'tdm';

export interface WeaponDef {
  id: WeaponId;
  nameKey: string;
  roleKey: string;
  damage: number;
  pellets: number;
  magSize: number;
  reloadTimeMs: number;
  ammoStyle: 'gold_bullet' | 'gray_pellets' | 'rail_lance' | 'emerald_dart';
  fireIntervalMs: number;
  energyCost: number;
  maxEnergy: number;
  rechargePerSec: number;
  maxRange: number;
  spread: number;
  moveMultiplier: number;
  beamColor: string;
  zoomFov: number;
}

export type WeaponSkinPattern =
  | 'solid_tech'
  | 'rainbow'
  | 'gold_walnut'
  | 'hex_carbon'
  | 'circuit'
  | 'prism_holo';

export interface WeaponSkinDef {
  id: string;
  name: string;
  pattern: WeaponSkinPattern;
  primaryColor: string;
  secondaryColor: string;
  emissiveColor: string;
  gripColor: string;
  scopeColor: string;
  metalness: number;
  roughness: number;
  price: number;
  unlockSource: 'starter' | 'store' | 'battlepass' | 'easter_egg';
}

export interface AvatarSkinDef {
  id: string;
  name: string;
  armorColor: string;
  clothingColor: string;
  trimColor: string;
  visorColor: string;
  price: number;
  unlockSource: 'starter' | 'store' | 'battlepass';
}

export interface MapObstacle {
  x: number;
  y: number;
  z: number;
  w: number;
  h: number;
  d: number;
  kind:
    | 'pillar'
    | 'barrier'
    | 'platform'
    | 'monolith'
    | 'rock'
    | 'crate'
    | 'wood_crate'
    | 'box_pile'
    | 'street_light'
    | 'concrete_wall'
    | 'building_wall'
    | 'building_floor'
    | 'building_roof'
    | 'sandstone_wall'
    | 'metal_awning'
    | 'ice'
    | 'bridge'
    | 'house'
    | 'peek_wall';
}

export interface HealOrbState {
  id: string;
  x: number;
  y: number;
  z: number;
  active: boolean;
}

export interface MinimapSnapshot {
  mapId: MapId;
  arenaHalfSize: number;
  player: { x: number; z: number; yaw: number };
  bots: Array<{
    id: string;
    x: number;
    z: number;
    team: 'cyan' | 'amber';
    alive: boolean;
  }>;
  peers: Array<{
    id: string;
    x: number;
    z: number;
    alive: boolean;
  }>;
  healOrbs: Array<{
    x: number;
    z: number;
    active: boolean;
  }>;
}

export interface JumpPadDef {
  x: number;
  y: number;
  z: number;
  radius: number;
  boostY: number;
}

export interface MapSpawn {
  x: number;
  y: number;
  z: number;
  yaw: number;
}

export interface MapEasterEgg {
  id: string;
  x: number;
  y: number;
  z: number;
  radius: number;
  requiredWeaponId: WeaponId;
  rewardSkinId: string;
  bonusCredits: number;
}

export interface MapDef {
  id: MapId;
  nameKey: string;
  subtitleKey: string;
  arenaHalfSize: number;
  isOutdoor: boolean;
  isDaylight?: boolean;
  floorStyle?: 'default' | 'trampled_earth' | 'sandyard';
  hasRoads?: boolean;
  hasTrees?: boolean;
  hasStreetLights?: boolean;
  skyTopColor: string;
  skyHorizonColor: string;
  skyColor: string;
  fogColor: string;
  fogDensity: number;
  floorColor: string;
  wallColor: string;
  accentColor: string;
  keyLightColor: string;
  hemiSkyColor: string;
  hemiGroundColor: string;
  obstacles: MapObstacle[];
  jumpPads: JumpPadDef[];
  spawns: MapSpawn[];
  teamSpawns?: {
    cyan: MapSpawn[];
    amber: MapSpawn[];
  };
  easterEgg?: MapEasterEgg;
}

export interface BattlePassTier {
  tier: number;
  xpRequired: number;
  freeReward: {
    type: 'credits' | 'weapon_skin' | 'avatar_skin' | 'title';
    amount?: number;
    itemId?: string;
    label: string;
  };
  premiumReward: {
    type: 'credits' | 'weapon_skin' | 'avatar_skin' | 'title';
    amount?: number;
    itemId?: string;
    label: string;
  };
}

export interface Keybinds {
  moveForward: string;
  moveBackward: string;
  moveLeft: string;
  moveRight: string;
  jump: string;
  dash: string;
  reload: string;
  chat: string;
  pause: string;
  slot1: string;
  slot2: string;
  slot3: string;
  slot4: string;
}

export interface GameSettings {
  graphicsQuality: GraphicsQuality;
  shadowQuality: ShadowQuality;
  renderDistance: number;
  vsync: boolean;
  showFps: boolean;
  fpsCap: FpsCapMode;
  fov: number;
  mouseSensitivity: number;
  shadowsEnabled: boolean;
  particlesEnabled: boolean;
  audioEnabled: boolean;
  masterVolume: number;
  controllerEnabled: boolean;
  controllerSensitivity: number;
  controllerDeadzone: number;
  controllerInvertY: boolean;
  controllerVibration: boolean;
  darkMode: boolean;
  language: LanguageCode;
  crossPlatformEnabled: boolean;
}

export interface WeaponStatsEntry {
  kills: number;
  shotsFired: number;
  shotsHit: number;
}

export interface PlayerCloudProfile {
  accountId: string;
  nickname: string;
  platform: PlatformType;
  credits: number;
  xp: number;
  battlePassXp: number;
  battlePassPremium: boolean;
  passSeasonNumber?: number;
  passSeasonEndsAt?: string;
  claimedFreeTiers: number[];
  claimedPremiumTiers: number[];
  unlockedWeaponSkins: string[];
  unlockedAvatarSkins: string[];
  equippedWeaponId: WeaponId;
  equippedWeaponSkinId: string;
  equippedAvatarSkinId: string;
  tutorialCompleted: boolean;
  easterEggUnlocked: boolean;
  stats: {
    matchesPlayed: number;
    wins: number;
    tags: number;
    deaths: number;
    shotsFired: number;
    shotsHit: number;
    weaponStats?: Record<WeaponId, WeaponStatsEntry>;
  };
  settings: GameSettings;
  keybinds: Keybinds;
  lastSyncedAt: string;
}

export type FriendStatus = 'online' | 'in_match' | 'lobby' | 'offline';

export interface FriendEntry {
  nickname: string;
  platform: PlatformType;
  status: FriendStatus;
  currentMap?: MapId;
  roomCode?: string;
}

export interface PartyInvite {
  id: string;
  fromNickname: string;
  fromPlatform: PlatformType;
  mapId: MapId;
  roomCode: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  channel: 'global' | 'party' | 'match';
  sender: string;
  platform: PlatformType;
  text: string;
  timestamp: string;
}

export interface RemoteActorState {
  id: string;
  nickname: string;
  team: 'cyan' | 'amber';
  isBot: boolean;
  platform: PlatformType;
  x: number;
  y: number;
  z: number;
  yaw: number;
  hp: number;
  maxHp: number;
  weaponId: WeaponId;
  avatarSkinId: string;
  alive: boolean;
  score: number;
  kills?: number;
  deaths?: number;
}

export interface MatchLeaderboardEntry {
  id: string;
  nickname: string;
  team: 'cyan' | 'amber';
  isBot: boolean;
  isLocalPlayer: boolean;
  kills: number;
  deaths: number;
}

export interface MatchSummary {
  won: boolean;
  gameMode: GameMode;
  mapId: MapId;
  tags: number;
  deaths: number;
  teamScoreCyan?: number;
  teamScoreAmber?: number;
  accuracy: number;
  creditsEarned: number;
  xpEarned: number;
  easterEggFound: boolean;
  durationSec: number;
  leaderboard?: MatchLeaderboardEntry[];
  weaponStats?: Record<WeaponId, WeaponStatsEntry>;
}
