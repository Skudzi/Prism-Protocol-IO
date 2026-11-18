import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Crosshair,
  Globe,
  Map as MapIcon,
  Moon,
  Play,
  Settings as SettingsIcon,
  Shield,
  Sun,
  Trophy,
  User,
  Users,
  X,
} from 'lucide-react';
import { ArmoryPanel } from './components/ArmoryPanel';
import { BattlePassPanel, MapsPanel } from './components/MapsBattlePassPanel';
import { PlayingHud } from './components/PlayingHud';
import { SettingsPanel } from './components/SettingsPanel';
import { AccountPanel, SocialPanel } from './components/SocialAccountPanel';
import { ArenaEngine, HudSnapshot } from './engine/ArenaEngine';
import { createDefaultProfile, DEFAULT_SETTINGS, MAPS } from './game/catalog';
import {
  applyMatchRewards,
  claimBattlePassTier,
  pickRandomMapId,
  purchaseStoreItem,
  upgradeBattlePassPremium,
} from './game/rules';
import {
  ChatMessage,
  FriendEntry,
  GameMode,
  GameScreenState,
  GameSettings,
  Keybinds,
  LanguageCode,
  MapId,
  MatchSummary,
  PartyInvite,
  PlatformType,
  PlayerCloudProfile,
  RemoteActorState,
  WeaponId,
} from './game/types';
import { LANGUAGES, t } from './i18n/translations';

type HubTab =
  | null
  | 'loadout'
  | 'maps'
  | 'battlepass'
  | 'social'
  | 'settings'
  | 'account';

const INITIAL_HUD: HudSnapshot = {
  hp: 100,
  maxHp: 100,
  energy: 100,
  maxEnergy: 100,
  ammo: 30,
  maxAmmo: 30,
  isReloading: false,
  reloadProgress: 0,
  ammoStyle: 'gold_bullet',
  dashCharge: 100,
  tags: 0,
  deaths: 0,
  teamScoreCyan: 0,
  teamScoreAmber: 0,
  gameMode: 'ffa',
  fps: 60,
  healFlashMs: 0,
  timeRemaining: 120,
  weaponId: 'pulse_carbine',
  hitMarkerMs: 0,
  lastHitZone: null,
  damageFlashMs: 0,
  pointerLocked: false,
  tutorialStep: 1,
  tutorialDronesHit: 0,
  easterEggUnlockedNow: false,
  isScoped: false,
  killsFeed: [],
  minimap: {
    mapId: 'hyperion_atrium',
    arenaHalfSize: 35,
    player: { x: 0, z: 27, yaw: 0 },
    bots: [],
    peers: [],
    healOrbs: [],
  },
};

const STORAGE_PROFILE_KEY = 'prism_protocol_profile_v1';
const STORAGE_TOKEN_KEY = 'prism_protocol_token_v1';

function normalizeProfile(raw: PlayerCloudProfile): PlayerCloudProfile {
  return {
    ...raw,
    settings: {
      ...DEFAULT_SETTINGS,
      ...(raw.settings ?? {}),
    },
  };
}

function loadInitialProfile(): PlayerCloudProfile {
  try {
    const raw = localStorage.getItem(STORAGE_PROFILE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as PlayerCloudProfile;
      if (parsed && parsed.settings && parsed.keybinds) return normalizeProfile(parsed);
    }
  } catch {
    // Fallback to default
  }
  return createDefaultProfile('Vanguard01');
}

export default function App() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<ArenaEngine | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const peersRef = useRef<Map<string, RemoteActorState>>(new Map());

  const [profile, setProfile] = useState<PlayerCloudProfile>(loadInitialProfile);
  const profileRef = useRef<PlayerCloudProfile>(profile);
  profileRef.current = profile;
  const [authToken, setAuthToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem(STORAGE_TOKEN_KEY);
    } catch {
      return null;
    }
  });
  const authTokenRef = useRef<string | null>(authToken);
  authTokenRef.current = authToken;
  const [authReady, setAuthReady] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string>('Local Save');
  const lastPlayedMapRef = useRef<MapId | undefined>(undefined);
  const [screenState, setScreenState] = useState<GameScreenState>('title');
  const [selectedMap, setSelectedMap] = useState<MapId>('hyperion_atrium');
  const [manualMapSelected, setManualMapSelected] = useState(false);
  const [gameMode, setGameMode] = useState<GameMode>('ffa');
  const [roomCode, setRoomCode] = useState<string>('ALPHA-1');
  const [activeTab, setActiveTab] = useState<HubTab>(null);
  const [isTutorial, setIsTutorial] = useState(false);
  const [hud, setHud] = useState<HudSnapshot>(INITIAL_HUD);
  const [matchSummary, setMatchSummary] = useState<MatchSummary | null>(null);
  const [easterEggBanner, setEasterEggBanner] = useState(false);

  const [friends, setFriends] = useState<FriendEntry[]>([]);
  const [invites, setInvites] = useState<PartyInvite[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [matchChatOpen, setMatchChatOpen] = useState(false);

  const lang = profile.settings.language;

  // Keep body data-state and dark mode class synced
  useEffect(() => {
    document.body.dataset.state = screenState;
  }, [screenState]);

  useEffect(() => {
    const root = document.documentElement;
    if (profile.settings.darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [profile.settings.darkMode]);

  // Persist locally on every profile change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_PROFILE_KEY, JSON.stringify(profile));
    } catch {
      // Ignore quota errors
    }
  }, [profile]);

  const refreshSocial = useCallback(async (tokenOverride?: string | null) => {
    try {
      const token = tokenOverride !== undefined ? tokenOverride : authTokenRef.current;
      const res = await fetch('/api/social/state', {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.friends)) setFriends(data.friends);
        if (Array.isArray(data.invites)) setInvites(data.invites);
        if (Array.isArray(data.chatHistory)) setChatMessages(data.chatHistory);
      }
    } catch {
      // Ignore transient network errors
    }
  }, []);

  // Restore saved username/password session on boot
  useEffect(() => {
    let cancelled = false;
    const restoreSession = async () => {
      const savedToken = authTokenRef.current;
      if (!savedToken) {
        if (!cancelled) {
          setAuthReady(true);
          setSyncStatus('Local Save');
          void refreshSocial(null);
        }
        return;
      }

      try {
        const res = await fetch('/api/cloud-save', {
          headers: { Authorization: `Bearer ${savedToken}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (!cancelled && data?.profile) {
            const normalized = normalizeProfile(data.profile as PlayerCloudProfile);
            setProfile(normalized);
            setSyncStatus(t(normalized.settings.language, 'account.synced'));
            void refreshSocial(savedToken);
          }
        } else if (res.status === 401) {
          try {
            localStorage.removeItem(STORAGE_TOKEN_KEY);
          } catch {
            // Ignore storage errors
          }
          if (!cancelled) {
            setAuthToken(null);
            setSyncStatus('Local Save');
            void refreshSocial(null);
          }
        }
      } catch {
        if (!cancelled) {
          setSyncStatus('Local Save');
        }
      } finally {
        if (!cancelled) {
          setAuthReady(true);
        }
      }
    };

    void restoreSession();
    return () => {
      cancelled = true;
    };
  }, [refreshSocial]);

  const syncCloudSave = useCallback(
    async (nextProfile: PlayerCloudProfile, refreshFromReturn = false) => {
      const token = authTokenRef.current;
      if (!token) {
        setSyncStatus('Local Save');
        return;
      }
      try {
        setSyncStatus('Syncing...');
        const res = await fetch('/api/cloud-save', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ profile: nextProfile }),
        });
        if (res.status === 401) {
          try {
            localStorage.removeItem(STORAGE_TOKEN_KEY);
          } catch {
            // Ignore storage errors
          }
          setAuthToken(null);
          setSyncStatus('Local Save');
          return;
        }
        if (!res.ok) {
          setSyncStatus('Sync Error');
          return;
        }
        const data = await res.json();
        if (data?.profile) {
          const normalized = normalizeProfile(data.profile as PlayerCloudProfile);
          if (refreshFromReturn) {
            setProfile(normalized);
          }
          setSyncStatus(t(normalized.settings.language, 'account.synced'));
        }
      } catch {
        setSyncStatus('Sync Error');
      }
    },
    []
  );

  // WebSocket real-time multiplayer, presence, invites & chat
  useEffect(() => {
    let closedByUser = false;
    let reconnectTimer = 0;

    const connect = () => {
      const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${proto}//${window.location.host}/ws`);
      wsRef.current = ws;

      ws.onopen = () => {
        ws.send(
          JSON.stringify({
            type: 'auth',
            nickname: profile.nickname,
            platform: profile.platform,
            weaponId: profile.equippedWeaponId,
            avatarSkinId: profile.equippedAvatarSkinId,
            status: screenState === 'playing' ? 'in_match' : 'lobby',
          })
        );
      };

      ws.onmessage = (evt) => {
        try {
          const msg = JSON.parse(evt.data);
          switch (msg.type) {
            case 'connected':
              if (Array.isArray(msg.chatHistory)) {
                setChatMessages(msg.chatHistory);
              }
              break;
            case 'presence:update':
              setFriends((prev) =>
                prev.map((f) =>
                  f.nickname.toLowerCase() === String(msg.nickname).toLowerCase()
                    ? {
                        ...f,
                        status: msg.status,
                        platform: msg.platform ?? f.platform,
                        currentMap: msg.currentMap,
                        roomCode: msg.roomCode,
                      }
                    : f
                )
              );
              break;
            case 'social:invite':
              if (msg.invite) {
                setInvites((prev) => [msg.invite, ...prev.slice(0, 8)]);
              }
              break;
            case 'chat:message':
              if (msg.message) {
                setChatMessages((prev) => [...prev.slice(-49), msg.message]);
              }
              break;
            case 'room:peers':
              peersRef.current.clear();
              if (Array.isArray(msg.peers)) {
                for (const p of msg.peers) {
                  peersRef.current.set(p.id, p);
                }
              }
              engineRef.current?.syncRemotePeers(Array.from(peersRef.current.values()));
              break;
            case 'room:peer_joined':
              if (msg.peer) {
                peersRef.current.set(msg.peer.id, msg.peer);
                engineRef.current?.syncRemotePeers(Array.from(peersRef.current.values()));
              }
              break;
            case 'room:peer_left':
              if (msg.id) {
                peersRef.current.delete(msg.id);
                engineRef.current?.syncRemotePeers(Array.from(peersRef.current.values()));
              }
              break;
            case 'room:peer_move': {
              const existing = peersRef.current.get(msg.id);
              if (existing) {
                existing.x = msg.x;
                existing.y = msg.y;
                existing.z = msg.z;
                existing.yaw = msg.yaw;
                existing.weaponId = msg.weaponId;
                existing.avatarSkinId = msg.avatarSkinId;
                existing.alive = msg.alive;
                engineRef.current?.syncRemotePeers(Array.from(peersRef.current.values()));
              }
              break;
            }
            case 'room:laser':
              if (msg.origin && msg.end) {
                engineRef.current?.spawnRemoteLaser(msg.origin, msg.end, msg.color ?? '#22d3ee');
              }
              break;
          }
        } catch {
          // Ignore malformed WS payloads
        }
      };

      ws.onclose = () => {
        if (!closedByUser) {
          reconnectTimer = window.setTimeout(connect, 2500);
        }
      };
    };

    connect();
    return () => {
      closedByUser = true;
      clearTimeout(reconnectTimer);
      wsRef.current?.close();
    };
  }, [profile.nickname, profile.platform]);

  // Ref callbacks for isolated Three.js lifecycle
  const callbacksRef = useRef({
    onMatchEnd: (summary: MatchSummary, shotsFired: number, shotsHit: number) => {
      setMatchSummary(summary);
      setScreenState('gameover');
      setProfile((prev) => {
        const updated = applyMatchRewards(prev, summary, shotsFired, shotsHit);
        syncCloudSave(updated);
        return updated;
      });
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'room:leave' }));
      }
    },
    onTutorialComplete: () => {
      setProfile((prev) => {
        const updated = {
          ...prev,
          tutorialCompleted: true,
          credits: prev.credits + (prev.tutorialCompleted ? 0 : 150),
        };
        syncCloudSave(updated);
        return updated;
      });
      setIsTutorial(false);
      setScreenState('title');
      engineRef.current?.setScreenState('title');
    },
    onEasterEggFound: () => {
      setEasterEggBanner(true);
      setTimeout(() => setEasterEggBanner(false), 5000);
      setProfile((prev) => {
        const nextSkins = prev.unlockedWeaponSkins.includes('prism_relic')
          ? prev.unlockedWeaponSkins
          : [...prev.unlockedWeaponSkins, 'prism_relic'];
        const updated = {
          ...prev,
          easterEggUnlocked: true,
          credits: prev.credits + (prev.easterEggUnlocked ? 0 : 500),
          unlockedWeaponSkins: nextSkins,
        };
        syncCloudSave(updated);
        return updated;
      });
    },
  });

  // Update callbacksRef closures cleanly
  callbacksRef.current.onMatchEnd = (summary, shotsFired, shotsHit) => {
    setMatchSummary(summary);
    setScreenState('gameover');
    setProfile((prev) => {
      const updated = applyMatchRewards(prev, summary, shotsFired, shotsHit);
      syncCloudSave(updated);
      return updated;
    });
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'room:leave' }));
    }
  };

  // Mount Three.js ArenaEngine ONCE
  useEffect(() => {
    if (!mountRef.current) return;
    const engine = new ArenaEngine(
      mountRef.current,
      profile.settings,
      profile.keybinds,
      {
        onHudUpdate: (nextHud) => setHud(nextHud),
        onMatchEnd: (summary, shotsFired, shotsHit) =>
          callbacksRef.current.onMatchEnd(summary, shotsFired, shotsHit),
        onTutorialComplete: () => callbacksRef.current.onTutorialComplete(),
        onEasterEggFound: () => callbacksRef.current.onEasterEggFound(),
        onPauseRequested: () => {
          setScreenState('paused');
          engineRef.current?.setScreenState('paused');
        },
        onChatRequested: () => {
          setMatchChatOpen((prev) => !prev);
        },
        onWeaponChanged: (weaponId) => {
          setProfile((prev) =>
            prev.equippedWeaponId === weaponId
              ? prev
              : { ...prev, equippedWeaponId: weaponId }
          );
        },
        onNetworkMove: (x, y, z, yaw) => {
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(
              JSON.stringify({
                type: 'player:move',
                x,
                y,
                z,
                yaw,
                weaponId: profile.equippedWeaponId,
                avatarSkinId: profile.equippedAvatarSkinId,
              })
            );
          }
        },
        onNetworkFire: (weaponId, origin, end, color, distance) => {
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(
              JSON.stringify({
                type: 'player:fire',
                weaponId,
                origin,
                end,
                color,
                distance,
              })
            );
          }
        },
      }
    );
    engine.setLoadout(
      profile.equippedWeaponId,
      profile.equippedWeaponSkinId,
      profile.equippedAvatarSkinId
    );
    engineRef.current = engine;

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  // Push settings & loadout updates to existing Three.js engine without remounting
  useEffect(() => {
    engineRef.current?.updateSettings(profile.settings, profile.keybinds);
  }, [profile.settings, profile.keybinds]);

  useEffect(() => {
    engineRef.current?.setLoadout(
      profile.equippedWeaponId,
      profile.equippedWeaponSkinId,
      profile.equippedAvatarSkinId
    );
  }, [profile.equippedWeaponId, profile.equippedWeaponSkinId, profile.equippedAvatarSkinId]);

  useEffect(() => {
    engineRef.current?.setPlayerNickname(profile.nickname);
  }, [profile.nickname]);

  const startGameplay = useCallback(
    (
      mapId: MapId,
      tutorialMode: boolean,
      targetRoom = roomCode,
      modeOverride: GameMode = gameMode
    ) => {
      (document.activeElement as HTMLElement | null)?.blur?.();
      setActiveTab(null);
      setMatchSummary(null);
      setMatchChatOpen(false);
      setIsTutorial(tutorialMode);
      if (!tutorialMode) {
        lastPlayedMapRef.current = mapId;
      }
      setSelectedMap(mapId);
      setScreenState('playing');
      document.body.dataset.state = 'playing';

      engineRef.current?.setLoadout(
        profile.equippedWeaponId,
        profile.equippedWeaponSkinId,
        profile.equippedAvatarSkinId
      );
      engineRef.current?.startMatch(mapId, tutorialMode, modeOverride, profile.nickname);

      if (!tutorialMode && wsRef.current?.readyState === WebSocket.OPEN) {
        const sp = MAPS[mapId].spawns[0];
        wsRef.current.send(
          JSON.stringify({
            type: 'room:join',
            roomCode: targetRoom,
            mapId,
            x: sp.x,
            y: sp.y,
            z: sp.z,
          })
        );
      }
    },
    [
      profile.equippedWeaponId,
      profile.equippedWeaponSkinId,
      profile.equippedAvatarSkinId,
      profile.nickname,
      roomCode,
      gameMode,
    ]
  );

  const startNextRound = useCallback(() => {
    const targetMap = manualMapSelected
      ? selectedMap
      : pickRandomMapId(lastPlayedMapRef.current);
    startGameplay(targetMap, false);
  }, [manualMapSelected, selectedMap, startGameplay]);

  // Support ?autostart=1 and Enter/Space on Title screen
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
      startNextRound();
    }
  }, []);

  useEffect(() => {
    if (screenState !== 'title' || activeTab !== null) return;
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        startNextRound();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [screenState, activeTab, startNextRound]);

  const handleReturnHub = () => {
    setScreenState('title');
    setIsTutorial(false);
    setMatchSummary(null);
    engineRef.current?.setScreenState('title');
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'room:leave' }));
    }
  };

  // Account Handlers (Username + Password Cloud Auth, No Email Required)
  const handleLogin = async (
    username: string,
    password: string,
    platform: PlatformType
  ): Promise<{ ok: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname: username, password, platform }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { ok: false, error: data?.error ?? 'Invalid username or password.' };
      }
      localStorage.setItem(STORAGE_TOKEN_KEY, data.token);
      setAuthToken(data.token);
      const normalized = normalizeProfile(data.profile as PlayerCloudProfile);
      setProfile(normalized);
      setSyncStatus(t(normalized.settings.language, 'account.synced'));
      void refreshSocial(data.token);
      return { ok: true };
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : 'Unable to reach cloud server.',
      };
    }
  };

  const handleRegister = async (
    username: string,
    password: string,
    platform: PlatformType
  ): Promise<{ ok: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nickname: username,
          password,
          platform,
          seedProfile: profileRef.current,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { ok: false, error: data?.error ?? 'Could not create account.' };
      }
      localStorage.setItem(STORAGE_TOKEN_KEY, data.token);
      setAuthToken(data.token);
      const normalized = normalizeProfile(data.profile as PlayerCloudProfile);
      setProfile(normalized);
      setSyncStatus(t(normalized.settings.language, 'account.synced'));
      void refreshSocial(data.token);
      return { ok: true };
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : 'Unable to reach cloud server.',
      };
    }
  };

  const handleUpdatePlatform = async (
    platform: PlatformType
  ): Promise<{ ok: boolean; error?: string }> => {
    const updated: PlayerCloudProfile = {
      ...profile,
      platform,
    };
    setProfile(updated);
    await syncCloudSave(updated);
    return { ok: true };
  };

  const handleLogout = async () => {
    try {
      localStorage.removeItem(STORAGE_TOKEN_KEY);
    } catch {
      // Ignore storage errors
    }
    setAuthToken(null);
    setProfile(createDefaultProfile('Vanguard01'));
    setSyncStatus('Local Save');
    void refreshSocial(null);
  };

  const handleAddFriend = async (nickname: string) => {
    const clean = nickname.trim();
    if (!/^[a-zA-Z0-9_-]{3,20}$/.test(clean)) {
      return { ok: false, error: 'Username must be 3–20 alphanumeric, _ or - characters.' };
    }
    try {
      const token = authTokenRef.current;
      const res = await fetch('/api/social/friends/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ nickname: clean }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { ok: false, error: data?.error ?? 'Could not add friend' };
      }
      if (Array.isArray(data.friends)) {
        setFriends(data.friends);
      }
      return { ok: true };
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : 'Could not add friend',
      };
    }
  };

  const handleInviteFriend = async (toNickname: string) => {
    try {
      await fetch('/api/social/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromNickname: profile.nickname,
          toNickname,
          mapId: selectedMap,
          roomCode,
        }),
      });
    } catch {
      // Ignore
    }
  };

  const handleSendChat = (text: string, channel: 'global' | 'party' | 'match') => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'chat:send', text, channel }));
    } else {
      setChatMessages((prev) => [
        ...prev,
        {
          id: `local-${Date.now()}`,
          channel,
          sender: profile.nickname,
          platform: profile.platform,
          text,
          timestamp: new Date().toISOString(),
        },
      ]);
    }
  };

  const updateSettings = (next: GameSettings) => {
    setProfile((prev) => {
      const updated = { ...prev, settings: next };
      syncCloudSave(updated);
      return updated;
    });
  };

  const updateKeybinds = (next: Keybinds) => {
    setProfile((prev) => {
      const updated = { ...prev, keybinds: next };
      syncCloudSave(updated);
      return updated;
    });
  };

  const tabItems: Array<{ id: Exclude<HubTab, null>; label: string; icon: React.ReactNode }> = [
    { id: 'loadout', label: t(lang, 'nav.loadout'), icon: <Crosshair className="h-4 w-4" /> },
    { id: 'maps', label: t(lang, 'nav.maps'), icon: <MapIcon className="h-4 w-4" /> },
    { id: 'battlepass', label: t(lang, 'nav.battlepass'), icon: <Trophy className="h-4 w-4" /> },
    { id: 'social', label: t(lang, 'nav.social'), icon: <Users className="h-4 w-4" /> },
    { id: 'settings', label: t(lang, 'nav.settings'), icon: <SettingsIcon className="h-4 w-4" /> },
    { id: 'account', label: t(lang, 'nav.account'), icon: <User className="h-4 w-4" /> },
  ];

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-slate-100 dark:bg-[#070B12] text-slate-900 dark:text-slate-100">
      {/* Isolated Three.js WebGL Mount */}
      <div
        ref={mountRef}
        data-testid="arena-canvas-mount"
        className="fixed inset-0 h-full w-full"
      />

      {/* Title Screen & Game Hub (Negative-space overlay over live 3D Camera Tour) */}
      {screenState === 'title' && (
        <div className="pointer-events-none fixed inset-0 z-10 flex flex-col justify-between p-6 md:p-10">
          {/* Top Utility Strip (Account summary, Language, Theme) */}
          <div className="pointer-events-auto flex flex-wrap items-center justify-between gap-4">
            <div className="rounded-lg border border-slate-200/80 dark:border-white/15 bg-white/90 dark:bg-[#070B12]/85 px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300">
              <span>{profile.nickname}</span>
              <span className="mx-2 text-slate-400">·</span>
              <span>{profile.platform}</span>
              <span className="mx-2 text-slate-400">·</span>
              <span className="font-mono font-bold text-amber-500">{profile.credits} CR</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 rounded-lg border border-slate-200/80 dark:border-white/15 bg-white/90 dark:bg-[#070B12]/85 px-2.5 py-1.5">
                <Globe className="h-3.5 w-3.5 text-cyan-500" />
                <select
                  aria-label={t(lang, 'settings.language')}
                  value={lang}
                  onChange={(e) =>
                    updateSettings({
                      ...profile.settings,
                      language: e.target.value as LanguageCode,
                    })
                  }
                  className="bg-transparent text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none cursor-pointer"
                >
                  {LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code} className="bg-white dark:bg-slate-900">
                      {l.label}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                aria-label="Toggle dark mode"
                onClick={() =>
                  updateSettings({
                    ...profile.settings,
                    darkMode: !profile.settings.darkMode,
                  })
                }
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200/80 dark:border-white/15 bg-white/90 dark:bg-[#070B12]/85 text-slate-800 dark:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
              >
                {profile.settings.darkMode ? (
                  <Sun className="h-4 w-4 text-amber-400" />
                ) : (
                  <Moon className="h-4 w-4 text-slate-700" />
                )}
              </button>
            </div>
          </div>

          {/* Center-Left Emblem & Primary Start CTA (leaves center-right 3D vista open) */}
          {activeTab === null ? (
            <div className="pointer-events-auto my-auto max-w-lg rounded-xl border border-slate-200/80 dark:border-white/15 bg-white/90 dark:bg-[#070B12]/85 p-6 shadow-2xl">
              {/* Custom Inline SVG Emblem */}
              <div className="flex items-center gap-3">
                <svg width="42" height="42" viewBox="0 0 42 42" aria-hidden="true">
                  <polygon
                    points="21,2 39,12 39,30 21,40 3,30 3,12"
                    fill="none"
                    stroke="#06b6d4"
                    strokeWidth="2.5"
                  />
                  <polygon points="21,9 32,27 10,27" fill="#06b6d4" fillOpacity="0.25" stroke="#22d3ee" strokeWidth="1.8" />
                  <circle cx="21" cy="21" r="3" fill="#f59e0b" />
                </svg>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {t(lang, 'app.title')}
                </h1>
              </div>

              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                {manualMapSelected
                  ? t(lang, MAPS[selectedMap].nameKey as Parameters<typeof t>[1])
                  : t(lang, 'map.randomMode')}{' '}
                ·{' '}
                {t(lang, `weapon.${profile.equippedWeaponId}.name` as Parameters<typeof t>[1])}
              </p>

              {/* Mode Selector: Free-For-All vs Team Deathmatch */}
              <div className="mt-4 inline-flex rounded-lg border border-slate-200 dark:border-slate-700/80 bg-slate-100/90 dark:bg-slate-900/80 p-1">
                {(['ffa', 'tdm'] as GameMode[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    data-testid={`mode-${m}`}
                    onClick={() => setGameMode(m)}
                    className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                      gameMode === m
                        ? 'bg-cyan-500 text-slate-950'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {t(lang, (m === 'ffa' ? 'mode.ffa' : 'mode.tdm') as Parameters<typeof t>[1])}
                  </button>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  data-start="true"
                  onClick={startNextRound}
                  className="flex items-center gap-2 rounded-lg bg-cyan-500 px-6 py-3 text-sm font-bold text-slate-950 hover:bg-cyan-400 transition-colors cursor-pointer"
                >
                  <Play className="h-4 w-4 fill-current" />
                  {t(lang, 'cta.deploy')}
                </button>

                {!profile.tutorialCompleted && (
                  <button
                    type="button"
                    onClick={() => startGameplay('hyperion_atrium', true)}
                    className="flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/90 px-4 py-3 text-sm font-semibold text-slate-800 dark:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                  >
                    <Shield className="h-4 w-4 text-cyan-500" />
                    {t(lang, 'cta.tutorial')}
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Active Hub Modal Drawer */
            <div className="pointer-events-auto mx-auto my-auto flex max-h-[74vh] w-full max-w-5xl flex-col rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white/95 dark:bg-[#0D131F]/95 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-5 py-3.5">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {tabItems.find((x) => x.id === activeTab)?.label}
                </h2>
                <button
                  type="button"
                  aria-label="Close panel"
                  onClick={() => setActiveTab(null)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5">
                {activeTab === 'loadout' && (
                  <ArmoryPanel
                    profile={profile}
                    lang={lang}
                    onEquipWeapon={(weaponId: WeaponId) => {
                      setProfile((prev) => {
                        const updated = { ...prev, equippedWeaponId: weaponId };
                        syncCloudSave(updated);
                        return updated;
                      });
                    }}
                    onActionSkin={(type, itemId) => {
                      setProfile((prev) => {
                        const res = purchaseStoreItem(prev, type, itemId);
                        if (!res.ok) return prev;
                        syncCloudSave(res.profile);
                        return res.profile;
                      });
                    }}
                  />
                )}

                {activeTab === 'maps' && (
                  <MapsPanel
                    selectedMap={selectedMap}
                    manualMapSelected={manualMapSelected}
                    lang={lang}
                    onSelectMap={(id) => {
                      setManualMapSelected(true);
                      setSelectedMap(id);
                      engineRef.current?.setMapPreview(id);
                    }}
                    onDeploy={(id) => {
                      setManualMapSelected(true);
                      startGameplay(id, false);
                    }}
                    onEnableRandomMap={() => {
                      setManualMapSelected(false);
                    }}
                  />
                )}

                {activeTab === 'battlepass' && (
                  <BattlePassPanel
                    profile={profile}
                    lang={lang}
                    onUpgradePremium={() => {
                      setProfile((prev) => {
                        const res = upgradeBattlePassPremium(prev, 600);
                        if (!res.ok) return prev;
                        syncCloudSave(res.profile);
                        return res.profile;
                      });
                    }}
                    onClaimTier={(tier, track) => {
                      setProfile((prev) => {
                        const res = claimBattlePassTier(prev, tier, track);
                        if (!res.ok) return prev;
                        syncCloudSave(res.profile);
                        return res.profile;
                      });
                    }}
                  />
                )}

                {activeTab === 'social' && (
                  <SocialPanel
                    friends={friends}
                    invites={invites}
                    chatMessages={chatMessages}
                    lang={lang}
                    onAddFriend={handleAddFriend}
                    onInviteFriend={handleInviteFriend}
                    onJoinInvite={(inv) => {
                      setRoomCode(inv.roomCode);
                      startGameplay(inv.mapId, false, inv.roomCode);
                    }}
                    onSendChat={(text, channel) => handleSendChat(text, channel)}
                  />
                )}

                {activeTab === 'settings' && (
                  <SettingsPanel
                    settings={profile.settings}
                    keybinds={profile.keybinds}
                    lang={lang}
                    onUpdateSettings={updateSettings}
                    onUpdateKeybinds={updateKeybinds}
                  />
                )}

                {activeTab === 'account' && (
                  <AccountPanel
                    profile={profile}
                    isAuthenticated={Boolean(authToken)}
                    authReady={authReady}
                    lang={lang}
                    syncStatus={syncStatus}
                    onLogin={handleLogin}
                    onRegister={handleRegister}
                    onUpdatePlatform={handleUpdatePlatform}
                    onLogout={handleLogout}
                    onSyncNow={() => void syncCloudSave(profile, true)}
                  />
                )}
              </div>
            </div>
          )}

          {/* Bottom Hub Dock + Flat Control Hint */}
          <div className="pointer-events-auto flex flex-col items-center gap-2.5">
            <nav
              aria-label="Game Hub Navigation"
              className="flex flex-wrap items-center justify-center gap-1.5 rounded-xl border border-slate-200/80 dark:border-white/15 bg-white/92 dark:bg-[#070B12]/90 p-1.5 shadow-xl"
            >
              {tabItems.map((item) => {
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveTab(active ? null : item.id)}
                    className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                      active
                        ? 'bg-cyan-500 text-slate-950'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-200/80 dark:hover:bg-slate-800'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
            <div className="rounded-md bg-white/85 dark:bg-[#070B12]/80 px-3 py-1 text-center text-[11px] font-medium text-slate-800 dark:text-slate-300">
              {t(lang, 'hud.controlsHint')}
            </div>
          </div>

          <div
            data-testid="creator-attribution"
            className="pointer-events-none fixed bottom-3 right-5 text-[11px] font-medium text-slate-700 dark:text-slate-300/90"
          >
            Creator Skudzi. All rights reserved (R)
          </div>
        </div>
      )}

      {/* Active Playing HUD, Pause & Post-Match Modals */}
      <PlayingHud
        hud={hud}
        screenState={screenState}
        mapId={selectedMap}
        isTutorial={isTutorial}
        audioEnabled={profile.settings.audioEnabled}
        showFps={profile.settings.showFps}
        lang={lang}
        easterEggBannerVisible={easterEggBanner}
        matchSummary={matchSummary}
        chatMessages={chatMessages}
        chatOpen={matchChatOpen}
        onToggleChat={() => setMatchChatOpen((v) => !v)}
        onSendChat={(txt) => handleSendChat(txt, 'match')}
        onToggleMute={() =>
          updateSettings({
            ...profile.settings,
            audioEnabled: !profile.settings.audioEnabled,
          })
        }
        onPause={() => {
          setScreenState('paused');
          engineRef.current?.setScreenState('paused');
        }}
        onResume={() => {
          setScreenState('playing');
          engineRef.current?.setScreenState('playing');
        }}
        onRestart={() => {
          if (screenState === 'gameover') {
            startNextRound();
          } else {
            startGameplay(selectedMap, false);
          }
        }}
        onReturnHub={handleReturnHub}
        onSkipTutorial={() => {
          setProfile((prev) => {
            const updated = { ...prev, tutorialCompleted: true };
            syncCloudSave(updated);
            return updated;
          });
          handleReturnHub();
        }}
        onSelectWeapon={(id) => {
          engineRef.current?.setWeapon(id);
          setProfile((prev) => ({ ...prev, equippedWeaponId: id }));
        }}
      />
    </div>
  );
}
