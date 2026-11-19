import * as THREE from 'three';
import { AvatarSkinDef, MapObstacle, WeaponId, WeaponSkinDef } from '../game/types';
import {
  createArmorPBRTextures,
  createGripKnurlTextures,
  createWeaponPBRTextures,
  createWoodGrainPBRTextures,
} from './textures';

export interface AnimatedAvatarRig {
  group: THREE.Group;
  torso: THREE.Group;
  legL: THREE.Group;
  legR: THREE.Group;
  armL: THREE.Group;
  armR: THREE.Group;
  head: THREE.Group;
  outlineMat: THREE.MeshBasicMaterial;
  xrayMaskMat: THREE.MeshBasicMaterial | null;
  xrayOutlineMat: THREE.MeshBasicMaterial | null;
  nametagSprite: THREE.Sprite | null;
  nametagTexture: THREE.CanvasTexture | null;
}

export function createNametagSprite(
  nickname: string,
  relation: 'ally' | 'enemy'
): { sprite: THREE.Sprite; texture: THREE.CanvasTexture } {
  const canvas = document.createElement('canvas');
  canvas.width = 384;
  canvas.height = 96;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, 384, 96);

  // Badge background + border (blue for teammates, red for enemies)
  const borderColor = relation === 'ally' ? '#3b82f6' : '#ef4444';
  const dotColor = relation === 'ally' ? '#60a5fa' : '#f87171';

  ctx.fillStyle = 'rgba(7, 11, 18, 0.88)';
  ctx.beginPath();
  ctx.roundRect(10, 14, 364, 68, 14);
  ctx.fill();

  ctx.lineWidth = 5;
  ctx.strokeStyle = borderColor;
  ctx.stroke();

  // Relation dot
  ctx.fillStyle = dotColor;
  ctx.beginPath();
  ctx.arc(38, 48, 9, 0, Math.PI * 2);
  ctx.fill();

  // Player / bot nickname
  ctx.font = '800 36px system-ui, -apple-system, Segoe UI, sans-serif';
  ctx.fillStyle = '#f8fafc';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  const safeName = nickname.length > 14 ? `${nickname.slice(0, 13)}…` : nickname;
  ctx.fillText(safeName, 60, 49, 294);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;

  const mat = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: true,
    depthWrite: false,
    fog: false,
  });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(2.4, 0.6, 1);
  return { sprite, texture };
}

export function disposeAvatarRig(rig: AnimatedAvatarRig) {
  if (rig.nametagTexture) {
    rig.nametagTexture.dispose();
  }
  if (rig.nametagSprite) {
    (rig.nametagSprite.material as THREE.SpriteMaterial).dispose();
  }
  rig.outlineMat.dispose();
  rig.xrayMaskMat?.dispose();
  rig.xrayOutlineMat?.dispose();
}

export function buildWeaponViewModel(
  weaponId: WeaponId,
  skin: WeaponSkinDef,
  avatarSkin?: AvatarSkinDef
): THREE.Group {
  const group = new THREE.Group();
  const pbr = createWeaponPBRTextures(skin);
  const knurl = createGripKnurlTextures();
  const isClearcoat =
    skin.pattern === 'rainbow' ||
    skin.pattern === 'prism_holo' ||
    skin.pattern === 'gold_walnut' ||
    skin.pattern === 'hex_carbon';

  const bodyMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    map: pbr.map,
    bumpMap: pbr.bumpMap,
    bumpScale: skin.pattern === 'gold_walnut' ? 0.014 : 0.009,
    roughnessMap: pbr.roughnessMap,
    metalness: skin.metalness,
    roughness: skin.roughness,
    clearcoat: isClearcoat ? 0.88 : 0.28,
    clearcoatRoughness: skin.pattern === 'rainbow' || skin.pattern === 'prism_holo' ? 0.08 : 0.18,
    reflectivity: 0.92,
  });
  const trimMat = new THREE.MeshPhysicalMaterial({
    color: skin.secondaryColor,
    bumpMap: pbr.bumpMap,
    bumpScale: 0.006,
    metalness: Math.min(0.98, skin.metalness + 0.12),
    roughness: Math.max(0.12, skin.roughness - 0.08),
    clearcoat: isClearcoat ? 0.65 : 0.2,
    clearcoatRoughness: 0.15,
  });
  const coreMat = new THREE.MeshStandardMaterial({
    color: skin.emissiveColor,
    emissive: skin.emissiveColor,
    emissiveIntensity: 2.2,
    roughness: 0.12,
    metalness: 0.25,
  });

  const isWoodGrip = skin.pattern === 'gold_walnut';
  const woodPbr = isWoodGrip ? createWoodGrainPBRTextures() : null;

  const gripMat = new THREE.MeshPhysicalMaterial({
    color: isWoodGrip ? 0xffffff : skin.gripColor,
    map: woodPbr?.map ?? null,
    bumpMap: woodPbr?.bumpMap ?? knurl.bumpMap,
    bumpScale: isWoodGrip ? 0.012 : 0.016,
    roughnessMap: woodPbr?.roughnessMap ?? knurl.roughnessMap,
    roughness: isWoodGrip ? 0.44 : 0.78,
    metalness: isWoodGrip ? 0.05 : 0.12,
    clearcoat: isWoodGrip ? 0.68 : 0.08,
    clearcoatRoughness: 0.22,
  });

  const scopeMat = new THREE.MeshPhysicalMaterial({
    color: isWoodGrip ? 0xffffff : skin.scopeColor,
    map: woodPbr?.map ?? null,
    bumpMap: woodPbr?.bumpMap ?? null,
    bumpScale: isWoodGrip ? 0.01 : 0,
    roughness: isWoodGrip ? 0.36 : 0.24,
    metalness: isWoodGrip ? 0.22 : 0.82,
    clearcoat: 0.75,
    clearcoatRoughness: 0.12,
  });

  const opticGlassMat = new THREE.MeshPhysicalMaterial({
    color: skin.emissiveColor,
    emissive: skin.emissiveColor,
    emissiveIntensity: 0.75,
    metalness: 0.15,
    roughness: 0.06,
    clearcoat: 1.0,
    clearcoatRoughness: 0.04,
    reflectivity: 1.0,
  });

  if (weaponId === 'helios_rail') {
    const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.115, 0.13, 0.58), bodyMat);
    group.add(receiver);

    const upperRail = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.04, 0.88), trimMat);
    upperRail.position.set(0, 0.082, -0.26);
    group.add(upperRail);

    // Picatinny rail teeth & barrel cooling ports
    for (let rz = -0.58; rz <= 0.06; rz += 0.065) {
      const tooth = new THREE.Mesh(new THREE.BoxGeometry(0.048, 0.014, 0.03), trimMat);
      tooth.position.set(0, 0.106, rz);
      group.add(tooth);
    }

    const lowerRail = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.035, 0.82), trimMat);
    lowerRail.position.set(0, -0.046, -0.25);
    group.add(lowerRail);

    const plasmaCore = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.74, 14), coreMat);
    plasmaCore.rotation.x = Math.PI / 2;
    plasmaCore.position.set(0, 0.018, -0.23);
    group.add(plasmaCore);

    const muzzleBrake = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.034, 0.09, 12), trimMat);
    muzzleBrake.rotation.x = Math.PI / 2;
    muzzleBrake.position.set(0, 0.018, -0.66);
    group.add(muzzleBrake);

    // Detailed scope housing + coated objective & ocular lenses
    const scopeTube = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.034, 0.28, 16), scopeMat);
    scopeTube.rotation.x = Math.PI / 2;
    scopeTube.position.set(0, 0.144, -0.02);
    group.add(scopeTube);

    const scopeTurret = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.03, 12), trimMat);
    scopeTurret.position.set(0, 0.178, -0.02);
    group.add(scopeTurret);

    const scopeRing = new THREE.Mesh(new THREE.TorusGeometry(0.033, 0.005, 8, 16), trimMat);
    scopeRing.position.set(0, 0.144, -0.14);
    group.add(scopeRing);

    const scopeLens = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.018, 14), opticGlassMat);
    scopeLens.rotation.x = Math.PI / 2;
    scopeLens.position.set(0, 0.144, 0.12);
    group.add(scopeLens);

    const triggerGuard = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.048, 0.075), trimMat);
    triggerGuard.position.set(0, -0.088, 0.06);
    group.add(triggerGuard);

    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.068, 0.16, 0.09), gripMat);
    grip.position.set(0, -0.12, 0.14);
    grip.rotation.x = 0.26;
    group.add(grip);

    const foreStock = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.06, 0.26), gripMat);
    foreStock.position.set(0, -0.055, -0.15);
    group.add(foreStock);
  } else if (weaponId === 'volt_scatter') {
    const chassis = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.14, 0.52), bodyMat);
    group.add(chassis);

    const topRail = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.018, 0.44), trimMat);
    topRail.position.set(0, 0.078, -0.06);
    group.add(topRail);

    const leftBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.036, 0.45, 14), trimMat);
    leftBarrel.rotation.x = Math.PI / 2;
    leftBarrel.position.set(-0.042, 0.02, -0.32);
    group.add(leftBarrel);

    const rightBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.036, 0.45, 14), trimMat);
    rightBarrel.rotation.x = Math.PI / 2;
    rightBarrel.position.set(0.042, 0.02, -0.32);
    group.add(rightBarrel);

    const powerCell = new THREE.Mesh(new THREE.BoxGeometry(0.175, 0.045, 0.2), coreMat);
    powerCell.position.set(0, 0.04, -0.05);
    group.add(powerCell);

    const optic = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.05, 0.14), scopeMat);
    optic.position.set(0, 0.105, 0.02);
    group.add(optic);

    const opticLens = new THREE.Mesh(new THREE.PlaneGeometry(0.042, 0.032), opticGlassMat);
    opticLens.position.set(0, 0.105, 0.092);
    group.add(opticLens);

    const pump = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.06, 0.24), gripMat);
    pump.position.set(0, -0.06, -0.24);
    group.add(pump);

    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.15, 0.09), gripMat);
    grip.position.set(0, -0.12, 0.15);
    grip.rotation.x = 0.24;
    group.add(grip);
  } else if (weaponId === 'arc_repeater') {
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.105, 0.125, 0.4), bodyMat);
    group.add(body);

    const shroud = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.075, 0.26), trimMat);
    shroud.position.set(0, 0.01, -0.24);
    group.add(shroud);

    const muzzleTip = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.028, 0.08, 12), trimMat);
    muzzleTip.rotation.x = Math.PI / 2;
    muzzleTip.position.set(0, 0.01, -0.4);
    group.add(muzzleTip);

    const arcStripL = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.025, 0.34), coreMat);
    arcStripL.position.set(-0.056, 0.02, -0.08);
    group.add(arcStripL);

    const arcStripR = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.025, 0.34), coreMat);
    arcStripR.position.set(0.056, 0.02, -0.08);
    group.add(arcStripR);

    const reflex = new THREE.Mesh(new THREE.TorusGeometry(0.028, 0.007, 8, 16), scopeMat);
    reflex.position.set(0, 0.095, -0.02);
    group.add(reflex);

    const reflexLens = new THREE.Mesh(new THREE.CircleGeometry(0.023, 14), opticGlassMat);
    reflexLens.position.set(0, 0.095, -0.02);
    group.add(reflexLens);

    const mag = new THREE.Mesh(new THREE.BoxGeometry(0.052, 0.18, 0.065), gripMat);
    mag.position.set(0, -0.14, -0.06);
    mag.rotation.x = -0.18;
    group.add(mag);
  } else {
    const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.115, 0.13, 0.52), bodyMat);
    group.add(receiver);

    // Top picatinny tactical rail
    const railBar = new THREE.Mesh(new THREE.BoxGeometry(0.054, 0.018, 0.44), trimMat);
    railBar.position.set(0, 0.072, -0.04);
    group.add(railBar);

    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.03, 0.44, 14), trimMat);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.015, -0.35);
    group.add(barrel);

    const muzzleRing = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.008, 8, 16), coreMat);
    muzzleRing.position.set(0, 0.015, -0.55);
    group.add(muzzleRing);

    const coreTube = new THREE.Mesh(new THREE.BoxGeometry(0.125, 0.03, 0.28), coreMat);
    coreTube.position.set(0, 0.03, -0.08);
    group.add(coreTube);

    const scopeBody = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.026, 0.18, 12), scopeMat);
    scopeBody.rotation.x = Math.PI / 2;
    scopeBody.position.set(0, 0.105, -0.02);
    group.add(scopeBody);

    const scopeLens = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.014, 12), opticGlassMat);
    scopeLens.rotation.x = Math.PI / 2;
    scopeLens.position.set(0, 0.105, 0.07);
    group.add(scopeLens);

    const triggerGuard = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.045, 0.072), trimMat);
    triggerGuard.position.set(0, -0.084, 0.06);
    group.add(triggerGuard);

    const foregrip = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.11, 0.075), gripMat);
    foregrip.position.set(0, -0.1, -0.18);
    group.add(foregrip);

    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.068, 0.15, 0.09), gripMat);
    grip.position.set(0, -0.12, 0.14);
    grip.rotation.x = 0.25;
    group.add(grip);
  }

  // First-person Tactical Gloved Hands & Cordura Forearm Sleeves holding the weapon
  const sleevePbr = createArmorPBRTextures(
    avatarSkin?.clothingColor ?? '#334155',
    avatarSkin?.trimColor ?? '#38bdf8',
    'cloth'
  );
  const sleeveMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: sleevePbr.map,
    bumpMap: sleevePbr.bumpMap,
    bumpScale: 0.01,
    roughnessMap: sleevePbr.roughnessMap,
    roughness: 0.85,
    metalness: 0.08,
  });
  const cuffMat = new THREE.MeshPhysicalMaterial({
    color: avatarSkin?.armorColor ?? '#1e293b',
    roughness: 0.34,
    metalness: 0.68,
    clearcoat: 0.55,
    clearcoatRoughness: 0.18,
  });
  const gloveMat = new THREE.MeshStandardMaterial({
    color: '#18181b',
    bumpMap: knurl.bumpMap,
    bumpScale: 0.014,
    roughnessMap: knurl.roughnessMap,
    roughness: 0.72,
    metalness: 0.14,
  });
  const wristStripMat = new THREE.MeshStandardMaterial({
    color: avatarSkin?.visorColor ?? '#06b6d4',
    emissive: avatarSkin?.visorColor ?? '#06b6d4',
    emissiveIntensity: 1.4,
    roughness: 0.2,
  });

  // Right hand + fingers gripping pistol grip + right forearm sleeve
  const rightGripPos =
    weaponId === 'arc_repeater'
      ? new THREE.Vector3(0.01, -0.09, 0.11)
      : new THREE.Vector3(0.01, -0.09, 0.12);

  const rightPalm = new THREE.Mesh(new THREE.BoxGeometry(0.092, 0.088, 0.11), gloveMat);
  rightPalm.position.set(rightGripPos.x + 0.012, rightGripPos.y, rightGripPos.z);
  group.add(rightPalm);

  const rightKnuckles = new THREE.Mesh(new THREE.BoxGeometry(0.096, 0.034, 0.072), cuffMat);
  rightKnuckles.position.set(rightGripPos.x + 0.018, rightGripPos.y + 0.038, rightGripPos.z - 0.015);
  group.add(rightKnuckles);

  const rightThumb = new THREE.Mesh(new THREE.CapsuleGeometry(0.017, 0.05, 4, 8), gloveMat);
  rightThumb.position.set(rightGripPos.x - 0.044, rightGripPos.y + 0.038, rightGripPos.z - 0.015);
  rightThumb.rotation.x = Math.PI / 2.2;
  group.add(rightThumb);

  const rightCuff = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.054, 0.08, 12), cuffMat);
  rightCuff.position.set(rightGripPos.x + 0.045, rightGripPos.y - 0.05, rightGripPos.z + 0.095);
  rightCuff.rotation.set(0.96, 0, -0.24);
  group.add(rightCuff);

  const rightStrip = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.064, 0.014), wristStripMat);
  rightStrip.position.set(rightGripPos.x + 0.008, rightGripPos.y - 0.042, rightGripPos.z + 0.085);
  rightStrip.rotation.set(0.96, 0, -0.24);
  group.add(rightStrip);

  const rightForearm = new THREE.Mesh(new THREE.CylinderGeometry(0.054, 0.072, 0.4, 12), sleeveMat);
  rightForearm.position.set(rightGripPos.x + 0.115, rightGripPos.y - 0.15, rightGripPos.z + 0.25);
  rightForearm.rotation.set(0.96, 0, -0.28);
  group.add(rightForearm);

  // Left hand + angled forearm cradling the foregrip / handguard
  const leftSupportPos =
    weaponId === 'volt_scatter'
      ? new THREE.Vector3(-0.015, -0.055, -0.22)
      : weaponId === 'arc_repeater'
      ? new THREE.Vector3(-0.015, -0.065, -0.14)
      : new THREE.Vector3(-0.015, -0.065, -0.17);

  const leftPalm = new THREE.Mesh(new THREE.BoxGeometry(0.098, 0.076, 0.115), gloveMat);
  leftPalm.position.set(leftSupportPos.x - 0.012, leftSupportPos.y, leftSupportPos.z);
  group.add(leftPalm);

  const leftKnuckles = new THREE.Mesh(new THREE.BoxGeometry(0.102, 0.03, 0.072), cuffMat);
  leftKnuckles.position.set(leftSupportPos.x - 0.028, leftSupportPos.y - 0.015, leftSupportPos.z);
  group.add(leftKnuckles);

  const leftThumb = new THREE.Mesh(new THREE.CapsuleGeometry(0.016, 0.05, 4, 8), gloveMat);
  leftThumb.position.set(leftSupportPos.x - 0.056, leftSupportPos.y + 0.04, leftSupportPos.z - 0.018);
  leftThumb.rotation.x = Math.PI / 2.2;
  group.add(leftThumb);

  const leftCuff = new THREE.Mesh(new THREE.CylinderGeometry(0.046, 0.052, 0.08, 12), cuffMat);
  leftCuff.position.set(leftSupportPos.x - 0.095, leftSupportPos.y - 0.052, leftSupportPos.z + 0.095);
  leftCuff.rotation.set(1.08, 0.35, 0.44);
  group.add(leftCuff);

  const leftForearm = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.072, 0.44, 12), sleeveMat);
  leftForearm.position.set(leftSupportPos.x - 0.225, leftSupportPos.y - 0.15, leftSupportPos.z + 0.25);
  leftForearm.rotation.set(1.08, 0.38, 0.5);
  group.add(leftForearm);

  return group;
}

/**
 * Realistic multi-part tactical laser tag operator with helmet, visor, jacket/clothing, armor, and articulated limbs.
 */
export function buildAvatarRig(
  skin: AvatarSkinDef,
  teamColorHex: string,
  shadowTexture: THREE.Texture,
  relation: 'ally' | 'enemy' = 'enemy',
  nickname?: string
): AnimatedAvatarRig {
  const group = new THREE.Group();

  const outlineMat = new THREE.MeshBasicMaterial({
    color: relation === 'ally' ? 0x38bdf8 : 0xef4444,
    side: THREE.BackSide,
    toneMapped: false,
    fog: false,
  });

  // Teammates (TDM allies) show normal realistic PBR armor in open sight and
  // ONLY a crisp thin blue silhouette line around them when occluded behind walls/barriers.
  const xrayMaskMat =
    relation === 'ally'
      ? new THREE.MeshBasicMaterial({
          colorWrite: false,
          depthWrite: false,
          depthTest: false,
          stencilWrite: true,
          stencilRef: 1,
          stencilFunc: THREE.AlwaysStencilFunc,
          stencilFail: THREE.ReplaceStencilOp,
          stencilZFail: THREE.ReplaceStencilOp,
          stencilZPass: THREE.ReplaceStencilOp,
        })
      : null;

  const xrayOutlineMat =
    relation === 'ally'
      ? new THREE.MeshBasicMaterial({
          color: 0x38bdf8,
          side: THREE.BackSide,
          transparent: true,
          opacity: 0.92,
          depthTest: true,
          depthFunc: THREE.GreaterDepth,
          depthWrite: false,
          stencilWrite: false,
          stencilFunc: THREE.NotEqualStencilFunc,
          stencilRef: 1,
          toneMapped: false,
          fog: false,
        })
      : null;

  const addOutlineShell = (
    parent: THREE.Object3D,
    sourceMesh: THREE.Mesh,
    _sx = 1.05,
    _sy = 1.03,
    _sz = 1.05
  ) => {
    if (relation !== 'ally' || !xrayMaskMat || !xrayOutlineMat) {
      return;
    }

    const mask = new THREE.Mesh(sourceMesh.geometry, xrayMaskMat);
    mask.position.copy(sourceMesh.position);
    mask.rotation.copy(sourceMesh.rotation);
    mask.scale.copy(sourceMesh.scale);
    mask.renderOrder = 8;
    mask.castShadow = false;
    mask.receiveShadow = false;
    parent.add(mask);

    const xrayShell = new THREE.Mesh(sourceMesh.geometry, xrayOutlineMat);
    xrayShell.position.copy(sourceMesh.position);
    xrayShell.rotation.copy(sourceMesh.rotation);
    xrayShell.scale.set(
      sourceMesh.scale.x * 1.045,
      sourceMesh.scale.y * 1.028,
      sourceMesh.scale.z * 1.045
    );
    xrayShell.renderOrder = 9;
    xrayShell.castShadow = false;
    xrayShell.receiveShadow = false;
    parent.add(xrayShell);
  };

  const clothPbr = createArmorPBRTextures(skin.clothingColor, skin.trimColor, 'cloth');
  const armorPbr = createArmorPBRTextures(skin.armorColor, skin.trimColor, 'armor');

  const clothMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: clothPbr.map,
    bumpMap: clothPbr.bumpMap,
    bumpScale: 0.012,
    roughnessMap: clothPbr.roughnessMap,
    roughness: 0.84,
    metalness: 0.08,
  });
  const armorMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    map: armorPbr.map,
    bumpMap: armorPbr.bumpMap,
    bumpScale: 0.015,
    roughnessMap: armorPbr.roughnessMap,
    metalness: 0.62,
    roughness: 0.34,
    clearcoat: 0.58,
    clearcoatRoughness: 0.16,
  });
  const trimMat = new THREE.MeshPhysicalMaterial({
    color: skin.trimColor,
    metalness: 0.86,
    roughness: 0.2,
    clearcoat: 0.72,
    clearcoatRoughness: 0.14,
  });
  const visorMat = new THREE.MeshPhysicalMaterial({
    color: skin.visorColor,
    emissive: skin.visorColor,
    emissiveIntensity: 1.85,
    roughness: 0.08,
    metalness: 0.25,
    clearcoat: 1.0,
    clearcoatRoughness: 0.04,
  });
  const teamGlowMat = new THREE.MeshStandardMaterial({
    color: teamColorHex,
    emissive: teamColorHex,
    emissiveIntensity: 1.35,
    roughness: 0.2,
  });

  // Ground contact shadow
  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.7, 24),
    new THREE.MeshBasicMaterial({
      map: shadowTexture,
      transparent: true,
      opacity: 0.52,
      depthWrite: false,
    })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.015;
  group.add(shadow);

  // Articulated Left & Right Legs (hip pivot at y = 0.88)
  const makeLeg = (side: -1 | 1): THREE.Group => {
    const legPivot = new THREE.Group();
    legPivot.position.set(side * 0.14, 0.88, 0);

    const thigh = new THREE.Mesh(new THREE.CapsuleGeometry(0.095, 0.24, 6, 12), clothMat);
    thigh.position.y = -0.2;
    thigh.castShadow = true;
    legPivot.add(thigh);
    addOutlineShell(legPivot, thigh, 1.22, 1.07, 1.22);

    const shin = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 0.26, 6, 12), armorMat);
    shin.position.y = -0.55;
    shin.castShadow = true;
    legPivot.add(shin);
    addOutlineShell(legPivot, shin, 1.24, 1.07, 1.24);

    const kneePad = new THREE.Mesh(new THREE.SphereGeometry(0.085, 10, 10), trimMat);
    kneePad.position.set(0, -0.38, 0.05);
    legPivot.add(kneePad);

    const boot = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.12, 0.27), armorMat);
    boot.position.set(0, -0.82, 0.04);
    boot.castShadow = true;
    legPivot.add(boot);
    addOutlineShell(legPivot, boot, 1.2, 1.22, 1.14);

    return legPivot;
  };

  const legL = makeLeg(-1);
  const legR = makeLeg(1);
  group.add(legL, legR);

  // Articulated Upper Body Torso Pivot (allows natural lean & turn sway)
  const torso = new THREE.Group();
  torso.position.set(0, 0.92, 0);
  group.add(torso);

  // Tactical Jacket / Torso + Vest Harness (relative to torso y = 0.92)
  const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.23, 0.1, 14), armorMat);
  belt.position.y = 0;
  torso.add(belt);

  const jacket = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.23, 0.52, 14), clothMat);
  jacket.scale.set(1.1, 1, 0.78);
  jacket.position.y = 0.3;
  jacket.castShadow = true;
  torso.add(jacket);
  addOutlineShell(torso, jacket, 1.12, 1.07, 1.13);

  // Vest armor chest plate
  const chestPlate = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.38, 0.34), armorMat);
  chestPlate.position.set(0, 0.33, 0.01);
  chestPlate.castShadow = true;
  torso.add(chestPlate);
  addOutlineShell(torso, chestPlate, 1.11, 1.11, 1.13);

  // Laser-tag chest & spine sensor rings
  const chestCore = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.38, 16), teamGlowMat);
  chestCore.rotation.x = Math.PI / 2;
  chestCore.position.set(0, 0.35, 0.01);
  torso.add(chestCore);

  // Jacket collar
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.04, 8, 16), clothMat);
  collar.rotation.x = Math.PI / 2;
  collar.position.y = 0.57;
  torso.add(collar);

  // Articulated Left Arm + Shoulder Pauldron
  const armL = new THREE.Group();
  armL.position.set(-0.34, 0.49, 0);
  const pauldronL = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 10), trimMat);
  pauldronL.scale.set(1, 0.9, 1.15);
  armL.add(pauldronL);
  addOutlineShell(armL, pauldronL, 1.18, 1.18, 1.16);

  const sleeveL = new THREE.Mesh(new THREE.CapsuleGeometry(0.068, 0.38, 6, 10), clothMat);
  sleeveL.position.set(0, -0.24, 0.12);
  sleeveL.rotation.x = -0.55;
  sleeveL.rotation.z = 0.12;
  armL.add(sleeveL);
  addOutlineShell(armL, sleeveL, 1.24, 1.07, 1.24);
  torso.add(armL);

  // Articulated Right Arm + Blaster Carbine
  const armR = new THREE.Group();
  armR.position.set(0.34, 0.49, 0);
  const pauldronR = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 10), trimMat);
  pauldronR.scale.set(1, 0.9, 1.15);
  armR.add(pauldronR);
  addOutlineShell(armR, pauldronR, 1.18, 1.18, 1.16);

  const sleeveR = new THREE.Mesh(new THREE.CapsuleGeometry(0.068, 0.36, 6, 10), clothMat);
  sleeveR.position.set(0, -0.22, 0.14);
  sleeveR.rotation.x = -0.85;
  armR.add(sleeveR);
  addOutlineShell(armR, sleeveR, 1.24, 1.07, 1.24);

  const rifle = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.11, 0.56), trimMat);
  rifle.position.set(-0.04, -0.32, 0.42);
  armR.add(rifle);

  const rifleCore = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.03, 0.25), teamGlowMat);
  rifleCore.position.set(-0.04, -0.3, 0.45);
  armR.add(rifleCore);
  torso.add(armR);

  // Sculpted Tactical Helmet + Ear Comms + Wrap-Around Illuminated Visor
  const head = new THREE.Group();
  head.position.set(0, 0.73, 0);

  const helmetShell = new THREE.Mesh(new THREE.SphereGeometry(0.185, 16, 14), armorMat);
  helmetShell.scale.set(0.95, 1.05, 1.08);
  helmetShell.castShadow = true;
  head.add(helmetShell);
  addOutlineShell(head, helmetShell, 1.15, 1.14, 1.15);

  const crest = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.05, 0.28), trimMat);
  crest.position.set(0, 0.175, -0.01);
  head.add(crest);

  const visor = new THREE.Mesh(
    new THREE.CylinderGeometry(0.182, 0.178, 0.09, 16, 1, false, -Math.PI * 0.38, Math.PI * 0.76),
    visorMat
  );
  visor.position.set(0, 0.015, 0.02);
  head.add(visor);

  const chinGuard = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.09, 0.14), trimMat);
  chinGuard.position.set(0, -0.09, 0.11);
  head.add(chinGuard);

  const earPodL = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.04, 12), trimMat);
  earPodL.rotation.z = Math.PI / 2;
  earPodL.position.set(-0.18, 0, 0);
  head.add(earPodL);

  const earPodR = earPodL.clone();
  earPodR.position.set(0.18, 0, 0);
  head.add(earPodR);

  torso.add(head);

  let nametagSprite: THREE.Sprite | null = null;
  let nametagTexture: THREE.CanvasTexture | null = null;
  if (nickname) {
    const builtTag = createNametagSprite(nickname, relation);
    nametagSprite = builtTag.sprite;
    nametagTexture = builtTag.texture;
    nametagSprite.position.set(0, 2.34, 0);
    group.add(nametagSprite);
  }

  return {
    group,
    torso,
    legL,
    legR,
    armL,
    armR,
    head,
    outlineMat,
    xrayMaskMat,
    xrayOutlineMat,
    nametagSprite,
    nametagTexture,
  };
}

export function buildJumpPad(accentHex: string): {
  group: THREE.Group;
  ring: THREE.Mesh;
} {
  const group = new THREE.Group();

  const baseMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    metalness: 0.75,
    roughness: 0.35,
  });
  const glowMat = new THREE.MeshStandardMaterial({
    color: accentHex,
    emissive: accentHex,
    emissiveIntensity: 2.2,
    roughness: 0.15,
  });

  const base = new THREE.Mesh(new THREE.CylinderGeometry(1.35, 1.55, 0.18, 8), baseMat);
  base.position.y = 0.09;
  group.add(base);

  const coreDisc = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.95, 0.2, 16), glowMat);
  coreDisc.position.y = 0.1;
  group.add(coreDisc);

  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.05, 0.06, 8, 24), glowMat);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.38;
  group.add(ring);

  return { group, ring };
}

export function buildStreetLight(accentHex: string): THREE.Group {
  const group = new THREE.Group();

  const poleMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    metalness: 0.85,
    roughness: 0.3,
  });
  const lampMat = new THREE.MeshStandardMaterial({
    color: 0xfef3c7,
    emissive: accentHex,
    emissiveIntensity: 2.5,
    roughness: 0.15,
  });

  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.32, 0.55, 10), poleMat);
  plinth.position.y = 0.275;
  group.add(plinth);

  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.14, 6.2, 10), poleMat);
  pole.position.y = 3.35;
  pole.castShadow = true;
  group.add(pole);

  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 1.6), poleMat);
  arm.position.set(0, 6.3, 0.72);
  group.add(arm);

  const housing = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.12, 0.55), poleMat);
  housing.position.set(0, 6.26, 1.4);
  group.add(housing);

  const bulb = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.06, 0.44), lampMat);
  bulb.position.set(0, 6.18, 1.4);
  group.add(bulb);

  return group;
}

export function buildTreeModel(
  shadowTexture: THREE.Texture,
  scale = 1,
  variant = 0
): THREE.Group {
  const group = new THREE.Group();

  const barkMat = new THREE.MeshStandardMaterial({
    color: 0x4a3525,
    roughness: 0.92,
    metalness: 0.02,
  });
  const leafColor = variant % 2 === 0 ? 0x2d6a4f : 0x1b4332;
  const leafHighlight = variant % 2 === 0 ? 0x40916c : 0x2d6a4f;
  const foliageMatA = new THREE.MeshStandardMaterial({
    color: leafColor,
    roughness: 0.85,
    metalness: 0.02,
  });
  const foliageMatB = new THREE.MeshStandardMaterial({
    color: leafHighlight,
    roughness: 0.78,
    metalness: 0.02,
  });

  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(1.9 * scale, 18),
    new THREE.MeshBasicMaterial({
      map: shadowTexture,
      transparent: true,
      opacity: 0.42,
      depthWrite: false,
    })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.018;
  group.add(shadow);

  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18 * scale, 0.34 * scale, 2.8 * scale, 10), barkMat);
  trunk.position.y = 1.4 * scale;
  trunk.castShadow = true;
  group.add(trunk);

  const branchL = new THREE.Mesh(new THREE.CylinderGeometry(0.08 * scale, 0.14 * scale, 1.4 * scale, 8), barkMat);
  branchL.position.set(-0.42 * scale, 2.3 * scale, 0);
  branchL.rotation.z = 0.65;
  group.add(branchL);

  const branchR = new THREE.Mesh(new THREE.CylinderGeometry(0.08 * scale, 0.14 * scale, 1.4 * scale, 8), barkMat);
  branchR.position.set(0.42 * scale, 2.4 * scale, 0.15 * scale);
  branchR.rotation.z = -0.6;
  group.add(branchR);

  const crown1 = new THREE.Mesh(new THREE.IcosahedronGeometry(1.35 * scale, 1), foliageMatA);
  crown1.position.set(0, 3.6 * scale, 0);
  crown1.castShadow = true;
  group.add(crown1);

  const crown2 = new THREE.Mesh(new THREE.IcosahedronGeometry(1.0 * scale, 1), foliageMatB);
  crown2.position.set(-0.8 * scale, 3.0 * scale, 0.4 * scale);
  crown2.castShadow = true;
  group.add(crown2);

  const crown3 = new THREE.Mesh(new THREE.IcosahedronGeometry(0.95 * scale, 1), foliageMatB);
  crown3.position.set(0.85 * scale, 3.1 * scale, -0.35 * scale);
  crown3.castShadow = true;
  group.add(crown3);

  return group;
}

export function buildEasterEggMonolith(): {
  group: THREE.Group;
  crystal: THREE.Mesh;
  ring: THREE.Mesh;
} {
  const group = new THREE.Group();

  const stoneMat = new THREE.MeshStandardMaterial({
    color: 0x1a1826,
    roughness: 0.78,
    metalness: 0.25,
  });
  const trimMat = new THREE.MeshStandardMaterial({
    color: 0x475569,
    roughness: 0.35,
    metalness: 0.85,
  });
  const crystalMat = new THREE.MeshStandardMaterial({
    color: 0x6366f1,
    emissive: 0x4338ca,
    emissiveIntensity: 0.35,
    roughness: 0.18,
    metalness: 0.45,
  });

  const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.95, 0.55, 8), stoneMat);
  pedestal.position.y = 0.275;
  group.add(pedestal);

  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.65, 0.05, 8, 20), trimMat);
  collar.rotation.x = Math.PI / 2;
  collar.position.y = 0.56;
  group.add(collar);

  const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.42, 0), crystalMat);
  crystal.position.y = 1.9;
  group.add(crystal);

  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.68, 0.035, 8, 24), trimMat);
  ring.position.y = 1.9;
  group.add(ring);

  return { group, crystal, ring };
}

export function buildHouseStructure(
  obs: MapObstacle,
  facadeTex: THREE.Texture,
  accentHex: string
): THREE.Group {
  const group = new THREE.Group();
  group.position.set(obs.x, obs.y, obs.z);

  const plinthH = Math.min(0.42, obs.h * 0.12);
  const eaveH = 0.08;
  const roofH = Math.min(0.52, obs.h * 0.16);
  const wallH = Math.max(1.2, obs.h - plinthH - eaveH - roofH);

  const plinthMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.85,
    metalness: 0.15,
  });
  const facadeMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: facadeTex,
    roughness: 0.68,
    metalness: 0.12,
  });
  const roofMat = new THREE.MeshStandardMaterial({
    color: 0x262936,
    roughness: 0.72,
    metalness: 0.35,
  });
  const trimMat = new THREE.MeshStandardMaterial({
    color: accentHex,
    emissive: accentHex,
    emissiveIntensity: 0.9,
    roughness: 0.25,
  });

  // Stone foundation plinth (non-overlapping bottom step)
  const plinth = new THREE.Mesh(
    new THREE.BoxGeometry(obs.w + 0.18, plinthH, obs.d + 0.18),
    plinthMat
  );
  plinth.position.y = plinthH * 0.5;
  plinth.receiveShadow = true;
  plinth.castShadow = true;
  group.add(plinth);

  // Textured architectural house walls stacked cleanly above plinth
  const walls = new THREE.Mesh(
    new THREE.BoxGeometry(obs.w, wallH, obs.d),
    facadeMat
  );
  walls.position.y = plinthH + wallH * 0.5;
  walls.castShadow = true;
  walls.receiveShadow = true;
  group.add(walls);

  // Eave optic accent strip stacked strictly between walls and roof (zero coplanar faces)
  const eaveGlow = new THREE.Mesh(
    new THREE.BoxGeometry(obs.w + 0.38, eaveH, obs.d + 0.38),
    trimMat
  );
  eaveGlow.position.y = plinthH + wallH + eaveH * 0.5;
  group.add(eaveGlow);

  // Overhanging roof cornice strictly above eave strip
  const lowerRoofH = roofH * 0.56;
  const upperRoofH = roofH * 0.44;
  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(obs.w + 0.48, lowerRoofH, obs.d + 0.48),
    roofMat
  );
  roof.position.y = plinthH + wallH + eaveH + lowerRoofH * 0.5;
  roof.castShadow = true;
  roof.receiveShadow = true;
  group.add(roof);

  const upperRoof = new THREE.Mesh(
    new THREE.BoxGeometry(obs.w * 0.74, upperRoofH, obs.d * 0.74),
    roofMat
  );
  upperRoof.position.y = plinthH + wallH + eaveH + lowerRoofH + upperRoofH * 0.5;
  upperRoof.castShadow = true;
  group.add(upperRoof);

  // Front/back entrance door frames offset 0.06m outside wall faces (zero z-fighting)
  const doorMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.5,
    metalness: 0.5,
  });
  const doorW = Math.min(1.4, obs.w * 0.24);
  const doorH = Math.min(2.05, wallH * 0.68);
  const door = new THREE.Mesh(
    new THREE.BoxGeometry(doorW, doorH, obs.d + 0.12),
    doorMat
  );
  door.position.y = plinthH + doorH * 0.5;
  group.add(door);

  return group;
}

export function buildTexturedCrate(
  obs: MapObstacle,
  crateTex: THREE.Texture,
  accentHex: string
): THREE.Group {
  const group = new THREE.Group();
  group.position.set(obs.x, obs.y, obs.z);

  const crateMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: crateTex,
    roughness: 0.58,
    metalness: 0.36,
  });
  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.45,
    metalness: 0.72,
  });
  const accentMat = new THREE.MeshStandardMaterial({
    color: accentHex,
    emissive: accentHex,
    emissiveIntensity: 1.0,
    roughness: 0.2,
  });

  // Main crate body (0.05m below top rim so topTrim never z-fights with body top)
  const bodyH = Math.max(0.2, obs.h - 0.05);
  const body = new THREE.Mesh(new THREE.BoxGeometry(obs.w, bodyH, obs.d), crateMat);
  body.position.y = bodyH * 0.5;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  // Corner steel posts protruding slightly beyond crate walls (no coplanar faces)
  const postW = Math.min(0.22, Math.min(obs.w, obs.d) * 0.12);
  const corners: Array<[number, number]> = [
    [-obs.w * 0.5, -obs.d * 0.5],
    [obs.w * 0.5, -obs.d * 0.5],
    [-obs.w * 0.5, obs.d * 0.5],
    [obs.w * 0.5, obs.d * 0.5],
  ];
  for (const [cx, cz] of corners) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(postW, obs.h, postW), frameMat);
    post.position.set(cx, obs.h * 0.5, cz);
    group.add(post);
  }

  // Top accent cap stacked cleanly on top of body
  const topTrim = new THREE.Mesh(
    new THREE.BoxGeometry(obs.w * 0.9, 0.05, obs.d * 0.9),
    accentMat
  );
  topTrim.position.y = bodyH + 0.025;
  group.add(topTrim);

  return group;
}

export function buildPeekCover(
  obs: MapObstacle,
  barrierTex: THREE.Texture,
  accentHex: string
): THREE.Group {
  const group = new THREE.Group();
  group.position.set(obs.x, obs.y, obs.z);

  const wallMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: barrierTex,
    roughness: 0.72,
    metalness: 0.22,
  });
  const capMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.4,
    metalness: 0.65,
  });
  const glowMat = new THREE.MeshStandardMaterial({
    color: accentHex,
    emissive: accentHex,
    emissiveIntensity: 1.1,
    roughness: 0.22,
  });

  // Stack block + cap vertically without overlapping top face
  const capH = Math.min(0.1, obs.h * 0.18);
  const blockH = Math.max(0.2, obs.h - capH);

  const block = new THREE.Mesh(new THREE.BoxGeometry(obs.w, blockH, obs.d), wallMat);
  block.position.y = blockH * 0.5;
  block.castShadow = true;
  block.receiveShadow = true;
  group.add(block);

  const cap = new THREE.Mesh(
    new THREE.BoxGeometry(obs.w + 0.08, capH, obs.d + 0.08),
    capMat
  );
  cap.position.y = blockH + capH * 0.5;
  group.add(cap);

  const strip = new THREE.Mesh(
    new THREE.BoxGeometry(obs.w + 0.05, 0.05, obs.d + 0.05),
    glowMat
  );
  strip.position.y = blockH * 0.82;
  group.add(strip);

  return group;
}

export function buildBridgeStructure(
  obs: MapObstacle,
  crateTex: THREE.Texture,
  accentHex: string
): THREE.Group {
  const group = new THREE.Group();
  group.position.set(obs.x, obs.y, obs.z);

  const deckMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: crateTex,
    roughness: 0.42,
    metalness: 0.68,
  });
  const railMat = new THREE.MeshStandardMaterial({
    color: accentHex,
    emissive: accentHex,
    emissiveIntensity: 1.25,
    roughness: 0.2,
  });

  const deck = new THREE.Mesh(new THREE.BoxGeometry(obs.w, obs.h, obs.d), deckMat);
  deck.position.y = obs.h * 0.5;
  deck.castShadow = true;
  deck.receiveShadow = true;
  group.add(deck);

  // Safety side rails elevated cleanly above deck surface
  const longAlongX = obs.w >= obs.d;
  if (longAlongX) {
    for (const side of [-1, 1]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(obs.w - 0.1, 0.08, 0.08), railMat);
      rail.position.set(0, obs.h + 0.36, side * (obs.d * 0.5 - 0.08));
      group.add(rail);
    }
  } else {
    for (const side of [-1, 1]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, obs.d - 0.1), railMat);
      rail.position.set(side * (obs.w * 0.5 - 0.08), obs.h + 0.36, 0);
      group.add(rail);
    }
  }

  return group;
}

export function buildHealOrbModel(): {
  group: THREE.Group;
  core: THREE.Mesh;
  ring: THREE.Mesh;
} {
  const group = new THREE.Group();

  const emeraldMat = new THREE.MeshStandardMaterial({
    color: 0x10b981,
    emissive: 0x10b981,
    emissiveIntensity: 2.3,
    roughness: 0.12,
    metalness: 0.2,
  });
  const ringMat = new THREE.MeshStandardMaterial({
    color: 0xd1fae5,
    emissive: 0x34d399,
    emissiveIntensity: 1.8,
    roughness: 0.15,
    metalness: 0.4,
  });

  const baseDisc = new THREE.Mesh(
    new THREE.RingGeometry(0.45, 0.78, 24),
    new THREE.MeshBasicMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide,
    })
  );
  baseDisc.rotation.x = -Math.PI / 2;
  baseDisc.position.y = 0.058;
  group.add(baseDisc);

  const core = new THREE.Mesh(new THREE.SphereGeometry(0.42, 16, 14), emeraldMat);
  core.position.y = 1.05;
  group.add(core);

  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.66, 0.055, 8, 24), ringMat);
  ring.position.y = 1.05;
  group.add(ring);

  return { group, core, ring };
}

function applyWorldBoxUVs(
  geo: THREE.BoxGeometry,
  w: number,
  h: number,
  d: number,
  tileMeters = 4
) {
  const uv = geo.attributes.uv;
  const norm = geo.attributes.normal;
  if (!uv || !norm) return;
  for (let i = 0; i < uv.count; i++) {
    const nx = Math.abs(norm.getX(i));
    const ny = Math.abs(norm.getY(i));
    const u = uv.getX(i);
    const v = uv.getY(i);
    if (nx > 0.5) {
      uv.setXY(i, (u * d) / tileMeters, (v * h) / tileMeters);
    } else if (ny > 0.5) {
      uv.setXY(i, (u * w) / tileMeters, (v * d) / tileMeters);
    } else {
      uv.setXY(i, (u * w) / tileMeters, (v * h) / tileMeters);
    }
  }
  uv.needsUpdate = true;
}

export function buildWoodenCrate(
  obs: MapObstacle,
  woodTex: THREE.Texture,
  woodBump: THREE.Texture
): THREE.Group {
  const group = new THREE.Group();
  group.position.set(obs.x, obs.y, obs.z);

  const plankMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: woodTex,
    bumpMap: woodBump,
    bumpScale: 0.045,
    roughness: 0.88,
    metalness: 0.03,
  });
  const frameWoodMat = new THREE.MeshStandardMaterial({
    color: 0x5c3a1c,
    map: woodTex,
    bumpMap: woodBump,
    bumpScale: 0.03,
    roughness: 0.92,
    metalness: 0.02,
  });
  const ironMat = new THREE.MeshStandardMaterial({
    color: 0x2e3136,
    roughness: 0.55,
    metalness: 0.55,
  });

  // Main wooden crate body (single clean tiled crate panel per face for smaller crates, scaled cleanly for large ones)
  const tileM = Math.max(1.2, Math.min(obs.w, obs.d, obs.h));
  const bodyH = Math.max(0.2, obs.h - 0.04);
  const bodyGeo = new THREE.BoxGeometry(obs.w, bodyH, obs.d);
  if (obs.w > 2.4 || obs.d > 2.4) {
    applyWorldBoxUVs(bodyGeo, obs.w, bodyH, obs.d, 1.9);
  }
  const body = new THREE.Mesh(bodyGeo, plankMat);
  body.position.y = bodyH * 0.5;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  // Proud corner wooden posts (protruding slightly beyond crate body so zero z-fighting occurs)
  const postW = Math.min(0.16, Math.max(0.08, tileM * 0.1));
  for (const [cx, cz] of [
    [-obs.w * 0.5, -obs.d * 0.5],
    [obs.w * 0.5, -obs.d * 0.5],
    [-obs.w * 0.5, obs.d * 0.5],
    [obs.w * 0.5, obs.d * 0.5],
  ]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(postW, obs.h, postW), frameWoodMat);
    post.position.set(cx, obs.h * 0.5, cz);
    post.castShadow = true;
    group.add(post);
  }

  // Timber lid frame stacked cleanly above bodyH
  const lid = new THREE.Mesh(
    new THREE.BoxGeometry(obs.w + 0.04, 0.04, obs.d + 0.04),
    frameWoodMat
  );
  lid.position.y = bodyH + 0.02;
  lid.castShadow = true;
  lid.receiveShadow = true;
  group.add(lid);

  // Rusted iron corner brackets around top rim
  const strapH = Math.min(0.1, obs.h * 0.14);
  for (const [cx, cz] of [
    [-obs.w * 0.5, -obs.d * 0.5],
    [obs.w * 0.5, -obs.d * 0.5],
    [-obs.w * 0.5, obs.d * 0.5],
    [obs.w * 0.5, obs.d * 0.5],
  ]) {
    const bracket = new THREE.Mesh(
      new THREE.BoxGeometry(postW + 0.03, strapH, postW + 0.03),
      ironMat
    );
    bracket.position.set(cx, obs.h - strapH * 0.5, cz);
    group.add(bracket);
  }

  return group;
}

export function buildConcreteWall(
  obs: MapObstacle,
  concreteTex: THREE.Texture,
  concreteBump: THREE.Texture
): THREE.Group {
  const group = new THREE.Group();
  group.position.set(obs.x, obs.y, obs.z);

  const wallMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: concreteTex,
    bumpMap: concreteBump,
    bumpScale: 0.055,
    roughness: 0.88,
    metalness: 0.06,
  });
  const copingMat = new THREE.MeshStandardMaterial({
    color: 0x646a73,
    roughness: 0.82,
    metalness: 0.08,
  });
  const footingMat = new THREE.MeshStandardMaterial({
    color: 0x565b63,
    roughness: 0.92,
    metalness: 0.04,
  });

  const isFloatingHeader = obs.y > 0.2;
  const capH = isFloatingHeader ? 0 : Math.min(0.11, obs.h * 0.12);
  const footH = isFloatingHeader ? 0 : Math.min(0.14, obs.h * 0.12);
  const mainH = Math.max(0.2, obs.h - capH - footH);

  if (footH > 0) {
    const footing = new THREE.Mesh(
      new THREE.BoxGeometry(obs.w + 0.1, footH, obs.d + 0.1),
      footingMat
    );
    footing.position.y = footH * 0.5;
    footing.castShadow = true;
    footing.receiveShadow = true;
    group.add(footing);
  }

  const bodyGeo = new THREE.BoxGeometry(obs.w, mainH, obs.d);
  applyWorldBoxUVs(bodyGeo, obs.w, mainH, obs.d, 4.2);
  const body = new THREE.Mesh(bodyGeo, wallMat);
  body.position.y = footH + mainH * 0.5;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  if (capH > 0) {
    const cap = new THREE.Mesh(
      new THREE.BoxGeometry(obs.w + 0.08, capH, obs.d + 0.08),
      copingMat
    );
    cap.position.y = footH + mainH + capH * 0.5;
    cap.castShadow = true;
    cap.receiveShadow = true;
    group.add(cap);
  }

  return group;
}

export function buildBuildingWall(
  obs: MapObstacle,
  concreteTex: THREE.Texture,
  concreteBump: THREE.Texture
): THREE.Group {
  const group = new THREE.Group();
  group.position.set(obs.x, obs.y, obs.z);

  const wallMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: concreteTex,
    bumpMap: concreteBump,
    bumpScale: 0.055,
    roughness: 0.88,
    metalness: 0.06,
  });
  const sillMat = new THREE.MeshStandardMaterial({
    color: 0x5c6169,
    roughness: 0.86,
    metalness: 0.08,
  });

  const geo = new THREE.BoxGeometry(obs.w, obs.h, obs.d);
  applyWorldBoxUVs(geo, obs.w, obs.h, obs.d, 4.5);
  const wall = new THREE.Mesh(geo, wallMat);
  wall.position.y = obs.h * 0.5;
  wall.castShadow = true;
  wall.receiveShadow = true;
  group.add(wall);

  // Subtle concrete window sill / base plinth for ground and upper-floor window sills
  if (obs.h <= 1.28) {
    const sill = new THREE.Mesh(
      new THREE.BoxGeometry(obs.w + 0.14, 0.08, obs.d + 0.06),
      sillMat
    );
    sill.position.y = obs.h - 0.04;
    sill.castShadow = true;
    sill.receiveShadow = true;
    group.add(sill);
  }

  return group;
}

export function buildBuildingFloor(
  obs: MapObstacle,
  concreteTex: THREE.Texture,
  concreteBump: THREE.Texture
): THREE.Group {
  const group = new THREE.Group();
  group.position.set(obs.x, obs.y, obs.z);

  const slabMat = new THREE.MeshStandardMaterial({
    color: 0xd1d5db,
    map: concreteTex,
    bumpMap: concreteBump,
    bumpScale: 0.045,
    roughness: 0.88,
    metalness: 0.06,
  });

  const geo = new THREE.BoxGeometry(obs.w, obs.h, obs.d);
  applyWorldBoxUVs(geo, obs.w, obs.h, obs.d, 5.0);
  const slab = new THREE.Mesh(geo, slabMat);
  slab.position.y = obs.h * 0.5;
  slab.castShadow = true;
  slab.receiveShadow = true;
  group.add(slab);

  return group;
}

export function buildBuildingRoof(
  obs: MapObstacle,
  concreteTex: THREE.Texture,
  concreteBump: THREE.Texture
): THREE.Group {
  const group = new THREE.Group();
  group.position.set(obs.x, obs.y, obs.z);

  const roofMat = new THREE.MeshStandardMaterial({
    color: 0x9ca3af,
    map: concreteTex,
    bumpMap: concreteBump,
    bumpScale: 0.04,
    roughness: 0.9,
    metalness: 0.08,
  });
  const beamMat = new THREE.MeshStandardMaterial({
    color: 0x3f444d,
    roughness: 0.65,
    metalness: 0.45,
  });

  const slabGeo = new THREE.BoxGeometry(obs.w, obs.h, obs.d);
  applyWorldBoxUVs(slabGeo, obs.w, obs.h, obs.d, 6.0);
  const slab = new THREE.Mesh(slabGeo, roofMat);
  slab.position.y = obs.h * 0.5;
  slab.castShadow = true;
  slab.receiveShadow = true;
  group.add(slab);

  // Exposed structural ceiling beams underneath roof for interior visual depth
  const beamCount = Math.max(3, Math.floor(obs.d / 12));
  const stepZ = obs.d / (beamCount + 1);
  for (let i = 1; i <= beamCount; i++) {
    const zPos = -obs.d * 0.5 + i * stepZ;
    const beam = new THREE.Mesh(
      new THREE.BoxGeometry(obs.w - 1.2, 0.28, 0.45),
      beamMat
    );
    beam.position.set(0, -0.14, zPos);
    beam.castShadow = true;
    group.add(beam);
  }

  return group;
}

export function buildSandstoneWall(
  obs: MapObstacle,
  sandstoneTex: THREE.Texture,
  sandstoneBump: THREE.Texture
): THREE.Group {
  const group = new THREE.Group();
  group.position.set(obs.x, obs.y, obs.z);

  const wallMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: sandstoneTex,
    bumpMap: sandstoneBump,
    bumpScale: 0.06,
    roughness: 0.88,
    metalness: 0.04,
  });
  const copingMat = new THREE.MeshStandardMaterial({
    color: 0xa67c52,
    roughness: 0.86,
    metalness: 0.05,
  });

  const geo = new THREE.BoxGeometry(obs.w, obs.h, obs.d);
  applyWorldBoxUVs(geo, obs.w, obs.h, obs.d, 4.5);
  const mesh = new THREE.Mesh(geo, wallMat);
  mesh.position.y = obs.h * 0.5;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);

  const coping = new THREE.Mesh(
    new THREE.BoxGeometry(obs.w + 0.14, 0.12, obs.d + 0.14),
    copingMat
  );
  coping.position.y = obs.h - 0.05;
  coping.castShadow = true;
  coping.receiveShadow = true;
  group.add(coping);

  return group;
}

export function buildMetalAwning(
  obs: MapObstacle,
  metalTex: THREE.Texture,
  metalBump: THREE.Texture
): THREE.Group {
  const group = new THREE.Group();
  group.position.set(obs.x, obs.y, obs.z);

  const metalMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: metalTex,
    bumpMap: metalBump,
    bumpScale: 0.07,
    roughness: 0.62,
    metalness: 0.55,
  });
  const trussMat = new THREE.MeshStandardMaterial({
    color: 0x3b2f26,
    roughness: 0.78,
    metalness: 0.35,
  });

  const roofGeo = new THREE.BoxGeometry(obs.w, obs.h, obs.d);
  applyWorldBoxUVs(roofGeo, obs.w, obs.h, obs.d, 3.2);
  const roof = new THREE.Mesh(roofGeo, metalMat);
  roof.position.y = obs.h * 0.5;
  roof.castShadow = true;
  roof.receiveShadow = true;
  group.add(roof);

  // Support beams underneath corrugated shed roof
  const beamCount = Math.max(2, Math.floor(obs.d / 9));
  const stepZ = obs.d / (beamCount + 1);
  for (let i = 1; i <= beamCount; i++) {
    const zPos = -obs.d * 0.5 + i * stepZ;
    const beam = new THREE.Mesh(
      new THREE.BoxGeometry(obs.w - 0.3, 0.24, 0.32),
      trussMat
    );
    beam.position.set(0, -0.12, zPos);
    beam.castShadow = true;
    group.add(beam);
  }

  return group;
}

export function buildSquarePlatform(
  obs: MapObstacle,
  concreteTex: THREE.Texture,
  concreteBump: THREE.Texture
): THREE.Group {
  const group = new THREE.Group();
  group.position.set(obs.x, obs.y, obs.z);

  const concreteMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: concreteTex,
    bumpMap: concreteBump,
    bumpScale: 0.05,
    roughness: 0.86,
    metalness: 0.06,
  });
  const rimMat = new THREE.MeshStandardMaterial({
    color: 0x525861,
    roughness: 0.82,
    metalness: 0.1,
  });

  const plinthH = 0.24;
  const topSlabH = 0.16;
  const coreH = Math.max(0.2, obs.h - plinthH - topSlabH);

  const plinthGeo = new THREE.BoxGeometry(obs.w + 0.5, plinthH, obs.d + 0.5);
  applyWorldBoxUVs(plinthGeo, obs.w + 0.5, plinthH, obs.d + 0.5, 4);
  const plinth = new THREE.Mesh(plinthGeo, rimMat);
  plinth.position.y = plinthH * 0.5;
  plinth.castShadow = true;
  plinth.receiveShadow = true;
  group.add(plinth);

  const coreGeo = new THREE.BoxGeometry(obs.w - 0.16, coreH, obs.d - 0.16);
  applyWorldBoxUVs(coreGeo, obs.w - 0.16, coreH, obs.d - 0.16, 4);
  const core = new THREE.Mesh(coreGeo, concreteMat);
  core.position.y = plinthH + coreH * 0.5;
  core.castShadow = true;
  core.receiveShadow = true;
  group.add(core);

  const deckGeo = new THREE.BoxGeometry(obs.w, topSlabH, obs.d);
  applyWorldBoxUVs(deckGeo, obs.w, topSlabH, obs.d, 4);
  const deck = new THREE.Mesh(deckGeo, rimMat);
  deck.position.y = plinthH + coreH + topSlabH * 0.5;
  deck.castShadow = true;
  deck.receiveShadow = true;
  group.add(deck);

  // Corner concrete bollards at the 4 corners of the central square platform
  for (const [bx, bz] of [
    [-obs.w * 0.5 + 0.45, -obs.d * 0.5 + 0.45],
    [obs.w * 0.5 - 0.45, -obs.d * 0.5 + 0.45],
    [-obs.w * 0.5 + 0.45, obs.d * 0.5 - 0.45],
    [obs.w * 0.5 - 0.45, obs.d * 0.5 - 0.45],
  ]) {
    const bollard = new THREE.Mesh(
      new THREE.BoxGeometry(0.45, 0.48, 0.45),
      concreteMat
    );
    bollard.position.set(bx, obs.h + 0.24, bz);
    bollard.castShadow = true;
    bollard.receiveShadow = true;
    group.add(bollard);
  }

  return group;
}

