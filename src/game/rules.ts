import {
  AVATAR_SKINS,
  BATTLE_PASS_TIERS,
  CHEST_CATALOG,
  createDefaultEquippedWeaponSkins,
  createDefaultWeaponStats,
  MAP_LIST,
  MAPS,
  PASS_SEASON_DURATION_MS,
  RARITY_META,
  RARITY_ORDER,
  WEAPON_SKINS,
} from './catalog';
import {
  AvatarSkinDef,
  ChestDef,
  ChestId,
  ChestOpenResult,
  GameMode,
  HealOrbState,
  MapDef,
  MapId,
  MapObstacle,
  MatchLeaderboardEntry,
  MatchSummary,
  MatchmakingRoomInfo,
  PlayerCloudProfile,
  SkinRarity,
  WeaponId,
  WeaponSkinDef,
  WeaponStatsEntry,
} from './types';

export { PASS_SEASON_DURATION_MS };

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface RayTarget {
  id: string;
  x: number;
  y: number;
  z: number;
  radius: number;
  height: number;
  alive: boolean;
}

export interface RayHitResult {
  hitType: 'none' | 'obstacle' | 'target' | 'easter_egg';
  hitZone?: 'head' | 'body';
  distance: number;
  targetId?: string;
  point: Vec3;
}

export function calculateDamage(
  baseDamage: number,
  hitZone: 'head' | 'body' = 'body'
): number {
  return hitZone === 'head' ? Math.round(baseDamage * 1.75) : baseDamage;
}

export function canManualReload(
  ammo: number,
  magSize: number,
  isReloading: boolean
): boolean {
  return !isReloading && ammo >= 0 && ammo <= magSize - 1;
}

export function shouldAutoReload(ammo: number, isReloading: boolean): boolean {
  return !isReloading && ammo <= 0;
}

export const NORMAL_JUMP_VELOCITY = 8.0;
export const UNDERFOOT_JUMP_VELOCITY = NORMAL_JUMP_VELOCITY * Math.sqrt(1.3);

export function canTriggerUnderfootJump(
  dirY: number,
  hitDistance: number,
  cooldownMsRemaining: number,
  weaponId: WeaponId = 'volt_scatter'
): boolean {
  return (
    weaponId === 'volt_scatter' &&
    cooldownMsRemaining <= 0 &&
    dirY <= -0.65 &&
    hitDistance <= 3.8
  );
}

export function applyUnderfootJumpVelocity(currentVelY: number): number {
  return Math.max(currentVelY, UNDERFOOT_JUMP_VELOCITY);
}

export function pickRandomMapId(
  excludeMapId?: MapId | MapId[],
  rng: () => number = Math.random
): MapId {
  const excludedSet = new Set<MapId>(
    Array.isArray(excludeMapId) ? excludeMapId : excludeMapId ? [excludeMapId] : []
  );
  const pool =
    excludedSet.size > 0 ? MAP_LIST.filter((m) => !excludedSet.has(m.id)) : MAP_LIST;
  const candidates = pool.length > 0 ? pool : MAP_LIST;
  const idx = Math.min(candidates.length - 1, Math.floor(rng() * candidates.length));
  return candidates[idx].id;
}

export const MAX_PLAYERS_PER_ROOM = 12;

export interface ActiveMatchRoomState {
  roomCode: string;
  mode: GameMode;
  mapId: MapId;
  playerCount: number;
}

export function allocateMatchmakingRoom(
  activeRooms: ActiveMatchRoomState[],
  mode: GameMode,
  options?: {
    maxPlayers?: number;
    excludeRoomCode?: string;
    excludeMapIds?: MapId[];
    rng?: () => number;
    nextRoomCode?: (mode: GameMode, index: number) => string;
  }
): MatchmakingRoomInfo {
  const maxPlayers = Math.max(1, options?.maxPlayers ?? MAX_PLAYERS_PER_ROOM);
  const rng = options?.rng ?? Math.random;

  const sameModeRooms = activeRooms.filter((r) => r.mode === mode);
  const joinable = sameModeRooms.find(
    (r) => r.roomCode !== options?.excludeRoomCode && r.playerCount < maxPlayers
  );

  if (joinable) {
    return {
      roomCode: joinable.roomCode,
      mode,
      mapId: joinable.mapId,
      playerCount: joinable.playerCount,
      maxPlayers,
      isNewRoom: false,
    };
  }

  const usedMapIds = new Set<MapId>([
    ...sameModeRooms.map((r) => r.mapId),
    ...(options?.excludeMapIds ?? []),
  ]);
  const mapId = pickRandomMapId(Array.from(usedMapIds), rng);
  const prefix = mode === 'tdm' ? 'TDM' : 'FFA';
  const existingCodes = new Set(activeRooms.map((r) => r.roomCode));
  let idx = sameModeRooms.length + 1;
  let roomCode = options?.nextRoomCode
    ? options.nextRoomCode(mode, idx)
    : `${prefix}-${idx}`;
  while (existingCodes.has(roomCode)) {
    idx += 1;
    roomCode = options?.nextRoomCode
      ? options.nextRoomCode(mode, idx)
      : `${prefix}-${idx}`;
  }

  return {
    roomCode,
    mode,
    mapId,
    playerCount: 0,
    maxPlayers,
    isNewRoom: true,
  };
}

export function checkJumpPadCollision(
  pos: Vec3,
  map: MapDef
): number | null {
  for (const pad of map.jumpPads) {
    const dx = pos.x - pad.x;
    const dz = pos.z - pad.z;
    if (Math.abs(pos.y - pad.y) <= 0.7 && dx * dx + dz * dz <= pad.radius * pad.radius) {
      return pad.boostY;
    }
  }
  return null;
}

export function getHealOrbScheduleTimes(
  matchDurationSec = 120,
  totalOrbs = 5
): number[] {
  const times: number[] = [];
  const marginStart = 12;
  const marginEnd = 12;
  const usable = Math.max(20, matchDurationSec - marginStart - marginEnd);
  const step = totalOrbs > 1 ? usable / (totalOrbs - 1) : 0;
  for (let i = 0; i < totalOrbs; i++) {
    // Seconds elapsed into the match when each orb spawns
    times.push(Math.round(marginStart + i * step));
  }
  return times;
}

export function pickOpenHealOrbPosition(
  map: MapDef,
  randX = Math.random(),
  randZ = Math.random()
): Vec3 {
  const bound = Math.max(8, map.arenaHalfSize - 5);
  for (let attempt = 0; attempt < 24; attempt++) {
    const rx = attempt === 0 ? randX : Math.random();
    const rz = attempt === 0 ? randZ : Math.random();
    const x = (rx * 2 - 1) * bound;
    const z = (rz * 2 - 1) * bound;

    const hitsObs = map.obstacles.some(
      (o) =>
        o.y < 1.8 &&
        Math.abs(x - o.x) < o.w * 0.5 + 1.4 &&
        Math.abs(z - o.z) < o.d * 0.5 + 1.4
    );
    const hitsPad = map.jumpPads.some(
      (p) => Math.hypot(x - p.x, z - p.z) < p.radius + 1.6
    );
    const hitsSpawn = map.spawns.some(
      (s) => Math.hypot(x - s.x, z - s.z) < 2.8
    );
    if (!hitsObs && !hitsPad && !hitsSpawn) {
      return { x: Number(x.toFixed(2)), y: 0, z: Number(z.toFixed(2)) };
    }
  }
  return { x: 0, y: 0, z: 10 };
}

export function checkHealOrbPickup(
  playerPos: Vec3,
  orb: Pick<HealOrbState, 'x' | 'y' | 'z' | 'active'>,
  pickupRadius = 1.45
): boolean {
  if (!orb.active) return false;
  const dx = playerPos.x - orb.x;
  const dz = playerPos.z - orb.z;
  const dy = Math.abs(playerPos.y - orb.y);
  return dy <= 1.8 && dx * dx + dz * dz <= pickupRadius * pickupRadius;
}

export function canTriggerEasterEgg(mapId: MapId, weaponId: WeaponId): boolean {
  const map = MAPS[mapId];
  if (!map || !map.easterEgg) return false;
  return map.easterEgg.requiredWeaponId === weaponId;
}

export function resolvePlayerMovement(
  pos: Vec3,
  vel: Vec3,
  moveForward: number,
  moveRight: number,
  yaw: number,
  jumpPressed: boolean,
  grounded: boolean,
  dt: number,
  map: MapDef,
  moveSpeed = 8.2,
  playerRadius = 0.48
): { pos: Vec3; vel: Vec3; grounded: boolean; jumpPadTriggered: boolean } {
  const clampedDt = Math.min(Math.max(dt, 0), 0.05);
  const sinY = Math.sin(yaw);
  const cosY = Math.cos(yaw);

  let wishX = -sinY * moveForward + cosY * moveRight;
  let wishZ = -cosY * moveForward - sinY * moveRight;
  const wishLen = Math.hypot(wishX, wishZ);
  if (wishLen > 1e-5) {
    wishX /= wishLen;
    wishZ /= wishLen;
  }

  const nextVelX = wishX * moveSpeed;
  const nextVelZ = wishZ * moveSpeed;
  let nextVelY = vel.y;
  let jumpPadTriggered = false;

  if (grounded && jumpPressed) {
    nextVelY = NORMAL_JUMP_VELOCITY;
  } else if (!grounded) {
    nextVelY -= 20.5 * clampedDt;
  }

  let nextX = pos.x + nextVelX * clampedDt;
  let nextZ = pos.z + nextVelZ * clampedDt;
  let nextY = pos.y + nextVelY * clampedDt;

  // Solid arena perimeter inside the visible border wall
  const bound = map.arenaHalfSize - playerRadius - 0.52;
  nextX = Math.max(-bound, Math.min(bound, nextX));
  nextZ = Math.max(-bound, Math.min(bound, nextZ));

  let floorHeight = 0;

  // Iterative multi-pass AABB separation so players & bots never clip into corners or rocks
  for (let pass = 0; pass < 3; pass++) {
    for (const obs of map.obstacles) {
      const halfW = obs.w * 0.5 + playerRadius;
      const halfD = obs.d * 0.5 + playerRadius;
      const obsBottom = obs.y;
      const obsTop = obs.y + obs.h;

      const dx = nextX - obs.x;
      const dz = nextZ - obs.z;

      if (Math.abs(dx) < halfW && Math.abs(dz) < halfD) {
        // Allow walking underneath elevated bridges/lintels (player head < obsBottom)
        const playerHead = pos.y + 1.62;
        if (obsBottom > 0.45 && playerHead <= obsBottom) {
          continue;
        }

        // Land cleanly on top of crates, bridges, or low sills
        if (pos.y >= obsTop - 0.38 && nextVelY <= 0.6) {
          if (obsTop > floorHeight) {
            floorHeight = obsTop;
          }
        } else if (pos.y < obsTop - 0.12 && pos.y + 1.65 > obsBottom) {
          const overlapX = halfW - Math.abs(dx);
          const overlapZ = halfD - Math.abs(dz);
          if (overlapX < overlapZ) {
            nextX += dx >= 0 ? overlapX + 0.002 : -(overlapX + 0.002);
          } else {
            nextZ += dz >= 0 ? overlapZ + 0.002 : -(overlapZ + 0.002);
          }
        }
      }
    }

    nextX = Math.max(-bound, Math.min(bound, nextX));
    nextZ = Math.max(-bound, Math.min(bound, nextZ));
  }

  let nextGrounded = false;
  if (nextY <= floorHeight) {
    nextY = floorHeight;
    nextVelY = 0;
    nextGrounded = true;
  }

  // Check jump pads after resolving XZ
  const padBoost = checkJumpPadCollision({ x: nextX, y: nextY, z: nextZ }, map);
  if (padBoost !== null && nextVelY <= 1.0) {
    nextVelY = padBoost;
    nextGrounded = false;
    jumpPadTriggered = true;
  }

  return {
    pos: { x: nextX, y: nextY, z: nextZ },
    vel: { x: nextVelX, y: nextVelY, z: nextVelZ },
    grounded: nextGrounded,
    jumpPadTriggered,
  };
}

export function intersectRayAABB(
  origin: Vec3,
  dir: Vec3,
  obs: MapObstacle
): number | null {
  const minX = obs.x - obs.w * 0.5;
  const maxX = obs.x + obs.w * 0.5;
  const minY = obs.y;
  const maxY = obs.y + obs.h;
  const minZ = obs.z - obs.d * 0.5;
  const maxZ = obs.z + obs.d * 0.5;

  let tmin = -Infinity;
  let tmax = Infinity;

  const axes: Array<[number, number, number, number]> = [
    [origin.x, dir.x, minX, maxX],
    [origin.y, dir.y, minY, maxY],
    [origin.z, dir.z, minZ, maxZ],
  ];

  for (const [o, d, bmin, bmax] of axes) {
    if (Math.abs(d) < 1e-8) {
      if (o < bmin || o > bmax) return null;
    } else {
      let t1 = (bmin - o) / d;
      let t2 = (bmax - o) / d;
      if (t1 > t2) {
        const tmp = t1;
        t1 = t2;
        t2 = tmp;
      }
      tmin = Math.max(tmin, t1);
      tmax = Math.min(tmax, t2);
      if (tmin > tmax) return null;
    }
  }

  if (tmax < 0) return null;
  return tmin >= 0 ? tmin : tmax;
}

export function intersectRaySphere(
  origin: Vec3,
  dir: Vec3,
  center: Vec3,
  radius: number
): number | null {
  const ocX = origin.x - center.x;
  const ocY = origin.y - center.y;
  const ocZ = origin.z - center.z;

  const b = ocX * dir.x + ocY * dir.y + ocZ * dir.z;
  const c = ocX * ocX + ocY * ocY + ocZ * ocZ - radius * radius;
  const disc = b * b - c;
  if (disc < 0) return null;
  const t = -b - Math.sqrt(disc);
  return t >= 0 ? t : null;
}

export function castLaserRay(
  origin: Vec3,
  dir: Vec3,
  maxRange: number,
  map: MapDef,
  targets: RayTarget[]
): RayHitResult {
  let closestDist = maxRange;
  let hitType: RayHitResult['hitType'] = 'none';
  let hitZone: 'head' | 'body' | undefined;
  let hitTargetId: string | undefined;

  for (const obs of map.obstacles) {
    const t = intersectRayAABB(origin, dir, obs);
    if (t !== null && t < closestDist) {
      closestDist = t;
      hitType = 'obstacle';
      hitZone = undefined;
      hitTargetId = undefined;
    }
  }

  // Intersect ground plane y=0 when aiming downward from above ground
  if (origin.y > 0 && dir.y < -1e-5) {
    const tFloor = -origin.y / dir.y;
    if (tFloor >= 0 && tFloor < closestDist) {
      closestDist = tFloor;
      hitType = 'obstacle';
      hitZone = undefined;
      hitTargetId = undefined;
    }
  }

  if (map.easterEgg) {
    const tEgg = intersectRaySphere(
      origin,
      dir,
      { x: map.easterEgg.x, y: map.easterEgg.y, z: map.easterEgg.z },
      map.easterEgg.radius
    );
    if (tEgg !== null && tEgg < closestDist) {
      closestDist = tEgg;
      hitType = 'easter_egg';
      hitZone = undefined;
      hitTargetId = map.easterEgg.id;
    }
  }

  for (const target of targets) {
    if (!target.alive) continue;
    const tTorso = intersectRaySphere(
      origin,
      dir,
      { x: target.x, y: target.y + target.height * 0.52, z: target.z },
      target.radius * 1.15
    );
    const tHead = intersectRaySphere(
      origin,
      dir,
      { x: target.x, y: target.y + target.height * 0.9, z: target.z },
      target.radius * 0.65
    );

    if (tHead !== null && (tTorso === null || tHead <= tTorso + 0.08)) {
      if (tHead < closestDist) {
        closestDist = tHead;
        hitType = 'target';
        hitZone = 'head';
        hitTargetId = target.id;
      }
    } else if (tTorso !== null && tTorso < closestDist) {
      closestDist = tTorso;
      hitType = 'target';
      hitZone = 'body';
      hitTargetId = target.id;
    }
  }

  return {
    hitType,
    hitZone,
    distance: closestDist,
    targetId: hitTargetId,
    point: {
      x: origin.x + dir.x * closestDist,
      y: origin.y + dir.y * closestDist,
      z: origin.z + dir.z * closestDist,
    },
  };
}

export function getBattlePassTier(battlePassXp: number): number {
  let reached = 0;
  for (const t of BATTLE_PASS_TIERS) {
    if (battlePassXp >= t.xpRequired) {
      reached = t.tier;
    }
  }
  return reached;
}

export function getChestPoolForRarity(
  chest: ChestDef,
  rarity: SkinRarity
): WeaponSkinDef[] {
  if ((chest.rarityChances[rarity] ?? 0) <= 0) return [];
  if (rarity === 'legendary' && chest.featuredLegendarySkinId) {
    const featured = WEAPON_SKINS.find((s) => s.id === chest.featuredLegendarySkinId);
    return featured ? [featured] : [];
  }
  return WEAPON_SKINS.filter(
    (s) => s.chestEligible !== false && s.rarity === rarity
  );
}

export function getChestRarityPercentages(
  chestId: ChestId
): Array<{ rarity: SkinRarity; chancePct: number }> {
  const chest = CHEST_CATALOG[chestId];
  return RARITY_ORDER.map((rarity) => ({
    rarity,
    chancePct: Number((chest.rarityChances[rarity] ?? 0).toFixed(2)),
  }));
}

export function getChestWeaponPercentages(
  chestId: ChestId
): Record<WeaponId, number> {
  const chest = CHEST_CATALOG[chestId];
  const totals: Record<WeaponId, number> = {
    pulse_carbine: 0,
    volt_scatter: 0,
    helios_rail: 0,
    arc_repeater: 0,
  };

  for (const rarity of RARITY_ORDER) {
    const tierPct = chest.rarityChances[rarity] ?? 0;
    if (tierPct <= 0) continue;
    const pool = getChestPoolForRarity(chest, rarity);
    const totalWeight = pool.reduce((sum, s) => sum + Math.max(1, s.dropWeight ?? 10), 0);
    if (totalWeight <= 0) continue;
    for (const skin of pool) {
      const w = Math.max(1, skin.dropWeight ?? 10);
      totals[skin.signatureWeapon] += tierPct * (w / totalWeight);
    }
  }

  return {
    pulse_carbine: Number(totals.pulse_carbine.toFixed(1)),
    volt_scatter: Number(totals.volt_scatter.toFixed(1)),
    helios_rail: Number(totals.helios_rail.toFixed(1)),
    arc_repeater: Number(totals.arc_repeater.toFixed(1)),
  };
}

export function rollChestOpen(
  profile: PlayerCloudProfile,
  chestId: ChestId,
  rng: () => number = Math.random
): ChestOpenResult {
  const chest = CHEST_CATALOG[chestId];
  if (!chest) {
    return { ok: false, profile, chestId, reason: 'Chest not found' };
  }
  if (profile.credits < chest.price) {
    return { ok: false, profile, chestId, reason: 'Insufficient credits' };
  }

  const totalChance = RARITY_ORDER.reduce(
    (acc, r) => acc + Math.max(0, chest.rarityChances[r] ?? 0),
    0
  );
  const roll = Math.min(totalChance - 1e-9, Math.max(0, rng() * totalChance));
  let cumulative = 0;
  let pickedRarity: SkinRarity = 'common';
  for (const r of RARITY_ORDER) {
    const pct = Math.max(0, chest.rarityChances[r] ?? 0);
    if (pct <= 0) continue;
    cumulative += pct;
    if (roll < cumulative) {
      pickedRarity = r;
      break;
    }
  }

  const pool = getChestPoolForRarity(chest, pickedRarity);
  if (pool.length === 0) {
    return { ok: false, profile, chestId, reason: 'No skins available in chest pool' };
  }

  const totalWeight = pool.reduce((sum, s) => sum + Math.max(1, s.dropWeight ?? 10), 0);
  const itemRoll = Math.min(totalWeight - 1e-9, Math.max(0, rng() * totalWeight));
  let weightAcc = 0;
  let droppedSkin = pool[pool.length - 1];
  for (const s of pool) {
    weightAcc += Math.max(1, s.dropWeight ?? 10);
    if (itemRoll < weightAcc) {
      droppedSkin = s;
      break;
    }
  }

  const alreadyOwned = profile.unlockedWeaponSkins.includes(droppedSkin.id);
  const refundCredits = alreadyOwned ? RARITY_META[droppedSkin.rarity].salvageCredits : 0;
  const nextUnlocked = alreadyOwned
    ? [...profile.unlockedWeaponSkins]
    : [...profile.unlockedWeaponSkins, droppedSkin.id];

  return {
    ok: true,
    chestId,
    skin: droppedSkin,
    isDuplicate: alreadyOwned,
    refundCredits,
    profile: {
      ...profile,
      credits: profile.credits - chest.price + refundCredits,
      unlockedWeaponSkins: nextUnlocked,
      lastSyncedAt: new Date().toISOString(),
    },
  };
}

const VALID_WEAPON_ID_SET = new Set<WeaponId>([
  'pulse_carbine',
  'volt_scatter',
  'helios_rail',
  'arc_repeater',
]);

export function normalizeEquippedWeaponSkins(
  raw?: Partial<Record<WeaponId, string>> | null,
  fallbackSkinId = 'cobalt_standard',
  activeWeaponId: WeaponId = 'pulse_carbine'
): Record<WeaponId, string> {
  const result = createDefaultEquippedWeaponSkins();
  const validSkinIds = new Set(WEAPON_SKINS.map((s) => s.id));
  let hasAnySlot = false;

  if (raw && typeof raw === 'object') {
    for (const wId of ['pulse_carbine', 'volt_scatter', 'helios_rail', 'arc_repeater'] as WeaponId[]) {
      const candidate = raw[wId];
      if (typeof candidate === 'string' && validSkinIds.has(candidate)) {
        result[wId] = candidate;
        hasAnySlot = true;
      }
    }
  }

  // Legacy migration: preserve single equippedWeaponSkinId onto its signature weapon and active weapon
  if (!hasAnySlot && typeof fallbackSkinId === 'string' && fallbackSkinId !== 'cobalt_standard' && validSkinIds.has(fallbackSkinId)) {
    const fallbackDef = WEAPON_SKINS.find((s) => s.id === fallbackSkinId);
    if (fallbackDef) {
      result[fallbackDef.signatureWeapon] = fallbackSkinId;
    }
    if (VALID_WEAPON_ID_SET.has(activeWeaponId)) {
      result[activeWeaponId] = fallbackSkinId;
    }
  }

  return result;
}

export function equipWeaponSkin(
  profile: PlayerCloudProfile,
  skinId: string,
  targetWeaponId?: WeaponId
): { ok: boolean; profile: PlayerCloudProfile; reason?: string } {
  const skin = WEAPON_SKINS.find((s) => s.id === skinId);
  if (!skin) return { ok: false, profile, reason: 'Item not found' };
  if (!profile.unlockedWeaponSkins.includes(skinId)) {
    return { ok: false, profile, reason: 'Skin not unlocked' };
  }
  const slotWeapon: WeaponId =
    targetWeaponId && VALID_WEAPON_ID_SET.has(targetWeaponId)
      ? targetWeaponId
      : skin.signatureWeapon;
  const nextSlots = {
    ...normalizeEquippedWeaponSkins(
      profile.equippedWeaponSkins,
      profile.equippedWeaponSkinId,
      profile.equippedWeaponId
    ),
    [slotWeapon]: skinId,
  };
  return {
    ok: true,
    profile: {
      ...profile,
      equippedWeaponSkins: nextSlots,
      equippedWeaponSkinId: nextSlots[profile.equippedWeaponId] ?? skinId,
    },
  };
}

export function purchaseStoreItem(
  profile: PlayerCloudProfile,
  itemType: 'weapon_skin' | 'avatar_skin',
  itemId: string,
  targetWeaponId?: WeaponId
): { ok: boolean; profile: PlayerCloudProfile; reason?: string } {
  if (itemType === 'weapon_skin') {
    const skin = WEAPON_SKINS.find((s) => s.id === itemId);
    if (!skin) return { ok: false, profile, reason: 'Item not found' };
    const slotWeapon: WeaponId =
      targetWeaponId && VALID_WEAPON_ID_SET.has(targetWeaponId)
        ? targetWeaponId
        : skin.signatureWeapon;
    const currentSlots = normalizeEquippedWeaponSkins(
      profile.equippedWeaponSkins,
      profile.equippedWeaponSkinId,
      profile.equippedWeaponId
    );
    const nextSlots = {
      ...currentSlots,
      [slotWeapon]: itemId,
    };

    if (profile.unlockedWeaponSkins.includes(itemId)) {
      return {
        ok: true,
        profile: {
          ...profile,
          equippedWeaponSkins: nextSlots,
          equippedWeaponSkinId: nextSlots[profile.equippedWeaponId] ?? itemId,
        },
      };
    }
    if (skin.unlockSource !== 'store') {
      return { ok: false, profile, reason: 'Locked to special unlock' };
    }
    if (profile.credits < skin.price) {
      return { ok: false, profile, reason: 'Insufficient credits' };
    }
    return {
      ok: true,
      profile: {
        ...profile,
        credits: profile.credits - skin.price,
        unlockedWeaponSkins: [...profile.unlockedWeaponSkins, itemId],
        equippedWeaponSkins: nextSlots,
        equippedWeaponSkinId: nextSlots[profile.equippedWeaponId] ?? itemId,
      },
    };
  }

  const avatar = AVATAR_SKINS.find((a) => a.id === itemId);
  if (!avatar) return { ok: false, profile, reason: 'Item not found' };
  if (profile.unlockedAvatarSkins.includes(itemId)) {
    return {
      ok: true,
      profile: { ...profile, equippedAvatarSkinId: itemId },
    };
  }
  if (avatar.unlockSource !== 'store') {
    return { ok: false, profile, reason: 'Locked to special unlock' };
  }
  if (profile.credits < avatar.price) {
    return { ok: false, profile, reason: 'Insufficient credits' };
  }
  return {
    ok: true,
    profile: {
      ...profile,
      credits: profile.credits - avatar.price,
      unlockedAvatarSkins: [...profile.unlockedAvatarSkins, itemId],
      equippedAvatarSkinId: itemId,
    },
  };
}

export function upgradeBattlePassPremium(
  profile: PlayerCloudProfile,
  cost = 600
): { ok: boolean; profile: PlayerCloudProfile; reason?: string } {
  if (profile.battlePassPremium) {
    return { ok: false, profile, reason: 'Already unlocked' };
  }
  if (profile.credits < cost) {
    return { ok: false, profile, reason: 'Insufficient credits' };
  }
  return {
    ok: true,
    profile: {
      ...profile,
      credits: profile.credits - cost,
      battlePassPremium: true,
    },
  };
}

export function claimBattlePassTier(
  profile: PlayerCloudProfile,
  tierNumber: number,
  track: 'free' | 'premium'
): { ok: boolean; profile: PlayerCloudProfile; reason?: string } {
  const tierDef = BATTLE_PASS_TIERS.find((t) => t.tier === tierNumber);
  if (!tierDef) return { ok: false, profile, reason: 'Invalid tier' };
  if (profile.battlePassXp < tierDef.xpRequired) {
    return { ok: false, profile, reason: 'Insufficient Battle Pass XP' };
  }
  if (track === 'premium' && !profile.battlePassPremium) {
    return { ok: false, profile, reason: 'Premium Battle Pass required' };
  }
  const claimedList =
    track === 'free' ? profile.claimedFreeTiers : profile.claimedPremiumTiers;
  if (claimedList.includes(tierNumber)) {
    return { ok: false, profile, reason: 'Already claimed' };
  }

  const reward = track === 'free' ? tierDef.freeReward : tierDef.premiumReward;
  const next: PlayerCloudProfile = {
    ...profile,
    claimedFreeTiers:
      track === 'free'
        ? [...profile.claimedFreeTiers, tierNumber]
        : profile.claimedFreeTiers,
    claimedPremiumTiers:
      track === 'premium'
        ? [...profile.claimedPremiumTiers, tierNumber]
        : profile.claimedPremiumTiers,
    unlockedWeaponSkins: [...profile.unlockedWeaponSkins],
    unlockedAvatarSkins: [...profile.unlockedAvatarSkins],
  };

  if (reward.type === 'credits' && reward.amount) {
    next.credits += reward.amount;
  } else if (
    reward.type === 'weapon_skin' &&
    reward.itemId &&
    !next.unlockedWeaponSkins.includes(reward.itemId)
  ) {
    next.unlockedWeaponSkins.push(reward.itemId);
  } else if (
    reward.type === 'avatar_skin' &&
    reward.itemId &&
    !next.unlockedAvatarSkins.includes(reward.itemId)
  ) {
    next.unlockedAvatarSkins.push(reward.itemId);
  }

  return { ok: true, profile: next };
}

export const MAX_MATCH_CREDITS = 250;
export const MAX_MATCH_XP = 50;
export const TUTORIAL_REWARD_CREDITS = 150;
export const TUTORIAL_REWARD_XP = 25;
export const DEATH_RESPAWN_COOLDOWN_MS = 3000;
export const KILL_CAM_DURATION_MS = 3000;
export const DEATH_XP_PENALTY = 5;
export const DEATH_CREDITS_PENALTY = 10;

export interface KillRankBracket {
  id: string;
  label: string;
  minKills: number;
  maxKills: number | null;
  xp: number;
  credits: number;
}

export const KILL_RANK_TABLE: KillRankBracket[] = [
  { id: 'rank_0', label: 'Recruit (0 Kills)', minKills: 0, maxKills: 0, xp: 0, credits: 0 },
  { id: 'rank_1', label: 'Trooper (1-3 Kills)', minKills: 1, maxKills: 3, xp: 5, credits: 25 },
  { id: 'rank_2', label: 'Vanguard (4-7 Kills)', minKills: 4, maxKills: 7, xp: 20, credits: 75 },
  { id: 'rank_3', label: 'Striker (8-10 Kills)', minKills: 8, maxKills: 10, xp: 30, credits: 125 },
  { id: 'rank_4', label: 'Apex (11-15 Kills)', minKills: 11, maxKills: 15, xp: 40, credits: 200 },
  { id: 'rank_5', label: 'Legend (16+ Kills)', minKills: 16, maxKills: null, xp: 50, credits: 250 },
];

export function getKillRankReward(kills: number): KillRankBracket {
  const safeKills = Math.max(0, Math.floor(kills));
  for (const bracket of KILL_RANK_TABLE) {
    if (
      safeKills >= bracket.minKills &&
      (bracket.maxKills === null || safeKills <= bracket.maxKills)
    ) {
      return bracket;
    }
  }
  return KILL_RANK_TABLE[KILL_RANK_TABLE.length - 1];
}

export function calculateMatchRewards(params: {
  won?: boolean;
  tags: number;
  deaths?: number;
}): { creditsEarned: number; xpEarned: number; rankId: string } {
  const safeTags = Math.max(0, Math.floor(params.tags));
  const safeDeaths = Math.max(0, Math.floor(params.deaths ?? 0));
  const bracket = getKillRankReward(safeTags);
  const rawCredits = bracket.credits - safeDeaths * DEATH_CREDITS_PENALTY;
  const rawXp = bracket.xp - safeDeaths * DEATH_XP_PENALTY;
  return {
    creditsEarned: Math.min(MAX_MATCH_CREDITS, Math.max(0, rawCredits)),
    xpEarned: Math.min(MAX_MATCH_XP, Math.max(0, rawXp)),
    rankId: bracket.id,
  };
}

export interface KillCamSample {
  t: number;
  attackerX: number;
  attackerY: number;
  attackerZ: number;
  attackerYaw: number;
  victimX: number;
  victimY: number;
  victimZ: number;
}

export function sampleKillCamClip(
  samples: KillCamSample[],
  progress: number
): KillCamSample | null {
  if (samples.length === 0) return null;
  if (samples.length === 1) return samples[0];

  const clamped = Math.min(1, Math.max(0, progress));
  const firstT = samples[0].t;
  const lastT = samples[samples.length - 1].t;
  const span = Math.max(1e-5, lastT - firstT);
  const targetT = firstT + clamped * span;

  for (let i = 0; i < samples.length - 1; i++) {
    const a = samples[i];
    const b = samples[i + 1];
    if (targetT <= b.t || i === samples.length - 2) {
      const segSpan = Math.max(1e-5, b.t - a.t);
      const alpha = Math.min(1, Math.max(0, (targetT - a.t) / segSpan));
      const yawDiff = Math.atan2(
        Math.sin(b.attackerYaw - a.attackerYaw),
        Math.cos(b.attackerYaw - a.attackerYaw)
      );
      return {
        t: targetT,
        attackerX: a.attackerX + (b.attackerX - a.attackerX) * alpha,
        attackerY: a.attackerY + (b.attackerY - a.attackerY) * alpha,
        attackerZ: a.attackerZ + (b.attackerZ - a.attackerZ) * alpha,
        attackerYaw: a.attackerYaw + yawDiff * alpha,
        victimX: a.victimX + (b.victimX - a.victimX) * alpha,
        victimY: a.victimY + (b.victimY - a.victimY) * alpha,
        victimZ: a.victimZ + (b.victimZ - a.victimZ) * alpha,
      };
    }
  }

  return samples[samples.length - 1];
}

export function applyTutorialCompletion(
  profile: PlayerCloudProfile
): PlayerCloudProfile {
  if (profile.tutorialCompleted) {
    return profile;
  }
  return {
    ...profile,
    tutorialCompleted: true,
    credits: profile.credits + TUTORIAL_REWARD_CREDITS,
    xp: profile.xp + TUTORIAL_REWARD_XP,
    battlePassXp: profile.battlePassXp + TUTORIAL_REWARD_XP,
    lastSyncedAt: new Date().toISOString(),
  };
}

export function applyControllerDeadzone(
  x: number,
  y: number,
  deadzone = 0.15
): { x: number; y: number } {
  const dz = Math.min(0.45, Math.max(0.02, deadzone));
  const mag = Math.hypot(x, y);
  if (mag <= dz || mag < 1e-6) {
    return { x: 0, y: 0 };
  }
  const clamped = Math.min(1, mag);
  const rescaled = (clamped - dz) / (1 - dz);
  return {
    x: (x / mag) * rescaled,
    y: (y / mag) * rescaled,
  };
}

const WEAPON_IDS: WeaponId[] = [
  'pulse_carbine',
  'volt_scatter',
  'helios_rail',
  'arc_repeater',
];

export function normalizeWeaponStats(
  raw?: Partial<Record<WeaponId, Partial<WeaponStatsEntry>>>
): Record<WeaponId, WeaponStatsEntry> {
  const base = createDefaultWeaponStats();
  if (!raw) return base;
  for (const id of WEAPON_IDS) {
    const entry = raw[id];
    if (!entry) continue;
    const kills = Math.max(0, Math.round(Number(entry.kills) || 0));
    const shotsFired = Math.max(0, Math.round(Number(entry.shotsFired) || 0));
    const shotsHit = Math.min(
      shotsFired,
      Math.max(0, Math.round(Number(entry.shotsHit) || 0))
    );
    base[id] = { kills, shotsFired, shotsHit };
  }
  return base;
}

export function calculateWeaponAccuracy(
  entry?: Partial<WeaponStatsEntry> | null
): number | null {
  if (!entry) return null;
  const fired = Math.max(0, Math.round(Number(entry.shotsFired) || 0));
  if (fired <= 0) return null;
  const hit = Math.min(fired, Math.max(0, Math.round(Number(entry.shotsHit) || 0)));
  return Math.round((hit / fired) * 100);
}

export interface BattlePassCountdown {
  days: number;
  hours: number;
  minutes: number;
  totalMinutes: number;
  remainingMs: number;
  expired: boolean;
}

export function getBattlePassCountdown(
  passSeasonEndsAt?: string,
  nowMs = Date.now()
): BattlePassCountdown {
  const parsedEnd = Date.parse(passSeasonEndsAt || '');
  const endMs = Number.isFinite(parsedEnd)
    ? parsedEnd
    : nowMs + PASS_SEASON_DURATION_MS;
  const remainingMs = Math.max(0, endMs - nowMs);
  const totalMinutes = remainingMs <= 0 ? 0 : Math.ceil(remainingMs / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;
  return {
    days,
    hours,
    minutes,
    totalMinutes,
    remainingMs,
    expired: remainingMs <= 0,
  };
}

export function syncBattlePassSeason(
  profile: PlayerCloudProfile,
  nowMs = Date.now()
): { profile: PlayerCloudProfile; resetTriggered: boolean } {
  const currentSeason = Math.max(1, Math.round(Number(profile.passSeasonNumber) || 1));
  const parsedEnd = Date.parse(profile.passSeasonEndsAt || '');
  if (!Number.isFinite(parsedEnd)) {
    return {
      profile: {
        ...profile,
        passSeasonNumber: currentSeason,
        passSeasonEndsAt: new Date(nowMs + PASS_SEASON_DURATION_MS).toISOString(),
      },
      resetTriggered: false,
    };
  }

  if (nowMs < parsedEnd) {
    if (profile.passSeasonNumber !== currentSeason) {
      return {
        profile: { ...profile, passSeasonNumber: currentSeason },
        resetTriggered: false,
      };
    }
    return { profile, resetTriggered: false };
  }

  const elapsedPastEnd = nowMs - parsedEnd;
  const cycles = Math.max(1, Math.floor(elapsedPastEnd / PASS_SEASON_DURATION_MS) + 1);
  const nextEndsAt = new Date(parsedEnd + cycles * PASS_SEASON_DURATION_MS).toISOString();

  return {
    profile: {
      ...profile,
      passSeasonNumber: currentSeason + cycles,
      passSeasonEndsAt: nextEndsAt,
      battlePassXp: 0,
      battlePassPremium: false,
      claimedFreeTiers: [],
      claimedPremiumTiers: [],
      lastSyncedAt: new Date(nowMs).toISOString(),
    },
    resetTriggered: true,
  };
}

export function detectLowPerfGpuString(
  gpuRenderer: string,
  hardwareConcurrency = 8
): boolean {
  const s = (gpuRenderer || '').trim();
  if (!s) return hardwareConcurrency > 0 && hardwareConcurrency <= 4;
  if (/NVIDIA|GeForce|RTX|GTX|Radeon RX|Radeon Pro|Apple M[2-9]|Apple M1 (Pro|Max|Ultra)/i.test(s)) {
    return false;
  }
  if (/Intel.*(UHD|HD Graphics|Iris|Arc\(TM\) Graphics)|Mesa Intel|Mali-|Adreno|PowerVR/i.test(s)) {
    return true;
  }
  return hardwareConcurrency > 0 && hardwareConcurrency <= 4 && /Intel/i.test(s);
}

export interface AdaptivePerfSettings {
  tier: number;
  renderScale: number;
  shadowSkipFrames: number;
  disableClearcoat: boolean;
  particleBudgetRatio: number;
}

const PERF_TIERS: Omit<AdaptivePerfSettings, 'tier'>[] = [
  { renderScale: 1.0, shadowSkipFrames: 1, disableClearcoat: false, particleBudgetRatio: 1.0 },
  { renderScale: 0.78, shadowSkipFrames: 2, disableClearcoat: true, particleBudgetRatio: 0.65 },
  { renderScale: 0.64, shadowSkipFrames: 4, disableClearcoat: true, particleBudgetRatio: 0.4 },
  { renderScale: 0.52, shadowSkipFrames: 6, disableClearcoat: true, particleBudgetRatio: 0.25 },
];

export function getPerfSettingsForTier(tier: number): AdaptivePerfSettings {
  const safeTier = Math.min(PERF_TIERS.length - 1, Math.max(0, Math.round(tier)));
  return {
    tier: safeTier,
    ...PERF_TIERS[safeTier],
  };
}

export function computeAdaptivePerfStep(params: {
  tier: number;
  avgFrameMs: number;
  targetFrameMs?: number;
  minTier?: number;
  maxTier?: number;
}): AdaptivePerfSettings {
  const minTier = Math.max(0, params.minTier ?? 0);
  const maxTier = Math.min(PERF_TIERS.length - 1, params.maxTier ?? PERF_TIERS.length - 1);
  const target = Math.max(8, params.targetFrameMs ?? 16.7);
  let nextTier = Math.min(maxTier, Math.max(minTier, Math.round(params.tier)));

  if (params.avgFrameMs > target * 1.35 && nextTier < maxTier) {
    nextTier += 1;
  } else if (params.avgFrameMs < target * 0.72 && nextTier > minTier) {
    nextTier -= 1;
  }

  return getPerfSettingsForTier(nextTier);
}

export function mergeLocalAndCloudProfiles(
  local: PlayerCloudProfile,
  cloud: PlayerCloudProfile
): PlayerCloudProfile {
  if (local.accountId !== cloud.accountId) {
    return {
      ...cloud,
      stats: {
        ...cloud.stats,
        weaponStats: normalizeWeaponStats(cloud.stats?.weaponStats),
      },
      settings: { ...cloud.settings },
      keybinds: { ...cloud.keybinds },
    };
  }

  const localTs = Date.parse(local.lastSyncedAt || '') || 0;
  const cloudTs = Date.parse(cloud.lastSyncedAt || '') || 0;
  const localNewer = localTs > cloudTs;
  const primary = localNewer ? local : cloud;

  const localWeapons = normalizeWeaponStats(local.stats?.weaponStats);
  const cloudWeapons = normalizeWeaponStats(cloud.stats?.weaponStats);
  const mergedWeapons = createDefaultWeaponStats();
  for (const id of WEAPON_IDS) {
    const l = localWeapons[id];
    const c = cloudWeapons[id];
    const fired = Math.max(l.shotsFired, c.shotsFired);
    const hit = Math.min(fired, Math.max(l.shotsHit, c.shotsHit));
    mergedWeapons[id] = {
      kills: Math.max(l.kills, c.kills),
      shotsFired: fired,
      shotsHit: hit,
    };
  }

  const localSeason = Math.max(1, Math.round(Number(local.passSeasonNumber) || 1));
  const cloudSeason = Math.max(1, Math.round(Number(cloud.passSeasonNumber) || 1));
  const newerSeason = Math.max(localSeason, cloudSeason);
  const useLocalPass = localSeason > cloudSeason;
  const useCloudPass = cloudSeason > localSeason;
  const resolvedPassEndsAt = useLocalPass
    ? local.passSeasonEndsAt
    : useCloudPass
    ? cloud.passSeasonEndsAt
    : (Date.parse(cloud.passSeasonEndsAt || '') || Infinity) <=
      (Date.parse(local.passSeasonEndsAt || '') || Infinity)
    ? cloud.passSeasonEndsAt ?? local.passSeasonEndsAt
    : local.passSeasonEndsAt ?? cloud.passSeasonEndsAt;

  const cleanPrimaryNick = String(primary.nickname || '').trim();
  const cleanCloudNick = String(cloud.nickname || '').trim();
  const resolvedNickname =
    cleanPrimaryNick.length >= 3 && cleanPrimaryNick.length <= 20
      ? cleanPrimaryNick
      : cleanCloudNick.length >= 3 && cleanCloudNick.length <= 20
      ? cleanCloudNick
      : 'PrismPlayer';

  const mergedUnlockedWeaponSkins = Array.from(
    new Set([...cloud.unlockedWeaponSkins, ...local.unlockedWeaponSkins])
  );
  const unlockedSkinSet = new Set(mergedUnlockedWeaponSkins);
  const secondary = localNewer ? cloud : local;
  const primarySlots = normalizeEquippedWeaponSkins(
    primary.equippedWeaponSkins,
    primary.equippedWeaponSkinId,
    primary.equippedWeaponId
  );
  const secondarySlots = normalizeEquippedWeaponSkins(
    secondary.equippedWeaponSkins,
    secondary.equippedWeaponSkinId,
    secondary.equippedWeaponId
  );
  const mergedWeaponSkins = createDefaultEquippedWeaponSkins();
  for (const wId of WEAPON_IDS) {
    if (unlockedSkinSet.has(primarySlots[wId])) {
      mergedWeaponSkins[wId] = primarySlots[wId];
    } else if (unlockedSkinSet.has(secondarySlots[wId])) {
      mergedWeaponSkins[wId] = secondarySlots[wId];
    }
  }

  return {
    ...primary,
    accountId: cloud.accountId,
    nickname: resolvedNickname,
    credits: primary.credits,
    xp: Math.max(local.xp, cloud.xp),
    passSeasonNumber: newerSeason,
    passSeasonEndsAt: resolvedPassEndsAt,
    battlePassXp: useLocalPass
      ? local.battlePassXp
      : useCloudPass
      ? cloud.battlePassXp
      : Math.max(local.battlePassXp, cloud.battlePassXp),
    battlePassPremium: useLocalPass
      ? local.battlePassPremium
      : useCloudPass
      ? cloud.battlePassPremium
      : local.battlePassPremium || cloud.battlePassPremium,
    claimedFreeTiers: useLocalPass
      ? [...local.claimedFreeTiers]
      : useCloudPass
      ? [...cloud.claimedFreeTiers]
      : Array.from(new Set([...cloud.claimedFreeTiers, ...local.claimedFreeTiers])).sort(
          (a, b) => a - b
        ),
    claimedPremiumTiers: useLocalPass
      ? [...local.claimedPremiumTiers]
      : useCloudPass
      ? [...cloud.claimedPremiumTiers]
      : Array.from(
          new Set([...cloud.claimedPremiumTiers, ...local.claimedPremiumTiers])
        ).sort((a, b) => a - b),
    unlockedWeaponSkins: mergedUnlockedWeaponSkins,
    unlockedAvatarSkins: Array.from(
      new Set([...cloud.unlockedAvatarSkins, ...local.unlockedAvatarSkins])
    ),
    equippedWeaponSkins: mergedWeaponSkins,
    equippedWeaponSkinId: mergedWeaponSkins[primary.equippedWeaponId] ?? primary.equippedWeaponSkinId,
    tutorialCompleted: local.tutorialCompleted || cloud.tutorialCompleted,
    easterEggUnlocked: local.easterEggUnlocked || cloud.easterEggUnlocked,
    stats: {
      matchesPlayed: Math.max(local.stats.matchesPlayed, cloud.stats.matchesPlayed),
      wins: Math.max(local.stats.wins, cloud.stats.wins),
      tags: Math.max(local.stats.tags, cloud.stats.tags),
      deaths: Math.max(local.stats.deaths, cloud.stats.deaths),
      shotsFired: Math.max(local.stats.shotsFired, cloud.stats.shotsFired),
      shotsHit: Math.max(local.stats.shotsHit, cloud.stats.shotsHit),
      weaponStats: mergedWeapons,
    },
    settings: { ...primary.settings },
    keybinds: { ...primary.keybinds },
    lastSyncedAt: new Date(Math.max(localTs, cloudTs, Date.now())).toISOString(),
  };
}

export function applyMatchRewards(
  profile: PlayerCloudProfile,
  summary: MatchSummary,
  shotsFired = 0,
  shotsHit = 0
): PlayerCloudProfile {
  const synced = syncBattlePassSeason(profile).profile;
  const nextSkins = [...synced.unlockedWeaponSkins];
  let easterEggUnlocked = synced.easterEggUnlocked;

  if (summary.easterEggFound && !easterEggUnlocked) {
    easterEggUnlocked = true;
    if (!nextSkins.includes('prism_relic')) {
      nextSkins.push('prism_relic');
    }
  }

  const currentWeapons = normalizeWeaponStats(synced.stats?.weaponStats);
  if (summary.weaponStats) {
    for (const id of WEAPON_IDS) {
      const add = summary.weaponStats[id];
      if (!add) continue;
      const addFired = Math.max(0, Math.round(add.shotsFired || 0));
      const addHit = Math.min(addFired, Math.max(0, Math.round(add.shotsHit || 0)));
      const addKills = Math.max(0, Math.round(add.kills || 0));
      currentWeapons[id] = {
        kills: currentWeapons[id].kills + addKills,
        shotsFired: currentWeapons[id].shotsFired + addFired,
        shotsHit: currentWeapons[id].shotsHit + addHit,
      };
    }
  }

  return {
    ...synced,
    credits: synced.credits + Math.min(MAX_MATCH_CREDITS, Math.max(0, summary.creditsEarned)),
    xp: synced.xp + Math.min(MAX_MATCH_XP, Math.max(0, summary.xpEarned)),
    battlePassXp:
      synced.battlePassXp + Math.min(MAX_MATCH_XP, Math.max(0, summary.xpEarned)),
    unlockedWeaponSkins: nextSkins,
    easterEggUnlocked,
    stats: {
      matchesPlayed: synced.stats.matchesPlayed + 1,
      wins: synced.stats.wins + (summary.won ? 1 : 0),
      tags: synced.stats.tags + summary.tags,
      deaths: synced.stats.deaths + summary.deaths,
      shotsFired: synced.stats.shotsFired + shotsFired,
      shotsHit: synced.stats.shotsHit + shotsHit,
      weaponStats: currentWeapons,
    },
    lastSyncedAt: new Date().toISOString(),
  };
}

export function sortLeaderboardEntries(
  entries: MatchLeaderboardEntry[]
): MatchLeaderboardEntry[] {
  return [...entries].sort((a, b) => {
    if (b.kills !== a.kills) return b.kills - a.kills;
    if (a.deaths !== b.deaths) return a.deaths - b.deaths;
    if (a.isLocalPlayer !== b.isLocalPlayer) return a.isLocalPlayer ? -1 : 1;
    return a.nickname.localeCompare(b.nickname);
  });
}

export type OperatorBodyType =
  | 'assault_commando'
  | 'shotgun_breacher'
  | 'sniper_marksman'
  | 'smg_woman';

export interface OperatorWeaponBodyStyle {
  bodyType: OperatorBodyType;
  isFemaleBody: boolean;
  hasFeatherHat: boolean;
  hasBreacherVest: boolean;
  hasAssaultGear: boolean;
  armorColorHex: string;
  clothingColorHex: string;
  vestColorHex: string;
  armorMetalness: number;
  armorRoughness: number;
  armorClearcoat: number;
  armorClearcoatRoughness: number;
  clothMetalness: number;
  clothRoughness: number;
}

function parseHexRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '').trim();
  const full =
    clean.length === 3
      ? `${clean[0]}${clean[0]}${clean[1]}${clean[1]}${clean[2]}${clean[2]}`
      : clean;
  const num = Number.parseInt(full, 16);
  if (!Number.isFinite(num)) return [128, 128, 128];
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

export function blendHexColors(hexA: string, hexB: string, t: number): string {
  const ratio = Math.min(1, Math.max(0, t));
  const [r1, g1, b1] = parseHexRgb(hexA);
  const [r2, g2, b2] = parseHexRgb(hexB);
  const toHex = (v: number) =>
    Math.round(Math.min(255, Math.max(0, v)))
      .toString(16)
      .padStart(2, '0');
  return `#${toHex(r1 + (r2 - r1) * ratio)}${toHex(g1 + (g2 - g1) * ratio)}${toHex(
    b1 + (b2 - b1) * ratio
  )}`;
}

export function getOperatorWeaponBodyStyle(
  weaponId: WeaponId,
  skin: AvatarSkinDef
): OperatorWeaponBodyStyle {
  if (weaponId === 'volt_scatter') {
    const richSkinBody = blendHexColors(skin.clothingColor, skin.trimColor, 0.52);
    const shinyArmor = blendHexColors(skin.armorColor, richSkinBody, 0.78);
    const shinyCloth = blendHexColors(skin.clothingColor, skin.trimColor, 0.44);
    const lightVest = blendHexColors(skin.trimColor, '#ffffff', 0.38);
    return {
      bodyType: 'shotgun_breacher',
      isFemaleBody: false,
      hasFeatherHat: false,
      hasBreacherVest: true,
      hasAssaultGear: false,
      armorColorHex: shinyArmor,
      clothingColorHex: shinyCloth,
      vestColorHex: lightVest,
      // Satin-gloss metallic finish: catches light richly without blinding glare
      armorMetalness: 0.44,
      armorRoughness: 0.28,
      armorClearcoat: 0.52,
      armorClearcoatRoughness: 0.26,
      clothMetalness: 0.26,
      clothRoughness: 0.36,
    };
  }

  if (weaponId === 'helios_rail') {
    return {
      bodyType: 'sniper_marksman',
      isFemaleBody: false,
      hasFeatherHat: true,
      hasBreacherVest: false,
      hasAssaultGear: false,
      armorColorHex: skin.armorColor,
      clothingColorHex: skin.clothingColor,
      vestColorHex: skin.armorColor,
      armorMetalness: 0.56,
      armorRoughness: 0.38,
      armorClearcoat: 0.42,
      armorClearcoatRoughness: 0.22,
      clothMetalness: 0.08,
      clothRoughness: 0.86,
    };
  }

  if (weaponId === 'arc_repeater') {
    return {
      bodyType: 'smg_woman',
      isFemaleBody: true,
      hasFeatherHat: false,
      hasBreacherVest: false,
      hasAssaultGear: false,
      armorColorHex: skin.armorColor,
      clothingColorHex: skin.clothingColor,
      vestColorHex: skin.armorColor,
      armorMetalness: 0.62,
      armorRoughness: 0.32,
      armorClearcoat: 0.56,
      armorClearcoatRoughness: 0.18,
      clothMetalness: 0.08,
      clothRoughness: 0.82,
    };
  }

  return {
    bodyType: 'assault_commando',
    isFemaleBody: false,
    hasFeatherHat: false,
    hasBreacherVest: false,
    hasAssaultGear: true,
    armorColorHex: skin.armorColor,
    clothingColorHex: skin.clothingColor,
    vestColorHex: skin.armorColor,
    armorMetalness: 0.64,
    armorRoughness: 0.34,
    armorClearcoat: 0.58,
    armorClearcoatRoughness: 0.16,
    clothMetalness: 0.08,
    clothRoughness: 0.84,
  };
}

export const SPAWN_PROTECTION_DURATION_MS = 3000;

export interface SpawnProtectionState {
  active: boolean;
  expiresAtMs: number;
}

export function createSpawnProtection(
  nowMs: number,
  durationMs = SPAWN_PROTECTION_DURATION_MS
): SpawnProtectionState {
  return {
    active: durationMs > 0,
    expiresAtMs: nowMs + Math.max(0, durationMs),
  };
}

export function isSpawnProtectionActive(
  state: SpawnProtectionState | null | undefined,
  nowMs: number
): boolean {
  if (!state || !state.active) return false;
  return nowMs < state.expiresAtMs;
}

export function getSpawnProtectionRemainingMs(
  state: SpawnProtectionState | null | undefined,
  nowMs: number
): number {
  if (!state || !state.active) return 0;
  return Math.max(0, state.expiresAtMs - nowMs);
}

export function clearSpawnProtectionOnShot(
  state: SpawnProtectionState | null | undefined
): SpawnProtectionState {
  if (!state) return { active: false, expiresAtMs: 0 };
  if (!state.active) return state;
  return { active: false, expiresAtMs: 0 };
}

export function getSpawnProtectedDamageMultiplier(
  state: SpawnProtectionState | null | undefined,
  nowMs: number
): 0 | 1 {
  return isSpawnProtectionActive(state, nowMs) ? 0 : 1;
}

export function applyIncomingDamageWithSpawnProtection(
  rawDamage: number,
  state: SpawnProtectionState | null | undefined,
  nowMs: number
): { damage: number; blocked: boolean; nextState: SpawnProtectionState } {
  const active = isSpawnProtectionActive(state, nowMs);
  if (active) {
    return {
      damage: 0,
      blocked: true,
      nextState: state as SpawnProtectionState,
    };
  }
  const safeDamage = Math.max(0, Math.round(rawDamage));
  return {
    damage: safeDamage,
    blocked: false,
    nextState: state && state.active ? { active: false, expiresAtMs: 0 } : state ?? { active: false, expiresAtMs: 0 },
  };
}

export function hasProfileCloudDiff(
  a: PlayerCloudProfile,
  b: PlayerCloudProfile
): boolean {
  const seasonEndDiffMs = Math.abs(
    (Date.parse(a.passSeasonEndsAt || '') || 0) -
      (Date.parse(b.passSeasonEndsAt || '') || 0)
  );
  if (
    a.nickname !== b.nickname ||
    a.platform !== b.platform ||
    a.credits !== b.credits ||
    a.xp !== b.xp ||
    a.battlePassXp !== b.battlePassXp ||
    a.battlePassPremium !== b.battlePassPremium ||
    a.passSeasonNumber !== b.passSeasonNumber ||
    Boolean(a.passSeasonEndsAt) !== Boolean(b.passSeasonEndsAt) ||
    seasonEndDiffMs > 1000 ||
    a.equippedWeaponId !== b.equippedWeaponId ||
    a.equippedWeaponSkinId !== b.equippedWeaponSkinId ||
    a.equippedAvatarSkinId !== b.equippedAvatarSkinId ||
    a.tutorialCompleted !== b.tutorialCompleted ||
    a.easterEggUnlocked !== b.easterEggUnlocked ||
    a.claimedFreeTiers.length !== b.claimedFreeTiers.length ||
    a.claimedPremiumTiers.length !== b.claimedPremiumTiers.length ||
    a.unlockedWeaponSkins.length !== b.unlockedWeaponSkins.length ||
    a.unlockedAvatarSkins.length !== b.unlockedAvatarSkins.length ||
    a.stats.matchesPlayed !== b.stats.matchesPlayed ||
    a.stats.wins !== b.stats.wins ||
    a.stats.tags !== b.stats.tags ||
    a.stats.deaths !== b.stats.deaths ||
    a.stats.shotsFired !== b.stats.shotsFired ||
    a.stats.shotsHit !== b.stats.shotsHit
  ) {
    return true;
  }

  const aWeapons = normalizeWeaponStats(a.stats?.weaponStats);
  const bWeapons = normalizeWeaponStats(b.stats?.weaponStats);
  for (const id of WEAPON_IDS) {
    if (
      aWeapons[id].kills !== bWeapons[id].kills ||
      aWeapons[id].shotsFired !== bWeapons[id].shotsFired ||
      aWeapons[id].shotsHit !== bWeapons[id].shotsHit
    ) {
      return true;
    }
  }

  const aSkins = normalizeEquippedWeaponSkins(
    a.equippedWeaponSkins,
    a.equippedWeaponSkinId,
    a.equippedWeaponId
  );
  const bSkins = normalizeEquippedWeaponSkins(
    b.equippedWeaponSkins,
    b.equippedWeaponSkinId,
    b.equippedWeaponId
  );
  for (const id of WEAPON_IDS) {
    if (aSkins[id] !== bSkins[id]) {
      return true;
    }
  }

  return (
    JSON.stringify(a.settings) !== JSON.stringify(b.settings) ||
    JSON.stringify(a.keybinds) !== JSON.stringify(b.keybinds)
  );
}
