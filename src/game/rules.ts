import {
  AVATAR_SKINS,
  BATTLE_PASS_TIERS,
  MAPS,
  WEAPON_SKINS,
} from './catalog';
import {
  HealOrbState,
  MapDef,
  MapId,
  MapObstacle,
  MatchSummary,
  PlayerCloudProfile,
  WeaponId,
} from './types';

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
    nextVelY = 8.0;
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

export function purchaseStoreItem(
  profile: PlayerCloudProfile,
  itemType: 'weapon_skin' | 'avatar_skin',
  itemId: string
): { ok: boolean; profile: PlayerCloudProfile; reason?: string } {
  if (itemType === 'weapon_skin') {
    const skin = WEAPON_SKINS.find((s) => s.id === itemId);
    if (!skin) return { ok: false, profile, reason: 'Item not found' };
    if (profile.unlockedWeaponSkins.includes(itemId)) {
      return {
        ok: true,
        profile: { ...profile, equippedWeaponSkinId: itemId },
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
        equippedWeaponSkinId: itemId,
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

export function applyMatchRewards(
  profile: PlayerCloudProfile,
  summary: MatchSummary,
  shotsFired = 0,
  shotsHit = 0
): PlayerCloudProfile {
  const nextSkins = [...profile.unlockedWeaponSkins];
  let easterEggUnlocked = profile.easterEggUnlocked;

  if (summary.easterEggFound && !easterEggUnlocked) {
    easterEggUnlocked = true;
    if (!nextSkins.includes('prism_relic')) {
      nextSkins.push('prism_relic');
    }
  }

  return {
    ...profile,
    credits: profile.credits + summary.creditsEarned,
    xp: profile.xp + summary.xpEarned,
    battlePassXp: profile.battlePassXp + summary.xpEarned,
    unlockedWeaponSkins: nextSkins,
    easterEggUnlocked,
    stats: {
      matchesPlayed: profile.stats.matchesPlayed + 1,
      wins: profile.stats.wins + (summary.won ? 1 : 0),
      tags: profile.stats.tags + summary.tags,
      deaths: profile.stats.deaths + summary.deaths,
      shotsFired: profile.stats.shotsFired + shotsFired,
      shotsHit: profile.stats.shotsHit + shotsHit,
    },
    lastSyncedAt: new Date().toISOString(),
  };
}
