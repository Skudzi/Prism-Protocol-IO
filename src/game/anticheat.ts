import { WEAPONS } from './catalog';
import { WeaponId } from './types';

export interface PlayerAntiCheatState {
  lastX: number;
  lastY: number;
  lastZ: number;
  lastMoveAtMs: number;
  lastFireAtMs: number;
  anomalyPoints: number;
  flagged: boolean;
}

export interface MovePacketValidation {
  valid: boolean;
  clampedX: number;
  clampedY: number;
  clampedZ: number;
  reason?: string;
}

export interface FirePacketValidation {
  valid: boolean;
  reason?: string;
}

const MAX_SPEED_UNITS_PER_SEC = 16.5; // Covers sprint + dash burst + network jitter
const TELEPORT_GRACE_DIST = 4.5;

export function createAntiCheatState(x = 0, y = 0, z = 0, nowMs = Date.now()): PlayerAntiCheatState {
  return {
    lastX: x,
    lastY: y,
    lastZ: z,
    lastMoveAtMs: nowMs,
    lastFireAtMs: 0,
    anomalyPoints: 0,
    flagged: false,
  };
}

export function validateMovePacket(
  state: PlayerAntiCheatState,
  x: number,
  y: number,
  z: number,
  arenaHalfSize: number,
  nowMs: number
): MovePacketValidation {
  if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) {
    state.anomalyPoints += 5;
    if (state.anomalyPoints >= 15) state.flagged = true;
    return {
      valid: false,
      clampedX: state.lastX,
      clampedY: state.lastY,
      clampedZ: state.lastZ,
      reason: 'non_finite_coords',
    };
  }

  const clampedX = Math.max(-arenaHalfSize, Math.min(arenaHalfSize, x));
  const clampedY = Math.max(0, Math.min(12, y));
  const clampedZ = Math.max(-arenaHalfSize, Math.min(arenaHalfSize, z));

  const elapsedSec = Math.max(0.016, (nowMs - state.lastMoveAtMs) / 1000);
  const dx = clampedX - state.lastX;
  const dz = clampedZ - state.lastZ;
  const horizDist = Math.hypot(dx, dz);
  const maxAllowed = MAX_SPEED_UNITS_PER_SEC * elapsedSec + TELEPORT_GRACE_DIST;

  if (horizDist > maxAllowed) {
    state.anomalyPoints += 3;
    if (state.anomalyPoints >= 15) state.flagged = true;
    // Silently clamp toward allowed step instead of crashing client
    const ratio = maxAllowed / horizDist;
    const safeX = state.lastX + dx * ratio;
    const safeZ = state.lastZ + dz * ratio;
    state.lastX = safeX;
    state.lastY = clampedY;
    state.lastZ = safeZ;
    state.lastMoveAtMs = nowMs;
    return {
      valid: false,
      clampedX: safeX,
      clampedY,
      clampedZ: safeZ,
      reason: 'speed_exceeded',
    };
  }

  state.lastX = clampedX;
  state.lastY = clampedY;
  state.lastZ = clampedZ;
  state.lastMoveAtMs = nowMs;
  state.anomalyPoints = Math.max(0, state.anomalyPoints - 0.1);
  return { valid: true, clampedX, clampedY, clampedZ };
}

export function validateFirePacket(
  state: PlayerAntiCheatState,
  weaponId: WeaponId,
  rangeDistance: number,
  nowMs: number
): FirePacketValidation {
  const weapon = WEAPONS[weaponId];
  if (!weapon) {
    state.anomalyPoints += 5;
    if (state.anomalyPoints >= 15) state.flagged = true;
    return { valid: false, reason: 'unknown_weapon' };
  }

  // Allow 18% network jitter margin on fire interval
  const minInterval = weapon.fireIntervalMs * 0.82;
  if (state.lastFireAtMs > 0 && nowMs - state.lastFireAtMs < minInterval) {
    state.anomalyPoints += 2;
    if (state.anomalyPoints >= 15) state.flagged = true;
    return { valid: false, reason: 'fire_rate_exceeded' };
  }

  if (!Number.isFinite(rangeDistance) || rangeDistance < 0 || rangeDistance > weapon.maxRange + 2.0) {
    state.anomalyPoints += 3;
    if (state.anomalyPoints >= 15) state.flagged = true;
    return { valid: false, reason: 'range_exceeded' };
  }

  state.lastFireAtMs = nowMs;
  state.anomalyPoints = Math.max(0, state.anomalyPoints - 0.05);
  return { valid: true };
}
