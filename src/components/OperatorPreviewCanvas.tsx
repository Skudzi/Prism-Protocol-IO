import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { buildAvatarRig, disposeAvatarRig, AnimatedAvatarRig } from '../engine/models';
import { createContactShadowTexture } from '../engine/textures';
import { getOperatorWeaponBodyStyle } from '../game/rules';
import { AvatarSkinDef, LanguageCode, WeaponId } from '../game/types';
import { t } from '../i18n/translations';

interface OperatorPreviewCanvasProps {
  weaponId: WeaponId;
  avatarSkin: AvatarSkinDef;
  lang?: LanguageCode;
}

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

const BODY_LABELS: Record<WeaponId, { title: string; subtitle: string }> = {
  pulse_carbine: {
    title: 'Assault Commando',
    subtitle: 'Heavy Pauldrons · Chest Mag Rig · Comms Mast',
  },
  volt_scatter: {
    title: 'Shotgun Breacher',
    subtitle: 'Light-Tinted Skin Vest · Satin-Gloss Armor',
  },
  helios_rail: {
    title: 'Sniper Marksman',
    subtitle: 'Wide-Brim Hat · Black Feather · Recon Mantle',
  },
  arc_repeater: {
    title: 'SMG Striker (Woman)',
    subtitle: 'Feminine Athletic Frame · Flowing Ponytail',
  },
};

export const OperatorPreviewCanvas: React.FC<OperatorPreviewCanvasProps> = ({
  weaponId,
  avatarSkin,
  lang = 'en',
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const stateRef = useRef({
    yaw: 0.42,
    dragging: false,
    lastX: 0,
    requestRender: () => {},
    rebuild: (_w: WeaponId, _s: AvatarSkinDef) => {},
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
    renderer.toneMappingExposure = 1.15;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));

    const w = container.clientWidth || 280;
    const h = container.clientHeight || 260;
    renderer.setSize(w, h);
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, w / h, 0.1, 30);
    camera.position.set(0, 1.32, 3.65);
    camera.lookAt(0, 1.05, 0);

    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    pmrem.dispose();

    const hemi = new THREE.HemisphereLight(0xe2e8f0, 0x1e293b, 0.9);
    const key = new THREE.DirectionalLight(0xfff4e0, 1.9);
    key.position.set(2.8, 4.4, 3.2);
    const rim = new THREE.DirectionalLight(0x38bdf8, 0.75);
    rim.position.set(-2.5, 2.5, -2.5);
    scene.add(hemi, key, rim);

    const pedestalMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.65,
      roughness: 0.35,
    });
    const pedestalRingMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.65,
    });
    const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.85, 0.08, 28), pedestalMat);
    pedestal.position.y = -0.04;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.76, 0.018, 8, 36), pedestalRingMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.005;
    scene.add(pedestal, ring);

    const shadowTex = createContactShadowTexture();
    const holder = new THREE.Group();
    scene.add(holder);

    let currentRig: AnimatedAvatarRig | null = null;
    let disposed = false;
    let frameId = 0;

    const requestRender = () => {
      if (disposed) return;
      cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(() => {
        if (disposed) return;
        holder.rotation.y = stateRef.current.yaw;
        renderer.render(scene, camera);
      });
    };

    const rebuild = (nextWeapon: WeaponId, nextSkin: AvatarSkinDef) => {
      if (currentRig) {
        holder.remove(currentRig.group);
        disposeAvatarRig(currentRig);
      }
      currentRig = buildAvatarRig(
        nextSkin,
        nextSkin.trimColor,
        shadowTex,
        'enemy',
        undefined,
        nextWeapon,
        0
      );
      holder.add(currentRig.group);
      requestRender();
    };

    stateRef.current.requestRender = requestRender;
    stateRef.current.rebuild = rebuild;
    rebuild(weaponId, avatarSkin);

    const onResize = () => {
      if (disposed || !container) return;
      const nw = container.clientWidth || 280;
      const nh = container.clientHeight || 260;
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
      if (currentRig) disposeAvatarRig(currentRig);
      pedestal.geometry.dispose();
      pedestalMat.dispose();
      ring.geometry.dispose();
      pedestalRingMat.dispose();
      shadowTex.dispose();
      envTex.dispose();
      renderer.dispose();
      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  useEffect(() => {
    stateRef.current.rebuild(weaponId, avatarSkin);
  }, [weaponId, avatarSkin]);

  const bodyStyle = getOperatorWeaponBodyStyle(weaponId, avatarSkin);
  const label = BODY_LABELS[weaponId];

  return (
    <div className="flex flex-col rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-900/90 p-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-cyan-400">
            {label.title}
          </div>
          <div className="text-[11px] text-slate-400">{label.subtitle}</div>
        </div>
        <button
          type="button"
          data-testid="operator-turn-btn"
          onClick={() => {
            stateRef.current.yaw += Math.PI * 0.5;
            stateRef.current.requestRender();
          }}
          className="rounded border border-slate-700 bg-slate-800 px-2.5 py-1 text-[11px] font-medium text-slate-200 hover:bg-slate-700 cursor-pointer"
        >
          {t(lang, 'cta.turn')}
        </button>
      </div>

      <div
        ref={mountRef}
        data-testid="operator-3d-preview"
        style={{ touchAction: 'none' }}
        onPointerDown={(e) => {
          stateRef.current.dragging = true;
          stateRef.current.lastX = e.clientX;
          e.currentTarget.setPointerCapture?.(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!stateRef.current.dragging) return;
          const dx = e.clientX - stateRef.current.lastX;
          stateRef.current.lastX = e.clientX;
          stateRef.current.yaw += dx * 0.012;
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
        onPointerLeave={() => {
          if (!stateRef.current.dragging) return;
        }}
        className="mt-2 h-56 w-full cursor-grab active:cursor-grabbing rounded-md bg-gradient-to-b from-slate-800/70 to-slate-950/90 select-none"
      />

      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
        <span>Skin: {avatarSkin.name}</span>
        {bodyStyle.hasBreacherVest && (
          <span className="flex items-center gap-1.5">
            <span>Vest Tint:</span>
            <span
              className="inline-block h-3 w-3 rounded-sm border border-white/30"
              style={{ backgroundColor: bodyStyle.vestColorHex }}
            />
          </span>
        )}
      </div>
    </div>
  );
};
