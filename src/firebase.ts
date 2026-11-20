import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { doc, getDocFromServer, getFirestore } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { DEFAULT_KEYBINDS, DEFAULT_SETTINGS, PASS_SEASON_DURATION_MS } from './game/catalog';
import { normalizeWeaponStats } from './game/rules';
import { PlatformType, PlayerCloudProfile } from './game/types';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

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

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

void testConnection();

export type FirestoreUserPayload = PlayerCloudProfile & {
  createdAt: string;
  updatedAt: string;
};

export function sanitizeFirestoreNickname(raw: string | null | undefined, fallback = 'PrismPlayer'): string {
  const cleaned = String(raw || '')
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, 20);
  if (cleaned.length >= 3) return cleaned;
  return fallback.slice(0, 20);
}

export function buildFirestoreProfilePayload(
  profile: PlayerCloudProfile,
  uid: string,
  existingCreatedAt?: string | null
): FirestoreUserPayload {
  const nowIso = new Date().toISOString();
  const createdAt = existingCreatedAt && existingCreatedAt.length <= 64 ? existingCreatedAt : nowIso;
  const updatedAt = existingCreatedAt ? nowIso : createdAt;

  const validPlatforms: PlatformType[] = ['PC', 'Web', 'Mobile', 'Console'];
  const platform: PlatformType = validPlatforms.includes(profile.platform)
    ? profile.platform
    : 'Web';

  const weaponStats = normalizeWeaponStats(profile.stats?.weaponStats);
  const clampInt = (n: unknown, max: number, min = 0) =>
    Math.min(max, Math.max(min, Math.round(Number(n) || 0)));
  const clampNum = (n: unknown, max: number, min = 0) => {
    const v = Number(n);
    if (!Number.isFinite(v)) return min;
    return Math.min(max, Math.max(min, v));
  };

  const mergedSettings = { ...DEFAULT_SETTINGS, ...(profile.settings ?? {}) };
  const mergedKeybinds = { ...DEFAULT_KEYBINDS, ...(profile.keybinds ?? {}) };

  const unlockedWeapons = Array.from(
    new Set(['cobalt_standard', ...(profile.unlockedWeaponSkins ?? [])].filter((s) => typeof s === 'string' && s.length >= 1 && s.length <= 64))
  ).slice(0, 100);
  const unlockedAvatars = Array.from(
    new Set(['vanguard_cyan', ...(profile.unlockedAvatarSkins ?? [])].filter((s) => typeof s === 'string' && s.length >= 1 && s.length <= 64))
  ).slice(0, 100);

  const passSeasonEndsAt =
    typeof profile.passSeasonEndsAt === 'string' &&
    Number.isFinite(Date.parse(profile.passSeasonEndsAt))
      ? profile.passSeasonEndsAt.slice(0, 64)
      : new Date(Date.now() + PASS_SEASON_DURATION_MS).toISOString();

  return {
    accountId: uid,
    nickname: sanitizeFirestoreNickname(profile.nickname),
    platform,
    credits: clampInt(profile.credits, 10000000),
    xp: clampInt(profile.xp, 100000000),
    battlePassXp: clampInt(profile.battlePassXp, 100000000),
    battlePassPremium: Boolean(profile.battlePassPremium),
    passSeasonNumber: clampInt(profile.passSeasonNumber ?? 1, 100000, 1),
    passSeasonEndsAt,
    claimedFreeTiers: (profile.claimedFreeTiers ?? []).slice(0, 50).map((t) => Math.round(Number(t) || 0)),
    claimedPremiumTiers: (profile.claimedPremiumTiers ?? []).slice(0, 50).map((t) => Math.round(Number(t) || 0)),
    unlockedWeaponSkins: unlockedWeapons,
    unlockedAvatarSkins: unlockedAvatars,
    equippedWeaponId: ['pulse_carbine', 'volt_scatter', 'helios_rail', 'arc_repeater'].includes(
      profile.equippedWeaponId
    )
      ? profile.equippedWeaponId
      : 'pulse_carbine',
    equippedWeaponSkinId: (profile.equippedWeaponSkinId || 'cobalt_standard').slice(0, 64),
    equippedAvatarSkinId: (profile.equippedAvatarSkinId || 'vanguard_cyan').slice(0, 64),
    tutorialCompleted: Boolean(profile.tutorialCompleted),
    easterEggUnlocked: Boolean(profile.easterEggUnlocked),
    stats: {
      matchesPlayed: clampInt(profile.stats?.matchesPlayed, 10000000),
      wins: clampInt(profile.stats?.wins, 10000000),
      tags: clampInt(profile.stats?.tags, 100000000),
      deaths: clampInt(profile.stats?.deaths, 100000000),
      shotsFired: clampInt(profile.stats?.shotsFired, 1000000000),
      shotsHit: clampInt(profile.stats?.shotsHit, 1000000000),
      weaponStats: {
        pulse_carbine: {
          kills: clampInt(weaponStats.pulse_carbine.kills, 100000000),
          shotsFired: clampInt(weaponStats.pulse_carbine.shotsFired, 1000000000),
          shotsHit: clampInt(weaponStats.pulse_carbine.shotsHit, 1000000000),
        },
        volt_scatter: {
          kills: clampInt(weaponStats.volt_scatter.kills, 100000000),
          shotsFired: clampInt(weaponStats.volt_scatter.shotsFired, 1000000000),
          shotsHit: clampInt(weaponStats.volt_scatter.shotsHit, 1000000000),
        },
        helios_rail: {
          kills: clampInt(weaponStats.helios_rail.kills, 100000000),
          shotsFired: clampInt(weaponStats.helios_rail.shotsFired, 1000000000),
          shotsHit: clampInt(weaponStats.helios_rail.shotsHit, 1000000000),
        },
        arc_repeater: {
          kills: clampInt(weaponStats.arc_repeater.kills, 100000000),
          shotsFired: clampInt(weaponStats.arc_repeater.shotsFired, 1000000000),
          shotsHit: clampInt(weaponStats.arc_repeater.shotsHit, 1000000000),
        },
      },
    },
    settings: {
      graphicsQuality: ['low', 'medium', 'high', 'ultra'].includes(mergedSettings.graphicsQuality)
        ? mergedSettings.graphicsQuality
        : 'high',
      shadowQuality: ['off', 'low', 'medium', 'high', 'ultra'].includes(mergedSettings.shadowQuality)
        ? mergedSettings.shadowQuality
        : 'high',
      renderDistance: clampInt(mergedSettings.renderDistance, 1000, 40),
      vsync: Boolean(mergedSettings.vsync),
      showFps: Boolean(mergedSettings.showFps),
      fpsCap: ['screen_locked', '60', '120', '165', '240', 'unlimited'].includes(mergedSettings.fpsCap)
        ? mergedSettings.fpsCap
        : 'unlimited',
      fov: clampInt(mergedSettings.fov, 150, 50),
      mouseSensitivity: clampNum(mergedSettings.mouseSensitivity, 20, 0.05),
      shadowsEnabled: Boolean(mergedSettings.shadowsEnabled),
      particlesEnabled: Boolean(mergedSettings.particlesEnabled),
      audioEnabled: Boolean(mergedSettings.audioEnabled),
      masterVolume: clampNum(mergedSettings.masterVolume, 1, 0),
      controllerEnabled: Boolean(mergedSettings.controllerEnabled),
      controllerSensitivity: clampNum(mergedSettings.controllerSensitivity, 20, 0.05),
      controllerDeadzone: clampNum(mergedSettings.controllerDeadzone, 1, 0),
      controllerInvertY: Boolean(mergedSettings.controllerInvertY),
      controllerVibration: Boolean(mergedSettings.controllerVibration),
      darkMode: Boolean(mergedSettings.darkMode),
      language: ['en', 'es', 'sk', 'fr', 'ja'].includes(mergedSettings.language)
        ? mergedSettings.language
        : 'en',
      crossPlatformEnabled: Boolean(mergedSettings.crossPlatformEnabled),
    },
    keybinds: {
      moveForward: String(mergedKeybinds.moveForward || 'KeyW').slice(0, 32),
      moveBackward: String(mergedKeybinds.moveBackward || 'KeyS').slice(0, 32),
      moveLeft: String(mergedKeybinds.moveLeft || 'KeyA').slice(0, 32),
      moveRight: String(mergedKeybinds.moveRight || 'KeyD').slice(0, 32),
      jump: String(mergedKeybinds.jump || 'Space').slice(0, 32),
      dash: String(mergedKeybinds.dash || 'ShiftLeft').slice(0, 32),
      reload: String(mergedKeybinds.reload || 'KeyR').slice(0, 32),
      chat: String(mergedKeybinds.chat || 'KeyT').slice(0, 32),
      pause: String(mergedKeybinds.pause || 'KeyP').slice(0, 32),
      slot1: String(mergedKeybinds.slot1 || 'Digit1').slice(0, 32),
      slot2: String(mergedKeybinds.slot2 || 'Digit2').slice(0, 32),
      slot3: String(mergedKeybinds.slot3 || 'Digit3').slice(0, 32),
      slot4: String(mergedKeybinds.slot4 || 'Digit4').slice(0, 32),
    },
    lastSyncedAt: nowIso,
    createdAt,
    updatedAt,
  };
}
