import crypto from 'node:crypto';
import express from 'express';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { createServer as createViteServer } from 'vite';
import { WebSocket, WebSocketServer } from 'ws';
import {
  createAntiCheatState,
  PlayerAntiCheatState,
  validateFirePacket,
  validateMovePacket,
} from './src/game/anticheat';
import { createDefaultProfile, DEFAULT_SETTINGS, MAPS } from './src/game/catalog';
import {
  ChatMessage,
  FriendEntry,
  FriendStatus,
  MapId,
  PartyInvite,
  PlatformType,
  PlayerCloudProfile,
  WeaponId,
} from './src/game/types';

interface StoredUser {
  nickname: string;
  nicknameLower: string;
  passwordSalt: string;
  passwordHash: string;
  profile: PlayerCloudProfile;
  friends: string[];
}

interface CloudStoreData {
  users: Record<string, StoredUser>;
  chatHistory: ChatMessage[];
  sessionSecret?: string;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const STORE_PATH = path.join(DATA_DIR, 'cloud_store.json');

function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

function createSeedStore(): CloudStoreData {
  const seedUsers: Array<{
    nickname: string;
    platform: PlatformType;
    credits: number;
    avatarSkin: string;
  }> = [
    { nickname: 'NovaPrime', platform: 'PC', credits: 1250, avatarSkin: 'titanium_prime' },
    { nickname: 'Kaito_JP', platform: 'Console', credits: 940, avatarSkin: 'crimson_striker' },
    { nickname: 'Zuzana_SK', platform: 'Web', credits: 880, avatarSkin: 'aurora_violet' },
    { nickname: 'ElenaV', platform: 'Mobile', credits: 710, avatarSkin: 'stealth_matte' },
  ];

  const users: Record<string, StoredUser> = {};
  for (const s of seedUsers) {
    const salt = crypto.randomBytes(16).toString('hex');
    const profile = createDefaultProfile(s.nickname);
    profile.accountId = `acc-${s.nickname.toLowerCase()}`;
    profile.platform = s.platform;
    profile.credits = s.credits;
    profile.equippedAvatarSkinId = s.avatarSkin;
    profile.unlockedAvatarSkins = Array.from(new Set(['vanguard_cyan', s.avatarSkin]));
    profile.tutorialCompleted = true;

    users[s.nickname.toLowerCase()] = {
      nickname: s.nickname,
      nicknameLower: s.nickname.toLowerCase(),
      passwordSalt: salt,
      passwordHash: hashPassword('prism1234', salt),
      profile,
      friends: seedUsers
        .map((other) => other.nickname)
        .filter((n) => n !== s.nickname),
    };
  }

  return {
    users,
    chatHistory: [
      {
        id: 'seed-1',
        channel: 'global',
        sender: 'NovaPrime',
        platform: 'PC',
        text: 'Squad up in Veridian Park — the elevated sky-bridges give great angles!',
        timestamp: new Date(Date.now() - 180000).toISOString(),
      },
      {
        id: 'seed-2',
        channel: 'global',
        sender: 'Zuzana_SK',
        platform: 'Web',
        text: 'Cross-play lobby is live! Anyone up for Hyperion Atrium?',
        timestamp: new Date(Date.now() - 60000).toISOString(),
      },
    ],
  };
}

function loadStore(): CloudStoreData {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(STORE_PATH)) {
      const seed = createSeedStore();
      fs.writeFileSync(STORE_PATH, JSON.stringify(seed, null, 2), 'utf8');
      return seed;
    }
    const raw = fs.readFileSync(STORE_PATH, 'utf8');
    const parsed = JSON.parse(raw) as CloudStoreData;
    if (!parsed.users) return createSeedStore();
    for (const u of Object.values(parsed.users)) {
      if (u?.profile) {
        u.profile.settings = { ...DEFAULT_SETTINGS, ...(u.profile.settings ?? {}) };
      }
    }
    if (!parsed.sessionSecret) {
      parsed.sessionSecret = crypto.randomBytes(32).toString('hex');
      fs.writeFileSync(STORE_PATH, JSON.stringify(parsed, null, 2), 'utf8');
    }
    return parsed;
  } catch {
    const seed = createSeedStore();
    seed.sessionSecret = crypto.randomBytes(32).toString('hex');
    return seed;
  }
}

let store = loadStore();

function saveStore() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to persist cloud store:', err);
  }
}

function getSessionSecret(): string {
  if (!store.sessionSecret) {
    store.sessionSecret = crypto.randomBytes(32).toString('hex');
    saveStore();
  }
  return store.sessionSecret;
}

function createSessionToken(nicknameLower: string): string {
  const payload = Buffer.from(nicknameLower, 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', getSessionSecret()).update(payload).digest('hex');
  return `${payload}.${sig}`;
}

function verifySessionToken(token: string): string | null {
  const dotIdx = token.indexOf('.');
  if (dotIdx <= 0) return null;
  const payload = token.slice(0, dotIdx);
  const sig = token.slice(dotIdx + 1);
  const expected = crypto.createHmac('sha256', getSessionSecret()).update(payload).digest('hex');
  const sigBuf = Buffer.from(sig, 'utf8');
  const expBuf = Buffer.from(expected, 'utf8');
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }
  try {
    return Buffer.from(payload, 'base64url').toString('utf8');
  } catch {
    return null;
  }
}

function getAuthUser(req: express.Request): StoredUser | null {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return null;
  const token = auth.slice(7).trim();
  const nickKey = verifySessionToken(token);
  if (!nickKey) return null;
  return store.users[nickKey] ?? null;
}

// Real-time presence, rooms, invites, and silent anti-cheat
interface ConnectedClient {
  ws: WebSocket;
  clientId: string;
  nickname: string;
  platform: PlatformType;
  status: FriendStatus;
  roomCode: string;
  mapId: MapId;
  x: number;
  y: number;
  z: number;
  yaw: number;
  hp: number;
  weaponId: WeaponId;
  avatarSkinId: string;
  alive: boolean;
  score: number;
  antiCheat: PlayerAntiCheatState;
}

const clients = new Map<string, ConnectedClient>();
const pendingInvites = new Map<string, PartyInvite[]>();

const SEED_STATUS_DEFAULTS: Record<string, { status: FriendStatus; mapId?: MapId }> = {
  novaprime: { status: 'lobby' },
  kaito_jp: { status: 'in_match', mapId: 'cryo_spire' },
  zuzana_sk: { status: 'online' },
  elenav: { status: 'offline' },
};

function getLiveStatusForNickname(nickname: string): {
  status: FriendStatus;
  currentMap?: MapId;
  roomCode?: string;
} {
  const lower = nickname.toLowerCase();
  for (const c of clients.values()) {
    if (c.nickname.toLowerCase() === lower && c.ws.readyState === WebSocket.OPEN) {
      return {
        status: c.status,
        currentMap: c.status === 'in_match' ? c.mapId : undefined,
        roomCode: c.roomCode || undefined,
      };
    }
  }
  const seed = SEED_STATUS_DEFAULTS[lower];
  if (seed) {
    return { status: seed.status, currentMap: seed.mapId };
  }
  return { status: 'offline' };
}

function buildFriendsList(friendNicknames: string[]): FriendEntry[] {
  return friendNicknames.map((nick) => {
    const user = store.users[nick.toLowerCase()];
    const live = getLiveStatusForNickname(nick);
    return {
      nickname: user?.nickname ?? nick,
      platform: user?.profile.platform ?? 'Web',
      status: live.status,
      currentMap: live.currentMap,
      roomCode: live.roomCode,
    };
  });
}

function broadcastAll(payload: unknown) {
  const msg = JSON.stringify(payload);
  for (const c of clients.values()) {
    if (c.ws.readyState === WebSocket.OPEN) {
      c.ws.send(msg);
    }
  }
}

function broadcastRoom(roomCode: string, payload: unknown, excludeClientId?: string) {
  const msg = JSON.stringify(payload);
  for (const c of clients.values()) {
    if (
      c.roomCode === roomCode &&
      c.clientId !== excludeClientId &&
      c.ws.readyState === WebSocket.OPEN
    ) {
      c.ws.send(msg);
    }
  }
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, playersOnline: clients.size });
  });

  // Register (nickname + password, NO CAPTCHA)
  app.post('/api/auth/register', (req, res) => {
    const rawNick = String(req.body?.nickname ?? '').trim();
    const password = String(req.body?.password ?? '');
    const platform = (['PC', 'Web', 'Mobile', 'Console'].includes(req.body?.platform)
      ? req.body.platform
      : 'Web') as PlatformType;

    if (!/^[a-zA-Z0-9_-]{3,20}$/.test(rawNick)) {
      res.status(400).json({ error: 'Nickname must be 3-20 alphanumeric, _ or - characters.' });
      return;
    }
    if (password.length < 4 || password.length > 72) {
      res.status(400).json({ error: 'Password must be at least 4 characters.' });
      return;
    }

    const key = rawNick.toLowerCase();
    if (store.users[key]) {
      res.status(409).json({ error: 'Nickname is already registered.' });
      return;
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const profile = createDefaultProfile(rawNick);
    profile.accountId = `acc-${crypto.randomUUID().slice(0, 8)}`;
    profile.platform = platform;

    store.users[key] = {
      nickname: rawNick,
      nicknameLower: key,
      passwordSalt: salt,
      passwordHash: hashPassword(password, salt),
      profile,
      friends: ['NovaPrime', 'Zuzana_SK'],
    };
    saveStore();

    const token = createSessionToken(key);
    res.json({ token, profile });
  });

  // Login (nickname + password, NO CAPTCHA)
  app.post('/api/auth/login', (req, res) => {
    const rawNick = String(req.body?.nickname ?? '').trim();
    const password = String(req.body?.password ?? '');
    const platform = (['PC', 'Web', 'Mobile', 'Console'].includes(req.body?.platform)
      ? req.body.platform
      : undefined) as PlatformType | undefined;

    const user = store.users[rawNick.toLowerCase()];
    if (!user) {
      res.status(401).json({ error: 'Invalid nickname or password.' });
      return;
    }

    const candidateHash = hashPassword(password, user.passwordSalt);
    if (candidateHash !== user.passwordHash) {
      res.status(401).json({ error: 'Invalid nickname or password.' });
      return;
    }

    if (platform) {
      user.profile.platform = platform;
      user.profile.lastSyncedAt = new Date().toISOString();
      saveStore();
    }

    const token = createSessionToken(user.nicknameLower);
    res.json({ token, profile: user.profile });
  });

  // Cloud Save Read
  app.get('/api/cloud-save', (req, res) => {
    const user = getAuthUser(req);
    if (!user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    res.json({ profile: user.profile });
  });

  // Cloud Save Sync Write
  app.put('/api/cloud-save', (req, res) => {
    const user = getAuthUser(req);
    if (!user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const incoming = req.body?.profile as Partial<PlayerCloudProfile> | undefined;
    if (!incoming || typeof incoming !== 'object') {
      res.status(400).json({ error: 'Missing profile payload' });
      return;
    }

    // Merge sanitized cloud save fields
    user.profile = {
      ...user.profile,
      platform: incoming.platform ?? user.profile.platform,
      credits:
        typeof incoming.credits === 'number' && Number.isFinite(incoming.credits)
          ? Math.max(0, Math.round(incoming.credits))
          : user.profile.credits,
      xp:
        typeof incoming.xp === 'number' && Number.isFinite(incoming.xp)
          ? Math.max(0, Math.round(incoming.xp))
          : user.profile.xp,
      battlePassXp:
        typeof incoming.battlePassXp === 'number' && Number.isFinite(incoming.battlePassXp)
          ? Math.max(0, Math.round(incoming.battlePassXp))
          : user.profile.battlePassXp,
      battlePassPremium:
        typeof incoming.battlePassPremium === 'boolean'
          ? incoming.battlePassPremium
          : user.profile.battlePassPremium,
      claimedFreeTiers: Array.isArray(incoming.claimedFreeTiers)
        ? incoming.claimedFreeTiers
        : user.profile.claimedFreeTiers,
      claimedPremiumTiers: Array.isArray(incoming.claimedPremiumTiers)
        ? incoming.claimedPremiumTiers
        : user.profile.claimedPremiumTiers,
      unlockedWeaponSkins: Array.isArray(incoming.unlockedWeaponSkins)
        ? incoming.unlockedWeaponSkins
        : user.profile.unlockedWeaponSkins,
      unlockedAvatarSkins: Array.isArray(incoming.unlockedAvatarSkins)
        ? incoming.unlockedAvatarSkins
        : user.profile.unlockedAvatarSkins,
      equippedWeaponId: incoming.equippedWeaponId ?? user.profile.equippedWeaponId,
      equippedWeaponSkinId:
        incoming.equippedWeaponSkinId ?? user.profile.equippedWeaponSkinId,
      equippedAvatarSkinId:
        incoming.equippedAvatarSkinId ?? user.profile.equippedAvatarSkinId,
      tutorialCompleted:
        typeof incoming.tutorialCompleted === 'boolean'
          ? incoming.tutorialCompleted
          : user.profile.tutorialCompleted,
      easterEggUnlocked:
        typeof incoming.easterEggUnlocked === 'boolean'
          ? incoming.easterEggUnlocked
          : user.profile.easterEggUnlocked,
      stats: incoming.stats ?? user.profile.stats,
      settings: { ...DEFAULT_SETTINGS, ...user.profile.settings, ...(incoming.settings ?? {}) },
      keybinds: incoming.keybinds ?? user.profile.keybinds,
      lastSyncedAt: new Date().toISOString(),
    };

    saveStore();
    res.json({ profile: user.profile });
  });

  // Social: Friends + Invites + Chat History
  app.get('/api/social/state', (req, res) => {
    const user = getAuthUser(req);
    const friendNicks = user ? user.friends : ['NovaPrime', 'Kaito_JP', 'Zuzana_SK', 'ElenaV'];
    const nickKey = user ? user.nicknameLower : 'guest';
    res.json({
      friends: buildFriendsList(friendNicks),
      invites: pendingInvites.get(nickKey) ?? [],
      chatHistory: store.chatHistory.slice(-40),
    });
  });

  app.post('/api/social/friends/add', (req, res) => {
    const targetNick = String(req.body?.nickname ?? '').trim();
    if (!targetNick) {
      res.status(400).json({ error: 'Nickname required' });
      return;
    }
    const targetUser = store.users[targetNick.toLowerCase()];
    if (!targetUser) {
      res.status(404).json({ error: 'Player nickname not found in Prism cloud.' });
      return;
    }

    const user = getAuthUser(req);
    if (user) {
      if (user.nicknameLower === targetUser.nicknameLower) {
        res.status(400).json({ error: 'Cannot add yourself.' });
        return;
      }
      if (!user.friends.some((f) => f.toLowerCase() === targetUser.nicknameLower)) {
        user.friends.push(targetUser.nickname);
        saveStore();
      }
      res.json({ friends: buildFriendsList(user.friends) });
      return;
    }

    res.json({
      friends: buildFriendsList(['NovaPrime', 'Kaito_JP', 'Zuzana_SK', 'ElenaV', targetUser.nickname]),
    });
  });

  app.post('/api/social/invite', (req, res) => {
    const user = getAuthUser(req);
    const fromNickname = user?.nickname ?? String(req.body?.fromNickname ?? 'Vanguard01');
    const fromPlatform = user?.profile.platform ?? 'Web';
    const toNickname = String(req.body?.toNickname ?? '').trim();
    const mapId = (req.body?.mapId ?? 'hyperion_atrium') as MapId;
    const roomCode = String(req.body?.roomCode ?? 'ALPHA-1');

    if (!toNickname) {
      res.status(400).json({ error: 'Target friend nickname required' });
      return;
    }

    const invite: PartyInvite = {
      id: `inv-${crypto.randomUUID().slice(0, 8)}`,
      fromNickname,
      fromPlatform,
      mapId,
      roomCode,
      createdAt: new Date().toISOString(),
    };

    const key = toNickname.toLowerCase();
    const list = pendingInvites.get(key) ?? [];
    list.unshift(invite);
    pendingInvites.set(key, list.slice(0, 10));

    // Deliver in real-time over WebSocket if target is connected
    for (const c of clients.values()) {
      if (c.nickname.toLowerCase() === key && c.ws.readyState === WebSocket.OPEN) {
        c.ws.send(JSON.stringify({ type: 'social:invite', invite }));
      }
    }

    res.json({ ok: true, invite });
  });

  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws) => {
    const clientId = crypto.randomUUID().slice(0, 12);
    const client: ConnectedClient = {
      ws,
      clientId,
      nickname: `Vanguard-${clientId.slice(0, 4)}`,
      platform: 'Web',
      status: 'lobby',
      roomCode: '',
      mapId: 'hyperion_atrium',
      x: 0,
      y: 0,
      z: 20,
      yaw: 0,
      hp: 100,
      weaponId: 'pulse_carbine',
      avatarSkinId: 'vanguard_cyan',
      alive: true,
      score: 0,
      antiCheat: createAntiCheatState(0, 0, 20),
    };
    clients.set(clientId, client);

    ws.send(
      JSON.stringify({
        type: 'connected',
        clientId,
        chatHistory: store.chatHistory.slice(-30),
      })
    );

    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        const nowMs = Date.now();

        switch (msg.type) {
          case 'auth': {
            if (typeof msg.nickname === 'string' && msg.nickname.trim()) {
              client.nickname = msg.nickname.trim().slice(0, 20);
            }
            if (msg.platform) client.platform = msg.platform;
            if (msg.avatarSkinId) client.avatarSkinId = msg.avatarSkinId;
            if (msg.weaponId) client.weaponId = msg.weaponId;
            client.status = msg.status ?? 'lobby';
            broadcastAll({
              type: 'presence:update',
              nickname: client.nickname,
              platform: client.platform,
              status: client.status,
              currentMap: client.status === 'in_match' ? client.mapId : undefined,
            });
            break;
          }

          case 'presence:status': {
            client.status = msg.status ?? 'lobby';
            if (msg.mapId) client.mapId = msg.mapId;
            if (typeof msg.roomCode === 'string') client.roomCode = msg.roomCode;
            broadcastAll({
              type: 'presence:update',
              nickname: client.nickname,
              platform: client.platform,
              status: client.status,
              currentMap: client.status === 'in_match' ? client.mapId : undefined,
              roomCode: client.roomCode || undefined,
            });
            break;
          }

          case 'room:join': {
            client.roomCode = String(msg.roomCode ?? 'ALPHA-1');
            client.mapId = (msg.mapId ?? 'hyperion_atrium') as MapId;
            client.status = 'in_match';
            client.x = Number(msg.x) || 0;
            client.y = Number(msg.y) || 0;
            client.z = Number(msg.z) || 20;
            client.hp = 100;
            client.alive = true;
            client.antiCheat = createAntiCheatState(client.x, client.y, client.z, nowMs);

            const peers = Array.from(clients.values())
              .filter((c) => c.roomCode === client.roomCode && c.clientId !== clientId)
              .map((c) => ({
                id: c.clientId,
                nickname: c.nickname,
                platform: c.platform,
                x: c.x,
                y: c.y,
                z: c.z,
                yaw: c.yaw,
                hp: c.hp,
                weaponId: c.weaponId,
                avatarSkinId: c.avatarSkinId,
                alive: c.alive,
                score: c.score,
              }));

            ws.send(JSON.stringify({ type: 'room:peers', peers }));
            broadcastRoom(
              client.roomCode,
              {
                type: 'room:peer_joined',
                peer: {
                  id: client.clientId,
                  nickname: client.nickname,
                  platform: client.platform,
                  x: client.x,
                  y: client.y,
                  z: client.z,
                  yaw: client.yaw,
                  hp: client.hp,
                  weaponId: client.weaponId,
                  avatarSkinId: client.avatarSkinId,
                  alive: client.alive,
                  score: client.score,
                },
              },
              clientId
            );
            broadcastAll({
              type: 'presence:update',
              nickname: client.nickname,
              platform: client.platform,
              status: 'in_match',
              currentMap: client.mapId,
              roomCode: client.roomCode,
            });
            break;
          }

          case 'room:leave': {
            const oldRoom = client.roomCode;
            client.roomCode = '';
            client.status = 'lobby';
            if (oldRoom) {
              broadcastRoom(oldRoom, { type: 'room:peer_left', id: clientId }, clientId);
            }
            broadcastAll({
              type: 'presence:update',
              nickname: client.nickname,
              platform: client.platform,
              status: 'lobby',
            });
            break;
          }

          case 'player:move': {
            if (!client.roomCode) break;
            const map = MAPS[client.mapId] ?? MAPS.hyperion_atrium;
            // Silent background anti-cheat validation (zero interruption to legitimate gameplay)
            const check = validateMovePacket(
              client.antiCheat,
              Number(msg.x),
              Number(msg.y),
              Number(msg.z),
              map.arenaHalfSize,
              nowMs
            );
            client.x = check.clampedX;
            client.y = check.clampedY;
            client.z = check.clampedZ;
            client.yaw = Number(msg.yaw) || 0;
            if (msg.weaponId) client.weaponId = msg.weaponId;
            if (msg.avatarSkinId) client.avatarSkinId = msg.avatarSkinId;

            broadcastRoom(
              client.roomCode,
              {
                type: 'room:peer_move',
                id: clientId,
                x: client.x,
                y: client.y,
                z: client.z,
                yaw: client.yaw,
                weaponId: client.weaponId,
                avatarSkinId: client.avatarSkinId,
                alive: client.alive,
              },
              clientId
            );
            break;
          }

          case 'player:fire': {
            if (!client.roomCode) break;
            const dist = Number(msg.distance) || 0;
            const check = validateFirePacket(
              client.antiCheat,
              (msg.weaponId ?? client.weaponId) as WeaponId,
              dist,
              nowMs
            );
            if (!check.valid) {
              // Silent rejection on impossible fire rate/range
              break;
            }
            broadcastRoom(
              client.roomCode,
              {
                type: 'room:laser',
                id: clientId,
                weaponId: msg.weaponId ?? client.weaponId,
                origin: msg.origin,
                end: msg.end,
                color: msg.color,
              },
              clientId
            );
            break;
          }

          case 'chat:send': {
            const text = String(msg.text ?? '').trim().slice(0, 240);
            if (!text) break;
            const channel = (['global', 'party', 'match'].includes(msg.channel)
              ? msg.channel
              : 'global') as ChatMessage['channel'];

            const chatMsg: ChatMessage = {
              id: `msg-${crypto.randomUUID().slice(0, 8)}`,
              channel,
              sender: client.nickname,
              platform: client.platform,
              text,
              timestamp: new Date().toISOString(),
            };
            store.chatHistory.push(chatMsg);
            if (store.chatHistory.length > 100) {
              store.chatHistory = store.chatHistory.slice(-100);
            }
            saveStore();
            broadcastAll({ type: 'chat:message', message: chatMsg });
            break;
          }
        }
      } catch {
        // Ignore malformed packets silently
      }
    });

    ws.on('close', () => {
      const oldRoom = client.roomCode;
      clients.delete(clientId);
      if (oldRoom) {
        broadcastRoom(oldRoom, { type: 'room:peer_left', id: clientId });
      }
      broadcastAll({
        type: 'presence:update',
        nickname: client.nickname,
        platform: client.platform,
        status: 'offline',
      });
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  const port = Number(process.env.PORT) || 3000;
  server.listen(port, '0.0.0.0', () => {
    console.log(`Prism Protocol server running on http://0.0.0.0:${port}`);
  });
}

startServer();
