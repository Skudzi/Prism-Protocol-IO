import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { AVATAR_SKINS, MAPS, WEAPONS, WEAPON_LIST, WEAPON_SKINS } from '../game/catalog';
import {
  applyControllerDeadzone,
  applyUnderfootJumpVelocity,
  calculateDamage,
  calculateMatchRewards,
  canManualReload,
  canTriggerEasterEgg,
  canTriggerUnderfootJump,
  castLaserRay,
  checkHealOrbPickup,
  DEATH_RESPAWN_COOLDOWN_MS,
  getHealOrbScheduleTimes,
  KILL_CAM_DURATION_MS,
  KillCamSample,
  pickOpenHealOrbPosition,
  RayTarget,
  resolvePlayerMovement,
  sampleKillCamClip,
  shouldAutoReload,
  sortLeaderboardEntries,
} from '../game/rules';
import {
  GameMode,
  GameScreenState,
  GameSettings,
  HealOrbState,
  Keybinds,
  MapDef,
  MapId,
  MapSpawn,
  MatchLeaderboardEntry,
  MatchSummary,
  MinimapSnapshot,
  RemoteActorState,
  ShadowQuality,
  WeaponDef,
  WeaponId,
} from '../game/types';
import { soundEngine } from './audio';
import {
  AnimatedAvatarRig,
  buildAvatarRig,
  buildBridgeStructure,
  buildBuildingFloor,
  buildBuildingRoof,
  buildBuildingWall,
  buildConcreteWall,
  buildEasterEggMonolith,
  buildHealOrbModel,
  buildHouseStructure,
  buildJumpPad,
  buildMetalAwning,
  buildPeekCover,
  buildSandstoneWall,
  buildSquarePlatform,
  buildStreetLight,
  buildTexturedCrate,
  buildTreeModel,
  buildWeaponViewModel,
  buildWoodenCrate,
  disposeAvatarRig,
} from './models';
import {
  createArenaFloorTextures,
  createBarrierTexture,
  createConcreteWallTextures,
  createContactShadowTexture,
  createCorrugatedMetalTextures,
  createCrateTexture,
  createHouseFacadeTexture,
  createRoadTexture,
  createSandstoneWallTextures,
  createSandyardFloorTextures,
  createSkyDomeMaterial,
  createTrampledFieldFloorTextures,
  createTrampledPathOverlayTexture,
  createWoodenCrateTextures,
} from './textures';

export interface HudSnapshot {
  hp: number;
  maxHp: number;
  energy: number;
  maxEnergy: number;
  ammo: number;
  maxAmmo: number;
  isReloading: boolean;
  reloadProgress: number;
  ammoStyle: WeaponDef['ammoStyle'];
  dashCharge: number;
  tags: number;
  deaths: number;
  teamScoreCyan: number;
  teamScoreAmber: number;
  gameMode: GameMode;
  fps: number;
  healFlashMs: number;
  timeRemaining: number;
  weaponId: WeaponId;
  hitMarkerMs: number;
  lastHitZone: 'head' | 'body' | null;
  damageFlashMs: number;
  pointerLocked: boolean;
  tutorialStep: number;
  tutorialDronesHit: number;
  easterEggUnlockedNow: boolean;
  isScoped: boolean;
  isDead: boolean;
  isKillCam: boolean;
  killCamRemainingMs: number;
  deathRespawnRemainingMs: number;
  killedBy: string | null;
  hasGamepad: boolean;
  killsFeed: Array<{ id: string; text: string }>;
  minimap: MinimapSnapshot;
}

interface BotEntity {
  id: string;
  nickname: string;
  team: 'cyan' | 'amber';
  policy: 'flanker' | 'kiter' | 'charger' | 'patroller' | 'drone';
  x: number;
  y: number;
  z: number;
  vx: number;
  vz: number;
  velY: number;
  grounded: boolean;
  yaw: number;
  hp: number;
  maxHp: number;
  alive: boolean;
  respawnTimer: number;
  fireCooldown: number;
  strafeSign: number;
  strafeTimer: number;
  avatarSkinId: string;
  rig: AnimatedAvatarRig;
  walkPhase: number;
  hitFlashTimer: number;
  kills: number;
  deaths: number;
  poseHistory: KillCamSample[];
  lastPoseSampleMs: number;
}

interface LaserBeamPoolItem {
  mesh: THREE.Mesh;
  life: number;
  maxLife: number;
}

interface ProjectilePoolItem {
  active: boolean;
  mesh: THREE.Mesh;
  vx: number;
  vy: number;
  vz: number;
  life: number;
}

interface SparkPoolItem {
  active: boolean;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
}

export interface ArenaEngineCallbacks {
  onHudUpdate: (hud: HudSnapshot) => void;
  onMatchEnd: (summary: MatchSummary, shotsFired: number, shotsHit: number) => void;
  onTutorialComplete: () => void;
  onEasterEggFound: () => void;
  onPauseRequested: () => void;
  onResumeRequested?: () => void;
  onChatRequested: () => void;
  onWeaponChanged?: (weaponId: WeaponId) => void;
  onNetworkMove?: (x: number, y: number, z: number, yaw: number) => void;
  onNetworkFire?: (
    weaponId: WeaponId,
    origin: { x: number; y: number; z: number },
    end: { x: number; y: number; z: number },
    color: string,
    distance: number
  ) => void;
}

const _vec3A = new THREE.Vector3();
const _vec3B = new THREE.Vector3();
const _vec3C = new THREE.Vector3();
const _quat = new THREE.Quaternion();
const _up = new THREE.Vector3(0, 1, 0);
const _mat4 = new THREE.Matrix4();
const _scale = new THREE.Vector3();

function detectSoftwareGl(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param));
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

export class ArenaEngine {
  private container: HTMLElement;
  private callbacks: ArenaEngineCallbacks;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private isSoftwareGl: boolean;
  private shadowTex: THREE.CanvasTexture;
  private envTex: THREE.Texture;
  private keyLight: THREE.DirectionalLight | null = null;
  private currentShadowSize = 2048;

  private mapGroup = new THREE.Group();
  private botsGroup = new THREE.Group();
  private peersGroup = new THREE.Group();
  private orbsGroup = new THREE.Group();
  private weaponMount = new THREE.Group();
  private weaponMesh: THREE.Group | null = null;
  private easterEggRig: { group: THREE.Group; crystal: THREE.Mesh; ring: THREE.Mesh } | null = null;
  private jumpPadRings: THREE.Mesh[] = [];
  private healOrbs: Array<{
    state: HealOrbState;
    rig: { group: THREE.Group; core: THREE.Mesh; ring: THREE.Mesh };
  }> = [];

  private beamPool: LaserBeamPoolItem[] = [];
  private projectilePool: ProjectilePoolItem[] = [];
  private projectileGeos: Record<WeaponDef['ammoStyle'], THREE.BufferGeometry>;
  private projectileMats: Record<WeaponDef['ammoStyle'], THREE.Material>;
  private sparkMesh: THREE.InstancedMesh;
  private sparks: SparkPoolItem[] = [];

  private bots: BotEntity[] = [];
  private peerMeshes = new Map<
    string,
    { rig: AnimatedAvatarRig; walkPhase: number; data: RemoteActorState; relation: 'ally' | 'enemy' }
  >();

  private mapId: MapId = 'hyperion_atrium';
  private weaponId: WeaponId = 'pulse_carbine';
  private weaponSkinId = 'cobalt_standard';
  private avatarSkinId = 'vanguard_navy';
  private playerNickname = 'Vanguard01';
  private settings: GameSettings;
  private keybinds: Keybinds;

  private screenState: GameScreenState = 'title';
  private gameMode: GameMode = 'ffa';
  private isTutorial = false;
  private tutorialStep = 1;
  private tutorialDronesHit = 0;
  private tutorialMoved = false;

  // Player simulation state
  private playerPos = { x: 0, y: 0, z: 22 };
  private playerVel = { x: 0, y: 0, z: 0 };
  private smoothMoveF = 0;
  private smoothMoveR = 0;
  private wasGrounded = true;
  private landDip = 0;
  private strafeRoll = 0;
  private lastYaw = 0;
  private swayX = 0;
  private swayY = 0;
  private yaw = 0;
  private pitch = 0;
  private grounded = true;
  private hp = 100;
  private maxHp = 100;
  private energy = 100;
  private ammoByWeapon: Record<WeaponId, number> = {
    pulse_carbine: 30,
    volt_scatter: 5,
    helios_rail: 3,
    arc_repeater: 35,
  };
  private isReloading = false;
  private reloadRemainingMs = 0;
  private reloadTotalMs = 1450;
  private dashCharge = 100;
  private dashTimer = 0;
  private tags = 0;
  private deaths = 0;
  private teamScoreCyan = 0;
  private teamScoreAmber = 0;
  private shotsFired = 0;
  private shotsHit = 0;
  private matchTimeRemaining = 120;
  private matchDuration = 120;
  private elapsedMatchSec = 0;
  private healSchedule: number[] = [];
  private healNextIndex = 0;
  private healFlashMs = 0;
  private easterEggTriggered = false;
  private lastFireMs = 0;
  private underfootJumpCooldownMs = 0;
  private hitstopTimer = 0;
  private cameraTrauma = 0;
  private recoilOffset = 0;
  private walkDist = 0;
  private hitMarkerMs = 0;
  private lastHitZone: 'head' | 'body' | null = null;
  private damageFlashMs = 0;
  private isScoped = false;
  private rightMouseDown = false;
  private isDead = false;
  private killCamRemainingMs = 0;
  private killCamClip: KillCamSample[] = [];
  private killCamBeamOrigin = { x: 0, y: 1.3, z: 0 };
  private killCamBeamEnd = { x: 0, y: 1.2, z: 0 };
  private killCamBeamColor = '#ef4444';
  private killCamBeamFired = false;
  private deathRespawnRemainingMs = 0;
  private killedBy: string | null = null;
  private killsFeed: Array<{ id: string; text: string }> = [];

  // Input & FPS state
  private keysPressed = new Set<string>();
  private mouseDown = false;
  private draggingLook = false;
  private pointerLocked = false;
  private prevGamepadButtons: boolean[] = [];
  private gamepadTriggerFiring = false;
  private hasGamepad = false;
  private lastNetSyncMs = 0;
  private lastHudEmitMs = 0;
  private tourAngle = 0;
  private fps = 60;
  private fpsFrameCount = 0;
  private fpsLastSampleMs = performance.now();

  private frameId = 0;
  private rafId = 0;
  private timeoutId = 0;
  private loopChannel: MessageChannel | null = null;
  private lastTimeMs = performance.now();
  private lastRenderMs = performance.now();
  private disposed = false;

  constructor(
    container: HTMLElement,
    settings: GameSettings,
    keybinds: Keybinds,
    callbacks: ArenaEngineCallbacks
  ) {
    this.container = container;
    this.settings = settings;
    this.keybinds = keybinds;
    this.callbacks = callbacks;

    this.isSoftwareGl = detectSoftwareGl();
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
      stencil: true,
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;
    this.renderer.setPixelRatio(
      this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2)
    );
    const shadowsActive =
      !this.isSoftwareGl && settings.shadowsEnabled && settings.shadowQuality !== 'off';
    this.renderer.shadowMap.enabled = shadowsActive;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const w = container.clientWidth || window.innerWidth;
    const h = container.clientHeight || window.innerHeight;
    this.renderer.setSize(w, h);
    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    const farPlane = Math.max(580, (settings.renderDistance || 180) + 400);
    this.camera = new THREE.PerspectiveCamera(settings.fov, w / h, 0.1, farPlane);
    this.camera.rotation.order = 'YXZ';
    this.scene.add(this.camera);

    // Mount weapon onto camera (hidden during Title camera tour and scoping)
    this.weaponMount.position.set(0.24, -0.21, -0.56);
    this.weaponMount.visible = false;
    this.camera.add(this.weaponMount);

    // Mandatory studio environment reflection
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environment = this.envTex;
    pmrem.dispose();

    this.shadowTex = createContactShadowTexture();

    this.scene.add(this.mapGroup);
    this.scene.add(this.botsGroup);
    this.scene.add(this.peersGroup);
    this.scene.add(this.orbsGroup);

    // Pooled laser beams (24)
    const beamGeo = new THREE.CylinderGeometry(0.024, 0.024, 1, 6);
    beamGeo.rotateX(Math.PI / 2);
    for (let i = 0; i < 24; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: 0x22d3ee,
        transparent: true,
        opacity: 0.9,
      });
      const mesh = new THREE.Mesh(beamGeo, mat);
      mesh.visible = false;
      this.scene.add(mesh);
      this.beamPool.push({ mesh, life: 0, maxLife: 0.11 });
    }

    // Weapon-specific 3D projectile shapes & materials (gold bullet, small gray balls, rail lance, emerald dart)
    const goldBulletGeo = new THREE.CylinderGeometry(0.028, 0.036, 0.56, 8);
    goldBulletGeo.rotateX(Math.PI / 2);
    const grayPelletGeo = new THREE.SphereGeometry(0.052, 8, 6);
    const railLanceGeo = new THREE.CylinderGeometry(0.022, 0.045, 1.35, 8);
    railLanceGeo.rotateX(Math.PI / 2);
    const emeraldDartGeo = new THREE.CylinderGeometry(0.018, 0.028, 0.36, 6);
    emeraldDartGeo.rotateX(Math.PI / 2);

    this.projectileGeos = {
      gold_bullet: goldBulletGeo,
      gray_pellets: grayPelletGeo,
      rail_lance: railLanceGeo,
      emerald_dart: emeraldDartGeo,
    };

    this.projectileMats = {
      gold_bullet: new THREE.MeshStandardMaterial({
        color: 0xfbbf24,
        emissive: 0xd97706,
        emissiveIntensity: 1.4,
        metalness: 0.88,
        roughness: 0.2,
      }),
      gray_pellets: new THREE.MeshStandardMaterial({
        color: 0x94a3b8,
        emissive: 0x475569,
        emissiveIntensity: 0.65,
        metalness: 0.82,
        roughness: 0.32,
      }),
      rail_lance: new THREE.MeshBasicMaterial({
        color: 0xf43f5e,
      }),
      emerald_dart: new THREE.MeshBasicMaterial({
        color: 0x34d399,
      }),
    };

    for (let i = 0; i < 48; i++) {
      const mesh = new THREE.Mesh(goldBulletGeo, this.projectileMats.gold_bullet);
      mesh.visible = false;
      this.scene.add(mesh);
      this.projectilePool.push({ active: false, mesh, vx: 0, vy: 0, vz: 0, life: 0 });
    }

    // Pooled impact sparks InstancedMesh (96)
    const sparkGeo = new THREE.BoxGeometry(0.08, 0.08, 0.08);
    const sparkMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    this.sparkMesh = new THREE.InstancedMesh(sparkGeo, sparkMat, 96);
    this.sparkMesh.frustumCulled = false;
    this.scene.add(this.sparkMesh);
    for (let i = 0; i < 96; i++) {
      this.sparks.push({ active: false, x: 0, y: -50, z: 0, vx: 0, vy: 0, vz: 0, life: 0 });
      _mat4.makeScale(0, 0, 0);
      this.sparkMesh.setMatrixAt(i, _mat4);
    }
    this.sparkMesh.instanceMatrix.needsUpdate = true;

    this.buildMapScene(this.mapId);
    this.rebuildWeaponMesh();

    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }

    this.bindEvents();
    this.startLoop();
  }

  private bindEvents() {
    window.addEventListener('resize', this.onResize);
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.onWindowBlur);
    document.addEventListener('visibilitychange', this.onVisibilityChange);
    document.addEventListener('pointerlockchange', this.onPointerLockChange);
    document.addEventListener('mousemove', this.onMouseMove);
    this.renderer.domElement.addEventListener('mousedown', this.onMouseDown);
    window.addEventListener('mouseup', this.onMouseUp);
    window.addEventListener('wheel', this.onWheel, { passive: false });
    this.renderer.domElement.addEventListener('contextmenu', this.onContextMenu);
  }

  private onWheel = (e: WheelEvent) => {
    if (this.screenState !== 'playing' || this.isDead) return;
    const tag = (e.target as HTMLElement | null)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    if (Math.abs(e.deltaY) < 1 && Math.abs(e.deltaX) < 1) return;
    e.preventDefault();
    const idx = WEAPON_LIST.findIndex((w) => w.id === this.weaponId);
    const step = (e.deltaY || e.deltaX) >= 0 ? 1 : -1;
    const nextIdx = (idx + step + WEAPON_LIST.length) % WEAPON_LIST.length;
    this.setWeapon(WEAPON_LIST[nextIdx].id);
  };

  private onContextMenu = (e: MouseEvent) => {
    e.preventDefault();
  };

  private onResize = () => {
    if (this.disposed) return;
    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  private onWindowBlur = () => {
    this.keysPressed.clear();
    this.mouseDown = false;
    this.draggingLook = false;
    this.isScoped = false;
  };

  private onVisibilityChange = () => {
    if (document.hidden) {
      this.onWindowBlur();
    }
  };

  private onPointerLockChange = () => {
    this.pointerLocked = document.pointerLockElement === this.renderer.domElement;
    this.emitHud(true);
  };

  private onKeyDown = (e: KeyboardEvent) => {
    // Do not steal input while typing in inputs or textareas
    const tag = (e.target as HTMLElement | null)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

    this.keysPressed.add(e.code);

    if (this.screenState !== 'playing') return;

    if (e.code === this.keybinds.pause || e.code === 'Escape') {
      document.exitPointerLock?.();
      this.callbacks.onPauseRequested();
      return;
    }

    if (this.isDead) {
      if (
        (e.code === 'Space' || e.code === 'Enter') &&
        this.killCamRemainingMs <= 0 &&
        this.deathRespawnRemainingMs <= 0
      ) {
        e.preventDefault();
        this.respawnPlayer();
      }
      return;
    }

    if (e.code === this.keybinds.chat) {
      e.preventDefault();
      document.exitPointerLock?.();
      this.callbacks.onChatRequested();
      return;
    }
    if (e.code === this.keybinds.slot1) this.setWeapon('pulse_carbine');
    if (e.code === this.keybinds.slot2) this.setWeapon('volt_scatter');
    if (e.code === this.keybinds.slot3) this.setWeapon('helios_rail');
    if (e.code === this.keybinds.slot4) this.setWeapon('arc_repeater');
    if (e.code === this.keybinds.reload) {
      const weapon = WEAPONS[this.weaponId];
      const currentAmmo = this.ammoByWeapon[this.weaponId];
      if (canManualReload(currentAmmo, weapon.magSize, this.isReloading)) {
        this.startReload();
      }
    }
    if (e.code === this.keybinds.dash && this.dashCharge >= 50 && this.dashTimer <= 0) {
      this.dashCharge -= 50;
      this.dashTimer = 0.22;
      soundEngine.playDash();
    }
  };

  private onKeyUp = (e: KeyboardEvent) => {
    this.keysPressed.delete(e.code);
  };

  private onMouseDown = (e: MouseEvent) => {
    if (this.screenState !== 'playing' || this.isDead) return;
    if (e.button === 2) {
      this.rightMouseDown = true;
      this.isScoped = true;
      return;
    }
    if (e.button === 0) {
      this.mouseDown = true;
      this.draggingLook = true;
      if (!this.pointerLocked && !this.isSoftwareGl) {
        try {
          this.renderer.domElement.requestPointerLock?.();
        } catch {
          // Ignore pointer lock rejection in headless/sandbox environments
        }
      }
      this.tryFire();
    }
  };

  private onMouseUp = (e: MouseEvent) => {
    if (e.button === 2) {
      this.rightMouseDown = false;
      this.isScoped = false;
    }
    if (e.button === 0) {
      this.mouseDown = false;
      this.draggingLook = false;
    }
  };

  private onMouseMove = (e: MouseEvent) => {
    if (this.screenState !== 'playing' || this.isDead) return;
    if (!this.pointerLocked && !this.draggingLook) return;
    const sens = 0.0022 * this.settings.mouseSensitivity * (this.isScoped ? 0.55 : 1);
    this.yaw -= e.movementX * sens;
    this.pitch = THREE.MathUtils.clamp(this.pitch - e.movementY * sens, -1.35, 1.35);
  };

  private getShadowMapSize(q: ShadowQuality): number {
    switch (q) {
      case 'off':
        return 0;
      case 'low':
        return 512;
      case 'medium':
        return 1024;
      case 'ultra':
        return 4096;
      case 'high':
      default:
        return 2048;
    }
  }

  public updateSettings(settings: GameSettings, keybinds: Keybinds) {
    this.settings = settings;
    this.keybinds = keybinds;
    this.camera.fov = settings.fov;
    this.camera.far = Math.max(580, (settings.renderDistance || 180) + 400);
    this.camera.updateProjectionMatrix();

    const map = MAPS[this.mapId];
    if (map) {
      const fogScale = 180 / Math.max(60, settings.renderDistance || 180);
      this.scene.fog = new THREE.FogExp2(map.fogColor, map.fogDensity * fogScale);
    }

    const shadowSize = this.getShadowMapSize(settings.shadowQuality ?? 'high');
    const shadowsActive = !this.isSoftwareGl && settings.shadowsEnabled && shadowSize > 0;
    this.renderer.shadowMap.enabled = shadowsActive;
    if (this.keyLight) {
      this.keyLight.castShadow = shadowsActive;
      if (shadowSize > 0 && shadowSize !== this.currentShadowSize) {
        this.currentShadowSize = shadowSize;
        this.keyLight.shadow.mapSize.set(shadowSize, shadowSize);
        if (this.keyLight.shadow.map) {
          this.keyLight.shadow.map.dispose();
          this.keyLight.shadow.map = null;
        }
      }
    }

    soundEngine.enabled = settings.audioEnabled;
    soundEngine.volume = settings.masterVolume;
  }

  public setLoadout(weaponId: WeaponId, weaponSkinId: string, avatarSkinId?: string) {
    const nextAvatar = avatarSkinId ?? this.avatarSkinId;
    const changed =
      this.weaponId !== weaponId ||
      this.weaponSkinId !== weaponSkinId ||
      this.avatarSkinId !== nextAvatar;
    this.weaponId = weaponId;
    this.weaponSkinId = weaponSkinId;
    this.avatarSkinId = nextAvatar;
    if (changed) {
      this.rebuildWeaponMesh();
    }
  }

  public setWeapon(weaponId: WeaponId) {
    if (this.weaponId === weaponId) return;
    this.weaponId = weaponId;
    this.isScoped = false;
    this.isReloading = false;
    this.reloadRemainingMs = 0;
    this.rebuildWeaponMesh();
    this.callbacks.onWeaponChanged?.(weaponId);
    this.emitHud(true);
  }

  private rebuildWeaponMesh() {
    if (this.weaponMesh) {
      this.weaponMount.remove(this.weaponMesh);
    }
    const skin = WEAPON_SKINS.find((s) => s.id === this.weaponSkinId) ?? WEAPON_SKINS[0];
    const avatarSkin = AVATAR_SKINS.find((a) => a.id === this.avatarSkinId) ?? AVATAR_SKINS[0];
    this.weaponMesh = buildWeaponViewModel(this.weaponId, skin, avatarSkin);
    this.weaponMount.add(this.weaponMesh);
  }

  public setScreenState(state: GameScreenState) {
    this.screenState = state;
    this.weaponMount.visible = state === 'playing' && !this.isScoped && !this.isDead;
    if (state !== 'playing') {
      this.keysPressed.clear();
      this.mouseDown = false;
      this.rightMouseDown = false;
      this.gamepadTriggerFiring = false;
      this.isScoped = false;
      document.exitPointerLock?.();
    }
  }

  public setPlayerNickname(nickname: string) {
    if (nickname.trim()) {
      this.playerNickname = nickname.trim();
    }
  }

  private pickTeamSpawn(map: MapDef, team?: 'cyan' | 'amber', indexHint?: number): MapSpawn {
    const pool =
      this.gameMode === 'tdm' && map.teamSpawns && team
        ? map.teamSpawns[team]
        : map.spawns;
    const safePool = pool && pool.length > 0 ? pool : map.spawns;
    if (indexHint !== undefined) {
      return safePool[indexHint % safePool.length];
    }
    return safePool[Math.floor(Math.random() * safePool.length)];
  }

  public startMatch(
    mapId: MapId,
    isTutorial = false,
    gameMode: GameMode = 'ffa',
    playerNickname?: string
  ) {
    if (playerNickname?.trim()) {
      this.playerNickname = playerNickname.trim();
    }
    this.isTutorial = isTutorial;
    this.gameMode = isTutorial ? 'ffa' : gameMode;
    this.tutorialStep = 1;
    this.tutorialDronesHit = 0;
    this.tutorialMoved = false;

    const targetMap = isTutorial ? 'hyperion_atrium' : mapId;
    if (this.mapId !== targetMap || this.bots.length === 0) {
      this.buildMapScene(targetMap);
    }
    this.mapId = targetMap;

    const map = MAPS[targetMap];
    const spawn =
      this.gameMode === 'tdm'
        ? this.pickTeamSpawn(map, 'cyan', 0)
        : map.spawns[0];
    this.playerPos = { x: spawn.x, y: spawn.y, z: spawn.z };
    this.playerVel = { x: 0, y: 0, z: 0 };
    this.smoothMoveF = 0;
    this.smoothMoveR = 0;
    this.wasGrounded = true;
    this.landDip = 0;
    this.strafeRoll = 0;
    this.swayX = 0;
    this.swayY = 0;
    this.yaw = spawn.yaw;
    this.lastYaw = spawn.yaw;
    this.pitch = 0;
    this.grounded = true;
    this.hp = 100;
    this.energy = 100;
    this.ammoByWeapon = {
      pulse_carbine: WEAPONS.pulse_carbine.magSize,
      volt_scatter: WEAPONS.volt_scatter.magSize,
      helios_rail: WEAPONS.helios_rail.magSize,
      arc_repeater: WEAPONS.arc_repeater.magSize,
    };
    this.isReloading = false;
    this.reloadRemainingMs = 0;
    this.isScoped = false;
    this.rightMouseDown = false;
    this.gamepadTriggerFiring = false;
    this.isDead = false;
    this.killCamRemainingMs = 0;
    this.killCamClip = [];
    this.killCamBeamFired = false;
    this.deathRespawnRemainingMs = 0;
    this.killedBy = null;
    this.camera.fov = this.settings.fov;
    this.camera.updateProjectionMatrix();
    this.dashCharge = 100;
    this.tags = 0;
    this.deaths = 0;
    this.teamScoreCyan = 0;
    this.teamScoreAmber = 0;
    this.shotsFired = 0;
    this.shotsHit = 0;
    this.underfootJumpCooldownMs = 0;
    this.matchDuration = isTutorial ? 180 : 120;
    this.matchTimeRemaining = this.matchDuration;
    this.elapsedMatchSec = 0;
    this.healSchedule = isTutorial ? [] : getHealOrbScheduleTimes(this.matchDuration, 5);
    this.healNextIndex = 0;
    this.healFlashMs = 0;
    this.clearHealOrbs();
    this.easterEggTriggered = false;
    this.killsFeed = [];
    this.screenState = 'playing';
    this.weaponMount.visible = true;

    this.spawnBots(isTutorial);
    this.emitHud(true);
  }

  public respawnPlayer(): boolean {
    if (
      !this.isDead ||
      this.killCamRemainingMs > 0 ||
      this.deathRespawnRemainingMs > 0 ||
      this.screenState !== 'playing'
    ) {
      return false;
    }
    const map = MAPS[this.mapId];
    const sp =
      this.gameMode === 'tdm'
        ? this.pickTeamSpawn(map, 'cyan')
        : map.spawns[Math.floor(Math.random() * map.spawns.length)];
    this.isDead = false;
    this.killCamRemainingMs = 0;
    this.killCamClip = [];
    this.killCamBeamFired = false;
    this.deathRespawnRemainingMs = 0;
    this.killedBy = null;
    this.hp = this.maxHp;
    this.ammoByWeapon[this.weaponId] = WEAPONS[this.weaponId].magSize;
    this.isReloading = false;
    this.reloadRemainingMs = 0;
    this.playerPos = { x: sp.x, y: sp.y, z: sp.z };
    this.playerVel = { x: 0, y: 0, z: 0 };
    this.grounded = true;
    this.yaw = sp.yaw;
    this.pitch = 0;
    this.camera.fov = this.settings.fov;
    this.camera.updateProjectionMatrix();
    this.weaponMount.visible = true;
    this.emitHud(true);
    return true;
  }

  private clearHealOrbs() {
    while (this.orbsGroup.children.length > 0) {
      this.orbsGroup.remove(this.orbsGroup.children[0]);
    }
    this.healOrbs = [];
  }

  public setMapPreview(mapId: MapId) {
    if (this.mapId !== mapId) {
      this.buildMapScene(mapId);
    }
  }

  private buildMapScene(mapId: MapId) {
    this.mapId = mapId;
    const map = MAPS[mapId];

    // Clear previous map meshes
    while (this.mapGroup.children.length > 0) {
      this.mapGroup.remove(this.mapGroup.children[0]);
    }
    this.easterEggRig = null;
    this.jumpPadRings = [];

    const fogScale = 180 / Math.max(60, this.settings.renderDistance || 180);
    this.scene.background = new THREE.Color(map.skyColor);
    this.scene.fog = new THREE.FogExp2(map.fogColor, map.fogDensity * fogScale);
    this.renderer.toneMappingExposure = map.isDaylight ? 1.02 : 1.12;

    // Gradient Sky Dome for realistic atmospheric depth (always inside camera.far)
    const skyRadius = Math.max(320, map.arenaHalfSize * 4.0);
    const skyDome = new THREE.Mesh(
      new THREE.SphereGeometry(skyRadius, 32, 20),
      createSkyDomeMaterial(map.skyTopColor, map.skyHorizonColor)
    );
    this.mapGroup.add(skyDome);

    // 3-point lighting with warm/cool atmospheric contrast (gentle exposure for daylight)
    const hemi = new THREE.HemisphereLight(
      map.hemiSkyColor,
      map.hemiGroundColor,
      map.isDaylight ? 0.72 : 0.85
    );
    this.mapGroup.add(hemi);

    const shadowSize = Math.max(512, this.getShadowMapSize(this.settings.shadowQuality ?? 'high'));
    this.currentShadowSize = shadowSize;
    const keyLight = new THREE.DirectionalLight(map.keyLightColor, map.isDaylight ? 1.18 : 1.45);
    keyLight.position.set(42, 62, 36);
    keyLight.castShadow = !this.isSoftwareGl && this.settings.shadowsEnabled && this.settings.shadowQuality !== 'off';
    const d = map.arenaHalfSize + 8;
    keyLight.shadow.camera.left = -d;
    keyLight.shadow.camera.right = d;
    keyLight.shadow.camera.top = d;
    keyLight.shadow.camera.bottom = -d;
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = Math.max(170, map.arenaHalfSize * 2.6);
    keyLight.shadow.mapSize.set(shadowSize, shadowSize);
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    this.keyLight = keyLight;
    this.mapGroup.add(keyLight);

    const accentPoint = new THREE.PointLight(
      map.accentColor,
      map.isDaylight ? 6 : 16,
      72,
      1.4
    );
    accentPoint.position.set(0, 9.5, 0);
    this.mapGroup.add(accentPoint);

    const maxAniso = this.renderer.capabilities.getMaxAnisotropy();
    const isTrampledField = map.floorStyle === 'trampled_earth';
    const isSandyard = map.floorStyle === 'sandyard';
    const floorTex = isTrampledField
      ? createTrampledFieldFloorTextures(maxAniso)
      : isSandyard
      ? createSandyardFloorTextures(maxAniso)
      : createArenaFloorTextures(
          map.floorColor,
          map.accentColor,
          maxAniso,
          map.isOutdoor
        );
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: floorTex.map,
      bumpMap: floorTex.bumpMap,
      bumpScale: isTrampledField ? 0.14 : isSandyard ? 0.11 : 0.08,
      roughness: isTrampledField || isSandyard ? 0.94 : map.isOutdoor ? 0.72 : 0.56,
      metalness: isTrampledField || isSandyard ? 0.02 : map.isOutdoor ? 0.12 : 0.34,
    });

    const barrierTex = createBarrierTexture(map.wallColor, map.accentColor, maxAniso);
    const concreteTex =
      isTrampledField || isSandyard ? createConcreteWallTextures('#7a7f87', maxAniso) : null;
    const woodTex = isTrampledField || isSandyard ? createWoodenCrateTextures(maxAniso) : null;
    const sandstoneTex = isSandyard ? createSandstoneWallTextures(maxAniso) : null;
    const corrugatedTex = isSandyard ? createCorrugatedMetalTextures(maxAniso) : null;

    if (map.isOutdoor) {
      // Extended outdoor ground disc + solid arena perimeter parapet wall + distant cliff vista
      const terrain = new THREE.Mesh(
        new THREE.CircleGeometry(skyRadius, 48),
        floorMat
      );
      terrain.rotation.x = -Math.PI / 2;
      terrain.receiveShadow = true;
      this.mapGroup.add(terrain);

      const arenaSize = map.arenaHalfSize * 2;
      const borderMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        map: sandstoneTex ? sandstoneTex.map : concreteTex ? concreteTex.map : barrierTex,
        bumpMap: sandstoneTex?.bumpMap ?? concreteTex?.bumpMap ?? null,
        bumpScale: sandstoneTex || concreteTex ? 0.055 : 0,
        roughness: isTrampledField || isSandyard ? 0.88 : 0.72,
        metalness: isTrampledField || isSandyard ? 0.05 : 0.25,
      });
      const borderTrimMat =
        isTrampledField || isSandyard
          ? new THREE.MeshStandardMaterial({
              color: isSandyard ? 0x9c7246 : 0x565b63,
              roughness: 0.84,
              metalness: 0.08,
            })
          : new THREE.MeshStandardMaterial({
              color: map.accentColor,
              emissive: map.accentColor,
              emissiveIntensity: 1.3,
              roughness: 0.2,
            });
      const borderH = isSandyard ? 5.2 : isTrampledField ? 3.2 : 2.6;
      const borderDefs: Array<[number, number, number, number, boolean]> = [
        [0, -map.arenaHalfSize, arenaSize + 0.9, 0.9, true],
        [0, map.arenaHalfSize, arenaSize + 0.9, 0.9, true],
        [-map.arenaHalfSize, 0, 0.9, arenaSize - 0.9, false],
        [map.arenaHalfSize, 0, 0.9, arenaSize - 0.9, false],
      ];
      for (const [wx, wz, ww, wd, alongX] of borderDefs) {
        const wall = new THREE.Mesh(new THREE.BoxGeometry(ww, borderH, wd), borderMat);
        wall.position.set(wx, borderH * 0.5, wz);
        wall.castShadow = true;
        wall.receiveShadow = true;
        this.mapGroup.add(wall);

        const rail = new THREE.Mesh(
          new THREE.BoxGeometry(alongX ? ww - 0.2 : wd + 0.14, 0.14, alongX ? wd + 0.14 : ww - 0.2),
          borderTrimMat
        );
        if (!alongX) rail.rotation.y = Math.PI / 2;
        rail.position.set(wx, borderH + 0.07, wz);
        this.mapGroup.add(rail);
      }

      const cliffMat = new THREE.MeshStandardMaterial({
        color: isSandyard ? 0xa88258 : isTrampledField ? 0x6b5642 : map.wallColor,
        roughness: 0.94,
        metalness: 0.04,
        flatShading: isTrampledField || isSandyard,
      });
      const ringCount = 32;
      for (let i = 0; i < ringCount; i++) {
        const ang = (i / ringCount) * Math.PI * 2;
        const dist =
          isTrampledField || isSandyard
            ? map.arenaHalfSize + 18 + (i % 3) * 5
            : map.arenaHalfSize + 6.2 + (i % 3) * 2.0;
        const boulder = new THREE.Mesh(
          new THREE.DodecahedronGeometry(
            isTrampledField || isSandyard ? 5.2 + (i % 3) * 1.6 : 3.8 + (i % 3) * 1.3,
            isTrampledField || isSandyard ? 0 : 1
          ),
          cliffMat
        );
        boulder.position.set(
          Math.cos(ang) * dist,
          isTrampledField || isSandyard ? 0.9 : 1.5,
          Math.sin(ang) * dist
        );
        boulder.rotation.set(i * 0.35, ang, 0.2);
        if (isTrampledField || isSandyard) {
          boulder.scale.set(2.4, 0.72 + (i % 3) * 0.25, 1.8);
        } else {
          boulder.scale.set(1.3, 1.2 + (i % 2) * 0.5, 1.2);
        }
        boulder.receiveShadow = true;
        boulder.castShadow = true;
        this.mapGroup.add(boulder);
      }
    } else {
      // Indoor hangar floor + high architectural walls & ceiling trusses
      const arenaSize = map.arenaHalfSize * 2;
      const floor = new THREE.Mesh(new THREE.PlaneGeometry(arenaSize, arenaSize), floorMat);
      floor.rotation.x = -Math.PI / 2;
      floor.receiveShadow = true;
      this.mapGroup.add(floor);

      const wallMat = new THREE.MeshStandardMaterial({
        color: map.wallColor,
        map: barrierTex,
        roughness: 0.64,
        metalness: 0.32,
      });
      const trimMat = new THREE.MeshStandardMaterial({
        color: map.accentColor,
        emissive: map.accentColor,
        emissiveIntensity: 1.5,
        roughness: 0.2,
      });

      const h = 9.5;
      const wallDefs: Array<[number, number, number, number, boolean]> = [
        [0, -map.arenaHalfSize, arenaSize + 0.9, 0.9, true],
        [0, map.arenaHalfSize, arenaSize + 0.9, 0.9, true],
        [-map.arenaHalfSize, 0, 0.9, arenaSize - 0.9, false],
        [map.arenaHalfSize, 0, 0.9, arenaSize - 0.9, false],
      ];
      for (const [wx, wz, ww, wd, alongX] of wallDefs) {
        const wall = new THREE.Mesh(new THREE.BoxGeometry(ww, h, wd), wallMat);
        wall.position.set(wx, h / 2, wz);
        wall.receiveShadow = true;
        this.mapGroup.add(wall);

        const strip = new THREE.Mesh(
          new THREE.BoxGeometry(alongX ? ww - 1.2 : ww + 0.08, 0.16, alongX ? wd + 0.08 : wd - 1.2),
          trimMat
        );
        strip.position.set(wx, 2.8, wz);
        this.mapGroup.add(strip);
      }

      for (let i = -2; i <= 2; i++) {
        const beam = new THREE.Mesh(new THREE.BoxGeometry(arenaSize, 0.45, 0.65), wallMat);
        beam.position.set(0, 9.6, i * (map.arenaHalfSize * 0.38));
        this.mapGroup.add(beam);
      }
    }

    // Trampled earth worn footpaths + building interior concrete slabs & TDM spawn zone strips for Map 1
    if (isTrampledField && concreteTex) {
      const pathTex = createTrampledPathOverlayTexture(maxAniso);
      const pathMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        map: pathTex.map,
        bumpMap: pathTex.bumpMap,
        bumpScale: 0.1,
        transparent: true,
        roughness: 0.92,
        metalness: 0.02,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -2,
        polygonOffsetUnits: -2,
      });

      const addDirtPath = (x: number, z: number, w: number, len: number, rotZ = 0) => {
        const strip = new THREE.Mesh(new THREE.PlaneGeometry(w, len), pathMat);
        strip.rotation.x = -Math.PI / 2;
        strip.rotation.z = rotZ;
        strip.position.set(x, 0.032, z);
        strip.receiveShadow = true;
        this.mapGroup.add(strip);
      };

      // North-South heavily walked center path (Red Base -> Center Platform -> Blue Base)
      addDirtPath(0, -33, 5.4, 52, 0);
      addDirtPath(0, 33, 5.4, 52, 0);
      // East-West cross trails linking West & East side building doorways across the courtyard
      addDirtPath(0, -12, 4.4, 92, Math.PI / 2);
      addDirtPath(0, 12, 4.4, 92, Math.PI / 2);
      // Side base yard footpaths linking peek walls & spawns
      addDirtPath(0, -56, 4.4, 42, Math.PI / 2);
      addDirtPath(0, 56, 4.4, 42, Math.PI / 2);

      // Poured concrete interior floor pads inside the two long enterable side buildings
      const interiorFloorMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        map: concreteTex.map,
        bumpMap: concreteTex.bumpMap,
        bumpScale: 0.04,
        roughness: 0.88,
        metalness: 0.05,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
      });
      for (const side of [-1, 1]) {
        const pad = new THREE.Mesh(new THREE.PlaneGeometry(17.5, 94.6), interiorFloorMat);
        pad.rotation.x = -Math.PI / 2;
        pad.position.set(side * 55.35, 0.024, 0);
        pad.receiveShadow = true;
        this.mapGroup.add(pad);
      }

      // Subtle painted team zone strips at North (Red) and South (Blue) non-building bases
      const blueZoneMat = new THREE.MeshStandardMaterial({
        color: 0x2563eb,
        roughness: 0.85,
        polygonOffset: true,
        polygonOffsetFactor: -3,
        polygonOffsetUnits: -3,
      });
      const redZoneMat = new THREE.MeshStandardMaterial({
        color: 0xdc2626,
        roughness: 0.85,
        polygonOffset: true,
        polygonOffsetFactor: -3,
        polygonOffsetUnits: -3,
      });
      const blueStrip = new THREE.Mesh(new THREE.PlaneGeometry(34, 1.4), blueZoneMat);
      blueStrip.rotation.x = -Math.PI / 2;
      blueStrip.position.set(0, 0.04, 62);
      this.mapGroup.add(blueStrip);

      const redStrip = new THREE.Mesh(new THREE.PlaneGeometry(34, 1.4), redZoneMat);
      redStrip.rotation.x = -Math.PI / 2;
      redStrip.position.set(0, 0.04, -62);
      this.mapGroup.add(redStrip);
    }

    // Intersecting Boulevard Roads (elevated cleanly with polygonOffset so zero z-fighting occurs)
    if (map.hasRoads) {
      const roadTex = createRoadTexture(maxAniso);
      const roadMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        map: roadTex,
        roughness: 0.86,
        metalness: 0.08,
        polygonOffset: true,
        polygonOffsetFactor: -2,
        polygonOffsetUnits: -2,
      });
      const junctionMat = new THREE.MeshStandardMaterial({
        color: 0x1b1f27,
        roughness: 0.88,
        metalness: 0.08,
        polygonOffset: true,
        polygonOffsetFactor: -2,
        polygonOffsetUnits: -2,
      });
      const roadW = 6.8;
      const armLen = map.arenaHalfSize - roadW * 0.5 - 0.5;
      const offsetCenter = roadW * 0.5 + armLen * 0.5;

      const junction = new THREE.Mesh(new THREE.PlaneGeometry(roadW, roadW), junctionMat);
      junction.rotation.x = -Math.PI / 2;
      junction.position.y = 0.045;
      junction.receiveShadow = true;
      this.mapGroup.add(junction);

      // North & South arms
      for (const sign of [-1, 1]) {
        const arm = new THREE.Mesh(new THREE.PlaneGeometry(roadW, armLen), roadMat);
        arm.rotation.x = -Math.PI / 2;
        arm.position.set(0, 0.045, sign * offsetCenter);
        arm.receiveShadow = true;
        this.mapGroup.add(arm);
      }
      // East & West arms
      for (const sign of [-1, 1]) {
        const arm = new THREE.Mesh(new THREE.PlaneGeometry(roadW, armLen), roadMat);
        arm.rotation.x = -Math.PI / 2;
        arm.rotation.z = Math.PI / 2;
        arm.position.set(sign * offsetCenter, 0.045, 0);
        arm.receiveShadow = true;
        this.mapGroup.add(arm);
      }
    }

    // Build Street Lights along roads/corridors
    if (map.hasStreetLights) {
      const sNear = 20;
      const sFar = Math.round(map.arenaHalfSize * 0.68);
      const lampSpots: Array<{ x: number; z: number; rotY: number }> = [
        { x: -4.4, z: -sNear, rotY: Math.PI / 2 },
        { x: 4.4, z: -sFar, rotY: -Math.PI / 2 },
        { x: -4.4, z: sFar, rotY: Math.PI / 2 },
        { x: 4.4, z: sNear, rotY: -Math.PI / 2 },
        { x: -sNear, z: -4.4, rotY: 0 },
        { x: sNear, z: 4.4, rotY: Math.PI },
        { x: -sFar, z: 4.4, rotY: Math.PI },
        { x: sFar, z: -4.4, rotY: 0 },
      ];
      lampSpots.forEach((spot, idx) => {
        if (Math.abs(spot.x) >= map.arenaHalfSize - 1.5 || Math.abs(spot.z) >= map.arenaHalfSize - 1.5) {
          return;
        }
        const lamp = buildStreetLight(map.accentColor);
        lamp.position.set(spot.x, 0, spot.z);
        lamp.rotation.y = spot.rotY;
        this.mapGroup.add(lamp);

        // Add subtle warm light pools on 2 opposing lamps to stay well under light budget
        if (idx === 0 || idx === 3) {
          const poolLight = new THREE.PointLight(map.accentColor, 9, 24, 1.7);
          poolLight.position.set(spot.x, 5.8, spot.z);
          this.mapGroup.add(poolLight);
        }
      });
    }

    // Build Trees in open courtyard margins (clear of roads, spawns, and obstacles)
    if (map.hasTrees) {
      const tMid = Math.round(map.arenaHalfSize * 0.52);
      const tOut = Math.round(map.arenaHalfSize * 0.78);
      const treeCandidates = [
        [-22, -22], [22, -22], [-22, 22], [22, 22],
        [-tOut, -14], [tOut, 14], [-14, -tOut], [14, tOut],
        [-tOut, tMid], [tOut, -tMid], [-tMid, tOut], [tMid, -tOut],
        [-10, -tMid], [10, tMid], [-tMid, 10], [tMid, -10],
        [-tOut, -tOut], [tOut, tOut], [-tOut, tOut], [tOut, -tOut],
      ];
      treeCandidates.forEach(([tx, tz], idx) => {
        if (Math.abs(tx) > map.arenaHalfSize - 2.5 || Math.abs(tz) > map.arenaHalfSize - 2.5) return;
        const blockedByObs = map.obstacles.some(
          (o) => Math.abs(tx - o.x) < o.w * 0.5 + 2.4 && Math.abs(tz - o.z) < o.d * 0.5 + 2.4
        );
        const blockedBySpawn = map.spawns.some(
          (s) => Math.hypot(tx - s.x, tz - s.z) < 3.8
        );
        if (blockedByObs || blockedBySpawn) return;
        const scale = 1.0 + (idx % 3) * 0.2;
        const tree = buildTreeModel(this.shadowTex, scale, idx);
        tree.position.set(tx, 0, tz);
        this.mapGroup.add(tree);
      });
    }

    // Build Jump Pads
    for (const pad of map.jumpPads) {
      const built = buildJumpPad(map.accentColor);
      built.group.position.set(pad.x, pad.y, pad.z);
      this.mapGroup.add(built.group);
      this.jumpPadRings.push(built.ring);
    }

    // Build Textured Houses, Cargo Crates, Peeking Cover, Bridges & Formations
    const crateTex = createCrateTexture(map.accentColor, maxAniso);
    const facadeTex = createHouseFacadeTexture(map.wallColor, map.accentColor, maxAniso);

    const iceMat = new THREE.MeshStandardMaterial({
      color: 0xbae6fd,
      map: barrierTex,
      roughness: 0.2,
      metalness: 0.18,
      emissive: 0x0284c7,
      emissiveIntensity: 0.32,
    });
    const monolithMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: barrierTex,
      roughness: 0.52,
      metalness: 0.38,
    });
    const capMat = new THREE.MeshStandardMaterial({
      color: map.accentColor,
      emissive: map.accentColor,
      emissiveIntensity: 1.25,
      roughness: 0.22,
    });

    const fallbackWoodTex = woodTex ?? createWoodenCrateTextures(maxAniso);
    const fallbackConcreteTex = concreteTex ?? createConcreteWallTextures(map.wallColor, maxAniso);
    const fallbackSandstoneTex = sandstoneTex ?? createSandstoneWallTextures(maxAniso);
    const fallbackMetalTex = corrugatedTex ?? createCorrugatedMetalTextures(maxAniso);

    for (const obs of map.obstacles) {
      if (obs.kind === 'house') {
        this.mapGroup.add(buildHouseStructure(obs, facadeTex, map.accentColor));
      } else if (obs.kind === 'wood_crate') {
        this.mapGroup.add(buildWoodenCrate(obs, fallbackWoodTex.map, fallbackWoodTex.bumpMap));
      } else if (obs.kind === 'concrete_wall') {
        this.mapGroup.add(buildConcreteWall(obs, fallbackConcreteTex.map, fallbackConcreteTex.bumpMap));
      } else if (obs.kind === 'building_wall') {
        this.mapGroup.add(buildBuildingWall(obs, fallbackConcreteTex.map, fallbackConcreteTex.bumpMap));
      } else if (obs.kind === 'building_floor') {
        this.mapGroup.add(buildBuildingFloor(obs, fallbackConcreteTex.map, fallbackConcreteTex.bumpMap));
      } else if (obs.kind === 'building_roof') {
        this.mapGroup.add(buildBuildingRoof(obs, fallbackConcreteTex.map, fallbackConcreteTex.bumpMap));
      } else if (obs.kind === 'sandstone_wall') {
        this.mapGroup.add(buildSandstoneWall(obs, fallbackSandstoneTex.map, fallbackSandstoneTex.bumpMap));
      } else if (obs.kind === 'metal_awning') {
        this.mapGroup.add(buildMetalAwning(obs, fallbackMetalTex.map, fallbackMetalTex.bumpMap));
      } else if (obs.kind === 'platform' && isTrampledField) {
        this.mapGroup.add(buildSquarePlatform(obs, fallbackConcreteTex.map, fallbackConcreteTex.bumpMap));
      } else if (obs.kind === 'crate') {
        this.mapGroup.add(buildTexturedCrate(obs, crateTex, map.accentColor));
      } else if (obs.kind === 'peek_wall' || obs.kind === 'barrier') {
        this.mapGroup.add(buildPeekCover(obs, barrierTex, map.accentColor));
      } else if (obs.kind === 'bridge') {
        this.mapGroup.add(buildBridgeStructure(obs, crateTex, map.accentColor));
      } else {
        const bodyH = Math.max(0.2, obs.h - 0.08);
        const box = new THREE.Mesh(
          new THREE.BoxGeometry(obs.w, bodyH, obs.d),
          obs.kind === 'ice' ? iceMat : monolithMat
        );
        box.position.set(obs.x, obs.y + bodyH / 2, obs.z);
        box.castShadow = true;
        box.receiveShadow = true;
        this.mapGroup.add(box);

        const rim = new THREE.Mesh(
          new THREE.BoxGeometry(obs.w + 0.06, 0.08, obs.d + 0.06),
          capMat
        );
        rim.position.set(obs.x, obs.y + bodyH + 0.04, obs.z);
        this.mapGroup.add(rim);
      }
    }

    // Build hidden Obsidian Vault Easter Egg Monolith (no bright beacon light so players must find it)
    if (map.easterEgg) {
      this.easterEggRig = buildEasterEggMonolith();
      this.easterEggRig.group.position.set(map.easterEgg.x, 0, map.easterEgg.z);
      this.mapGroup.add(this.easterEggRig.group);
    }

    // Also populate idle showcase bots during Title Tour
    this.spawnBots(false);
  }

  private spawnBots(isTutorial: boolean) {
    for (const oldBot of this.bots) {
      disposeAvatarRig(oldBot.rig);
    }
    while (this.botsGroup.children.length > 0) {
      this.botsGroup.remove(this.botsGroup.children[0]);
    }
    this.bots = [];
    const map = MAPS[this.mapId];

    if (isTutorial) {
      const dronePositions = [
        { x: -3.5, y: 0, z: 21.5 },
        { x: 0, y: 0, z: 20.5 },
        { x: 3.5, y: 0, z: 21.5 },
      ];
      dronePositions.forEach((p, idx) => {
        const skin = AVATAR_SKINS[idx % AVATAR_SKINS.length];
        const name = `Holo-Drone 0${idx + 1}`;
        const rig = buildAvatarRig(skin, '#ef4444', this.shadowTex, 'enemy', name);
        rig.group.position.set(p.x, p.y, p.z);
        rig.group.rotation.y = 0;
        this.botsGroup.add(rig.group);
        this.bots.push({
          id: `drone-${idx}`,
          nickname: name,
          team: 'amber',
          policy: 'drone',
          x: p.x,
          y: p.y,
          z: p.z,
          vx: 0,
          vz: 0,
          velY: 0,
          grounded: true,
          yaw: 0,
          hp: 40,
          maxHp: 40,
          alive: true,
          respawnTimer: 0,
          fireCooldown: 99,
          strafeSign: idx % 2 === 0 ? 1 : -1,
          strafeTimer: 1.5,
          avatarSkinId: skin.id,
          rig,
          walkPhase: idx * 1.1,
          hitFlashTimer: 0,
          kills: 0,
          deaths: 0,
          poseHistory: [],
          lastPoseSampleMs: 0,
        });
      });
      return;
    }

    const botConfigs: Array<{
      name: string;
      team: 'cyan' | 'amber';
      policy: BotEntity['policy'];
      skinIdx: number;
      spawnIdx: number;
    }> =
      this.gameMode === 'tdm'
        ? [
            { name: 'AstraAlly', team: 'cyan', policy: 'flanker', skinIdx: 0, spawnIdx: 1 },
            { name: 'PulseAlly', team: 'cyan', policy: 'charger', skinIdx: 2, spawnIdx: 2 },
            { name: 'RiftBot', team: 'amber', policy: 'flanker', skinIdx: 1, spawnIdx: 0 },
            { name: 'VexUnit', team: 'amber', policy: 'kiter', skinIdx: 3, spawnIdx: 1 },
            { name: 'ApexFrame', team: 'amber', policy: 'charger', skinIdx: 4, spawnIdx: 2 },
          ]
        : [
            { name: 'RiftBot', team: 'amber', policy: 'flanker', skinIdx: 1, spawnIdx: 1 },
            { name: 'VexUnit', team: 'amber', policy: 'kiter', skinIdx: 2, spawnIdx: 2 },
            { name: 'ApexFrame', team: 'amber', policy: 'charger', skinIdx: 3, spawnIdx: 3 },
            { name: 'HelixAI', team: 'amber', policy: 'patroller', skinIdx: 4, spawnIdx: 4 },
          ];

    for (const cfg of botConfigs) {
      const sp =
        this.gameMode === 'tdm'
          ? this.pickTeamSpawn(map, cfg.team, cfg.spawnIdx)
          : map.spawns[cfg.spawnIdx % map.spawns.length];
      const skin = AVATAR_SKINS[cfg.skinIdx % AVATAR_SKINS.length];
      const relation: 'ally' | 'enemy' =
        this.gameMode === 'tdm' && cfg.team === 'cyan' ? 'ally' : 'enemy';
      const teamGlow = relation === 'ally' ? '#3b82f6' : '#ef4444';
      const rig = buildAvatarRig(skin, teamGlow, this.shadowTex, relation, cfg.name);
      rig.group.position.set(sp.x, sp.y, sp.z);
      this.botsGroup.add(rig.group);

      this.bots.push({
        id: `bot-${cfg.name.toLowerCase()}`,
        nickname: cfg.name,
        team: cfg.team,
        policy: cfg.policy,
        x: sp.x,
        y: sp.y,
        z: sp.z,
        vx: 0,
        vz: 0,
        velY: 0,
        grounded: true,
        yaw: sp.yaw,
        hp: 100,
        maxHp: 100,
        alive: true,
        respawnTimer: 0,
        fireCooldown: 1.2 + Math.random(),
        strafeSign: Math.random() > 0.5 ? 1 : -1,
        strafeTimer: 0.9 + Math.random() * 1.1,
        avatarSkinId: skin.id,
        rig,
        walkPhase: Math.random() * 6,
        hitFlashTimer: 0,
        kills: 0,
        deaths: 0,
        poseHistory: [
          {
            t: performance.now() / 1000,
            attackerX: sp.x,
            attackerY: sp.y,
            attackerZ: sp.z,
            attackerYaw: sp.yaw,
            victimX: this.playerPos.x,
            victimY: this.playerPos.y,
            victimZ: this.playerPos.z,
          },
        ],
        lastPoseSampleMs: performance.now(),
      });
    }
  }

  public syncRemotePeers(peers: RemoteActorState[]) {
    const activeIds = new Set(peers.map((p) => p.id));
    for (const [id, entry] of this.peerMeshes.entries()) {
      if (!activeIds.has(id)) {
        this.peersGroup.remove(entry.rig.group);
        disposeAvatarRig(entry.rig);
        this.peerMeshes.delete(id);
      }
    }

    for (const peer of peers) {
      const relation: 'ally' | 'enemy' =
        this.gameMode === 'tdm' && peer.team === 'cyan' ? 'ally' : 'enemy';
      let existing = this.peerMeshes.get(peer.id);
      if (existing && existing.relation !== relation) {
        this.peersGroup.remove(existing.rig.group);
        disposeAvatarRig(existing.rig);
        this.peerMeshes.delete(peer.id);
        existing = undefined;
      }
      if (!existing) {
        const skin =
          AVATAR_SKINS.find((a) => a.id === peer.avatarSkinId) ?? AVATAR_SKINS[0];
        const teamColor = relation === 'ally' ? '#3b82f6' : '#ef4444';
        const rig = buildAvatarRig(skin, teamColor, this.shadowTex, relation, peer.nickname);
        this.peersGroup.add(rig.group);
        existing = { rig, walkPhase: 0, data: peer, relation };
        this.peerMeshes.set(peer.id, existing);
      }
      const moved =
        Math.hypot(peer.x - existing.data.x, peer.z - existing.data.z) > 0.01;
      existing.data = peer;
      existing.rig.group.visible = peer.alive;
      existing.rig.group.position.set(peer.x, peer.y, peer.z);
      existing.rig.group.rotation.y = peer.yaw + Math.PI;
      if (moved) {
        existing.walkPhase += 0.35;
        existing.rig.legL.rotation.x = Math.sin(existing.walkPhase) * 0.52;
        existing.rig.legR.rotation.x = -Math.sin(existing.walkPhase) * 0.52;
        existing.rig.armL.rotation.x = -0.35 + Math.sin(existing.walkPhase) * 0.24;
        existing.rig.armR.rotation.x = Math.cos(existing.walkPhase) * 0.1;
        existing.rig.torso.rotation.x = 0.07;
      } else {
        existing.rig.legL.rotation.x = 0;
        existing.rig.legR.rotation.x = 0;
        existing.rig.armL.rotation.x = 0;
        existing.rig.torso.rotation.x = 0;
      }
    }
  }

  public spawnRemoteLaser(
    origin: { x: number; y: number; z: number },
    end: { x: number; y: number; z: number },
    colorHex: string
  ) {
    this.spawnBeam(origin, end, colorHex);
  }

  private spawnBeam(
    origin: { x: number; y: number; z: number },
    end: { x: number; y: number; z: number },
    colorHex: string
  ) {
    const slot = this.beamPool.find((b) => b.life <= 0) ?? this.beamPool[0];
    _vec3A.set(origin.x, origin.y, origin.z);
    _vec3B.set(end.x, end.y, end.z);
    const dist = Math.max(0.1, _vec3A.distanceTo(_vec3B));

    slot.mesh.position.copy(_vec3A).lerp(_vec3B, 0.5);
    slot.mesh.scale.set(1, 1, dist);
    slot.mesh.lookAt(_vec3B);
    (slot.mesh.material as THREE.MeshBasicMaterial).color.set(colorHex);
    (slot.mesh.material as THREE.MeshBasicMaterial).opacity = 0.95;
    slot.mesh.visible = true;
    slot.life = slot.maxLife;
  }

  private spawnSparks(point: { x: number; y: number; z: number }, count: number) {
    if (!this.settings.particlesEnabled) return;
    let spawned = 0;
    for (const sp of this.sparks) {
      if (!sp.active) {
        sp.active = true;
        sp.x = point.x;
        sp.y = point.y;
        sp.z = point.z;
        sp.vx = (Math.random() - 0.5) * 8;
        sp.vy = Math.random() * 5 + 1;
        sp.vz = (Math.random() - 0.5) * 8;
        sp.life = 0.28 + Math.random() * 0.16;
        spawned++;
        if (spawned >= count) break;
      }
    }
  }

  private spawnProjectile(
    origin: { x: number; y: number; z: number },
    endPoint: { x: number; y: number; z: number },
    ammoStyle: WeaponDef['ammoStyle']
  ) {
    const slot = this.projectilePool.find((p) => !p.active) ?? this.projectilePool[0];
    _vec3A.set(origin.x, origin.y, origin.z);
    _vec3B.set(endPoint.x, endPoint.y, endPoint.z);
    const dist = Math.max(0.25, _vec3A.distanceTo(_vec3B));
    _vec3C.copy(_vec3B).sub(_vec3A).normalize();

    const speed =
      ammoStyle === 'rail_lance'
        ? 160
        : ammoStyle === 'gold_bullet'
        ? 105
        : ammoStyle === 'gray_pellets'
        ? 78
        : 98;

    slot.active = true;
    slot.mesh.geometry = this.projectileGeos[ammoStyle];
    slot.mesh.material = this.projectileMats[ammoStyle];
    slot.mesh.position.copy(_vec3A);
    slot.mesh.lookAt(_vec3B);
    slot.mesh.visible = true;
    slot.vx = _vec3C.x * speed;
    slot.vy = _vec3C.y * speed;
    slot.vz = _vec3C.z * speed;
    slot.life = Math.min(0.45, dist / speed);
  }

  private startReload() {
    const weapon = WEAPONS[this.weaponId];
    const currentAmmo = this.ammoByWeapon[this.weaponId];
    if (this.isReloading || currentAmmo >= weapon.magSize) return;
    this.isReloading = true;
    this.isScoped = false;
    this.reloadTotalMs = weapon.reloadTimeMs;
    this.reloadRemainingMs = weapon.reloadTimeMs;
    soundEngine.playReload();
    this.emitHud(true);
  }

  public triggerFire() {
    this.tryFire();
  }

  private tryFire() {
    if (this.screenState !== 'playing' || this.isDead) return;
    if (this.isReloading) return;

    const now = performance.now();
    const weapon = WEAPONS[this.weaponId];
    if (now - this.lastFireMs < weapon.fireIntervalMs) return;

    const currentAmmo = this.ammoByWeapon[this.weaponId];
    if (currentAmmo <= 0) {
      if (shouldAutoReload(currentAmmo, this.isReloading)) {
        this.startReload();
      }
      return;
    }

    this.lastFireMs = now;
    const nextAmmo = Math.max(0, currentAmmo - 1);
    this.ammoByWeapon[this.weaponId] = nextAmmo;

    this.recoilOffset = Math.min(0.12, this.recoilOffset + (weapon.id === 'helios_rail' ? 0.1 : 0.04));
    this.cameraTrauma = Math.min(1, this.cameraTrauma + (weapon.id === 'helios_rail' ? 0.28 : 0.12));
    soundEngine.playLaser(this.weaponId);
    this.triggerRumble(
      weapon.id === 'helios_rail' ? 0.5 : 0.22,
      weapon.id === 'helios_rail' ? 0.65 : 0.18,
      weapon.id === 'helios_rail' ? 120 : 55
    );

    const map = MAPS[this.mapId];
    const camPos = {
      x: this.camera.position.x,
      y: this.camera.position.y,
      z: this.camera.position.z,
    };

    // Base forward vector from camera quaternion
    _vec3C.set(0, 0, -1).applyQuaternion(this.camera.quaternion).normalize();

    const targets: RayTarget[] = this.bots
      .filter((b) => this.gameMode !== 'tdm' || b.team === 'amber')
      .map((b) => ({
        id: b.id,
        x: b.x,
        y: b.y,
        z: b.z,
        radius: 0.48,
        height: 1.78,
        alive: b.alive,
      }));

    // Include opposing remote peers as ray targets
    for (const [id, entry] of this.peerMeshes.entries()) {
      if (entry.data.alive && (this.gameMode !== 'tdm' || entry.data.team !== 'cyan')) {
        targets.push({
          id,
          x: entry.data.x,
          y: entry.data.y,
          z: entry.data.z,
          radius: 0.48,
          height: 1.78,
          alive: true,
        });
      }
    }

    const skin = WEAPON_SKINS.find((s) => s.id === this.weaponSkinId) ?? WEAPON_SKINS[0];
    const beamColor =
      weapon.ammoStyle === 'gold_bullet'
        ? '#fbbf24'
        : weapon.ammoStyle === 'gray_pellets'
        ? '#94a3b8'
        : skin.unlockSource === 'starter'
        ? weapon.beamColor
        : skin.emissiveColor;

    // Muzzle origin (centered when scoped, weapon barrel offset when hip-firing)
    const muzzleOffset = this.isScoped
      ? _vec3A.set(0, -0.06, -0.65)
      : _vec3A.set(0.18, -0.14, -0.65);
    muzzleOffset.applyQuaternion(this.camera.quaternion).add(this.camera.position);
    const muzzlePos = { x: muzzleOffset.x, y: muzzleOffset.y, z: muzzleOffset.z };

    let underfootTriggered = false;
    for (let p = 0; p < weapon.pellets; p++) {
      this.shotsFired++;
      const dir = {
        x: _vec3C.x + (Math.random() - 0.5) * weapon.spread,
        y: _vec3C.y + (Math.random() - 0.5) * weapon.spread,
        z: _vec3C.z + (Math.random() - 0.5) * weapon.spread,
      };
      const len = Math.hypot(dir.x, dir.y, dir.z);
      dir.x /= len;
      dir.y /= len;
      dir.z /= len;

      const hit = castLaserRay(camPos, dir, weapon.maxRange, map, targets);
      this.spawnProjectile(muzzlePos, hit.point, weapon.ammoStyle);
      this.spawnBeam(muzzlePos, hit.point, beamColor);
      this.spawnSparks(hit.point, hit.hitType === 'target' ? 14 : 6);

      // Underfoot shot jump boost (+0.3x jump height) when firing downward near ground/cover
      if (
        !underfootTriggered &&
        canTriggerUnderfootJump(dir.y, hit.distance, this.underfootJumpCooldownMs)
      ) {
        this.playerVel.y = applyUnderfootJumpVelocity(this.playerVel.y);
        this.grounded = false;
        this.underfootJumpCooldownMs = 450;
        underfootTriggered = true;
        soundEngine.playJumpPad();
      }

      if (p === 0) {
        this.callbacks.onNetworkFire?.(
          this.weaponId,
          muzzlePos,
          hit.point,
          beamColor,
          hit.distance
        );
      }

      if (hit.hitType === 'easter_egg' && !this.easterEggTriggered) {
        if (canTriggerEasterEgg(this.mapId, this.weaponId)) {
          this.easterEggTriggered = true;
          soundEngine.playEasterEggChime();
          this.hitstopTimer = 0.07;
          this.cameraTrauma = 0.65;
          this.spawnSparks(hit.point, 28);
          this.callbacks.onEasterEggFound();
        }
      } else if (hit.hitType === 'target' && hit.targetId) {
        this.shotsHit++;
        const isHeadshot = hit.hitZone === 'head';
        const dmg = calculateDamage(weapon.damage, hit.hitZone ?? 'body');
        const bot = this.bots.find((b) => b.id === hit.targetId);
        if (bot && bot.alive) {
          bot.hp -= dmg;
          bot.hitFlashTimer = 0.09;
          if (Math.random() < 0.6) bot.strafeSign *= -1;
          this.hitMarkerMs = isHeadshot ? 260 : 180;
          this.lastHitZone = hit.hitZone ?? 'body';
          if (bot.hp <= 0) {
            bot.alive = false;
            bot.deaths++;
            bot.respawnTimer = this.isTutorial ? 999 : 3.2;
            bot.rig.group.visible = false;
            this.tags++;
            if (this.gameMode === 'tdm') {
              this.teamScoreCyan += 1;
            }
            this.hitstopTimer = isHeadshot ? 0.055 : 0.035;
            soundEngine.playHitMarker(true, isHeadshot);
            this.killsFeed = [
              {
                id: `${now}-${bot.id}`,
                text: isHeadshot
                  ? `HEADSHOT · ${bot.nickname}`
                  : `Tagged ${bot.nickname}`,
              },
              ...this.killsFeed.slice(0, 3),
            ];
            if (this.isTutorial && bot.policy === 'drone') {
              this.tutorialDronesHit++;
              if (this.tutorialDronesHit >= 3) {
                this.tutorialStep = 3;
                setTimeout(() => {
                  if (!this.disposed && this.isTutorial) {
                    this.callbacks.onTutorialComplete();
                  }
                }, 1400);
              }
            }
          } else {
            soundEngine.playHitMarker(false, isHeadshot);
          }
        }
      }
    }

    // Strict rule: do NOT auto-reload until magazine hits 0
    if (shouldAutoReload(nextAmmo, this.isReloading)) {
      this.startReload();
    } else {
      this.emitHud(true);
    }
  }

  private startLoop() {
    if (typeof MessageChannel !== 'undefined' && !this.loopChannel) {
      this.loopChannel = new MessageChannel();
    }

    const scheduleNext = (tickFn: () => void) => {
      if (this.disposed) return;
      if (this.isSoftwareGl) {
        this.afterDraw(tickFn);
        return;
      }

      const useScreenLock =
        this.settings.vsync || this.settings.fpsCap === 'screen_locked';
      if (useScreenLock) {
        this.rafId = requestAnimationFrame(tickFn);
        return;
      }

      if (this.settings.fpsCap === 'unlimited') {
        if (this.loopChannel) {
          this.loopChannel.port1.postMessage(null);
        } else {
          this.timeoutId = window.setTimeout(tickFn, 0);
        }
        return;
      }

      const targetFps = Number(this.settings.fpsCap) || 165;
      const minIntervalMs = 1000 / targetFps;
      const elapsed = performance.now() - this.lastRenderMs;
      const remaining = minIntervalMs - elapsed;
      if (remaining > 5) {
        this.timeoutId = window.setTimeout(tickFn, Math.floor(remaining - 4));
      } else if (this.loopChannel) {
        this.loopChannel.port1.postMessage(null);
      } else {
        this.timeoutId = window.setTimeout(tickFn, 0);
      }
    };

    const tick = () => {
      if (this.disposed) return;
      const now = performance.now();

      // Enforce numeric FPS cap when VSync is disabled and fpsCap is numeric
      const useScreenLock =
        this.settings.vsync || this.settings.fpsCap === 'screen_locked';
      if (!this.isSoftwareGl && !useScreenLock && this.settings.fpsCap !== 'unlimited') {
        const targetFps = Number(this.settings.fpsCap) || 165;
        const minIntervalMs = 1000 / targetFps;
        if (now - this.lastRenderMs < minIntervalMs - 0.35) {
          scheduleNext(tick);
          return;
        }
      }

      this.lastRenderMs = now;
      const rawDt = (now - this.lastTimeMs) / 1000;
      this.lastTimeMs = now;
      const dt = Math.min(Math.max(rawDt, 0.0005), 0.05);

      this.fpsFrameCount++;
      const elapsedFpsMs = now - this.fpsLastSampleMs;
      if (elapsedFpsMs >= 450) {
        this.fps = Math.max(1, Math.round((this.fpsFrameCount * 1000) / elapsedFpsMs));
        this.fpsFrameCount = 0;
        this.fpsLastSampleMs = now;
      }

      this.update(dt, now);
      this.renderer.render(this.scene, this.camera);
      scheduleNext(tick);
    };

    if (this.loopChannel) {
      this.loopChannel.port2.onmessage = () => tick();
    }

    scheduleNext(tick);
  }

  private afterDraw(cb: () => void) {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      if (this.disposed) return;
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 80);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  private update(dt: number, nowMs: number) {
    // Animate Easter Egg Monolith if present
    if (this.easterEggRig) {
      this.easterEggRig.crystal.rotation.y += dt * (this.easterEggTriggered ? 3.5 : 0.8);
      this.easterEggRig.crystal.position.y = 1.9 + Math.sin(nowMs * 0.003) * 0.09;
      this.easterEggRig.ring.rotation.x += dt * 0.6;
      this.easterEggRig.ring.rotation.z += dt * 0.45;
      if (this.easterEggTriggered) {
        (this.easterEggRig.crystal.material as THREE.MeshStandardMaterial).emissive.setHex(0x38bdf8);
        (this.easterEggRig.crystal.material as THREE.MeshStandardMaterial).color.setHex(0x38bdf8);
      }
    }

    // Update laser beam pool
    for (const b of this.beamPool) {
      if (b.life > 0) {
        b.life -= dt;
        if (b.life <= 0) {
          b.mesh.visible = false;
        } else {
          (b.mesh.material as THREE.MeshBasicMaterial).opacity = (b.life / b.maxLife) * 0.72;
        }
      }
    }

    // Update 3D weapon projectile pool (gold bullets, gray shotgun pellets, rail lances, darts)
    for (const p of this.projectilePool) {
      if (!p.active) continue;
      p.life -= dt;
      if (p.life <= 0) {
        p.active = false;
        p.mesh.visible = false;
      } else {
        p.mesh.position.x += p.vx * dt;
        p.mesh.position.y += p.vy * dt;
        p.mesh.position.z += p.vz * dt;
      }
    }

    // Update spark InstancedMesh pool
    let sparksDirty = false;
    for (let i = 0; i < this.sparks.length; i++) {
      const sp = this.sparks[i];
      if (!sp.active) continue;
      sparksDirty = true;
      sp.life -= dt;
      if (sp.life <= 0) {
        sp.active = false;
        _mat4.makeScale(0, 0, 0);
        this.sparkMesh.setMatrixAt(i, _mat4);
      } else {
        sp.vy -= 14 * dt;
        sp.x += sp.vx * dt;
        sp.y += sp.vy * dt;
        sp.z += sp.vz * dt;
        const s = Math.max(0.01, sp.life * 3.0);
        _vec3A.set(sp.x, sp.y, sp.z);
        _scale.set(s, s, s);
        _mat4.compose(_vec3A, _quat.identity(), _scale);
        this.sparkMesh.setMatrixAt(i, _mat4);
      }
    }
    if (sparksDirty) {
      this.sparkMesh.instanceMatrix.needsUpdate = true;
    }

    // Animate Jump Pad hover rings
    for (let i = 0; i < this.jumpPadRings.length; i++) {
      const ring = this.jumpPadRings[i];
      ring.position.y = 0.38 + Math.sin(nowMs * 0.005 + i) * 0.14;
      ring.scale.setScalar(1 + Math.sin(nowMs * 0.005 + i) * 0.08);
    }

    // Title screen world camera tour
    if (this.screenState === 'title') {
      this.tourAngle += dt * 0.16;
      const r = Math.min(46, Math.max(24, MAPS[this.mapId].arenaHalfSize * 0.56));
      this.camera.position.set(
        Math.cos(this.tourAngle) * r,
        11.2 + Math.sin(this.tourAngle * 0.7) * 2.0,
        Math.sin(this.tourAngle) * r
      );
      this.camera.lookAt(0, 2.4, 0);
      return;
    }

    if (this.screenState === 'paused') {
      this.pollGamepad(dt, true);
      return;
    }

    if (this.screenState !== 'playing') return;

    // Poll Gamepad API (supports pause, respawn, sticks, triggers, buttons, D-pad)
    const padInput = this.pollGamepad(dt, false);

    // Hide first-person weapon & hands whenever scoping or dead
    this.weaponMount.visible = !this.isScoped && !this.isDead;

    // Hitstop freeze for heavy impacts while keeping shake/visuals alive
    this.cameraTrauma = Math.max(0, this.cameraTrauma - dt * 2.4);
    this.recoilOffset = THREE.MathUtils.damp(this.recoilOffset, 0, 18, dt);
    this.hitMarkerMs = Math.max(0, this.hitMarkerMs - dt * 1000);
    this.damageFlashMs = Math.max(0, this.damageFlashMs - dt * 1000);
    this.healFlashMs = Math.max(0, this.healFlashMs - dt * 1000);
    this.underfootJumpCooldownMs = Math.max(0, this.underfootJumpCooldownMs - dt * 1000);

    // Magazine reload countdown
    if (this.isReloading && !this.isDead) {
      this.reloadRemainingMs -= dt * 1000;
      if (this.reloadRemainingMs <= 0) {
        this.ammoByWeapon[this.weaponId] = WEAPONS[this.weaponId].magSize;
        this.isReloading = false;
        this.reloadRemainingMs = 0;
        this.emitHud(true);
      }
    }

    if (this.hitstopTimer > 0) {
      this.hitstopTimer -= dt;
      return;
    }

    // Match timer & 5 random Heal Orb spawns
    if (!this.isTutorial) {
      this.elapsedMatchSec += dt;
      this.matchTimeRemaining -= dt;
      while (
        this.healNextIndex < this.healSchedule.length &&
        this.elapsedMatchSec >= this.healSchedule[this.healNextIndex]
      ) {
        const orbPos = pickOpenHealOrbPosition(MAPS[this.mapId]);
        const rig = buildHealOrbModel();
        rig.group.position.set(orbPos.x, orbPos.y, orbPos.z);
        this.orbsGroup.add(rig.group);
        this.healOrbs.push({
          state: {
            id: `orb-${this.healNextIndex}`,
            x: orbPos.x,
            y: orbPos.y,
            z: orbPos.z,
            active: true,
          },
          rig,
        });
        this.healNextIndex++;
      }

      if (this.matchTimeRemaining <= 0) {
        this.matchTimeRemaining = 0;
        this.finishMatch();
        return;
      }
    }

    const map = MAPS[this.mapId];

    // If eliminated, play 3s Kill Cam attacker perspective replay before showing Respawn screen
    if (this.isDead) {
      this.isScoped = false;
      this.mouseDown = false;
      this.gamepadTriggerFiring = false;

      if (this.killCamRemainingMs > 0) {
        this.killCamRemainingMs = Math.max(0, this.killCamRemainingMs - dt * 1000);
        const progress = 1 - this.killCamRemainingMs / KILL_CAM_DURATION_MS;
        const sample = sampleKillCamClip(this.killCamClip, progress);
        if (sample) {
          const fwdX = -Math.sin(sample.attackerYaw);
          const fwdZ = -Math.cos(sample.attackerYaw);
          const rightX = Math.cos(sample.attackerYaw);
          const rightZ = -Math.sin(sample.attackerYaw);
          this.camera.position.set(
            sample.attackerX - fwdX * 0.68 + rightX * 0.22,
            sample.attackerY + 1.66,
            sample.attackerZ - fwdZ * 0.68 + rightZ * 0.22
          );
          this.camera.lookAt(sample.victimX, sample.victimY + 1.24, sample.victimZ);

          const zoomFov = Math.max(54, this.settings.fov - 12 * Math.sin(progress * Math.PI * 0.5));
          if (Math.abs(this.camera.fov - zoomFov) > 0.15) {
            this.camera.fov = zoomFov;
            this.camera.updateProjectionMatrix();
          }
        }
        if (progress >= 0.72 && !this.killCamBeamFired) {
          this.killCamBeamFired = true;
          this.spawnBeam(this.killCamBeamOrigin, this.killCamBeamEnd, this.killCamBeamColor);
          this.spawnSparks(this.killCamBeamEnd, 14);
        }
        if (this.killCamRemainingMs <= 0) {
          this.camera.fov = this.settings.fov;
          this.camera.updateProjectionMatrix();
          this.emitHud(true);
        }
      } else {
        this.deathRespawnRemainingMs = Math.max(0, this.deathRespawnRemainingMs - dt * 1000);
        this.camera.position.set(
          this.playerPos.x,
          this.playerPos.y + 0.58,
          this.playerPos.z
        );
        this.camera.rotation.set(this.pitch * 0.4 - 0.15, this.yaw, 0.22, 'YXZ');
      }

      this.updateBots(dt, map, nowMs);
      if (nowMs - this.lastHudEmitMs > 100) {
        this.emitHud(false);
      }
      return;
    }

    // Dash recharge
    const weapon = WEAPONS[this.weaponId];
    this.dashCharge = Math.min(100, this.dashCharge + 24 * dt);
    if (this.dashTimer > 0) this.dashTimer -= dt;

    // Continuous fire if held (mouse or controller trigger)
    if (this.mouseDown || this.gamepadTriggerFiring) {
      this.tryFire();
    }

    // Arrow key look fallback for accessibility / keyboard-only play
    if (this.keysPressed.has('ArrowLeft')) this.yaw += 2.2 * dt;
    if (this.keysPressed.has('ArrowRight')) this.yaw -= 2.2 * dt;
    if (this.keysPressed.has('ArrowUp')) this.pitch = Math.min(1.2, this.pitch + 1.5 * dt);
    if (this.keysPressed.has('ArrowDown')) this.pitch = Math.max(-1.2, this.pitch - 1.5 * dt);

    const keyF =
      (this.keysPressed.has(this.keybinds.moveForward) ? 1 : 0) -
      (this.keysPressed.has(this.keybinds.moveBackward) ? 1 : 0);
    const keyR =
      (this.keysPressed.has(this.keybinds.moveRight) ? 1 : 0) -
      (this.keysPressed.has(this.keybinds.moveLeft) ? 1 : 0);
    const inputF = THREE.MathUtils.clamp(keyF + padInput.moveF, -1, 1);
    const inputR = THREE.MathUtils.clamp(keyR + padInput.moveR, -1, 1);
    const jump = this.keysPressed.has(this.keybinds.jump) || padInput.jump;

    const accelRate = inputF !== 0 || inputR !== 0 ? 15 : 13;
    this.smoothMoveF = THREE.MathUtils.damp(this.smoothMoveF, inputF, accelRate, dt);
    this.smoothMoveR = THREE.MathUtils.damp(this.smoothMoveR, inputR, accelRate, dt);
    const moveF = Math.abs(this.smoothMoveF) < 0.01 ? 0 : this.smoothMoveF;
    const moveR = Math.abs(this.smoothMoveR) < 0.01 ? 0 : this.smoothMoveR;

    if (this.isTutorial && this.tutorialStep === 1 && (Math.abs(inputF) > 0.1 || Math.abs(inputR) > 0.1)) {
      this.tutorialMoved = true;
      this.tutorialStep = 2;
    }

    const inputMag = Math.min(1, Math.hypot(moveF, moveR));
    const baseSpeed =
      8.4 * weapon.moveMultiplier * (this.dashTimer > 0 ? 1.85 : 1.0) * (this.isScoped ? 0.72 : 1.0);
    const speed = baseSpeed * inputMag;
    const prevX = this.playerPos.x;
    const prevZ = this.playerPos.z;
    const resolved = resolvePlayerMovement(
      this.playerPos,
      this.playerVel,
      moveF,
      moveR,
      this.yaw,
      jump,
      this.grounded,
      dt,
      map,
      speed,
      0.48
    );
    this.playerPos = resolved.pos;
    this.playerVel = resolved.vel;
    this.grounded = resolved.grounded;
    if (resolved.jumpPadTriggered) {
      soundEngine.playJumpPad();
    }

    if (!this.wasGrounded && this.grounded) {
      this.landDip = -0.11;
    }
    this.wasGrounded = this.grounded;
    this.landDip = THREE.MathUtils.damp(this.landDip, 0, 14, dt);

    const movedDist = Math.hypot(this.playerPos.x - prevX, this.playerPos.z - prevZ);
    this.walkDist += movedDist;

    // Smooth FOV zoom
    const targetFov = this.isScoped ? weapon.zoomFov : this.settings.fov;
    if (Math.abs(this.camera.fov - targetFov) > 0.1) {
      this.camera.fov = THREE.MathUtils.damp(this.camera.fov, targetFov, 14, dt);
      this.camera.updateProjectionMatrix();
    }

    // Realistic figure-8 camera gait + strafe tilt + landing cushion + trauma shake
    const shake = this.cameraTrauma * this.cameraTrauma * 0.04;
    const speedNorm = this.grounded && !this.isScoped ? Math.min(1, movedDist / Math.max(0.001, baseSpeed * dt)) : 0;
    const bobY = Math.sin(this.walkDist * 2.15) * 0.042 * speedNorm + this.landDip;
    const bobX = Math.cos(this.walkDist * 1.075) * 0.022 * speedNorm;
    this.strafeRoll = THREE.MathUtils.damp(this.strafeRoll, -moveR * 0.018, 10, dt);

    const rightX = Math.cos(this.yaw);
    const rightZ = -Math.sin(this.yaw);
    this.camera.position.set(
      this.playerPos.x + rightX * bobX + (Math.random() - 0.5) * shake,
      this.playerPos.y + 1.62 + bobY + (Math.random() - 0.5) * shake,
      this.playerPos.z + rightZ * bobX + (Math.random() - 0.5) * shake
    );
    this.camera.rotation.set(this.pitch, this.yaw, this.strafeRoll, 'YXZ');

    // Viewmodel sway, stride rhythm, recoil & reload dip animation
    const dyaw = Math.atan2(Math.sin(this.yaw - this.lastYaw), Math.cos(this.yaw - this.lastYaw));
    this.lastYaw = this.yaw;
    this.swayX = THREE.MathUtils.damp(
      this.swayX,
      THREE.MathUtils.clamp(dyaw * 0.45 - moveR * 0.012, -0.04, 0.04),
      12,
      dt
    );
    this.swayY = THREE.MathUtils.damp(
      this.swayY,
      THREE.MathUtils.clamp(this.playerVel.y * -0.003, -0.03, 0.03),
      10,
      dt
    );
    const reloadNorm = this.isReloading
      ? Math.sin(((this.reloadTotalMs - this.reloadRemainingMs) / Math.max(1, this.reloadTotalMs)) * Math.PI)
      : 0;

    this.weaponMount.position.set(
      0.24 + this.swayX + Math.cos(this.walkDist * 1.075) * 0.01 * speedNorm,
      -0.21 + this.swayY + Math.sin(this.walkDist * 2.15) * 0.012 * speedNorm - reloadNorm * 0.14,
      -0.56 + this.recoilOffset
    );
    this.weaponMount.rotation.set(
      -reloadNorm * 0.42 + this.recoilOffset * 0.65,
      this.swayX * 0.7,
      reloadNorm * 0.28 + this.strafeRoll * 0.9
    );

    // Animate & check Heal Orb pickups
    for (const orb of this.healOrbs) {
      if (!orb.state.active) continue;
      orb.rig.core.position.y = 1.05 + Math.sin(nowMs * 0.0045) * 0.16;
      orb.rig.ring.rotation.y += dt * 2.4;
      orb.rig.ring.rotation.x += dt * 1.3;
      if (checkHealOrbPickup(this.playerPos, orb.state)) {
        orb.state.active = false;
        orb.rig.group.visible = false;
        this.hp = this.maxHp;
        this.healFlashMs = 900;
        soundEngine.playHealPickup();
        this.emitHud(true);
      }
    }

    // Update bots
    this.updateBots(dt, map, nowMs);

    // Broadcast network move at ~16Hz
    if (nowMs - this.lastNetSyncMs > 60) {
      this.lastNetSyncMs = nowMs;
      this.callbacks.onNetworkMove?.(
        this.playerPos.x,
        this.playerPos.y,
        this.playerPos.z,
        this.yaw
      );
    }

    // Throttle HUD React updates to ~10Hz
    if (nowMs - this.lastHudEmitMs > 100) {
      this.emitHud(false);
    }
  }

  private triggerRumble(weak: number, strong: number, durationMs: number) {
    if (!this.settings.controllerEnabled || !this.settings.controllerVibration) return;
    try {
      const pads = navigator.getGamepads?.();
      if (!pads) return;
      for (const pad of pads) {
        if (pad && pad.connected) {
          const actuator = (
            pad as Gamepad & {
              vibrationActuator?: {
                playEffect?: (type: string, params: Record<string, number>) => Promise<void>;
              };
            }
          ).vibrationActuator;
          void actuator?.playEffect?.('dual-rumble', {
            startDelay: 0,
            duration: durationMs,
            weakMagnitude: Math.min(1, Math.max(0, weak)),
            strongMagnitude: Math.min(1, Math.max(0, strong)),
          });
          break;
        }
      }
    } catch {
      // Ignore unsupported vibration APIs
    }
  }

  private pollGamepad(
    dt: number,
    allowPauseOnly: boolean
  ): { moveF: number; moveR: number; jump: boolean } {
    const pads = typeof navigator !== 'undefined' ? navigator.getGamepads?.() : null;
    let gp: Gamepad | null = null;
    if (pads) {
      for (const candidate of pads) {
        if (candidate && candidate.connected) {
          gp = candidate;
          break;
        }
      }
    }
    this.hasGamepad = Boolean(gp);
    if (!gp || !this.settings.controllerEnabled) {
      this.gamepadTriggerFiring = false;
      this.prevGamepadButtons = [];
      return { moveF: 0, moveR: 0, jump: false };
    }

    const pressed = gp.buttons.map((b) => Boolean(b?.pressed));
    const justPressed = (idx: number) => Boolean(pressed[idx] && !this.prevGamepadButtons[idx]);

    // Start / Options toggles pause or resume
    if (justPressed(9)) {
      this.prevGamepadButtons = pressed;
      if (allowPauseOnly) {
        this.callbacks.onResumeRequested?.();
      } else {
        document.exitPointerLock?.();
        this.callbacks.onPauseRequested();
      }
      return { moveF: 0, moveR: 0, jump: false };
    }

    if (allowPauseOnly) {
      this.prevGamepadButtons = pressed;
      this.gamepadTriggerFiring = false;
      return { moveF: 0, moveR: 0, jump: false };
    }

    if (this.isDead) {
      if (justPressed(0) && this.killCamRemainingMs <= 0 && this.deathRespawnRemainingMs <= 0) {
        this.respawnPlayer();
      }
      this.prevGamepadButtons = pressed;
      this.gamepadTriggerFiring = false;
      return { moveF: 0, moveR: 0, jump: false };
    }

    // Select / Share toggles chat
    if (justPressed(8)) {
      this.callbacks.onChatRequested();
    }

    // D-Pad 12/13/14/15 -> weapons 1-4
    if (justPressed(12)) this.setWeapon('pulse_carbine');
    if (justPressed(15)) this.setWeapon('volt_scatter');
    if (justPressed(13)) this.setWeapon('helios_rail');
    if (justPressed(14)) this.setWeapon('arc_repeater');

    // Y / Triangle (3) or RB / R1 (5) -> cycle weapon
    if (justPressed(3) || justPressed(5)) {
      const idx = WEAPON_LIST.findIndex((w) => w.id === this.weaponId);
      const next = WEAPON_LIST[(idx + 1) % WEAPON_LIST.length];
      this.setWeapon(next.id);
    }

    // X / Square (2) -> manual reload
    if (justPressed(2)) {
      const weapon = WEAPONS[this.weaponId];
      const currentAmmo = this.ammoByWeapon[this.weaponId];
      if (canManualReload(currentAmmo, weapon.magSize, this.isReloading)) {
        this.startReload();
      }
    }

    // B / Circle (1) or LB / L1 (4) -> Dash
    if ((justPressed(1) || justPressed(4)) && this.dashCharge >= 50 && this.dashTimer <= 0) {
      this.dashCharge -= 50;
      this.dashTimer = 0.22;
      soundEngine.playDash();
    }

    // LT / L2 (6) -> Scope / ADS
    const ltDown = (gp.buttons[6]?.value ?? 0) > 0.35;
    this.isScoped = ltDown || this.rightMouseDown;

    // RT / R2 (7) -> Fire
    this.gamepadTriggerFiring = (gp.buttons[7]?.value ?? 0) > 0.35;

    // Left stick move + Right stick look with deadzone + quadratic curve
    const dz = this.settings.controllerDeadzone ?? 0.15;
    const stickL = applyControllerDeadzone(gp.axes[0] ?? 0, gp.axes[1] ?? 0, dz);
    const stickR = applyControllerDeadzone(gp.axes[2] ?? 0, gp.axes[3] ?? 0, dz);

    const rMag = Math.hypot(stickR.x, stickR.y);
    if (rMag > 0.001) {
      const curve = Math.pow(rMag, 1.35) / rMag;
      const lookSpeed =
        2.75 * this.settings.controllerSensitivity * (this.isScoped ? 0.55 : 1.0);
      const ySign = this.settings.controllerInvertY ? 1 : -1;
      this.yaw -= stickR.x * curve * lookSpeed * dt;
      this.pitch = THREE.MathUtils.clamp(
        this.pitch + stickR.y * curve * ySign * lookSpeed * 0.78 * dt,
        -1.35,
        1.35
      );
    }

    this.prevGamepadButtons = pressed;
    return {
      moveF: -stickL.y,
      moveR: stickL.x,
      jump: Boolean(pressed[0]),
    };
  }

  private updateBots(dt: number, map: (typeof MAPS)[MapId], nowMs: number) {
    const lerpAngle = (current: number, target: number, alpha: number) => {
      const diff = Math.atan2(Math.sin(target - current), Math.cos(target - current));
      return current + diff * Math.min(1, alpha);
    };

    for (let idx = 0; idx < this.bots.length; idx++) {
      const bot = this.bots[idx];
      if (!bot.alive) {
        if (!this.isTutorial) {
          bot.respawnTimer -= dt;
          if (bot.respawnTimer <= 0) {
            const sp =
              this.gameMode === 'tdm'
                ? this.pickTeamSpawn(map, bot.team)
                : map.spawns[Math.floor(Math.random() * map.spawns.length)];
            bot.x = sp.x;
            bot.y = sp.y;
            bot.z = sp.z;
            bot.vx = 0;
            bot.vz = 0;
            bot.velY = 0;
            bot.grounded = true;
            bot.yaw = sp.yaw;
            bot.hp = bot.maxHp;
            bot.alive = true;
            bot.rig.group.visible = true;
            bot.poseHistory = [];
            bot.lastPoseSampleMs = 0;
          }
        }
        continue;
      }

      if (bot.hitFlashTimer > 0) {
        bot.hitFlashTimer -= dt;
        bot.rig.group.scale.set(1.06, 0.94, 1.06);
      } else {
        bot.rig.group.scale.set(1, 1, 1);
      }

      if (bot.policy === 'drone') {
        bot.x += Math.sin(nowMs * 0.002 + bot.strafeSign) * 1.4 * dt;
        bot.rig.group.position.set(bot.x, bot.y, bot.z);
        bot.walkPhase += dt * 5;
        bot.rig.legL.rotation.x = Math.sin(bot.walkPhase) * 0.25;
        bot.rig.legR.rotation.x = -Math.sin(bot.walkPhase) * 0.25;
        bot.rig.armL.rotation.x = -0.2 + Math.sin(bot.walkPhase) * 0.15;
        continue;
      }

      // Pick nearest opposing target (TDM fights across Cyan vs Amber; FFA targets player)
      let targetX = this.playerPos.x;
      let targetY = this.playerPos.y;
      let targetZ = this.playerPos.z;
      let targetBot: BotEntity | null = null;
      let minDist = bot.team === 'cyan' ? Infinity : Math.hypot(targetX - bot.x, targetZ - bot.z);

      if (this.gameMode === 'tdm') {
        for (const other of this.bots) {
          if (!other.alive || other.team === bot.team || other.policy === 'drone') continue;
          const d = Math.hypot(other.x - bot.x, other.z - bot.z);
          if (d < minDist) {
            minDist = d;
            targetX = other.x;
            targetY = other.y;
            targetZ = other.z;
            targetBot = other;
          }
        }
      }

      if (!Number.isFinite(minDist)) {
        continue;
      }

      const dx = targetX - bot.x;
      const dz = targetZ - bot.z;
      const dist = Math.hypot(dx, dz);
      const targetYaw = Math.atan2(-dx, -dz);
      bot.yaw = lerpAngle(bot.yaw, targetYaw, dt * 8.5);

      // Dynamic juke timer & occasional hop
      bot.strafeTimer -= dt;
      if (bot.strafeTimer <= 0) {
        bot.strafeTimer = 0.95 + Math.random() * 1.15;
        bot.strafeSign = -bot.strafeSign;
      }
      const wantJump = bot.grounded && Math.random() < 0.011;

      const weave = Math.sin(nowMs * 0.0038 + idx * 1.7) * 0.35;
      let moveF = 0;
      let moveR = 0;
      if (bot.policy === 'charger') {
        moveF = dist > 5.5 ? 0.95 : -0.15;
        moveR = bot.strafeSign * 0.6 + weave;
      } else if (bot.policy === 'kiter') {
        moveF = dist < 11 ? -0.8 : dist > 18 ? 0.8 : 0;
        moveR = bot.strafeSign * 0.95 + weave;
      } else if (bot.policy === 'flanker') {
        moveF = dist > 9 ? 0.72 : 0.12;
        moveR = bot.strafeSign * 1.0 + weave;
      } else {
        moveF = dist > 14 ? 0.65 : 0.2;
        moveR = bot.strafeSign * 0.7 + weave;
      }

      // Look-ahead obstacle avoidance so bots glide cleanly around cover instead of grinding into walls
      const sinY = Math.sin(bot.yaw);
      const cosY = Math.cos(bot.yaw);
      let wishX = -sinY * moveF + cosY * moveR;
      let wishZ = -cosY * moveF - sinY * moveR;
      const wishLen = Math.hypot(wishX, wishZ);
      if (wishLen > 1e-4) {
        wishX /= wishLen;
        wishZ /= wishLen;
        const probeX = bot.x + wishX * 2.1;
        const probeZ = bot.z + wishZ * 2.1;
        for (const obs of map.obstacles) {
          if (obs.y > 0.8) continue;
          if (
            Math.abs(probeX - obs.x) < obs.w * 0.5 + 0.9 &&
            Math.abs(probeZ - obs.z) < obs.d * 0.5 + 0.9
          ) {
            moveR += bot.strafeSign * 1.25;
            moveF *= 0.35;
            break;
          }
        }
      }

      // Smooth horizontal inertia for natural human-like bot acceleration & deceleration
      const botMaxSpeed = bot.hitFlashTimer > 0 ? 6.9 : 5.9;
      const targetVx = (-sinY * moveF + cosY * moveR) * botMaxSpeed;
      const targetVz = (-cosY * moveF - sinY * moveR) * botMaxSpeed;
      const lenTarget = Math.hypot(targetVx, targetVz);
      const clampedVx = lenTarget > botMaxSpeed ? (targetVx / lenTarget) * botMaxSpeed : targetVx;
      const clampedVz = lenTarget > botMaxSpeed ? (targetVz / lenTarget) * botMaxSpeed : targetVz;

      bot.vx = THREE.MathUtils.damp(bot.vx, clampedVx, 9.5, dt);
      bot.vz = THREE.MathUtils.damp(bot.vz, clampedVz, 9.5, dt);
      const curSpeed = Math.hypot(bot.vx, bot.vz);

      // Convert smoothed world velocity back to local yaw axes for resolvePlayerMovement
      const localF = -sinY * bot.vx - cosY * bot.vz;
      const localR = cosY * bot.vx - sinY * bot.vz;

      const prevBotX = bot.x;
      const prevBotZ = bot.z;
      const res = resolvePlayerMovement(
        { x: bot.x, y: bot.y, z: bot.z },
        { x: 0, y: bot.velY, z: 0 },
        localF,
        localR,
        bot.yaw,
        wantJump,
        bot.grounded,
        dt,
        map,
        curSpeed,
        0.48
      );
      bot.x = res.pos.x;
      bot.y = res.pos.y;
      bot.z = res.pos.z;
      bot.velY = res.vel.y;
      bot.grounded = res.grounded;

      const actualSpeed = Math.hypot(bot.x - prevBotX, bot.z - prevBotZ) / Math.max(0.001, dt);
      const speedRatio = Math.min(1, actualSpeed / 5.9);

      bot.rig.group.position.set(bot.x, bot.y, bot.z);
      bot.rig.group.rotation.y = bot.yaw + Math.PI;
      bot.walkPhase += dt * (4.0 + speedRatio * 7.5);

      if (speedRatio > 0.08) {
        bot.rig.legL.rotation.x = Math.sin(bot.walkPhase) * 0.54 * speedRatio;
        bot.rig.legR.rotation.x = -Math.sin(bot.walkPhase) * 0.54 * speedRatio;
        bot.rig.armL.rotation.x = -0.35 + Math.sin(bot.walkPhase) * 0.24 * speedRatio;
        bot.rig.armR.rotation.x = Math.cos(bot.walkPhase) * 0.1 * speedRatio;
        bot.rig.torso.rotation.x = 0.09 * speedRatio;
        bot.rig.torso.rotation.y = Math.sin(bot.walkPhase) * 0.05 * speedRatio;
      } else {
        bot.rig.legL.rotation.x = THREE.MathUtils.damp(bot.rig.legL.rotation.x, 0, 10, dt);
        bot.rig.legR.rotation.x = THREE.MathUtils.damp(bot.rig.legR.rotation.x, 0, 10, dt);
        bot.rig.armL.rotation.x = THREE.MathUtils.damp(bot.rig.armL.rotation.x, 0, 10, dt);
        bot.rig.torso.rotation.x = Math.sin(nowMs * 0.0025 + idx) * 0.025;
        bot.rig.torso.rotation.y = Math.cos(nowMs * 0.0018 + idx) * 0.03;
      }
      const elevPitch = THREE.MathUtils.clamp((targetY - bot.y) / Math.max(4, dist), -0.35, 0.35);
      bot.rig.head.rotation.x = THREE.MathUtils.damp(bot.rig.head.rotation.x, -elevPitch, 8, dt);

      if (nowMs - bot.lastPoseSampleMs >= 45) {
        bot.lastPoseSampleMs = nowMs;
        bot.poseHistory.push({
          t: nowMs / 1000,
          attackerX: bot.x,
          attackerY: bot.y,
          attackerZ: bot.z,
          attackerYaw: bot.yaw,
          victimX: this.playerPos.x,
          victimY: this.playerPos.y,
          victimZ: this.playerPos.z,
        });
        if (bot.poseHistory.length > 75) {
          bot.poseHistory.shift();
        }
      }

      // Bot laser fire with clear sight check
      bot.fireCooldown -= dt;
      if (bot.fireCooldown <= 0 && dist < 38) {
        bot.fireCooldown = 1.35 + Math.random() * 0.9;
        const origin = { x: bot.x, y: bot.y + 1.3, z: bot.z };
        const dir = {
          x: (targetX - bot.x) / Math.max(0.1, dist),
          y: (targetY + 1.3 - (bot.y + 1.3)) / Math.max(0.1, dist),
          z: (targetZ - bot.z) / Math.max(0.1, dist),
        };
        const ray = castLaserRay(origin, dir, dist, map, []);
        if (ray.hitType === 'none') {
          const hitTarget = Math.random() < 0.52;
          const endPoint = hitTarget
            ? { x: targetX, y: targetY + 1.2, z: targetZ }
            : {
                x: targetX + (Math.random() - 0.5) * 2.2,
                y: targetY + 1.2,
                z: targetZ + (Math.random() - 0.5) * 2.2,
              };
          this.spawnBeam(origin, endPoint, bot.team === 'cyan' ? '#38bdf8' : '#ef4444');

          if (hitTarget) {
            if (targetBot) {
              targetBot.hp -= 16;
              targetBot.hitFlashTimer = 0.08;
              if (targetBot.hp <= 0) {
                targetBot.alive = false;
                targetBot.deaths++;
                bot.kills++;
                targetBot.respawnTimer = 3.2;
                targetBot.rig.group.visible = false;
                if (this.gameMode === 'tdm') {
                  if (bot.team === 'cyan') {
                    this.teamScoreCyan += 1;
                  } else {
                    this.teamScoreAmber += 1;
                  }
                }
                this.killsFeed = [
                  {
                    id: `${nowMs}-${bot.id}-${targetBot.id}`,
                    text: `${bot.nickname} → ${targetBot.nickname}`,
                  },
                  ...this.killsFeed.slice(0, 3),
                ];
              }
            } else {
              // Target is the human player (skip if already awaiting respawn)
              if (!this.isDead) {
                this.hp -= 12;
                this.damageFlashMs = 240;
                this.cameraTrauma = Math.min(1, this.cameraTrauma + 0.22);
                this.triggerRumble(0.28, 0.4, 90);
                if (this.hp <= 0) {
                  this.hp = 0;
                  this.isDead = true;
                  this.killCamRemainingMs = KILL_CAM_DURATION_MS;
                  this.deathRespawnRemainingMs = 0;
                  this.killCamClip = [
                    ...bot.poseHistory,
                    {
                      t: nowMs / 1000,
                      attackerX: bot.x,
                      attackerY: bot.y,
                      attackerZ: bot.z,
                      attackerYaw: bot.yaw,
                      victimX: this.playerPos.x,
                      victimY: this.playerPos.y,
                      victimZ: this.playerPos.z,
                    },
                  ];
                  this.killCamBeamOrigin = { ...origin };
                  this.killCamBeamEnd = { ...endPoint };
                  this.killCamBeamColor = bot.team === 'cyan' ? '#38bdf8' : '#ef4444';
                  this.killCamBeamFired = false;
                  this.killedBy = bot.nickname;
                  this.deaths++;
                  bot.kills++;
                  if (this.gameMode === 'tdm') {
                    this.teamScoreAmber += 1;
                  }
                  this.isScoped = false;
                  this.rightMouseDown = false;
                  this.mouseDown = false;
                  this.gamepadTriggerFiring = false;
                  this.isReloading = false;
                  this.reloadRemainingMs = 0;
                  document.exitPointerLock?.();
                  this.triggerRumble(0.85, 0.95, 250);
                  this.killsFeed = [
                    {
                      id: `${nowMs}-${bot.id}-player`,
                      text: `${bot.nickname} tagged You`,
                    },
                    ...this.killsFeed.slice(0, 3),
                  ];
                  this.emitHud(true);
                }
              }
            }
          }
        }
      }
    }
  }

  private finishMatch() {
    this.screenState = 'gameover';
    this.isDead = false;
    this.killCamRemainingMs = 0;
    this.killCamClip = [];
    this.killCamBeamFired = false;
    this.deathRespawnRemainingMs = 0;
    this.killedBy = null;
    this.camera.fov = this.settings.fov;
    this.camera.updateProjectionMatrix();
    this.weaponMount.visible = false;
    document.exitPointerLock?.();

    const accuracy =
      this.shotsFired > 0 ? Math.round((this.shotsHit / this.shotsFired) * 100) : 0;
    const won =
      this.gameMode === 'tdm'
        ? this.teamScoreCyan >= this.teamScoreAmber
        : this.tags >= this.deaths;
    const { creditsEarned, xpEarned } = calculateMatchRewards({
      won,
      tags: this.tags,
      deaths: this.deaths,
    });

    let leaderboard: MatchLeaderboardEntry[] | undefined;
    if (this.gameMode === 'tdm') {
      const entries: MatchLeaderboardEntry[] = [
        {
          id: 'local-player',
          nickname: this.playerNickname,
          team: 'cyan',
          isBot: false,
          isLocalPlayer: true,
          kills: this.tags,
          deaths: this.deaths,
        },
        ...this.bots
          .filter((b) => b.policy !== 'drone')
          .map((b) => ({
            id: b.id,
            nickname: b.nickname,
            team: b.team,
            isBot: true,
            isLocalPlayer: false,
            kills: b.kills,
            deaths: b.deaths,
          })),
        ...Array.from(this.peerMeshes.entries()).map(([id, p]) => ({
          id,
          nickname: p.data.nickname,
          team: p.data.team,
          isBot: p.data.isBot,
          isLocalPlayer: false,
          kills: p.data.kills ?? p.data.score ?? 0,
          deaths: p.data.deaths ?? 0,
        })),
      ];
      leaderboard = sortLeaderboardEntries(entries);
    }

    this.callbacks.onMatchEnd(
      {
        won,
        gameMode: this.gameMode,
        mapId: this.mapId,
        tags: this.tags,
        deaths: this.deaths,
        teamScoreCyan: this.gameMode === 'tdm' ? this.teamScoreCyan : undefined,
        teamScoreAmber: this.gameMode === 'tdm' ? this.teamScoreAmber : undefined,
        accuracy,
        creditsEarned,
        xpEarned,
        easterEggFound: this.easterEggTriggered,
        durationSec: this.matchDuration,
        leaderboard,
      },
      this.shotsFired,
      this.shotsHit
    );
  }

  private emitHud(force: boolean) {
    if (force) {
      this.lastHudEmitMs = performance.now();
    } else {
      this.lastHudEmitMs = performance.now();
    }
    const weapon = WEAPONS[this.weaponId];
    const reloadProgress =
      this.isReloading && this.reloadTotalMs > 0
        ? Math.min(1, Math.max(0, 1 - this.reloadRemainingMs / this.reloadTotalMs))
        : 0;

    const map = MAPS[this.mapId];
    this.callbacks.onHudUpdate({
      hp: Math.max(0, Math.round(this.hp)),
      maxHp: this.maxHp,
      energy: Math.round(this.energy),
      maxEnergy: weapon.maxEnergy,
      ammo: this.ammoByWeapon[this.weaponId],
      maxAmmo: weapon.magSize,
      isReloading: this.isReloading,
      reloadProgress,
      ammoStyle: weapon.ammoStyle,
      dashCharge: Math.round(this.dashCharge),
      tags: this.tags,
      deaths: this.deaths,
      teamScoreCyan: this.teamScoreCyan,
      teamScoreAmber: this.teamScoreAmber,
      gameMode: this.gameMode,
      fps: this.fps,
      healFlashMs: this.healFlashMs,
      timeRemaining: Math.ceil(this.matchTimeRemaining),
      weaponId: this.weaponId,
      hitMarkerMs: this.hitMarkerMs,
      lastHitZone: this.lastHitZone,
      damageFlashMs: this.damageFlashMs,
      pointerLocked: this.pointerLocked,
      tutorialStep: this.tutorialStep,
      tutorialDronesHit: this.tutorialDronesHit,
      easterEggUnlockedNow: this.easterEggTriggered,
      isScoped: this.isScoped,
      isDead: this.isDead,
      isKillCam: this.isDead && this.killCamRemainingMs > 0,
      killCamRemainingMs: Math.round(this.killCamRemainingMs),
      deathRespawnRemainingMs: Math.round(this.deathRespawnRemainingMs),
      killedBy: this.killedBy,
      hasGamepad: this.hasGamepad,
      killsFeed: this.killsFeed,
      minimap: {
        mapId: this.mapId,
        arenaHalfSize: map.arenaHalfSize,
        player: { x: this.playerPos.x, z: this.playerPos.z, yaw: this.yaw },
        bots: this.bots.map((b) => ({
          id: b.id,
          x: b.x,
          z: b.z,
          team: b.team,
          alive: b.alive,
        })),
        peers: Array.from(this.peerMeshes.entries()).map(([id, p]) => ({
          id,
          x: p.data.x,
          z: p.data.z,
          alive: p.data.alive,
        })),
        healOrbs: this.healOrbs.map((o) => ({
          x: o.state.x,
          z: o.state.z,
          active: o.state.active,
        })),
      },
    });
  }

  public dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.frameId);
    cancelAnimationFrame(this.rafId);
    clearTimeout(this.frameId);
    clearTimeout(this.timeoutId);
    if (this.loopChannel) {
      this.loopChannel.port2.onmessage = null;
      this.loopChannel.port1.close();
      this.loopChannel.port2.close();
      this.loopChannel = null;
    }
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.onWindowBlur);
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
    document.removeEventListener('pointerlockchange', this.onPointerLockChange);
    document.removeEventListener('mousemove', this.onMouseMove);
    this.renderer.domElement.removeEventListener('mousedown', this.onMouseDown);
    window.removeEventListener('mouseup', this.onMouseUp);
    window.removeEventListener('wheel', this.onWheel);
    this.renderer.domElement.removeEventListener('contextmenu', this.onContextMenu);
    for (const bot of this.bots) {
      disposeAvatarRig(bot.rig);
    }
    for (const peer of this.peerMeshes.values()) {
      disposeAvatarRig(peer.rig);
    }
    Object.values(this.projectileGeos).forEach((g) => g.dispose());
    Object.values(this.projectileMats).forEach((m) => m.dispose());
    this.shadowTex.dispose();
    this.envTex.dispose();
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
