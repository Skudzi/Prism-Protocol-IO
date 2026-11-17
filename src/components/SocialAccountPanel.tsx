import React, { useState } from 'react';
import { Cloud, RefreshCw, Send, UserPlus, Users, Mail } from 'lucide-react';
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

        <div className="space-y-2">
          {friends.map((f) => (
            <div
              key={f.nickname}
              className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/70 px-3 py-2.5"
            >
              <div>
                <div className="text-sm font-semibold text-slate-900 dark:text-white">
                  {f.nickname}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {f.platform} · {statusLabel(f.status)}
                </div>
              </div>
              <button
                type="button"
                onClick={() => onInviteFriend(f.nickname)}
                className="rounded bg-slate-200 dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-100 hover:bg-cyan-500 hover:text-slate-950 transition-colors cursor-pointer"
              >
                {t(lang, 'social.invite')}
              </button>
            </div>
          ))}
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
  authToken: string | null;
  lang: LanguageCode;
  syncStatus: string;
  onLogin: (nickname: string, password: string, platform: PlatformType) => Promise<{ ok: boolean; error?: string }>;
  onRegister: (nickname: string, password: string, platform: PlatformType) => Promise<{ ok: boolean; error?: string }>;
  onLogout: () => void;
  onSyncNow: () => void;
}

export const AccountPanel: React.FC<AccountPanelProps> = ({
  profile,
  authToken,
  lang,
  syncStatus,
  onLogin,
  onRegister,
  onLogout,
  onSyncNow,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('register');
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [platform, setPlatform] = useState<PlatformType>(profile.platform);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setBusy(true);
    const res =
      mode === 'register'
        ? await onRegister(nickname.trim(), password, platform)
        : await onLogin(nickname.trim(), password, platform);
    setBusy(false);
    if (!res.ok) {
      setErrorMsg(res.error ?? 'Authentication failed');
    } else {
      setPassword('');
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
          <div className="text-xs text-cyan-600 dark:text-cyan-400">
            {syncStatus} · {new Date(profile.lastSyncedAt).toLocaleTimeString()}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onSyncNow}
            className="flex items-center gap-1.5 rounded-lg bg-cyan-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-cyan-400 cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            {t(lang, 'cta.syncNow')}
          </button>
          {authToken && (
            <button
              type="button"
              onClick={onLogout}
              className="rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
            >
              {t(lang, 'account.logout')}
            </button>
          )}
        </div>
      </div>

      {!authToken ? (
        <form
          onSubmit={handleSubmit}
          className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/70 p-5 space-y-4"
        >
          <div role="tablist" aria-label="Account mode" className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'register'}
              onClick={() => {
                setMode('register');
                setErrorMsg(null);
              }}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold cursor-pointer ${
                mode === 'register'
                  ? 'bg-cyan-500 text-slate-950'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              New Account
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'login'}
              onClick={() => {
                setMode('login');
                setErrorMsg(null);
              }}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold cursor-pointer ${
                mode === 'login'
                  ? 'bg-cyan-500 text-slate-950'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Existing Account
            </button>
          </div>

          <div>
            <label
              htmlFor="acc-nick"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              {t(lang, 'account.nickname')}
            </label>
            <input
              id="acc-nick"
              type="text"
              required
              minLength={3}
              maxLength={20}
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="e.g. Striker99"
              className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="acc-pass"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              {t(lang, 'account.password')}
            </label>
            <input
              id="acc-pass"
              type="password"
              required
              minLength={4}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••"
              className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-cyan-500 focus:outline-none"
            />
          </div>

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

          {errorMsg && <p className="text-xs font-medium text-rose-500">{errorMsg}</p>}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-50 cursor-pointer"
          >
            {mode === 'register' ? t(lang, 'account.register') : t(lang, 'account.login')}
          </button>
        </form>
      ) : (
        <div className="flex flex-col justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-5">
          <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
            {t(lang, 'account.synced')}
          </div>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
            All credits, weapon & avatar skins, Battle Pass tiers, keybinds, and Vault Easter Egg progress are synchronized across PC, Web, Console, and Mobile.
          </p>
        </div>
      )}
    </div>
  );
};
