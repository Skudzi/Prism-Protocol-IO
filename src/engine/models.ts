import * as THREE from 'three';
import { getOperatorWeaponBodyStyle } from '../game/rules';
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
  xrayOutlineMat: THREE.Material | null;
  nametagSprite: THREE.Sprite | null;
  nametagTexture: THREE.CanvasTexture | null;
  spawnShieldRing: THREE.Mesh;
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
  rig.spawnShieldRing.geometry.dispose();
  (rig.spawnShieldRing.material as THREE.Material).dispose();
}

export function buildWeaponViewModel(
  weaponId: WeaponId,
  skin: WeaponSkinDef,
  avatarSkin?: AvatarSkinDef,
  options?: { disableClearcoat?: boolean }
): THREE.Group {
  const group = new THREE.Group();
  const pbr = createWeaponPBRTextures(skin);
  const knurl = createGripKnurlTextures();
  const clearcoatMult = options?.disableClearcoat ? 0 : 1;
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
    clearcoat: (isClearcoat ? 0.88 : 0.28) * clearcoatMult,
    clearcoatRoughness: skin.pattern === 'rainbow' || skin.pattern === 'prism_holo' ? 0.08 : 0.18,
    reflectivity: 0.92,
  });
  const trimMat = new THREE.MeshPhysicalMaterial({
    color: skin.secondaryColor,
    bumpMap: pbr.bumpMap,
    bumpScale: 0.006,
    metalness: Math.min(0.98, skin.metalness + 0.12),
    roughness: Math.max(0.12, skin.roughness - 0.08),
    clearcoat: (isClearcoat ? 0.65 : 0.2) * clearcoatMult,
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
    clearcoat: (isWoodGrip ? 0.68 : 0.08) * clearcoatMult,
    clearcoatRoughness: 0.22,
  });

  const scopeMat = new THREE.MeshPhysicalMaterial({
    color: isWoodGrip ? 0xffffff : skin.scopeColor,
    map: woodPbr?.map ?? null,
    bumpMap: woodPbr?.bumpMap ?? null,
    bumpScale: isWoodGrip ? 0.01 : 0,
    roughness: isWoodGrip ? 0.36 : 0.24,
    metalness: isWoodGrip ? 0.22 : 0.82,
    clearcoat: 0.75 * clearcoatMult,
    clearcoatRoughness: 0.12,
  });

  const opticGlassMat = new THREE.MeshPhysicalMaterial({
    color: skin.emissiveColor,
    emissive: skin.emissiveColor,
    emissiveIntensity: 0.75,
    metalness: 0.15,
    roughness: 0.06,
    clearcoat: 1.0 * clearcoatMult,
    clearcoatRoughness: 0.04,
    reflectivity: 1.0,
  });

  const gunmetalMat = new THREE.MeshStandardMaterial({
    color: 0x202630,
    bumpMap: knurl.bumpMap,
    bumpScale: 0.005,
    metalness: 0.84,
    roughness: 0.34,
  });
  const boltSteelMat = new THREE.MeshStandardMaterial({
    color: 0x9aa4b2,
    metalness: 0.92,
    roughness: 0.2,
  });
  const ventGlowMat = new THREE.MeshStandardMaterial({
    color: skin.emissiveColor,
    emissive: skin.emissiveColor,
    emissiveIntensity: 0.85,
    roughness: 0.22,
    metalness: 0.35,
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
    // Realistic Compact Tactical PDW / MPX-style SMG
    const upperReceiver = new THREE.Mesh(new THREE.BoxGeometry(0.088, 0.068, 0.36), bodyMat);
    upperReceiver.position.set(0, 0.022, -0.02);
    group.add(upperReceiver);

    const lowerReceiver = new THREE.Mesh(new THREE.BoxGeometry(0.082, 0.052, 0.24), gunmetalMat);
    lowerReceiver.position.set(0, -0.032, 0.02);
    group.add(lowerReceiver);

    // Ejection port recess + machined brushed-steel bolt carrier on right side
    const ejectPort = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.028, 0.072), gunmetalMat);
    ejectPort.position.set(0.04, 0.026, -0.02);
    group.add(ejectPort);

    const boltCarrier = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.022, 0.062), boltSteelMat);
    boltCarrier.position.set(0.043, 0.026, -0.02);
    group.add(boltCarrier);

    // Left-side folding charging handle
    const chargeKnob = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.014, 0.024), gunmetalMat);
    chargeKnob.position.set(-0.054, 0.028, -0.14);
    group.add(chargeKnob);

    // Slotted top Picatinny rail
    const topRailBase = new THREE.Mesh(new THREE.BoxGeometry(0.044, 0.01, 0.33), gunmetalMat);
    topRailBase.position.set(0, 0.061, -0.04);
    group.add(topRailBase);
    for (let rz = -0.19; rz <= 0.11; rz += 0.032) {
      const tooth = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.008, 0.016), trimMat);
      tooth.position.set(0, 0.069, rz);
      group.add(tooth);
    }

    // Perforated ventilated M-LOK shroud & barrel sleeve
    const handguard = new THREE.Mesh(new THREE.BoxGeometry(0.072, 0.062, 0.19), bodyMat);
    handguard.position.set(0, 0.018, -0.25);
    group.add(handguard);

    for (let vz = -0.31; vz <= -0.19; vz += 0.04) {
      const slotL = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.016, 0.024), gunmetalMat);
      slotL.position.set(-0.038, 0.018, vz);
      group.add(slotL);
      const slotR = slotL.clone();
      slotR.position.x = 0.038;
      group.add(slotR);
    }
    const ventL = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.007, 0.12), ventGlowMat);
    ventL.position.set(-0.038, 0.033, -0.25);
    group.add(ventL);
    const ventR = ventL.clone();
    ventR.position.x = 0.038;
    group.add(ventR);

    // Right-rail compact tactical laser / illuminator module
    const peqBody = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.026, 0.075), gunmetalMat);
    peqBody.position.set(0.049, 0.02, -0.24);
    group.add(peqBody);
    const peqEmitter = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.012, 8), ventGlowMat);
    peqEmitter.rotation.x = Math.PI / 2;
    peqEmitter.position.set(0.051, 0.022, -0.281);
    group.add(peqEmitter);

    // Exposed steel barrel collar + ribbed cylindrical tactical suppressor
    const innerBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.014, 0.06, 12), boltSteelMat);
    innerBarrel.rotation.x = Math.PI / 2;
    innerBarrel.position.set(0, 0.016, -0.355);
    group.add(innerBarrel);

    const suppressor = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.023, 0.15, 16), gunmetalMat);
    suppressor.rotation.x = Math.PI / 2;
    suppressor.position.set(0, 0.016, -0.445);
    group.add(suppressor);

    for (const sz of [-0.39, -0.43, -0.47, -0.505]) {
      const rib = new THREE.Mesh(new THREE.TorusGeometry(0.0225, 0.003, 6, 16), trimMat);
      rib.position.set(0, 0.016, sz);
      group.add(rib);
    }

    // Skeletonized riser + enclosed micro red-dot reflex optic
    const riser = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.018, 0.056), gunmetalMat);
    riser.position.set(0, 0.08, -0.02);
    group.add(riser);

    const opticBody = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.068, 14), scopeMat);
    opticBody.rotation.x = Math.PI / 2;
    opticBody.position.set(0, 0.105, -0.02);
    group.add(opticBody);

    const opticHood = new THREE.Mesh(new THREE.BoxGeometry(0.048, 0.034, 0.044), gunmetalMat);
    opticHood.position.set(0, 0.105, -0.02);
    group.add(opticHood);

    const reflexLens = new THREE.Mesh(new THREE.CircleGeometry(0.018, 14), opticGlassMat);
    reflexLens.position.set(0, 0.105, 0.016);
    group.add(reflexLens);

    // Flared magwell + 35-rd extended ribbed stick magazine
    const magwell = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.036, 0.068), gunmetalMat);
    magwell.position.set(0, -0.062, -0.055);
    group.add(magwell);

    const mag = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.17, 0.048), gripMat);
    mag.position.set(0, -0.145, -0.072);
    mag.rotation.x = -0.16;
    group.add(mag);
    for (const my of [-0.11, -0.15, -0.19]) {
      const magRib = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.01, 0.052), gunmetalMat);
      magRib.position.set(0, my, -0.068 - (my + 0.145) * 0.16);
      magRib.rotation.x = -0.16;
      group.add(magRib);
    }

    // Trigger guard, curved trigger, angled handstop, stippled grip & collapsible dual-rod PDW wire stock
    const triggerGuard = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.036, 0.062), gunmetalMat);
    triggerGuard.position.set(0, -0.068, 0.03);
    group.add(triggerGuard);

    const trigger = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.024, 0.012), boltSteelMat);
    trigger.position.set(0, -0.062, 0.032);
    trigger.rotation.x = 0.25;
    group.add(trigger);

    const handStop = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.045, 0.048), gripMat);
    handStop.position.set(0, -0.036, -0.24);
    handStop.rotation.x = -0.25;
    group.add(handStop);

    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.054, 0.135, 0.076), gripMat);
    grip.position.set(0, -0.105, 0.11);
    grip.rotation.x = 0.24;
    group.add(grip);

    for (const sx of [-0.03, 0.03]) {
      const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.17, 8), boltSteelMat);
      rod.rotation.x = Math.PI / 2;
      rod.position.set(sx, 0.015, 0.24);
      group.add(rod);
    }
    const wireButtplate = new THREE.Mesh(new THREE.BoxGeometry(0.072, 0.1, 0.024), gunmetalMat);
    wireButtplate.position.set(0, -0.005, 0.325);
    group.add(wireButtplate);
  } else {
    // Realistic Tactical M416 / SCAR-inspired Assault Rifle (Pulse Carbine)
    const upperReceiver = new THREE.Mesh(new THREE.BoxGeometry(0.096, 0.072, 0.42), bodyMat);
    upperReceiver.position.set(0, 0.022, -0.01);
    group.add(upperReceiver);

    const lowerReceiver = new THREE.Mesh(new THREE.BoxGeometry(0.088, 0.056, 0.29), gunmetalMat);
    lowerReceiver.position.set(0, -0.036, 0.035);
    group.add(lowerReceiver);

    // Ejection port, brushed-steel bolt carrier & brass deflector on right side
    const ejectPort = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.03, 0.082), gunmetalMat);
    ejectPort.position.set(0.044, 0.026, -0.01);
    group.add(ejectPort);

    const boltPlate = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.024, 0.07), boltSteelMat);
    boltPlate.position.set(0.047, 0.026, -0.01);
    group.add(boltPlate);

    const brassDeflector = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.03, 0.024), trimMat);
    brassDeflector.position.set(0.052, 0.026, 0.044);
    brassDeflector.rotation.y = 0.35;
    group.add(brassDeflector);

    // Rear T-handle charging latch & fire selector switch
    const chargingHandle = new THREE.Mesh(new THREE.BoxGeometry(0.062, 0.016, 0.022), gunmetalMat);
    chargingHandle.position.set(0, 0.048, 0.198);
    group.add(chargingHandle);

    const selectorSwitch = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.012, 0.034), boltSteelMat);
    selectorSwitch.position.set(-0.048, -0.022, 0.115);
    selectorSwitch.rotation.x = -0.35;
    group.add(selectorSwitch);

    // Full-length slotted top Picatinny rail
    const railBase = new THREE.Mesh(new THREE.BoxGeometry(0.048, 0.01, 0.56), gunmetalMat);
    railBase.position.set(0, 0.063, -0.1);
    group.add(railBase);
    for (let rz = -0.36; rz <= 0.16; rz += 0.036) {
      const tooth = new THREE.Mesh(new THREE.BoxGeometry(0.044, 0.008, 0.018), trimMat);
      tooth.position.set(0, 0.071, rz);
      group.add(tooth);
    }

    // Ventilated octagonal M-LOK / Quad-Rail handguard + recessed heat vents
    const handguard = new THREE.Mesh(new THREE.BoxGeometry(0.082, 0.074, 0.25), bodyMat);
    handguard.position.set(0, 0.018, -0.29);
    group.add(handguard);

    const handguardBottom = new THREE.Mesh(new THREE.BoxGeometry(0.054, 0.014, 0.24), gunmetalMat);
    handguardBottom.position.set(0, -0.024, -0.29);
    group.add(handguardBottom);

    for (let hz = -0.38; hz <= -0.2; hz += 0.042) {
      const ventCutL = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.02, 0.024), gunmetalMat);
      ventCutL.position.set(-0.042, 0.016, hz);
      group.add(ventCutL);
      const ventCutR = ventCutL.clone();
      ventCutR.position.x = 0.042;
      group.add(ventCutR);
    }
    const ventGlowL = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.007, 0.17), ventGlowMat);
    ventGlowL.position.set(-0.042, 0.034, -0.29);
    group.add(ventGlowL);
    const ventGlowR = ventGlowL.clone();
    ventGlowR.position.x = 0.042;
    group.add(ventGlowR);

    // Gas block + heavy cold-hammer-forged steel barrel + 3-prong flash suppressor
    const gasBlock = new THREE.Mesh(new THREE.BoxGeometry(0.044, 0.052, 0.038), gunmetalMat);
    gasBlock.position.set(0, 0.022, -0.43);
    group.add(gasBlock);

    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.019, 0.24, 14), boltSteelMat);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.018, -0.5);
    group.add(barrel);

    const flashHiderBase = new THREE.Mesh(new THREE.CylinderGeometry(0.021, 0.022, 0.055, 12), gunmetalMat);
    flashHiderBase.rotation.x = Math.PI / 2;
    flashHiderBase.position.set(0, 0.018, -0.625);
    group.add(flashHiderBase);
    for (let i = 0; i < 3; i++) {
      const ang = (i / 3) * Math.PI * 2;
      const prong = new THREE.Mesh(new THREE.BoxGeometry(0.007, 0.007, 0.042), gunmetalMat);
      prong.position.set(Math.cos(ang) * 0.015, 0.018 + Math.sin(ang) * 0.015, -0.66);
      group.add(prong);
    }

    // Tactical Holographic Reflex Sight + windage turret + coated lens
    const opticMount = new THREE.Mesh(new THREE.BoxGeometry(0.046, 0.016, 0.095), gunmetalMat);
    opticMount.position.set(0, 0.082, -0.02);
    group.add(opticMount);

    const opticHoodTop = new THREE.Mesh(new THREE.BoxGeometry(0.054, 0.01, 0.085), scopeMat);
    opticHoodTop.position.set(0, 0.132, -0.02);
    group.add(opticHoodTop);

    const opticWallL = new THREE.Mesh(new THREE.BoxGeometry(0.009, 0.044, 0.082), scopeMat);
    opticWallL.position.set(-0.023, 0.109, -0.02);
    group.add(opticWallL);
    const opticWallR = opticWallL.clone();
    opticWallR.position.x = 0.023;
    group.add(opticWallR);

    const windageKnob = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.014, 10), trimMat);
    windageKnob.rotation.z = Math.PI / 2;
    windageKnob.position.set(0.032, 0.106, -0.015);
    group.add(windageKnob);

    const scopeLens = new THREE.Mesh(new THREE.PlaneGeometry(0.034, 0.028), opticGlassMat);
    scopeLens.position.set(0, 0.11, 0.02);
    group.add(scopeLens);

    // Flared magwell + curved ribbed 30-rd STANAG magazine
    const magwell = new THREE.Mesh(new THREE.BoxGeometry(0.068, 0.04, 0.092), gunmetalMat);
    magwell.position.set(0, -0.068, -0.045);
    group.add(magwell);

    const magUpper = new THREE.Mesh(new THREE.BoxGeometry(0.044, 0.085, 0.072), gripMat);
    magUpper.position.set(0, -0.112, -0.042);
    magUpper.rotation.x = 0.08;
    group.add(magUpper);

    const magLower = new THREE.Mesh(new THREE.BoxGeometry(0.044, 0.095, 0.07), gripMat);
    magLower.position.set(0, -0.19, -0.022);
    magLower.rotation.x = 0.24;
    group.add(magLower);

    // Trigger guard, curved trigger, angled tactical foregrip, pistol grip & collapsible carbine stock
    const triggerGuard = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.042, 0.07), gunmetalMat);
    triggerGuard.position.set(0, -0.076, 0.056);
    group.add(triggerGuard);

    const trigger = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.026, 0.012), boltSteelMat);
    trigger.position.set(0, -0.068, 0.058);
    trigger.rotation.x = 0.28;
    group.add(trigger);

    const foregrip = new THREE.Mesh(new THREE.BoxGeometry(0.044, 0.105, 0.056), gripMat);
    foregrip.position.set(0, -0.085, -0.2);
    foregrip.rotation.x = -0.14;
    group.add(foregrip);

    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.058, 0.145, 0.082), gripMat);
    grip.position.set(0, -0.115, 0.14);
    grip.rotation.x = 0.26;
    group.add(grip);

    const bufferTube = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.16, 12), gunmetalMat);
    bufferTube.rotation.x = Math.PI / 2;
    bufferTube.position.set(0, 0.018, 0.265);
    group.add(bufferTube);

    const stockCheek = new THREE.Mesh(new THREE.BoxGeometry(0.062, 0.095, 0.125), bodyMat);
    stockCheek.position.set(0, -0.006, 0.305);
    group.add(stockCheek);

    const buttPad = new THREE.Mesh(new THREE.BoxGeometry(0.064, 0.11, 0.022), gunmetalMat);
    buttPad.position.set(0, -0.014, 0.372);
    group.add(buttPad);
  }

  // First-person Tactical Gloved Hands & Cordura Forearm Sleeves holding the weapon
  const effectiveAvatarSkin: AvatarSkinDef = avatarSkin ?? {
    id: 'vanguard_cyan',
    name: 'Vanguard Cyan',
    armorColor: '#1e293b',
    clothingColor: '#334155',
    trimColor: '#38bdf8',
    visorColor: '#06b6d4',
    price: 0,
    unlockSource: 'starter',
  };
  const bodyStyle = getOperatorWeaponBodyStyle(weaponId, effectiveAvatarSkin);
  const sleevePbr = createArmorPBRTextures(
    bodyStyle.clothingColorHex,
    effectiveAvatarSkin.trimColor,
    'cloth'
  );
  const sleeveMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: sleevePbr.map,
    bumpMap: sleevePbr.bumpMap,
    bumpScale: 0.01,
    roughnessMap: sleevePbr.roughnessMap,
    roughness: bodyStyle.clothRoughness,
    metalness: bodyStyle.clothMetalness,
  });
  const cuffMat = new THREE.MeshPhysicalMaterial({
    color: bodyStyle.armorColorHex,
    roughness: bodyStyle.armorRoughness,
    metalness: bodyStyle.armorMetalness,
    clearcoat: bodyStyle.armorClearcoat,
    clearcoatRoughness: bodyStyle.armorClearcoatRoughness,
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
    color: effectiveAvatarSkin.visorColor,
    emissive: effectiveAvatarSkin.visorColor,
    emissiveIntensity: 1.4,
    roughness: 0.2,
  });
  const armSlim = bodyStyle.isFemaleBody ? 0.84 : 1.0;

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

  const rightCuff = new THREE.Mesh(
    new THREE.CylinderGeometry(0.048 * armSlim, 0.054 * armSlim, 0.08, 12),
    cuffMat
  );
  rightCuff.position.set(rightGripPos.x + 0.045, rightGripPos.y - 0.05, rightGripPos.z + 0.095);
  rightCuff.rotation.set(0.96, 0, -0.24);
  group.add(rightCuff);

  const rightStrip = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.064, 0.014), wristStripMat);
  rightStrip.position.set(rightGripPos.x + 0.008, rightGripPos.y - 0.042, rightGripPos.z + 0.085);
  rightStrip.rotation.set(0.96, 0, -0.24);
  group.add(rightStrip);

  const rightForearm = new THREE.Mesh(
    new THREE.CylinderGeometry(0.054 * armSlim, 0.072 * armSlim, 0.4, 12),
    sleeveMat
  );
  rightForearm.position.set(rightGripPos.x + 0.115, rightGripPos.y - 0.15, rightGripPos.z + 0.25);
  rightForearm.rotation.set(0.96, 0, -0.28);
  group.add(rightForearm);

  // Left hand + angled forearm cradling the foregrip / handguard
  const leftSupportPos =
    weaponId === 'volt_scatter'
      ? new THREE.Vector3(-0.015, -0.055, -0.22)
      : weaponId === 'arc_repeater'
      ? new THREE.Vector3(-0.012, -0.046, -0.215)
      : weaponId === 'pulse_carbine'
      ? new THREE.Vector3(-0.012, -0.078, -0.2)
      : new THREE.Vector3(-0.015, -0.065, -0.17);

  const leftPalm = new THREE.Mesh(new THREE.BoxGeometry(0.092 * armSlim, 0.072, 0.105), gloveMat);
  leftPalm.position.set(leftSupportPos.x - 0.008, leftSupportPos.y, leftSupportPos.z);
  group.add(leftPalm);

  const leftKnuckles = new THREE.Mesh(new THREE.BoxGeometry(0.096 * armSlim, 0.028, 0.068), cuffMat);
  leftKnuckles.position.set(leftSupportPos.x - 0.024, leftSupportPos.y - 0.014, leftSupportPos.z);
  group.add(leftKnuckles);

  const leftThumb = new THREE.Mesh(new THREE.CapsuleGeometry(0.015, 0.048, 4, 8), gloveMat);
  leftThumb.position.set(leftSupportPos.x - 0.05, leftSupportPos.y + 0.036, leftSupportPos.z - 0.016);
  leftThumb.rotation.x = Math.PI / 2.2;
  group.add(leftThumb);

  const wristAnchor = new THREE.Vector3(
    leftSupportPos.x - 0.026,
    leftSupportPos.y - 0.01,
    leftSupportPos.z + 0.045
  );
  const elbowAnchor = new THREE.Vector3(
    leftSupportPos.x - 0.31,
    leftSupportPos.y - 0.23,
    leftSupportPos.z + 0.42
  );
  const forearmDir = wristAnchor.clone().sub(elbowAnchor);
  const forearmLen = forearmDir.length();
  const forearmAxis = forearmDir.clone().normalize();
  const upAxis = new THREE.Vector3(0, 1, 0);

  const leftCuff = new THREE.Mesh(
    new THREE.CylinderGeometry(0.044 * armSlim, 0.05 * armSlim, 0.085, 12),
    cuffMat
  );
  leftCuff.position.copy(wristAnchor).addScaledVector(forearmAxis, -0.038);
  leftCuff.quaternion.setFromUnitVectors(upAxis, forearmAxis);
  group.add(leftCuff);

  const sleeveLen = Math.max(0.28, forearmLen - 0.06);
  const leftForearm = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05 * armSlim, 0.072 * armSlim, sleeveLen, 12),
    sleeveMat
  );
  leftForearm.position.copy(wristAnchor).addScaledVector(forearmAxis, -(0.06 + sleeveLen * 0.5));
  leftForearm.quaternion.setFromUnitVectors(upAxis, forearmAxis);
  group.add(leftForearm);

  return group;
}

/**
 * Realistic multi-part tactical laser tag operator with helmet, visor, jacket/clothing, armor, and articulated limbs.
 */
export function buildAvatarRig(
  skin: AvatarSkinDef,
  _teamColorHex: string,
  shadowTexture: THREE.Texture,
  relation: 'ally' | 'enemy' = 'enemy',
  nickname?: string,
  weaponId: WeaponId = 'pulse_carbine',
  allyStencilIndex = 0
): AnimatedAvatarRig {
  const group = new THREE.Group();
  const bodyStyle = getOperatorWeaponBodyStyle(weaponId, skin);

  const outlineMat = new THREE.MeshBasicMaterial({
    color: relation === 'ally' ? 0x38bdf8 : 0xef4444,
    side: THREE.BackSide,
    toneMapped: false,
    fog: false,
  });

  // Teammates (TDM allies) render in their real customizable skin colors and get
  // a crisp, hollow blue silhouette outline visible BOTH in open view AND through walls.
  const allySlot = Math.max(0, allyStencilIndex) % 200;
  const allyStencilRef = 10 + allySlot;
  const maskRenderOrder = 100 + allySlot * 2;
  const outlineRenderOrder = 101 + allySlot * 2;

  const xrayMaskMat =
    relation === 'ally'
      ? new THREE.MeshBasicMaterial({
          side: THREE.DoubleSide,
          colorWrite: false,
          depthWrite: false,
          depthTest: false,
          transparent: true,
          opacity: 1,
          stencilWrite: true,
          stencilWriteMask: 0xff,
          stencilRef: allyStencilRef,
          stencilFunc: THREE.AlwaysStencilFunc,
          stencilFail: THREE.ReplaceStencilOp,
          stencilZFail: THREE.ReplaceStencilOp,
          stencilZPass: THREE.ReplaceStencilOp,
        })
      : null;

  const xrayOutlineMat =
    relation === 'ally'
      ? new THREE.ShaderMaterial({
          side: THREE.DoubleSide,
          transparent: true,
          depthTest: false,
          depthWrite: false,
          stencilWrite: true,
          stencilWriteMask: 0x00,
          stencilFunc: THREE.NotEqualStencilFunc,
          stencilFuncMask: 0xff,
          stencilRef: allyStencilRef,
          stencilFail: THREE.KeepStencilOp,
          stencilZFail: THREE.KeepStencilOp,
          stencilZPass: THREE.KeepStencilOp,
          toneMapped: false,
          fog: false,
          vertexShader: /* glsl */ `
            void main() {
              vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
              vec4 mvCenter = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
              float dist = max(1.5, -mvCenter.z);
              float pad = clamp(dist * 0.0038, 0.036, 0.24);
              vec3 outDir = mvPos.xyz - mvCenter.xyz;
              float outLen = length(outDir);
              if (outLen > 0.0001) {
                mvPos.xyz += (outDir / outLen) * pad;
              }
              gl_Position = projectionMatrix * mvPos;
            }
          `,
          fragmentShader: /* glsl */ `
            void main() {
              gl_FragColor = vec4(0.22, 0.74, 0.98, 0.96);
            }
          `,
        })
      : null;

  const addOutlineShell = (
    parent: THREE.Object3D,
    sourceMesh: THREE.Mesh,
    _padMeters = 0.036
  ) => {
    if (relation !== 'ally' || !xrayMaskMat || !xrayOutlineMat) {
      return;
    }

    const geo = sourceMesh.geometry;

    const mask = new THREE.Mesh(geo, xrayMaskMat);
    mask.position.copy(sourceMesh.position);
    mask.rotation.copy(sourceMesh.rotation);
    mask.scale.copy(sourceMesh.scale);
    mask.renderOrder = maskRenderOrder;
    mask.castShadow = false;
    mask.receiveShadow = false;
    mask.frustumCulled = false;
    parent.add(mask);

    const xrayShell = new THREE.Mesh(geo, xrayOutlineMat);
    xrayShell.position.copy(sourceMesh.position);
    xrayShell.rotation.copy(sourceMesh.rotation);
    xrayShell.scale.copy(sourceMesh.scale);
    xrayShell.renderOrder = outlineRenderOrder;
    xrayShell.castShadow = false;
    xrayShell.receiveShadow = false;
    xrayShell.frustumCulled = false;
    parent.add(xrayShell);
  };

  const clothPbr = createArmorPBRTextures(bodyStyle.clothingColorHex, skin.trimColor, 'cloth');
  const armorPbr = createArmorPBRTextures(bodyStyle.armorColorHex, skin.trimColor, 'armor');

  const clothMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: clothPbr.map,
    bumpMap: clothPbr.bumpMap,
    bumpScale: 0.012,
    roughnessMap: clothPbr.roughnessMap,
    roughness: bodyStyle.clothRoughness,
    metalness: bodyStyle.clothMetalness,
  });
  const armorMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    map: armorPbr.map,
    bumpMap: armorPbr.bumpMap,
    bumpScale: 0.015,
    roughnessMap: armorPbr.roughnessMap,
    metalness: bodyStyle.armorMetalness,
    roughness: bodyStyle.armorRoughness,
    clearcoat: bodyStyle.armorClearcoat,
    clearcoatRoughness: bodyStyle.armorClearcoatRoughness,
  });
  const trimMat = new THREE.MeshPhysicalMaterial({
    color: skin.trimColor,
    metalness: bodyStyle.hasBreacherVest ? 0.52 : 0.84,
    roughness: bodyStyle.hasBreacherVest ? 0.28 : 0.22,
    clearcoat: 0.62,
    clearcoatRoughness: 0.18,
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

  // Proportions tailored per weapon body type
  const isWoman = bodyStyle.isFemaleBody;
  const hipSpacing = isWoman ? 0.13 : 0.145;
  const thighR = isWoman ? 0.082 : 0.098;
  const shinR = isWoman ? 0.068 : 0.082;
  const shoulderX = isWoman ? 0.255 : bodyStyle.hasAssaultGear ? 0.36 : 0.345;
  const armRadius = isWoman ? 0.054 : 0.07;

  // Articulated Left & Right Legs (hip pivot at y = 0.88)
  const makeLeg = (side: -1 | 1): THREE.Group => {
    const legPivot = new THREE.Group();
    legPivot.position.set(side * hipSpacing, 0.88, 0);

    const thigh = new THREE.Mesh(new THREE.CapsuleGeometry(thighR, 0.24, 6, 12), clothMat);
    thigh.position.y = -0.2;
    thigh.castShadow = true;
    legPivot.add(thigh);
    addOutlineShell(legPivot, thigh);

    const shin = new THREE.Mesh(new THREE.CapsuleGeometry(shinR, 0.26, 6, 12), armorMat);
    shin.position.y = -0.55;
    shin.castShadow = true;
    legPivot.add(shin);
    addOutlineShell(legPivot, shin);

    const kneePad = new THREE.Mesh(
      new THREE.SphereGeometry(isWoman ? 0.072 : 0.086, 10, 10),
      trimMat
    );
    kneePad.position.set(0, -0.38, 0.05);
    legPivot.add(kneePad);

    const boot = new THREE.Mesh(
      new THREE.BoxGeometry(isWoman ? 0.135 : 0.165, 0.12, isWoman ? 0.24 : 0.27),
      armorMat
    );
    boot.position.set(0, -0.82, 0.04);
    boot.castShadow = true;
    legPivot.add(boot);
    addOutlineShell(legPivot, boot);

    return legPivot;
  };

  const legL = makeLeg(-1);
  const legR = makeLeg(1);
  group.add(legL, legR);

  // Articulated Upper Body Torso Pivot (allows natural lean & turn sway)
  const torso = new THREE.Group();
  torso.position.set(0, 0.92, 0);
  group.add(torso);

  if (isWoman) {
    // Woman Operator (SMG): sculpted pelvis/hips, narrow cinched waist, contoured bust chest
    const hipCurve = new THREE.Mesh(
      new THREE.CylinderGeometry(0.188, 0.168, 0.17, 16),
      armorMat
    );
    hipCurve.scale.set(1.16, 1, 0.86);
    hipCurve.position.y = 0.04;
    torso.add(hipCurve);
    addOutlineShell(torso, hipCurve);

    const waistFlare = new THREE.Mesh(
      new THREE.CylinderGeometry(0.142, 0.19, 0.12, 16),
      clothMat
    );
    waistFlare.scale.set(1.1, 1, 0.82);
    waistFlare.position.y = 0.15;
    torso.add(waistFlare);
    addOutlineShell(torso, waistFlare);

    const waistTorso = new THREE.Mesh(
      new THREE.CylinderGeometry(0.195, 0.142, 0.34, 16),
      clothMat
    );
    waistTorso.scale.set(1.02, 1, 0.72);
    waistTorso.position.y = 0.37;
    waistTorso.castShadow = true;
    torso.add(waistTorso);
    addOutlineShell(torso, waistTorso);

    const bustArmor = new THREE.Mesh(
      new THREE.BoxGeometry(0.32, 0.21, 0.28),
      armorMat
    );
    bustArmor.position.set(0, 0.39, 0.04);
    bustArmor.rotation.x = -0.18;
    bustArmor.castShadow = true;
    torso.add(bustArmor);
    addOutlineShell(torso, bustArmor);
  } else if (bodyStyle.hasAssaultGear) {
    // AR Operator (1st gun): Athletic Spec-Ops torso + flared field-coat hip tails (distinct from heavy Shotgun breacher)
    const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.2, 0.09, 14), armorMat);
    belt.position.y = 0;
    torso.add(belt);

    const jacket = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.195, 0.5, 14), clothMat);
    jacket.scale.set(1.02, 1, 0.72);
    jacket.position.y = 0.29;
    jacket.castShadow = true;
    torso.add(jacket);
    addOutlineShell(torso, jacket);

    const chestPlate = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.34, 0.28), armorMat);
    chestPlate.position.set(0, 0.34, 0.01);
    chestPlate.castShadow = true;
    torso.add(chestPlate);
    addOutlineShell(torso, chestPlate);
  } else {
    // Standard / Heavy Tactical Torso (Shotgun & Sniper)
    const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.23, 0.1, 14), armorMat);
    belt.position.y = 0;
    torso.add(belt);

    const jacket = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.23, 0.52, 14), clothMat);
    jacket.scale.set(1.1, 1, 0.78);
    jacket.position.y = 0.3;
    jacket.castShadow = true;
    torso.add(jacket);
    addOutlineShell(torso, jacket);

    const chestPlate = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.38, 0.34), armorMat);
    chestPlate.position.set(0, 0.33, 0.01);
    chestPlate.castShadow = true;
    torso.add(chestPlate);
    addOutlineShell(torso, chestPlate);
  }

  // Chest core sensor ring uses skin's own visor/accent color (no forced blue fill!)
  const chestCore = new THREE.Mesh(
    new THREE.CylinderGeometry(bodyStyle.hasAssaultGear ? 0.068 : 0.085, bodyStyle.hasAssaultGear ? 0.068 : 0.085, 0.36, 16),
    visorMat
  );
  chestCore.rotation.x = Math.PI / 2;
  chestCore.position.set(0, 0.36, 0.02);
  torso.add(chestCore);

  // Jacket collar
  const collar = new THREE.Mesh(
    new THREE.TorusGeometry(isWoman ? 0.12 : 0.145, 0.038, 8, 16),
    clothMat
  );
  collar.rotation.x = Math.PI / 2;
  collar.position.y = 0.57;
  torso.add(collar);

  // Weapon-Specific Torso Equipment
  if (bodyStyle.hasBreacherVest) {
    // Shotgun Operator: Heavy Tactical Breacher Vest in lighter skin tint (e.g. light red for Crimson Striker)
    const vestPbr = createArmorPBRTextures(bodyStyle.vestColorHex, skin.trimColor, 'armor');
    const vestMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      map: vestPbr.map,
      bumpMap: vestPbr.bumpMap,
      bumpScale: 0.014,
      roughnessMap: vestPbr.roughnessMap,
      metalness: 0.22,
      roughness: 0.48,
      clearcoat: 0.28,
      clearcoatRoughness: 0.32,
    });

    const vestFront = new THREE.Mesh(new THREE.BoxGeometry(0.49, 0.4, 0.4), vestMat);
    vestFront.position.set(0, 0.33, 0.015);
    vestFront.castShadow = true;
    torso.add(vestFront);
    addOutlineShell(torso, vestFront);

    const vestStrapL = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.12, 0.38), vestMat);
    vestStrapL.position.set(-0.16, 0.54, 0.01);
    torso.add(vestStrapL);
    const vestStrapR = vestStrapL.clone();
    vestStrapR.position.set(0.16, 0.54, 0.01);
    torso.add(vestStrapR);

    const vestCollar = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.09, 0.28), vestMat);
    vestCollar.position.set(0, 0.57, -0.02);
    torso.add(vestCollar);

    const lowerAbFlap = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.13, 0.38), vestMat);
    lowerAbFlap.position.set(0, 0.1, 0.03);
    torso.add(lowerAbFlap);

    // Tactical chest rig straps & shell loops on the Breacher Vest
    for (const sx of [-0.16, 0.16]) {
      const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.06, 0.42), trimMat);
      buckle.position.set(sx, 0.48, 0.015);
      torso.add(buckle);
    }
    const chestBand = new THREE.Mesh(new THREE.BoxGeometry(0.495, 0.055, 0.415), armorMat);
    chestBand.position.set(0, 0.22, 0.015);
    torso.add(chestBand);
    for (const sx of [-0.14, -0.05, 0.05, 0.14]) {
      const shellLoop = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.09, 8), trimMat);
      shellLoop.position.set(sx, 0.22, 0.225);
      torso.add(shellLoop);
    }
  } else if (bodyStyle.hasAssaultGear) {
    // AR Operator (1st gun): Flared tactical coat tails + diagonal cross-chest bandolier + twin-cell radio spine pack
    const coatTailL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.42, 0.24), clothMat);
    coatTailL.position.set(-0.22, -0.13, -0.04);
    coatTailL.rotation.z = -0.14;
    coatTailL.rotation.x = 0.08;
    coatTailL.castShadow = true;
    torso.add(coatTailL);
    addOutlineShell(torso, coatTailL);

    const coatTailR = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.42, 0.24), clothMat);
    coatTailR.position.set(0.22, -0.13, -0.04);
    coatTailR.rotation.z = 0.14;
    coatTailR.rotation.x = 0.08;
    coatTailR.castShadow = true;
    torso.add(coatTailR);
    addOutlineShell(torso, coatTailR);

    const coatTailBack = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.4, 0.06), clothMat);
    coatTailBack.position.set(0, -0.12, -0.17);
    coatTailBack.rotation.x = 0.16;
    coatTailBack.castShadow = true;
    torso.add(coatTailBack);
    addOutlineShell(torso, coatTailBack);

    // Diagonal cross-chest tactical bandolier strap + angled rifle mag cells
    const bandolier = new THREE.Mesh(new THREE.BoxGeometry(0.095, 0.56, 0.31), trimMat);
    bandolier.position.set(0, 0.31, 0.015);
    bandolier.rotation.z = -0.62;
    torso.add(bandolier);
    addOutlineShell(torso, bandolier);

    for (const [bx, by] of [
      [-0.1, 0.4],
      [0.01, 0.31],
      [0.12, 0.22],
    ]) {
      const magCell = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.13, 0.06), armorMat);
      magCell.position.set(bx, by, 0.175);
      magCell.rotation.z = -0.62;
      torso.add(magCell);
    }

    // Twin-cell Recon Spine Pack + glowing energy strips + tall right-shoulder whip antenna
    const packLeft = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.38, 0.14), armorMat);
    packLeft.position.set(-0.085, 0.35, -0.2);
    torso.add(packLeft);
    addOutlineShell(torso, packLeft);

    const packRight = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.38, 0.14), armorMat);
    packRight.position.set(0.085, 0.35, -0.2);
    torso.add(packRight);
    addOutlineShell(torso, packRight);

    for (const px of [-0.085, 0.085]) {
      const cellGlow = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.24, 0.025), visorMat);
      cellGlow.position.set(px, 0.35, -0.275);
      torso.add(cellGlow);
    }

    const antennaMast = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.016, 0.52, 8), trimMat);
    antennaMast.position.set(0.15, 0.78, -0.2);
    antennaMast.rotation.z = -0.09;
    torso.add(antennaMast);
    const antennaTip = new THREE.Mesh(new THREE.SphereGeometry(0.028, 8, 8), visorMat);
    antennaTip.position.set(0.173, 1.04, -0.2);
    torso.add(antennaTip);
  } else if (bodyStyle.hasFeatherHat) {
    // Sniper Operator: Recon mantle / shoulder drape around upper torso
    const mantle = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.39, 0.26, 16), clothMat);
    mantle.scale.set(1.18, 1, 0.88);
    mantle.position.set(0, 0.49, -0.02);
    torso.add(mantle);
    addOutlineShell(torso, mantle);
  }

  // Articulated Left Arm + Shoulder Pauldron
  const armL = new THREE.Group();
  armL.position.set(-shoulderX, 0.49, 0);
  const pauldronRadius = isWoman || bodyStyle.hasFeatherHat ? 0.1 : 0.13;
  const pauldronL = bodyStyle.hasAssaultGear
    ? new THREE.Mesh(new THREE.ConeGeometry(0.135, 0.24, 6), trimMat)
    : new THREE.Mesh(new THREE.SphereGeometry(pauldronRadius, 12, 10), trimMat);
  if (bodyStyle.hasAssaultGear) {
    pauldronL.rotation.z = 1.15;
    pauldronL.position.set(-0.04, 0.03, 0);
  } else {
    pauldronL.scale.set(1, 0.9, 1.15);
  }
  armL.add(pauldronL);
  addOutlineShell(armL, pauldronL);

  const sleeveL = new THREE.Mesh(new THREE.CapsuleGeometry(armRadius, 0.38, 6, 10), clothMat);
  sleeveL.position.set(0, -0.24, 0.12);
  sleeveL.rotation.x = -0.55;
  sleeveL.rotation.z = 0.12;
  armL.add(sleeveL);
  addOutlineShell(armL, sleeveL);

  if (bodyStyle.hasAssaultGear) {
    // AR Operator left-forearm armored gauntlet shield
    const gauntlet = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.26, 0.15), armorMat);
    gauntlet.position.set(-0.075, -0.29, 0.19);
    gauntlet.rotation.x = -0.55;
    gauntlet.rotation.z = 0.12;
    armL.add(gauntlet);
    addOutlineShell(armL, gauntlet);

    const gauntletTrim = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.2, 0.04), visorMat);
    gauntletTrim.position.set(-0.105, -0.29, 0.21);
    gauntletTrim.rotation.x = -0.55;
    armL.add(gauntletTrim);
  }
  torso.add(armL);

  // Articulated Right Arm + Weapon-Matched Blaster Prop
  const armR = new THREE.Group();
  armR.position.set(shoulderX, 0.49, 0);
  const pauldronR = bodyStyle.hasAssaultGear
    ? new THREE.Mesh(new THREE.ConeGeometry(0.135, 0.24, 6), trimMat)
    : new THREE.Mesh(new THREE.SphereGeometry(pauldronRadius, 12, 10), trimMat);
  if (bodyStyle.hasAssaultGear) {
    pauldronR.rotation.z = -1.15;
    pauldronR.position.set(0.04, 0.03, 0);
  } else {
    pauldronR.scale.set(1, 0.9, 1.15);
  }
  armR.add(pauldronR);
  addOutlineShell(armR, pauldronR);

  const sleeveR = new THREE.Mesh(new THREE.CapsuleGeometry(armRadius, 0.36, 6, 10), clothMat);
  sleeveR.position.set(0, -0.22, 0.14);
  sleeveR.rotation.x = -0.85;
  armR.add(sleeveR);
  addOutlineShell(armR, sleeveR);

  // Third-person weapon prop shaped to match weaponId
  if (weaponId === 'helios_rail' || weaponId === 'volt_scatter') {
    const propLength = weaponId === 'helios_rail' ? 0.95 : 0.58;
    const propWidth = weaponId === 'volt_scatter' ? 0.12 : 0.085;
    const rifle = new THREE.Mesh(
      new THREE.BoxGeometry(propWidth, 0.11, propLength),
      armorMat
    );
    rifle.position.set(-0.04, -0.32, 0.24 + propLength * 0.35);
    armR.add(rifle);

    const rifleCore = new THREE.Mesh(
      new THREE.BoxGeometry(propWidth + 0.01, 0.03, propLength * 0.48),
      visorMat
    );
    rifleCore.position.set(-0.04, -0.295, 0.26 + propLength * 0.36);
    armR.add(rifleCore);

    if (weaponId === 'helios_rail') {
      const scopeMount = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.03, 0.24, 10), trimMat);
      scopeMount.rotation.x = Math.PI / 2;
      scopeMount.position.set(-0.04, -0.22, 0.52);
      armR.add(scopeMount);
    }
  } else if (weaponId === 'arc_repeater') {
    const gunMat = new THREE.MeshStandardMaterial({ color: 0x1e242d, metalness: 0.82, roughness: 0.34 });
    const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.072, 0.09, 0.32), armorMat);
    receiver.position.set(-0.04, -0.31, 0.38);
    armR.add(receiver);

    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.022, 0.22, 10), gunMat);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(-0.04, -0.3, 0.62);
    armR.add(barrel);

    const mag = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.16, 0.045), gunMat);
    mag.position.set(-0.04, -0.41, 0.46);
    mag.rotation.x = 0.18;
    armR.add(mag);

    const microOptic = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.038, 0.065), trimMat);
    microOptic.position.set(-0.04, -0.245, 0.4);
    armR.add(microOptic);
  } else {
    const gunMat = new THREE.MeshStandardMaterial({ color: 0x1e242d, metalness: 0.84, roughness: 0.32 });
    const stock = new THREE.Mesh(new THREE.BoxGeometry(0.056, 0.1, 0.18), gunMat);
    stock.position.set(-0.04, -0.32, 0.22);
    armR.add(stock);

    const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.078, 0.1, 0.42), armorMat);
    receiver.position.set(-0.04, -0.31, 0.46);
    armR.add(receiver);

    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.022, 0.32, 10), gunMat);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(-0.04, -0.3, 0.78);
    armR.add(barrel);

    const mag = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.15, 0.062), gunMat);
    mag.position.set(-0.04, -0.41, 0.49);
    mag.rotation.x = -0.18;
    armR.add(mag);

    const holoOptic = new THREE.Mesh(new THREE.BoxGeometry(0.046, 0.044, 0.082), trimMat);
    holoOptic.position.set(-0.04, -0.24, 0.45);
    armR.add(holoOptic);
  }
  torso.add(armR);

  // Sculpted Head + Weapon-Specific Headgear (Hat + Black Feather / Ponytail / Heavy Brow Helmet)
  const head = new THREE.Group();
  head.position.set(0, 0.73, 0);

  const helmetShell = new THREE.Mesh(
    new THREE.SphereGeometry(isWoman ? 0.172 : 0.185, 16, 14),
    armorMat
  );
  helmetShell.scale.set(isWoman ? 0.92 : 0.95, 1.04, isWoman ? 1.03 : 1.08);
  helmetShell.castShadow = true;
  head.add(helmetShell);
  addOutlineShell(head, helmetShell);

  const visor = new THREE.Mesh(
    new THREE.CylinderGeometry(
      isWoman ? 0.168 : 0.182,
      isWoman ? 0.164 : 0.178,
      isWoman ? 0.075 : 0.09,
      16,
      1,
      false,
      -Math.PI * 0.38,
      Math.PI * 0.76
    ),
    visorMat
  );
  visor.position.set(0, 0.015, 0.02);
  head.add(visor);

  if (bodyStyle.hasFeatherHat) {
    // Sniper Marksman: Tactical wide-brim hat + prominent sculpted BLACK FEATHER
    const hatMat = new THREE.MeshStandardMaterial({
      color: 0x32353e,
      roughness: 0.72,
      metalness: 0.14,
    });
    const featherMat = new THREE.MeshStandardMaterial({
      color: 0x050507,
      roughness: 0.38,
      metalness: 0.26,
    });

    const hatBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.33, 0.03, 20), hatMat);
    hatBrim.position.set(0, 0.145, 0.01);
    hatBrim.rotation.x = -0.08;
    head.add(hatBrim);
    addOutlineShell(head, hatBrim, 0.025);

    const hatCrown = new THREE.Mesh(new THREE.CylinderGeometry(0.155, 0.195, 0.16, 16), hatMat);
    hatCrown.position.set(0, 0.225, 0.0);
    hatCrown.rotation.x = -0.06;
    head.add(hatCrown);
    addOutlineShell(head, hatCrown, 0.025);

    const hatBand = new THREE.Mesh(new THREE.CylinderGeometry(0.192, 0.198, 0.036, 16), trimMat);
    hatBand.position.set(0, 0.168, 0.005);
    hatBand.rotation.x = -0.06;
    head.add(hatBand);

    // Sculpted 3-part Black Feather tucked into left hat band and sweeping up/back
    const featherGroup = new THREE.Group();
    featherGroup.position.set(-0.18, 0.19, 0.04);
    featherGroup.rotation.set(-0.34, 0.12, 0.44);

    const quill = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.012, 0.38, 6), featherMat);
    quill.position.y = 0.16;
    featherGroup.add(quill);

    const lowerPlume = new THREE.Mesh(new THREE.ConeGeometry(0.062, 0.28, 8), featherMat);
    lowerPlume.scale.set(0.36, 1, 1.15);
    lowerPlume.position.set(0, 0.18, -0.01);
    featherGroup.add(lowerPlume);

    const tipPlume = new THREE.Mesh(new THREE.ConeGeometry(0.048, 0.22, 8), featherMat);
    tipPlume.scale.set(0.32, 1, 1.05);
    tipPlume.position.set(-0.01, 0.32, -0.055);
    tipPlume.rotation.x = -0.35;
    featherGroup.add(tipPlume);

    head.add(featherGroup);
    addOutlineShell(featherGroup, lowerPlume, 0.022);

    // Rangefinder targeting monocle over right visor eye
    const monocle = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.036, 0.06, 10), visorMat);
    monocle.rotation.x = Math.PI / 2;
    monocle.position.set(0.09, 0.02, 0.18);
    head.add(monocle);
  } else if (isWoman) {
    // SMG Woman Operator: Sleek contoured headset band + flowing swept dark ponytail
    const hairMat = new THREE.MeshStandardMaterial({
      color: 0x1e1b24,
      roughness: 0.62,
      metalness: 0.18,
    });

    const headband = new THREE.Mesh(new THREE.TorusGeometry(0.175, 0.022, 8, 18), trimMat);
    headband.rotation.x = Math.PI / 2 - 0.18;
    headband.position.set(0, 0.08, -0.01);
    head.add(headband);

    const hairTie = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.016, 8, 12), trimMat);
    hairTie.position.set(0.04, 0.04, -0.185);
    head.add(hairTie);

    const ponyUpper = new THREE.Mesh(new THREE.CapsuleGeometry(0.052, 0.16, 6, 10), hairMat);
    ponyUpper.position.set(0.09, -0.02, -0.22);
    ponyUpper.rotation.set(0.68, 0, -0.28);
    head.add(ponyUpper);
    addOutlineShell(head, ponyUpper, 0.024);

    const ponyLower = new THREE.Mesh(new THREE.ConeGeometry(0.058, 0.25, 10), hairMat);
    ponyLower.position.set(0.15, -0.18, -0.22);
    ponyLower.rotation.set(2.8, 0, -0.22);
    head.add(ponyLower);
    addOutlineShell(head, ponyLower, 0.024);
  } else if (bodyStyle.hasAssaultGear) {
    // AR Spec-Ops Operator: Angled tactical beret + peaked visor cap + dual cylindrical NVG optics + half-face respirator
    const beretMat = new THREE.MeshStandardMaterial({
      color: 0x18202c,
      roughness: 0.78,
      metalness: 0.12,
    });
    const beretRim = new THREE.Mesh(new THREE.CylinderGeometry(0.185, 0.182, 0.045, 18), trimMat);
    beretRim.position.set(0, 0.105, 0);
    head.add(beretRim);

    const beretCrown = new THREE.Mesh(new THREE.CylinderGeometry(0.225, 0.185, 0.115, 18), beretMat);
    beretCrown.position.set(0.04, 0.168, -0.01);
    beretCrown.rotation.z = -0.24;
    beretCrown.rotation.x = -0.08;
    head.add(beretCrown);
    addOutlineShell(head, beretCrown, 0.025);

    const beretFlash = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.07, 0.028), trimMat);
    beretFlash.position.set(-0.07, 0.145, 0.178);
    beretFlash.rotation.y = -0.2;
    head.add(beretFlash);

    const capPeak = new THREE.Mesh(new THREE.BoxGeometry(0.23, 0.024, 0.13), armorMat);
    capPeak.position.set(0, 0.095, 0.18);
    capPeak.rotation.x = 0.22;
    head.add(capPeak);
    addOutlineShell(head, capPeak, 0.022);

    // Twin protruding Recon NVG Goggle Pods on brow
    const nvgBar = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.036, 0.06), armorMat);
    nvgBar.position.set(0, 0.05, 0.185);
    head.add(nvgBar);
    for (const gx of [-0.062, 0.062]) {
      const pod = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.038, 0.115, 12), armorMat);
      pod.rotation.x = Math.PI / 2;
      pod.position.set(gx, 0.035, 0.215);
      head.add(pod);
      const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.018, 12), visorMat);
      lens.rotation.x = Math.PI / 2;
      lens.position.set(gx, 0.035, 0.274);
      head.add(lens);
    }

    // Angular Half-Face Tactical Respirator + Twin Side Filter Canisters
    const respirator = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.105, 0.13), armorMat);
    respirator.position.set(0, -0.085, 0.135);
    head.add(respirator);
    addOutlineShell(head, respirator, 0.022);

    for (const fx of [-0.11, 0.11]) {
      const filter = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.042, 0.06, 10), trimMat);
      filter.rotation.z = Math.PI / 2;
      filter.rotation.y = fx < 0 ? 0.45 : -0.45;
      filter.position.set(fx, -0.092, 0.125);
      head.add(filter);
    }

    const micBoom = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.17, 6), trimMat);
    micBoom.rotation.z = Math.PI / 2;
    micBoom.rotation.y = 0.65;
    micBoom.position.set(0.145, -0.055, 0.1);
    head.add(micBoom);
  } else {
    // Shotgun heavy tactical helmet brow crest + chin guard
    const crest = new THREE.Mesh(
      new THREE.BoxGeometry(0.07, 0.055, 0.29),
      trimMat
    );
    crest.position.set(0, 0.175, -0.01);
    head.add(crest);

    const chinGuard = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.09, 0.14), trimMat);
    chinGuard.position.set(0, -0.09, 0.11);
    head.add(chinGuard);
  }

  const earPodL = new THREE.Mesh(new THREE.CylinderGeometry(0.046, 0.046, 0.038, 12), trimMat);
  earPodL.rotation.z = Math.PI / 2;
  earPodL.position.set(isWoman ? -0.165 : -0.18, 0, 0);
  head.add(earPodL);

  const earPodR = earPodL.clone();
  earPodR.position.set(isWoman ? 0.165 : 0.18, 0, 0);
  head.add(earPodR);

  torso.add(head);

  // Subtle translucent cyan protective halo visible ONLY during active Spawn Protection
  const spawnShieldRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.68, 0.035, 10, 28),
    new THREE.MeshBasicMaterial({
      color: 0x22d3ee,
      transparent: true,
      opacity: 0.72,
      depthWrite: false,
    })
  );
  spawnShieldRing.rotation.x = Math.PI / 2;
  spawnShieldRing.position.set(0, 1.05, 0);
  spawnShieldRing.visible = false;
  group.add(spawnShieldRing);

  let nametagSprite: THREE.Sprite | null = null;
  let nametagTexture: THREE.CanvasTexture | null = null;
  if (nickname) {
    const builtTag = createNametagSprite(nickname, relation);
    nametagSprite = builtTag.sprite;
    nametagTexture = builtTag.texture;
    nametagSprite.position.set(0, bodyStyle.hasFeatherHat ? 2.48 : 2.34, 0);
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
    spawnShieldRing,
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

export function buildStreetLight(accentHex: string, obs?: MapObstacle): THREE.Group {
  const group = new THREE.Group();

  const poleMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    metalness: 0.85,
    roughness: 0.3,
  });
  const collarMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    metalness: 0.72,
    roughness: 0.38,
  });
  const lampMat = new THREE.MeshStandardMaterial({
    color: 0xfef3c7,
    emissive: accentHex,
    emissiveIntensity: 2.5,
    roughness: 0.15,
  });

  const baseW = obs ? Math.max(0.65, obs.w * 0.94) : 0.75;
  const baseD = obs ? Math.max(0.65, obs.d * 0.94) : 0.75;
  const totalH = obs ? Math.max(5.5, obs.h) : 6.4;

  const plinth = new THREE.Mesh(new THREE.BoxGeometry(baseW, 0.75, baseD), poleMat);
  plinth.position.y = 0.375;
  plinth.castShadow = true;
  plinth.receiveShadow = true;
  group.add(plinth);

  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.34, 0.45, 10), collarMat);
  collar.position.y = 0.975;
  collar.castShadow = true;
  group.add(collar);

  const poleH = Math.max(4.0, totalH - 1.0);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, poleH, 10), poleMat);
  pole.position.y = 1.0 + poleH * 0.5;
  pole.castShadow = true;
  pole.receiveShadow = true;
  group.add(pole);

  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 1.75), poleMat);
  arm.position.set(0, totalH - 0.1, 0.82);
  arm.castShadow = true;
  group.add(arm);

  const housing = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.16, 0.68), poleMat);
  housing.position.set(0, totalH - 0.14, 1.55);
  group.add(housing);

  const bulb = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.08, 0.54), lampMat);
  bulb.position.set(0, totalH - 0.24, 1.55);
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
  const doorH = Math.max(0.5, Math.min(2.05, wallH * 0.68) - 0.02);
  const door = new THREE.Mesh(
    new THREE.BoxGeometry(doorW, doorH, obs.d + 0.12),
    doorMat
  );
  door.position.y = plinthH + 0.015 + doorH * 0.5;
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

  // Corner steel posts stopping cleanly at bodyH (zero coplanar faces with topTrim or body sides)
  const postW = Math.min(0.22, Math.min(obs.w, obs.d) * 0.12);
  const corners: Array<[number, number]> = [
    [-obs.w * 0.5 - 0.004, -obs.d * 0.5 - 0.004],
    [obs.w * 0.5 + 0.004, -obs.d * 0.5 - 0.004],
    [-obs.w * 0.5 - 0.004, obs.d * 0.5 + 0.004],
    [obs.w * 0.5 + 0.004, obs.d * 0.5 + 0.004],
  ];
  for (const [cx, cz] of corners) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(postW, bodyH, postW), frameMat);
    post.position.set(cx, bodyH * 0.5, cz);
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

export function applyWorldBoxUVs(
  geo: THREE.BoxGeometry,
  w: number,
  h: number,
  d: number,
  tileU = 4,
  tileV = tileU
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
      uv.setXY(i, (u * d) / tileU, (v * h) / tileV);
    } else if (ny > 0.5) {
      uv.setXY(i, (u * w) / tileU, (v * d) / tileU);
    } else {
      uv.setXY(i, (u * w) / tileU, (v * h) / tileV);
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

  // Main wooden crate body (single clean tiled crate panel per face)
  const tileM = Math.max(1.2, Math.min(obs.w, obs.d, obs.h));
  const lidH = 0.04;
  const bodyH = Math.max(0.2, obs.h - lidH);
  const bodyGeo = new THREE.BoxGeometry(obs.w, bodyH, obs.d);
  if (obs.w > 2.4 || obs.d > 2.4) {
    applyWorldBoxUVs(bodyGeo, obs.w, bodyH, obs.d, 1.9);
  }
  const body = new THREE.Mesh(bodyGeo, plankMat);
  body.position.y = bodyH * 0.5;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  // Proud corner wooden posts ending cleanly below lid (zero coplanar top faces)
  const postW = Math.min(0.16, Math.max(0.08, tileM * 0.1));
  const corners: Array<[number, number]> = [
    [-obs.w * 0.5 - 0.004, -obs.d * 0.5 - 0.004],
    [obs.w * 0.5 + 0.004, -obs.d * 0.5 - 0.004],
    [-obs.w * 0.5 - 0.004, obs.d * 0.5 + 0.004],
    [obs.w * 0.5 + 0.004, obs.d * 0.5 + 0.004],
  ];
  for (const [cx, cz] of corners) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(postW, bodyH, postW), frameWoodMat);
    post.position.set(cx, bodyH * 0.5, cz);
    post.castShadow = true;
    group.add(post);
  }

  // Timber lid frame stacked cleanly above bodyH
  const lid = new THREE.Mesh(
    new THREE.BoxGeometry(obs.w + 0.04, lidH, obs.d + 0.04),
    frameWoodMat
  );
  lid.position.y = bodyH + lidH * 0.5;
  lid.castShadow = true;
  lid.receiveShadow = true;
  group.add(lid);

  // Rusted iron corner brackets seated cleanly below lid (no coplanar edge with lid)
  const strapH = Math.min(0.1, bodyH * 0.16);
  for (const [cx, cz] of corners) {
    const bracket = new THREE.Mesh(
      new THREE.BoxGeometry(postW + 0.025, strapH, postW + 0.025),
      ironMat
    );
    bracket.position.set(cx, bodyH - strapH * 0.5 - 0.005, cz);
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

  const hasSill = obs.h <= 1.28;
  const sillH = hasSill ? 0.06 : 0;
  const wallH = Math.max(0.2, obs.h - sillH);

  const geo = new THREE.BoxGeometry(obs.w, wallH, obs.d);
  applyWorldBoxUVs(geo, obs.w, wallH, obs.d, 4.5);
  const wall = new THREE.Mesh(geo, wallMat);
  wall.position.y = wallH * 0.5;
  wall.castShadow = true;
  wall.receiveShadow = true;
  group.add(wall);

  // Concrete window sill stacked cleanly on top of wallH (zero coplanar faces)
  if (hasSill) {
    const sill = new THREE.Mesh(
      new THREE.BoxGeometry(obs.w + 0.14, sillH, obs.d + 0.06),
      sillMat
    );
    sill.position.y = wallH + sillH * 0.5;
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

  const copingH = Math.min(0.12, obs.h * 0.14);
  const mainH = Math.max(0.2, obs.h - copingH);

  const geo = new THREE.BoxGeometry(obs.w, mainH, obs.d);
  // Keep vertical UV span >= mainH so bottom masonry plinth never wraps up tall walls
  applyWorldBoxUVs(geo, obs.w, mainH, obs.d, 4.5, Math.max(4.5, mainH));
  const mesh = new THREE.Mesh(geo, wallMat);
  mesh.position.y = mainH * 0.5;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);

  const coping = new THREE.Mesh(
    new THREE.BoxGeometry(obs.w + 0.14, copingH, obs.d + 0.14),
    copingMat
  );
  coping.position.y = mainH + copingH * 0.5;
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

export function buildWoodenBoxPile(
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
  const darkPlankMat = new THREE.MeshStandardMaterial({
    color: 0xb98a57,
    map: woodTex,
    bumpMap: woodBump,
    bumpScale: 0.04,
    roughness: 0.9,
    metalness: 0.02,
  });
  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x4d3017,
    roughness: 0.92,
    metalness: 0.04,
  });

  // Build a house-sized stacked cluster of 11 varied wooden boxes inside [obs.w x obs.h x obs.d]
  const w = obs.w;
  const h = obs.h;
  const d = obs.d;

  const subBoxes: Array<{
    ox: number;
    oy: number;
    oz: number;
    bw: number;
    bh: number;
    bd: number;
    rotY?: number;
    dark?: boolean;
  }> = [
    // Tier 1: Spaced solid base crates (zero intersection between base boxes)
    { ox: -w * 0.26, oy: 0, oz: -d * 0.26, bw: w * 0.45, bh: h * 0.41, bd: d * 0.45 },
    { ox: w * 0.26, oy: 0, oz: -d * 0.26, bw: w * 0.45, bh: h * 0.37, bd: d * 0.45, dark: true },
    { ox: -w * 0.26, oy: 0, oz: d * 0.26, bw: w * 0.45, bh: h * 0.39, bd: d * 0.45, dark: true },
    { ox: w * 0.26, oy: 0, oz: d * 0.26, bw: w * 0.45, bh: h * 0.42, bd: d * 0.45 },
    // Tier 2: Non-intersecting mid-height stacked boxes cleanly resting above Tier 1 tops
    { ox: -w * 0.22, oy: h * 0.42, oz: -d * 0.18, bw: w * 0.38, bh: h * 0.3, bd: d * 0.36, rotY: 0.05 },
    { ox: w * 0.22, oy: h * 0.43, oz: d * 0.18, bw: w * 0.38, bh: h * 0.29, bd: d * 0.36, rotY: -0.06, dark: true },
    { ox: w * 0.22, oy: h * 0.38, oz: -d * 0.22, bw: w * 0.34, bh: h * 0.26, bd: d * 0.34, rotY: 0.08 },
    { ox: -w * 0.22, oy: h * 0.4, oz: d * 0.22, bw: w * 0.34, bh: h * 0.24, bd: d * 0.32, rotY: -0.09 },
    // Tier 3: Crown peak boxes cleanly stacked above Tier 2
    { ox: -w * 0.04, oy: h * 0.74, oz: -d * 0.04, bw: w * 0.38, bh: h * 0.26, bd: d * 0.36, rotY: -0.1 },
    { ox: w * 0.22, oy: h * 0.73, oz: d * 0.18, bw: w * 0.24, bh: h * 0.18, bd: d * 0.24, rotY: 0.14, dark: true },
    { ox: -w * 0.24, oy: h * 0.65, oz: d * 0.22, bw: w * 0.22, bh: h * 0.16, bd: d * 0.22, rotY: 0.06 },
  ];

  for (const b of subBoxes) {
    const trimH = 0.035;
    const bodyH = Math.max(0.12, b.bh - trimH);
    const geo = new THREE.BoxGeometry(b.bw, bodyH, b.bd);
    applyWorldBoxUVs(geo, b.bw, bodyH, b.bd, 1.8);
    const box = new THREE.Mesh(geo, b.dark ? darkPlankMat : plankMat);
    box.position.set(b.ox, b.oy + bodyH * 0.5, b.oz);
    if (b.rotY) box.rotation.y = b.rotY;
    box.castShadow = true;
    box.receiveShadow = true;
    group.add(box);

    // Timber top trim cap seated flush inside b.bh (zero z-fighting or penetration above tier)
    const trim = new THREE.Mesh(
      new THREE.BoxGeometry(b.bw + 0.03, trimH, b.bd + 0.03),
      frameMat
    );
    trim.position.set(b.ox, b.oy + bodyH + trimH * 0.5, b.oz);
    if (b.rotY) trim.rotation.y = b.rotY;
    group.add(trim);
  }

  return group;
}


