import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Unsubscribe,
} from 'firebase/firestore';
import {
  createDefaultProfile,
  DEFAULT_KEYBINDS,
  DEFAULT_SETTINGS,
} from '../game/catalog';
import type {
  FriendEntry,
  GameSettings,
  Keybinds,
  PlatformType,
  PlayerCloudProfile,
  WeaponId,
} from '../game/types';
import { auth, db } from './firebase';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

const VALID_PLATFORMS: PlatformType[] = ['PC', 'Web', 'Mobile', 'Console'];
const VALID_WEAPONS: WeaponId[] = [
  'pulse_carbine',
  'volt_scatter',
  'helios_rail',
  'arc_repeater',
];
const VALID_GRAPHICS = ['low', 'medium', 'high', 'ultra'] as const;
const VALID_SHADOWS = ['off', 'low', 'medium', 'high', 'ultra'] as const;
const VALID_FPS_CAPS = ['screen_locked', '60', '120', '165', '240', 'unlimited'] as const;
const VALID_LANGUAGES = ['en', 'es', 'sk', 'fr', 'ja'] as const;

export function sanitizeNickname(raw: string | null | undefined, fallback = 'Vanguard01'): string {
  const cleaned = (raw ?? '')
    .replace(/[^a-zA-Z0-9_\- ]+/g, '')
    .trim()
    .slice(0, 20);
  if (cleaned.length >= 3) return cleaned;
  return fallback;
}

function sanitizeId(raw: string | null | undefined, fallback: string, maxLen = 64): string {
  const cleaned = (raw ?? '')
    .replace(/[^a-zA-Z0-9_\-]+/g, '')
    .slice(0, maxLen);
  return cleaned.length >= 1 ? cleaned : fallback;
}

function sanitizeKeyCode(raw: string | null | undefined, fallback: string): string {
  const cleaned = (raw ?? '').replace(/[^a-zA-Z0-9]+/g, '').slice(0, 32);
  return cleaned.length >= 1 ? cleaned : fallback;
}

function clampInt(val: unknown, min: number, max: number, fallback: number): number {
  if (typeof val !== 'number' || !Number.isFinite(val)) return fallback;
  return Math.max(min, Math.min(max, Math.round(val)));
}

function clampFloat(val: unknown, min: number, max: number, fallback: number): number {
  if (typeof val !== 'number' || !Number.isFinite(val)) return fallback;
  return Math.max(min, Math.min(max, val));
}

function sanitizeSettings(raw?: Partial<GameSettings> | null): GameSettings {
  const merged = { ...DEFAULT_SETTINGS, ...(raw ?? {}) };
  return {
    graphicsQuality: VALID_GRAPHICS.includes(merged.graphicsQuality)
      ? merged.graphicsQuality
      : DEFAULT_SETTINGS.graphicsQuality,
    shadowQuality: VALID_SHADOWS.includes(merged.shadowQuality)
      ? merged.shadowQuality
      : DEFAULT_SETTINGS.shadowQuality,
    renderDistance: clampInt(merged.renderDistance, 60, 1000, DEFAULT_SETTINGS.renderDistance),
    vsync: Boolean(merged.vsync),
    showFps: Boolean(merged.showFps),
    fpsCap: VALID_FPS_CAPS.includes(merged.fpsCap) ? merged.fpsCap : DEFAULT_SETTINGS.fpsCap,
    fov: clampInt(merged.fov, 60, 150, DEFAULT_SETTINGS.fov),
    mouseSensitivity: clampFloat(merged.mouseSensitivity, 0.1, 20, DEFAULT_SETTINGS.mouseSensitivity),
    shadowsEnabled: Boolean(merged.shadowsEnabled),
    particlesEnabled: Boolean(merged.particlesEnabled),
    audioEnabled: Boolean(merged.audioEnabled),
    masterVolume: clampFloat(merged.masterVolume, 0, 1, DEFAULT_SETTINGS.masterVolume),
    darkMode: Boolean(merged.darkMode),
    language: VALID_LANGUAGES.includes(merged.language) ? merged.language : DEFAULT_SETTINGS.language,
    crossPlatformEnabled: Boolean(merged.crossPlatformEnabled),
  };
}

function sanitizeKeybinds(raw?: Partial<Keybinds> | null): Keybinds {
  const merged = { ...DEFAULT_KEYBINDS, ...(raw ?? {}) };
  return {
    moveForward: sanitizeKeyCode(merged.moveForward, DEFAULT_KEYBINDS.moveForward),
    moveBackward: sanitizeKeyCode(merged.moveBackward, DEFAULT_KEYBINDS.moveBackward),
    moveLeft: sanitizeKeyCode(merged.moveLeft, DEFAULT_KEYBINDS.moveLeft),
    moveRight: sanitizeKeyCode(merged.moveRight, DEFAULT_KEYBINDS.moveRight),
    jump: sanitizeKeyCode(merged.jump, DEFAULT_KEYBINDS.jump),
    dash: sanitizeKeyCode(merged.dash, DEFAULT_KEYBINDS.dash),
    reload: sanitizeKeyCode(merged.reload, DEFAULT_KEYBINDS.reload),
    chat: sanitizeKeyCode(merged.chat, DEFAULT_KEYBINDS.chat),
    pause: sanitizeKeyCode(merged.pause, DEFAULT_KEYBINDS.pause),
    slot1: sanitizeKeyCode(merged.slot1, DEFAULT_KEYBINDS.slot1),
    slot2: sanitizeKeyCode(merged.slot2, DEFAULT_KEYBINDS.slot2),
    slot3: sanitizeKeyCode(merged.slot3, DEFAULT_KEYBINDS.slot3),
    slot4: sanitizeKeyCode(merged.slot4, DEFAULT_KEYBINDS.slot4),
  };
}

function sanitizeSkinArray(raw: unknown, starterId: string): string[] {
  const list = Array.isArray(raw) ? raw : [];
  const valid = list
    .filter((v): v is string => typeof v === 'string')
    .map((v) => sanitizeId(v, '', 64))
    .filter((v) => v.length > 0);
  const unique = Array.from(new Set([starterId, ...valid]));
  return unique.slice(0, 100);
}

function sanitizeTierArray(raw: unknown): number[] {
  const list = Array.isArray(raw) ? raw : [];
  const valid = list
    .filter((v): v is number => typeof v === 'number' && Number.isInteger(v) && v >= 1 && v <= 100);
  return Array.from(new Set(valid)).slice(0, 50);
}

export function sanitizeProfileForFirestore(
  uid: string,
  raw: PlayerCloudProfile
): Omit<PlayerCloudProfile, 'lastSyncedAt'> & { lastSyncedAt: string } {
  const base = createDefaultProfile('Vanguard01');
  const statsRaw = raw.stats ?? base.stats;

  return {
    accountId: sanitizeId(uid, uid, 128),
    nickname: sanitizeNickname(raw.nickname, 'Vanguard01'),
    platform: VALID_PLATFORMS.includes(raw.platform) ? raw.platform : 'Web',
    credits: clampInt(raw.credits, 0, 10000000, 650),
    xp: clampInt(raw.xp, 0, 100000000, 0),
    battlePassXp: clampInt(raw.battlePassXp, 0, 100000000, 250),
    battlePassPremium: Boolean(raw.battlePassPremium),
    claimedFreeTiers: sanitizeTierArray(raw.claimedFreeTiers),
    claimedPremiumTiers: sanitizeTierArray(raw.claimedPremiumTiers),
    unlockedWeaponSkins: sanitizeSkinArray(raw.unlockedWeaponSkins, 'cobalt_standard'),
    unlockedAvatarSkins: sanitizeSkinArray(raw.unlockedAvatarSkins, 'vanguard_cyan'),
    equippedWeaponId: VALID_WEAPONS.includes(raw.equippedWeaponId)
      ? raw.equippedWeaponId
      : 'pulse_carbine',
    equippedWeaponSkinId: sanitizeId(raw.equippedWeaponSkinId, 'cobalt_standard', 64),
    equippedAvatarSkinId: sanitizeId(raw.equippedAvatarSkinId, 'vanguard_cyan', 64),
    tutorialCompleted: Boolean(raw.tutorialCompleted),
    easterEggUnlocked: Boolean(raw.easterEggUnlocked),
    stats: {
      matchesPlayed: clampInt(statsRaw.matchesPlayed, 0, 10000000, 0),
      wins: clampInt(statsRaw.wins, 0, 10000000, 0),
      tags: clampInt(statsRaw.tags, 0, 100000000, 0),
      deaths: clampInt(statsRaw.deaths, 0, 100000000, 0),
      shotsFired: clampInt(statsRaw.shotsFired, 0, 1000000000, 0),
      shotsHit: clampInt(statsRaw.shotsHit, 0, 1000000000, 0),
    },
    settings: sanitizeSettings(raw.settings),
    keybinds: sanitizeKeybinds(raw.keybinds),
    lastSyncedAt: new Date().toISOString().slice(0, 64),
  };
}

export async function loadOrCreateUserCloudProfile(
  uid: string,
  localProfile: PlayerCloudProfile,
  displayName?: string | null
): Promise<PlayerCloudProfile> {
  const docPath = `users/${uid}`;
  const ref = doc(db, 'users', uid);

  let snap;
  try {
    snap = await getDoc(ref);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, docPath);
  }

  if (snap.exists()) {
    const data = snap.data() as PlayerCloudProfile;
    return sanitizeProfileForFirestore(uid, {
      ...createDefaultProfile(data.nickname || 'Vanguard01'),
      ...data,
      accountId: uid,
    });
  }

  // First-ever cloud login for this user: seed cloud save with their current local progress
  const seededNick =
    localProfile.nickname && localProfile.nickname !== 'Vanguard01'
      ? localProfile.nickname
      : sanitizeNickname(displayName, 'Vanguard01');

  const payload = sanitizeProfileForFirestore(uid, {
    ...localProfile,
    accountId: uid,
    nickname: seededNick,
  });

  try {
    await setDoc(ref, {
      ...payload,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, docPath);
  }

  return payload;
}

export async function saveUserCloudProfile(
  uid: string,
  profile: PlayerCloudProfile
): Promise<PlayerCloudProfile> {
  const docPath = `users/${uid}`;
  const ref = doc(db, 'users', uid);
  const sanitized = sanitizeProfileForFirestore(uid, profile);

  try {
    const existing = await getDoc(ref);
    if (!existing.exists()) {
      await setDoc(ref, {
        ...sanitized,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      const { accountId: _ignore, ...updatableFields } = sanitized;
      await updateDoc(ref, {
        ...updatableFields,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }

  return sanitized;
}

export function subscribeUserFriends(
  uid: string,
  onFriends: (friends: FriendEntry[]) => void
): Unsubscribe {
  const path = `users/${uid}/friends`;
  const q = query(collection(db, 'users', uid, 'friends'), where('ownerId', '==', uid));
  return onSnapshot(
    q,
    (snapshot) => {
      const list: FriendEntry[] = snapshot.docs.map((d) => {
        const data = d.data() as { nickname: string; platform: PlatformType };
        return {
          nickname: data.nickname,
          platform: VALID_PLATFORMS.includes(data.platform) ? data.platform : 'Web',
          status: 'online',
        };
      });
      onFriends(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function addUserCloudFriend(
  uid: string,
  nickname: string,
  platform: PlatformType = 'Web'
): Promise<void> {
  const cleanNick = sanitizeNickname(nickname, '');
  if (cleanNick.length < 3) {
    throw new Error('Friend nickname must be 3-20 alphanumeric characters.');
  }
  const friendId = sanitizeId(cleanNick.toLowerCase().replace(/\s+/g, '_'), `f_${Date.now()}`, 128);
  const docPath = `users/${uid}/friends/${friendId}`;
  const ref = doc(db, 'users', uid, 'friends', friendId);

  try {
    await setDoc(ref, {
      ownerId: uid,
      nickname: cleanNick,
      platform: VALID_PLATFORMS.includes(platform) ? platform : 'Web',
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, docPath);
  }
}

export async function removeUserCloudFriend(uid: string, nickname: string): Promise<void> {
  const friendId = sanitizeId(nickname.toLowerCase().replace(/\s+/g, '_'), '', 128);
  if (!friendId) return;
  const docPath = `users/${uid}/friends/${friendId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'friends', friendId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}
