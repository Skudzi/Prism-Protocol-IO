import React from 'react';
import { MAPS } from '../game/catalog';
import { LanguageCode, MinimapSnapshot } from '../game/types';
import { t } from '../i18n/translations';

interface MinimapProps {
  data: MinimapSnapshot;
  lang: LanguageCode;
}

export const Minimap: React.FC<MinimapProps> = ({ data, lang }) => {
  const map = MAPS[data.mapId];
  const half = Math.max(20, data.arenaHalfSize || map.arenaHalfSize);
  const size = 140;
  const pad = 8;
  const inner = size - pad * 2;

  const toSvg = (val: number) => pad + ((val + half) / (half * 2)) * inner;
  const toLen = (len: number) => (len / (half * 2)) * inner;

  const px = toSvg(data.player.x);
  const pz = toSvg(data.player.z);
  const rotDeg = (-data.player.yaw * 180) / Math.PI;

  return (
    <div
      data-testid="tactical-minimap"
      className="fixed left-4 top-4 rounded-lg border border-white/15 bg-[#070B12]/85 p-2 shadow-lg"
    >
      <div className="mb-1 flex items-center justify-between px-0.5 text-[9px] font-bold tracking-widest text-slate-400">
        <span>{t(lang, 'hud.minimap')}</span>
        <span className="font-mono text-cyan-400">
          {Math.round(data.player.x)},{Math.round(data.player.z)}
        </span>
      </div>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="block rounded border border-white/10 bg-[#0d1522]"
        aria-label="Tactical Minimap"
      >
        {/* Optional cross-roads or trampled dirt footpaths */}
        {map.hasRoads && (
          <g opacity={0.35}>
            <rect
              x={toSvg(-3.4)}
              y={pad}
              width={toLen(6.8)}
              height={inner}
              fill="#475569"
            />
            <rect
              x={pad}
              y={toSvg(-3.4)}
              width={inner}
              height={toLen(6.8)}
              fill="#475569"
            />
          </g>
        )}
        {map.floorStyle === 'trampled_earth' && (
          <g opacity={0.45}>
            <rect
              x={toSvg(-4)}
              y={toSvg(-half + 6)}
              width={toLen(8)}
              height={toLen(half * 2 - 12)}
              fill="#7c5c3e"
              rx={2}
            />
            <rect
              x={toSvg(-half + 14)}
              y={toSvg(-3.5)}
              width={toLen(half * 2 - 28)}
              height={toLen(7)}
              fill="#7c5c3e"
              rx={2}
            />
          </g>
        )}

        {map.floorStyle === 'sandyard' && (
          <rect
            x={pad}
            y={pad}
            width={inner}
            height={inner}
            fill="#a17d52"
            opacity={0.2}
          />
        )}

        {/* Arena perimeter border */}
        <rect
          x={pad}
          y={pad}
          width={inner}
          height={inner}
          fill="none"
          stroke={map.accentColor}
          strokeOpacity={0.45}
          strokeWidth={1}
        />

        {/* Static map obstacles */}
        {map.obstacles.map((obs, idx) => {
          const rx = toSvg(obs.x - obs.w * 0.5);
          const rz = toSvg(obs.z - obs.d * 0.5);
          const rw = Math.max(1.5, toLen(obs.w));
          const rd = Math.max(1.5, toLen(obs.d));
          const fill =
            obs.kind === 'wood_crate'
              ? '#9a673a'
              : obs.kind === 'concrete_wall'
              ? '#94a3b8'
              : obs.kind === 'sandstone_wall'
              ? '#c89d6c'
              : obs.kind === 'building_wall'
              ? '#64748b'
              : obs.kind === 'building_roof' || obs.kind === 'building_floor'
              ? '#475569'
              : obs.kind === 'metal_awning'
              ? '#64748b'
              : obs.kind === 'platform'
              ? '#78716c'
              : obs.kind === 'house'
              ? '#475569'
              : obs.kind === 'bridge'
              ? '#334155'
              : obs.kind === 'peek_wall'
              ? '#64748b'
              : '#3b4a5e';
          const isOverhead =
            obs.kind === 'building_roof' ||
            obs.kind === 'building_floor' ||
            obs.kind === 'metal_awning';
          const fillOpacity =
            obs.kind === 'building_roof' || obs.kind === 'building_floor'
              ? 0.22
              : obs.kind === 'metal_awning'
              ? 0.24
              : obs.kind === 'bridge'
              ? 0.65
              : 0.9;
          return (
            <rect
              key={`${obs.kind}-${idx}`}
              x={rx}
              y={rz}
              width={rw}
              height={rd}
              rx={0.8}
              fill={fill}
              fillOpacity={fillOpacity}
              stroke="#94a3b8"
              strokeOpacity={isOverhead ? 0.32 : 0.22}
              strokeWidth={0.5}
            />
          );
        })}

        {/* Jump Pads */}
        {map.jumpPads.map((padDef, idx) => (
          <circle
            key={`pad-${idx}`}
            cx={toSvg(padDef.x)}
            cy={toSvg(padDef.z)}
            r={2.6}
            fill="none"
            stroke="#22d3ee"
            strokeOpacity={0.75}
            strokeWidth={1.1}
          />
        ))}

        {/* Active Heal Orbs */}
        {data.healOrbs.map((orb, idx) =>
          orb.active ? (
            <polygon
              key={`orb-${idx}`}
              points={`${toSvg(orb.x)},${toSvg(orb.z) - 3.6} ${toSvg(orb.x) + 3.6},${toSvg(orb.z)} ${toSvg(orb.x)},${toSvg(orb.z) + 3.6} ${toSvg(orb.x) - 3.6},${toSvg(orb.z)}`}
              fill="#10b981"
              stroke="#d1fae5"
              strokeWidth={0.7}
            />
          ) : null
        )}

        {/* Remote Peers */}
        {data.peers.map((peer) =>
          peer.alive ? (
            <circle
              key={`peer-${peer.id}`}
              cx={toSvg(peer.x)}
              cy={toSvg(peer.z)}
              r={2.8}
              fill="#38bdf8"
              stroke="#0f172a"
              strokeWidth={0.8}
            />
          ) : null
        )}

        {/* Bots */}
        {data.bots.map((bot) =>
          bot.alive ? (
            <circle
              key={bot.id}
              cx={toSvg(bot.x)}
              cy={toSvg(bot.z)}
              r={2.7}
              fill={bot.team === 'cyan' ? '#3b82f6' : '#ef4444'}
              stroke="#0f172a"
              strokeWidth={0.8}
            />
          ) : null
        )}

        {/* Local Player View Cone & Directional Arrow */}
        <g transform={`translate(${px}, ${pz}) rotate(${rotDeg})`}>
          <polygon
            points="0,0 -11,-21 11,-21"
            fill="#22d3ee"
            fillOpacity={0.18}
          />
          <polygon
            points="0,-5.5 4.2,4.5 0,2.2 -4.2,4.5"
            fill="#ffffff"
            stroke="#06b6d4"
            strokeWidth={1.1}
          />
        </g>
      </svg>
    </div>
  );
};
