import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { Eye, Lock, RotateCw } from 'lucide-react';
import { buildWeaponViewModel, disposeObject3D } from '../engine/models';
import { AVATAR_SKINS, RARITY_META, WEAPON_LIST } from '../game/catalog';
import { AvatarSkinDef, LanguageCode, WeaponId, WeaponSkinDef } from '../game/types';
import { t } from '../i18n/translations';

interface WeaponSkinPreviewCanvasProps {
  weaponId: WeaponId;
  skin: WeaponSkinDef;
  avatarSkin?: AvatarSkinDef;
  unlocked: boolean;
  equippedOnSlot: boolean;
  lang?: LanguageCode;
  onChangeWeapon: (id: WeaponId) => void;
  onEquipOrUnlock: (skin: WeaponSkinDef, weaponId: WeaponId) => void;
}

const WEAPON_TAB_LABELS: Record<WeaponId, string> = {
  pulse_carbine: 'AR',
  volt_scatter: 'Shotgun',
  helios_rail: 'Sniper',
  arc_repeater: 'SMG',
};

function detectSoftwareGl(): boolean {
  if (typeof document === 'undefined') return true;
  const gl = document.createElement('canvas').getContext('webgl2');
  if (!gl) return true;
  const ext = gl.getExtension('WEBGL_debug_renderer_info');
  const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
  const gpu = String(gl.getParameter(param));
  gl.getExtension('WEBGL_lose_context')?.loseContext();
  return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
}

export const WeaponSkinPreviewCanvas: React.FC<WeaponSkinPreviewCanvasProps> = ({
  weaponId,
  skin,
  avatarSkin,
  unlocked,
  equippedOnSlot,
  lang = 'en',
  onChangeWeapon,
  onEquipOrUnlock,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const stateRef = useRef({
    yaw: 0.45,
    pitch: 0.12,
    dragging: false,
    lastX: 0,
    lastY: 0,
    requestRender: () => {},
    rebuild: (_w: WeaponId, _s: WeaponSkinDef, _a: AvatarSkinDef) => {},
  });

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = detectSoftwareGl();
    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));

    const w = container.clientWidth || 360;
    const h = container.clientHeight || 220;
    renderer.setSize(w, h);
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, w / h, 0.05, 25);
    camera.position.set(1.05, 0.28, 0.68);
    camera.lookAt(0, 0, 0);

    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    pmrem.dispose();

    const hemi = new THREE.HemisphereLight(0xe2e8f0, 0x0f172a, 0.95);
    const key = new THREE.DirectionalLight(0xfff4e0, 2.0);
    key.position.set(2.8, 3.6, 2.8);
    const rim = new THREE.DirectionalLight(0x38bdf8, 0.85);
    rim.position.set(-2.4, 2.0, -2.4);
    scene.add(hemi, key, rim);

    const holder = new THREE.Group();
    scene.add(holder);

    let currentModel: THREE.Group | null = null;
    let disposed = false;
    let frameId = 0;

    const requestRender = () => {
      if (disposed) return;
      cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(() => {
        if (disposed) return;
        holder.rotation.y = stateRef.current.yaw;
        holder.rotation.x = stateRef.current.pitch;
        renderer.render(scene, camera);
      });
    };

    const rebuild = (nextWeapon: WeaponId, nextSkin: WeaponSkinDef, nextAvatar: AvatarSkinDef) => {
      if (currentModel) {
        holder.remove(currentModel);
        disposeObject3D(currentModel);
        currentModel = null;
      }

      const rawWeapon = buildWeaponViewModel(nextWeapon, nextSkin, nextAvatar, {
        disableClearcoat: isSoftwareGl,
        weaponOnly: true,
      });

      const box = new THREE.Box3().setFromObject(rawWeapon);
      const size = new THREE.Vector3();
      const center = new THREE.Vector3();
      box.getSize(size);
      box.getCenter(center);

      const maxDim = Math.max(size.x, size.y, size.z, 0.25);
      const fitScale = 0.82 / maxDim;
      rawWeapon.position.sub(center);

      const centeredWrapper = new THREE.Group();
      centeredWrapper.add(rawWeapon);
      centeredWrapper.scale.setScalar(fitScale);

      currentModel = centeredWrapper;
      holder.add(currentModel);
      requestRender();
    };

    stateRef.current.requestRender = requestRender;
    stateRef.current.rebuild = rebuild;
    rebuild(weaponId, skin, avatarSkin ?? AVATAR_SKINS[0]);

    const onResize = () => {
      if (disposed || !container) return;
      const nw = container.clientWidth || 360;
      const nh = container.clientHeight || 220;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
      requestRender();
    };
    window.addEventListener('resize', onResize);

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', onResize);
      if (currentModel) {
        disposeObject3D(currentModel);
        currentModel = null;
      }
      envTex.dispose();
      renderer.dispose();
      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  useEffect(() => {
    stateRef.current.rebuild(weaponId, skin, avatarSkin ?? AVATAR_SKINS[0]);
  }, [weaponId, skin, avatarSkin]);

  const meta = RARITY_META[skin.rarity];

  return (
    <div
      data-testid="weapon-skin-inspector"
      className="flex flex-col rounded-lg border border-slate-800 bg-slate-900/95 p-3.5 text-slate-100"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            <Eye className="h-3.5 w-3.5 text-cyan-400" />
            <span>{t(lang, 'armory.inspectTitle')}</span>
          </div>
          <div className="mt-0.5 flex flex-wrap items-baseline gap-2">
            <span
              data-testid="inspect-skin-name"
              className="text-base font-bold"
              style={{ color: meta.colorHex }}
            >
              {skin.name}
            </span>
            <span
              data-testid="inspect-skin-rarity"
              className="text-xs font-bold uppercase tracking-wider"
              style={{ color: meta.colorHex }}
            >
              {meta.label}
            </span>
          </div>
        </div>

        <button
          type="button"
          data-testid="weapon-inspect-turn-btn"
          onClick={() => {
            stateRef.current.yaw += Math.PI * 0.5;
            stateRef.current.requestRender();
          }}
          className="inline-flex items-center gap-1 rounded border border-slate-700 bg-slate-800 px-2.5 py-1 text-[11px] font-medium text-slate-200 hover:bg-slate-700 cursor-pointer"
        >
          <RotateCw className="h-3 w-3" />
          <span>{t(lang, 'cta.turn')}</span>
        </button>
      </div>

      {/* Weapon Selector inside Inspector */}
      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        {WEAPON_LIST.map((w) => {
          const active = weaponId === w.id;
          const isSignature = skin.signatureWeapon === w.id;
          return (
            <button
              key={w.id}
              type="button"
              data-testid={`inspect-weapon-${w.id}`}
              onClick={() => onChangeWeapon(w.id)}
              className={`rounded px-2.5 py-1 text-[11px] font-semibold cursor-pointer transition-colors ${
                active
                  ? 'bg-cyan-500 text-slate-950'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {WEAPON_TAB_LABELS[w.id]}
              {isSignature ? ' ★' : ''}
            </button>
          );
        })}
      </div>

      <div
        ref={mountRef}
        data-testid="weapon-skin-3d-preview"
        style={{ touchAction: 'none' }}
        onPointerDown={(e) => {
          stateRef.current.dragging = true;
          stateRef.current.lastX = e.clientX;
          stateRef.current.lastY = e.clientY;
          e.currentTarget.setPointerCapture?.(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!stateRef.current.dragging) return;
          const dx = e.clientX - stateRef.current.lastX;
          const dy = e.clientY - stateRef.current.lastY;
          stateRef.current.lastX = e.clientX;
          stateRef.current.lastY = e.clientY;
          stateRef.current.yaw += dx * 0.012;
          stateRef.current.pitch = THREE.MathUtils.clamp(
            stateRef.current.pitch + dy * 0.009,
            -0.55,
            0.55
          );
          stateRef.current.requestRender();
        }}
        onPointerUp={(e) => {
          stateRef.current.dragging = false;
          if (e.currentTarget.hasPointerCapture?.(e.pointerId)) {
            e.currentTarget.releasePointerCapture(e.pointerId);
          }
        }}
        onPointerCancel={() => {
          stateRef.current.dragging = false;
        }}
        className="mt-2.5 h-52 w-full cursor-grab active:cursor-grabbing rounded-md bg-gradient-to-b from-slate-800/80 to-slate-950/95 select-none"
      />

      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="text-slate-400">
          {t(lang, 'armory.signatureSlot')}: {WEAPON_TAB_LABELS[skin.signatureWeapon]}
        </span>
        <button
          type="button"
          data-testid="weapon-inspect-equip-btn"
          disabled={!unlocked && skin.unlockSource !== 'store'}
          onClick={() => onEquipOrUnlock(skin, weaponId)}
          className={`inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-bold cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed ${
            equippedOnSlot
              ? 'bg-cyan-500 text-slate-950'
              : unlocked
              ? 'bg-slate-800 text-slate-100 hover:bg-slate-700 border border-slate-700'
              : 'bg-amber-500 text-slate-950 hover:bg-amber-400'
          }`}
        >
          {equippedOnSlot ? (
            `${t(lang, 'cta.equipped')} · ${WEAPON_TAB_LABELS[weaponId]}`
          ) : unlocked ? (
            `${t(lang, 'cta.equip')} · ${WEAPON_TAB_LABELS[weaponId]}`
          ) : skin.unlockSource === 'store' ? (
            `${t(lang, 'cta.unlock')} · ${skin.price} CR`
          ) : (
            <>
              <Lock className="h-3.5 w-3.5" />
              <span>
                {skin.unlockSource === 'easter_egg'
                  ? 'Easter Egg'
                  : skin.unlockSource === 'battlepass'
                  ? 'Battle Pass'
                  : 'Supply Chest'}
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
