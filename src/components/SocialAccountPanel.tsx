import React, { useEffect, useState } from 'react';
import { Cloud, Crosshair, Mail, RefreshCw, Send, Trash2, UserPlus, Users } from 'lucide-react';
import { WEAPON_LIST } from '../game/catalog';
import { calculateWeaponAccuracy, normalizeWeaponStats } from '../game/rules';
import {
  ChatMessage,
  FriendEntry,
  LanguageCode,
  PartyInvite,
  PlatformType,
  PlayerCloudProfile,
} from '../game/types';
import { t } from '../i18n/translations';

interface SocialPanelProps {
  friends: FriendEntry[];
  invites: PartyInvite[];
  chatMessages: ChatMessage[];
  lang: LanguageCode;
  onAddFriend: (nickname: string) => Promise<{ ok: boolean; error?: string }>;
  onRemoveFriend: (nickname: string) => Promise<{ ok: boolean; error?: string }>;
  onInviteFriend: (nickname: string) => void;
  onJoinInvite: (invite: PartyInvite) => void;
  onSendChat: (text: string, channel: 'global' | 'party') => void;
}

export const SocialPanel: React.FC<SocialPanelProps> = ({
  friends,
  invites,
  chatMessages,
  lang,
  onAddFriend,
  onRemoveFriend,
  onInviteFriend,
  onJoinInvite,
  onSendChat,
}) => {
  const [friendNick, setFriendNick] = useState('');
  const [friendMsg, setFriendMsg] = useState<string | null>(null);
  const [chatText, setChatText] = useState('');
  const [channel, setChannel] = useState<'global' | 'party'>('global');

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!friendNick.trim()) return;
    const res = await onAddFriend(friendNick.trim());
    if (res.ok) {
      setFriendNick('');
      setFriendMsg('Friend added');
    } else {
      setFriendMsg(res.error ?? 'Could not add friend');
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatText.trim()) return;
    onSendChat(chatText.trim(), channel);
    setChatText('');
  };

  const statusLabel = (s: FriendEntry['status']) => {
    if (s === 'in_match') return t(lang, 'social.inMatch');
    if (s === 'lobby') return t(lang, 'social.lobby');
    if (s === 'online') return t(lang, 'social.online');
    return t(lang, 'social.offline');
  };

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      {/* Friends & Invites */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
            <Users className="h-4 w-4 text-cyan-500" />
            {t(lang, 'social.friends')}
          </h3>
        </div>

        <form onSubmit={handleAdd} className="flex gap-2">
          <input
            type="text"
            value={friendNick}
            onChange={(e) => setFriendNick(e.target.value)}
            placeholder={t(lang, 'social.addFriend')}
            aria-label={t(lang, 'social.addFriend')}
            className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-sm text-slate-900 dark:text-white focus:border-cyan-500 focus:outline-none"
          />
          <button
            type="submit"
            aria-label="Add friend"
            className="flex items-center gap-1.5 rounded-lg bg-cyan-500 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-cyan-400 cursor-pointer"
          >
            <UserPlus className="h-3.5 w-3.5" />
            Add
          </button>
        </form>
        {friendMsg && (
          <p className="text-xs text-slate-600 dark:text-slate-400">{friendMsg}</p>
        )}

        {invites.length > 0 && (
          <div className="space-y-2">
            {invites.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center justify-between rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3 py-2 text-xs"
              >
                <div className="flex items-center gap-2 text-slate-800 dark:text-slate-100">
                  <Mail className="h-3.5 w-3.5 text-cyan-500" />
                  <span>
                    {inv.fromNickname} ({inv.fromPlatform}) invited you · Room {inv.roomCode}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onJoinInvite(inv)}
                  className="rounded bg-cyan-500 px-2.5 py-1 font-semibold text-slate-950 hover:bg-cyan-400 cursor-pointer"
                >
                  {t(lang, 'social.join')}
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-2" data-testid="friends-list">
          {friends.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 px-4 py-5 text-center text-xs text-slate-600 dark:text-slate-400">
              {t(lang, 'social.noFriends')}
            </div>
          ) : (
            friends.map((f) => (
              <div
                key={f.nickname}
                className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/70 px-3 py-2.5"
              >
                <div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">
                    {f.nickname}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {f.platform} · {statusLabel(f.status)}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onInviteFriend(f.nickname)}
                    className="rounded bg-slate-200 dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-100 hover:bg-cyan-500 hover:text-slate-950 transition-colors cursor-pointer"
                  >
                    {t(lang, 'social.invite')}
                  </button>
                  <button
                    type="button"
                    aria-label={`Remove ${f.nickname}`}
                    onClick={async () => {
                      const res = await onRemoveFriend(f.nickname);
                      if (!res.ok) {
                        setFriendMsg(res.error ?? 'Could not remove friend');
                      } else {
                        setFriendMsg(null);
                      }
                    }}
                    className="flex h-7 w-7 items-center justify-center rounded border border-slate-300 dark:border-slate-700 text-slate-500 hover:border-rose-500/60 hover:bg-rose-500/10 hover:text-rose-500 transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Real-Time Messaging */}
      <div className="flex flex-col rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/70 p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            {t(lang, 'social.chat')}
          </h3>
          <div className="flex gap-1 rounded-md bg-slate-200 dark:bg-slate-800 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setChannel('global')}
              className={`rounded px-2.5 py-1 font-medium cursor-pointer ${
                channel === 'global'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Global
            </button>
            <button
              type="button"
              onClick={() => setChannel('party')}
              className={`rounded px-2.5 py-1 font-medium cursor-pointer ${
                channel === 'party'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Party
            </button>
          </div>
        </div>

        <div className="mt-3 h-56 flex-1 space-y-2 overflow-y-auto rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/70 p-3 text-xs">
          {chatMessages
            .filter((m) => m.channel === channel || m.channel === 'match')
            .map((m) => (
              <div key={m.id} className="leading-relaxed">
                <span className="font-semibold text-cyan-600 dark:text-cyan-400">
                  {m.sender}
                </span>
                <span className="text-slate-400"> · {m.platform}: </span>
                <span className="text-slate-800 dark:text-slate-200">{m.text}</span>
              </div>
            ))}
        </div>

        <form onSubmit={handleSend} className="mt-3 flex gap-2">
          <input
            type="text"
            value={chatText}
            onChange={(e) => setChatText(e.target.value)}
            placeholder="Message squad..."
            aria-label="Chat message"
            className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-cyan-500 focus:outline-none"
          />
          <button
            type="submit"
            className="flex items-center gap-1.5 rounded-lg bg-cyan-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-cyan-400 cursor-pointer"
          >
            <Send className="h-3.5 w-3.5" />
            {t(lang, 'social.send')}
          </button>
        </form>
      </div>
    </div>
  );
};

interface AccountPanelProps {
  profile: PlayerCloudProfile;
  isAuthenticated: boolean;
  isGoogleSynced?: boolean;
  cloudEmail?: string | null;
  cloudError?: string | null;
  authReady: boolean;
  lang: LanguageCode;
  syncStatus: string;
  onGoogleSignIn?: () => Promise<{ ok: boolean; error?: string }>;
  onLogin: (
    username: string,
    password: string,
    platform: PlatformType
  ) => Promise<{ ok: boolean; error?: string }>;
  onRegister: (
    username: string,
    password: string,
    platform: PlatformType
  ) => Promise<{ ok: boolean; error?: string }>;
  onUpdatePlatform: (platform: PlatformType) => Promise<{ ok: boolean; error?: string }>;
  onLogout: () => Promise<void>;
  onSyncNow: () => void;
}

export const AccountPanel: React.FC<AccountPanelProps> = ({
  profile,
  isAuthenticated,
  isGoogleSynced = false,
  cloudEmail = null,
  cloudError = null,
  authReady,
  lang,
  syncStatus,
  onGoogleSignIn,
  onLogin,
  onRegister,
  onUpdatePlatform,
  onLogout,
  onSyncNow,
}) => {
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [platform, setPlatform] = useState<PlatformType>(profile.platform);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setPlatform(profile.platform);
  }, [profile.platform]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setStatusMsg(null);
    setBusy(true);
    const res =
      authMode === 'login'
        ? await onLogin(username.trim(), password, platform)
        : await onRegister(username.trim(), password, platform);
    setBusy(false);
    if (!res.ok) {
      setErrorMsg(res.error ?? 'Authentication failed');
    } else {
      setPassword('');
      setStatusMsg(t(lang, 'account.synced'));
    }
  };

  const handleGoogleClick = async () => {
    if (!onGoogleSignIn) return;
    setErrorMsg(null);
    setStatusMsg(null);
    setBusy(true);
    const res = await onGoogleSignIn();
    setBusy(false);
    if (!res.ok && res.error) {
      setErrorMsg(res.error);
    } else if (res.ok) {
      setStatusMsg(t(lang, 'account.synced'));
    }
  };

  const handleSavePlatform = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setStatusMsg(null);
    setBusy(true);
    const res = await onUpdatePlatform(platform);
    setBusy(false);
    if (!res.ok) {
      setErrorMsg(res.error ?? 'Could not sync platform');
    } else {
      setStatusMsg(t(lang, 'account.synced'));
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/70 p-5">
        <div className="flex items-center gap-2">
          <Cloud className="h-5 w-5 text-cyan-500" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            {t(lang, 'account.title')}
          </h3>
        </div>

        <div className="mt-4 space-y-2 text-sm text-slate-700 dark:text-slate-300">
          <div>
            <span className="text-slate-500 dark:text-slate-400">{t(lang, 'account.nickname')}: </span>
            <span className="font-semibold text-slate-900 dark:text-white">{profile.nickname}</span>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400">{t(lang, 'account.platform')}: </span>
            <span className="font-semibold">{profile.platform}</span>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400">K/D · Matches: </span>
            <span className="font-mono">
              {profile.stats.tags}/{profile.stats.deaths} · {profile.stats.matchesPlayed}
            </span>
          </div>
          <div className="text-xs text-cyan-600 dark:text-cyan-400" data-testid="cloud-sync-status">
            {syncStatus} · {new Date(profile.lastSyncedAt).toLocaleTimeString()}
          </div>
        </div>

        {/* Per-Weapon Kills & Accuracy Breakdown */}
        <div
          className="mt-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/60 p-3"
          data-testid="account-weapon-stats"
        >
          <div className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            <Crosshair className="h-3.5 w-3.5 text-cyan-500" />
            <span>{t(lang, 'account.weaponStats')}</span>
          </div>
          <div className="divide-y divide-slate-200/80 dark:divide-slate-800/80">
            {(() => {
              const weaponStats = normalizeWeaponStats(profile.stats.weaponStats);
              return WEAPON_LIST.map((w) => {
                const entry = weaponStats[w.id];
                const acc = calculateWeaponAccuracy(entry);
                return (
                  <div
                    key={w.id}
                    data-testid={`weapon-stat-${w.id}`}
                    className="flex items-center justify-between gap-2 py-2 text-xs first:pt-1 last:pb-0"
                  >
                    <div className="min-w-0">
                      <div className="truncate font-semibold text-slate-900 dark:text-white">
                        {t(lang, `weapon.${w.id}.name` as Parameters<typeof t>[1])}
                      </div>
                      <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                        {t(lang, 'account.hitsShots')}: {entry.shotsHit} / {entry.shotsFired}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-4 text-right font-mono">
                      <div>
                        <div className="text-[10px] uppercase text-slate-500 dark:text-slate-400">
                          {t(lang, 'account.kills')}
                        </div>
                        <div className="font-bold text-slate-900 dark:text-white">
                          {entry.kills}
                        </div>
                      </div>
                      <div className="w-14">
                        <div className="text-[10px] uppercase text-slate-500 dark:text-slate-400">
                          {t(lang, 'account.accuracy')}
                        </div>
                        <div className="font-bold text-cyan-600 dark:text-cyan-400">
                          {acc === null ? '--' : `${acc}%`}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            data-testid="sync-now-btn"
            onClick={onSyncNow}
            disabled={!isAuthenticated || busy}
            className="flex items-center gap-1.5 rounded-lg bg-cyan-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            {t(lang, 'cta.syncNow')}
          </button>
          {isAuthenticated && (
            <button
              type="button"
              data-testid="logout-btn"
              onClick={() => void onLogout()}
              className="rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
            >
              {t(lang, 'account.logout')}
            </button>
          )}
        </div>
      </div>

      {!isAuthenticated ? (
        <div className="flex flex-col justify-between rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/70 p-5 space-y-4">
          {onGoogleSignIn && (
            <div className="space-y-2 border-b border-slate-200 dark:border-slate-800 pb-4">
              <button
                type="button"
                data-testid="google-signin-btn"
                disabled={!authReady || busy}
                onClick={() => void handleGoogleClick()}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-2.5 text-sm font-semibold text-slate-900 dark:text-white hover:border-cyan-500 hover:bg-slate-100 dark:hover:bg-slate-900 disabled:opacity-50 transition-colors cursor-pointer"
              >
                <Cloud className="h-4 w-4 text-cyan-500" />
                {t(lang, 'account.googleSignIn')}
              </button>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                1-click Firestore Cloud Save across all devices, or use Username &amp; Password below.
              </p>
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="flex flex-1 flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-bold text-slate-900 dark:text-white">
                  {authMode === 'login' ? t(lang, 'account.login') : t(lang, 'account.register')}
                </div>
                <div className="flex gap-1 rounded-md bg-slate-200 dark:bg-slate-800 p-0.5 text-xs">
                  <button
                    type="button"
                    data-testid="auth-tab-login"
                    onClick={() => {
                      setAuthMode('login');
                      setErrorMsg(null);
                    }}
                    className={`rounded px-2.5 py-1 font-medium cursor-pointer ${
                      authMode === 'login'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {t(lang, 'account.login')}
                  </button>
                  <button
                    type="button"
                    data-testid="auth-tab-register"
                    onClick={() => {
                      setAuthMode('register');
                      setErrorMsg(null);
                    }}
                    className={`rounded px-2.5 py-1 font-medium cursor-pointer ${
                      authMode === 'register'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {t(lang, 'account.login') === 'Sign In' ? 'Register' : t(lang, 'account.register').split(' ')[0]}
                  </button>
                </div>
              </div>

              <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                {t(lang, 'account.guest')}
              </p>

              <div>
                <label
                  htmlFor="acc-username"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  Username
                </label>
                <input
                  id="acc-username"
                  data-testid="account-username-input"
                  type="text"
                  required
                  minLength={3}
                  maxLength={20}
                  pattern="[a-zA-Z0-9_\-]{3,20}"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. PrismPlayer1"
                  className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="acc-password"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  {t(lang, 'account.password')}
                </label>
                <input
                  id="acc-password"
                  data-testid="account-password-input"
                  type="password"
                  required
                  minLength={4}
                  maxLength={72}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 4 characters"
                  className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="acc-platform-auth"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  {t(lang, 'account.platform')}
                </label>
                <select
                  id="acc-platform-auth"
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value as PlatformType)}
                  className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-cyan-500 focus:outline-none"
                >
                  <option value="Web">Web</option>
                  <option value="PC">PC</option>
                  <option value="Console">Console</option>
                  <option value="Mobile">Mobile</option>
                </select>
              </div>

              {(errorMsg || cloudError) && (
                <p className="rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-medium text-rose-500">
                  {errorMsg ?? cloudError}
                </p>
              )}
            </div>

            <button
              type="submit"
              data-testid="account-submit-btn"
              disabled={!authReady || busy}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-50 cursor-pointer"
            >
              <Cloud className="h-4 w-4" />
              {busy
                ? 'Connecting...'
                : authMode === 'login'
                  ? t(lang, 'account.login')
                  : t(lang, 'account.register')}
            </button>
          </form>
        </div>
      ) : (
        <form
          onSubmit={handleSavePlatform}
          className="flex flex-col justify-between rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-5 space-y-4"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                {t(lang, 'account.synced')}
              </div>
              {isGoogleSynced && (
                <span className="rounded bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-300">
                  Firestore Cloud
                </span>
              )}
            </div>
            {cloudEmail && (
              <div className="text-xs font-mono text-slate-600 dark:text-slate-300">
                {cloudEmail}
              </div>
            )}
            <p className="text-xs text-slate-600 dark:text-slate-400">
              All credits, XP, weapon &amp; avatar skins, Battle Pass tiers, weapon stats, and settings are saved locally on this device and synced to the cloud.
            </p>

            {!isGoogleSynced && onGoogleSignIn && (
              <button
                type="button"
                data-testid="google-signin-btn"
                disabled={!authReady || busy}
                onClick={() => void handleGoogleClick()}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-cyan-500/40 bg-white dark:bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-900 disabled:opacity-50 cursor-pointer"
              >
                <Cloud className="h-3.5 w-3.5 text-cyan-500" />
                {t(lang, 'account.googleSignIn')}
              </button>
            )}

            <div>
              <label
                htmlFor="acc-platform"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                {t(lang, 'account.platform')}
              </label>
              <select
                id="acc-platform"
                value={platform}
                onChange={(e) => setPlatform(e.target.value as PlatformType)}
                className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-cyan-500 focus:outline-none"
              >
                <option value="Web">Web</option>
                <option value="PC">PC</option>
                <option value="Console">Console</option>
                <option value="Mobile">Mobile</option>
              </select>
            </div>

            {(errorMsg || cloudError) && (
              <p className="text-xs font-medium text-rose-500">{errorMsg ?? cloudError}</p>
            )}
            {statusMsg && <p className="text-xs font-medium text-emerald-500">{statusMsg}</p>}
          </div>

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-cyan-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-50 cursor-pointer"
          >
            {t(lang, 'account.saveIdentity')}
          </button>
        </form>
      )}
    </div>
  );
};
