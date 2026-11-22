import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AVATAR_SKINS,
  CHEST_CATALOG,
  createDefaultProfile,
  DEFAULT_SETTINGS,
  MAP_LIST,
  MAPS,
  PASS_SEASON_DURATION_MS,
  RARITY_META,
  RARITY_ORDER,
  WEAPONS,
  WEAPON_SKINS,
} from './catalog';
import {
  allocateMatchmakingRoom,
  applyControllerDeadzone,
  applyIncomingDamageWithSpawnProtection,
  applyMatchRewards,
  applyTutorialCompletion,
  applyUnderfootJumpVelocity,
  calculateDamage,
  calculateMatchRewards,
  calculateWeaponAccuracy,
  canManualReload,
  canTriggerEasterEgg,
  canTriggerUnderfootJump,
  castLaserRay,
  checkHealOrbPickup,
  checkJumpPadCollision,
  claimBattlePassTier,
  clearSpawnProtectionOnShot,
  computeAdaptivePerfStep,
  createSpawnProtection,
  detectLowPerfGpuString,
  equipWeaponSkin,
  getBattlePassCountdown,
  getChestPoolForRarity,
  getChestRarityPercentages,
  getChestWeaponPercentages,
  getHealOrbScheduleTimes,
  getKillRankReward,
  getOperatorWeaponBodyStyle,
  getPerfSettingsForTier,
  getSpawnProtectedDamageMultiplier,
  getSpawnProtectionRemainingMs,
  hasProfileCloudDiff,
  isSpawnProtectionActive,
  MAX_MATCH_CREDITS,
  MAX_MATCH_XP,
  MAX_PLAYERS_PER_ROOM,
  mergeLocalAndCloudProfiles,
  NORMAL_JUMP_VELOCITY,
  normalizeEquippedWeaponSkins,
  pickOpenHealOrbPosition,
  pickRandomMapId,
  purchaseStoreItem,
  resolvePlayerMovement,
  rollChestOpen,
  sampleKillCamClip,
  shouldAutoReload,
  sortLeaderboardEntries,
  SPAWN_PROTECTION_DURATION_MS,
  syncBattlePassSeason,
  TUTORIAL_REWARD_CREDITS,
  TUTORIAL_REWARD_XP,
  UNDERFOOT_JUMP_VELOCITY,
  upgradeBattlePassPremium,
} from './rules';
import {
  createAntiCheatState,
  validateFirePacket,
  validateMovePacket,
} from './anticheat';

test('Easter egg on obsidian_vault unlocks ONLY with helios_rail', () => {
  assert.equal(canTriggerEasterEgg('obsidian_vault', 'helios_rail'), true);
  assert.equal(canTriggerEasterEgg('obsidian_vault', 'pulse_carbine'), false);
  assert.equal(canTriggerEasterEgg('obsidian_vault', 'volt_scatter'), false);
  assert.equal(canTriggerEasterEgg('obsidian_vault', 'arc_repeater'), false);
  assert.equal(canTriggerEasterEgg('hyperion_atrium', 'helios_rail'), false);
});

test('All 8 maps (4 daylight and 4 non-daylight) have open spawn points clear of obstacles', () => {
  const mapIds = Object.keys(MAPS) as Array<keyof typeof MAPS>;
  assert.equal(mapIds.length, 8);
  const daylightMaps = mapIds.filter((id) => MAPS[id].isDaylight === true);
  const nonDaylightMaps = mapIds.filter((id) => !MAPS[id].isDaylight);
  assert.equal(daylightMaps.length, 4, 'Exactly 4 daylight maps should exist');
  assert.equal(nonDaylightMaps.length, 4, 'Exactly 4 non-daylight maps should exist');
  for (const id of mapIds) {
    const map = MAPS[id];
    assert.ok(map.spawns.length >= 4);
    for (const spawn of map.spawns) {
      for (const obs of map.obstacles) {
        const insideX = Math.abs(spawn.x - obs.x) < obs.w * 0.5 + 0.5;
        const insideZ = Math.abs(spawn.z - obs.z) < obs.d * 0.5 + 0.5;
        assert.equal(insideX && insideZ, false, `Spawn overlaps obstacle in ${id}`);
      }
    }
    if (map.teamSpawns) {
      for (const spawn of [...map.teamSpawns.cyan, ...map.teamSpawns.amber]) {
        for (const obs of map.obstacles) {
          const insideX = Math.abs(spawn.x - obs.x) < obs.w * 0.5 + 0.5;
          const insideZ = Math.abs(spawn.z - obs.z) < obs.d * 0.5 + 0.5;
          assert.equal(insideX && insideZ, false, `Team spawn overlaps obstacle in ${id}`);
        }
      }
    }
  }
});

test('Player movement resolves AABB collisions without penetrating walls', () => {
  const map = MAPS.hyperion_atrium;
  // Move directly toward center monolith at (0,0,0) which has half-width 2.25
  const result = resolvePlayerMovement(
    { x: 0, y: 0, z: 2.8 },
    { x: 0, y: 0, z: 0 },
    1,
    0,
    0,
    false,
    true,
    0.05,
    map,
    8.2,
    0.48
  );
  assert.ok(result.pos.z >= 2.25 + 0.48 - 1e-4, 'Player should stop outside monolith');
});

test('castLaserRay detects hits on enemy targets and hidden Easter egg monolith inside alcove', () => {
  const vault = MAPS.obsidian_vault;
  const egg = vault.easterEgg!;

  // Line of sight from center arena toward the hidden egg should be blocked by basalt alcove walls
  const toEggX = egg.x;
  const toEggZ = egg.z;
  const normLen = Math.hypot(toEggX, toEggZ);
  const rayFromCenter = castLaserRay(
    { x: 0, y: egg.y, z: 0 },
    { x: toEggX / normLen, y: 0, z: toEggZ / normLen },
    WEAPONS.helios_rail.maxRange,
    vault,
    []
  );
  assert.equal(rayFromCenter.hitType, 'obstacle');

  // Unobstructed shot inside the hidden NE alcove hits the Easter egg
  const rayToEgg = castLaserRay(
    { x: egg.x, y: egg.y, z: egg.z - 2.4 },
    { x: 0, y: 0, z: 1 },
    WEAPONS.helios_rail.maxRange,
    vault,
    []
  );
  assert.equal(rayToEgg.hitType, 'easter_egg');

  const rayToBotBody = castLaserRay(
    { x: 0, y: 0.92, z: 10 },
    { x: 0, y: 0, z: -1 },
    50,
    MAPS.hyperion_atrium,
    [{ id: 'bot-1', x: 0, y: 0, z: 5, radius: 0.5, height: 1.8, alive: true }]
  );
  assert.equal(rayToBotBody.hitType, 'target');
  assert.equal(rayToBotBody.hitZone, 'body');
  assert.equal(rayToBotBody.targetId, 'bot-1');

  const rayToBotHead = castLaserRay(
    { x: 0, y: 1.62, z: 10 },
    { x: 0, y: 0, z: -1 },
    50,
    MAPS.hyperion_atrium,
    [{ id: 'bot-1', x: 0, y: 0, z: 5, radius: 0.5, height: 1.8, alive: true }]
  );
  assert.equal(rayToBotHead.hitType, 'target');
  assert.equal(rayToBotHead.hitZone, 'head');
  assert.equal(rayToBotHead.targetId, 'bot-1');
});

test('Headshots deal 1.75x damage compared to body shots', () => {
  assert.equal(calculateDamage(22, 'body'), 22);
  assert.equal(calculateDamage(22, 'head'), 39);
  assert.equal(calculateDamage(72, 'head'), 126);
});

test('Jump pads launch players vertically and bridges allow passing underneath', () => {
  const map = MAPS.hyperion_atrium;
  const pad = map.jumpPads[0];
  assert.ok(pad);
  const boost = checkJumpPadCollision({ x: pad.x, y: 0, z: pad.z }, map);
  assert.equal(boost, pad.boostY);

  const launchRes = resolvePlayerMovement(
    { x: pad.x, y: 0, z: pad.z },
    { x: 0, y: 0, z: 0 },
    0,
    0,
    0,
    false,
    true,
    0.016,
    map
  );
  assert.equal(launchRes.jumpPadTriggered, true);
  assert.ok(launchRes.vel.y >= 12);

  // Bridge at (0, 2.8, 7) allows walking freely underneath at y=0
  const underBridge = resolvePlayerMovement(
    { x: 0, y: 0, z: 7 },
    { x: 0, y: 0, z: 0 },
    1,
    0,
    0,
    false,
    true,
    0.03,
    map
  );
  assert.ok(underBridge.pos.z < 7);
});

test('Catalog includes Rainbow Spectrum, Golden Walnut skins, jump pads on all 8 maps, tuned railgun zoom, and expanded FPS/graphics settings', () => {
  const rainbow = WEAPON_SKINS.find((s) => s.id === 'rainbow_spectrum');
  const walnut = WEAPON_SKINS.find((s) => s.id === 'royal_walnut');
  assert.equal(rainbow?.pattern, 'rainbow');
  assert.equal(walnut?.pattern, 'gold_walnut');
  assert.ok(walnut?.gripColor);
  assert.ok(walnut?.scopeColor);
  assert.ok(WEAPONS.helios_rail.zoomFov >= 40 && WEAPONS.helios_rail.zoomFov <= 48);
  assert.equal(DEFAULT_SETTINGS.fpsCap, 'unlimited');
  assert.equal(DEFAULT_SETTINGS.vsync, false);
  assert.equal(DEFAULT_SETTINGS.showFps, true);
  assert.equal(DEFAULT_SETTINGS.shadowQuality, 'high');
  assert.equal(DEFAULT_SETTINGS.renderDistance, 180);

  for (const map of Object.values(MAPS)) {
    assert.ok(map.jumpPads.length >= 3, `${map.id} should have jump pads`);
    assert.ok(map.arenaHalfSize >= 68, `${map.id} should be expanded (>= 68m half-size)`);
  }
});

test('Store purchase, battle pass upgrade & tier claim update profile idempotently', () => {
  let profile = createDefaultProfile('TestUser');
  assert.equal(profile.credits, 100);
  assert.equal(profile.xp, 0);
  assert.equal(profile.battlePassXp, 0);

  // Insufficient starter funds for 300 CR skin
  const failStarterBuy = purchaseStoreItem(profile, 'weapon_skin', 'solar_flare');
  assert.equal(failStarterBuy.ok, false);

  profile = { ...profile, credits: 650 };
  const buyRes = purchaseStoreItem(profile, 'weapon_skin', 'solar_flare');
  assert.equal(buyRes.ok, true);
  assert.equal(buyRes.profile.credits, 350);
  assert.ok(buyRes.profile.unlockedWeaponSkins.includes('solar_flare'));

  // Insufficient funds for 750 CR skin
  const failBuy = purchaseStoreItem(buyRes.profile, 'weapon_skin', 'obsidian_gold');
  assert.equal(failBuy.ok, false);

  // Give credits & XP and claim BP tier
  profile = { ...buyRes.profile, credits: 700, battlePassXp: 500 };
  const passUp = upgradeBattlePassPremium(profile, 600);
  assert.equal(passUp.ok, true);
  assert.equal(passUp.profile.battlePassPremium, true);

  const claimFree = claimBattlePassTier(passUp.profile, 1, 'free');
  assert.equal(claimFree.ok, true);
  assert.equal(claimFree.profile.credits, 250);

  const claimPrem = claimBattlePassTier(claimFree.profile, 2, 'premium');
  assert.equal(claimPrem.ok, true);
  assert.ok(claimPrem.profile.unlockedWeaponSkins.includes('emerald_circuit'));

  // Double claim rejected
  const dupClaim = claimBattlePassTier(claimPrem.profile, 2, 'premium');
  assert.equal(dupClaim.ok, false);
});

test('Match rewards follow kill rank brackets and deduct -5 XP and -10 CR per death', () => {
  assert.deepEqual(
    { xp: getKillRankReward(0).xp, cr: getKillRankReward(0).credits },
    { xp: 0, cr: 0 }
  );
  assert.deepEqual(calculateMatchRewards({ tags: 0, deaths: 0 }), {
    xpEarned: 0,
    creditsEarned: 0,
    rankId: 'rank_0',
  });
  assert.deepEqual(calculateMatchRewards({ tags: 1, deaths: 0 }), {
    xpEarned: 5,
    creditsEarned: 25,
    rankId: 'rank_1',
  });
  assert.deepEqual(calculateMatchRewards({ tags: 3, deaths: 0 }), {
    xpEarned: 5,
    creditsEarned: 25,
    rankId: 'rank_1',
  });
  assert.deepEqual(calculateMatchRewards({ tags: 4, deaths: 0 }), {
    xpEarned: 20,
    creditsEarned: 75,
    rankId: 'rank_2',
  });
  assert.deepEqual(calculateMatchRewards({ tags: 7, deaths: 0 }), {
    xpEarned: 20,
    creditsEarned: 75,
    rankId: 'rank_2',
  });
  assert.deepEqual(calculateMatchRewards({ tags: 8, deaths: 0 }), {
    xpEarned: 30,
    creditsEarned: 125,
    rankId: 'rank_3',
  });
  assert.deepEqual(calculateMatchRewards({ tags: 10, deaths: 0 }), {
    xpEarned: 30,
    creditsEarned: 125,
    rankId: 'rank_3',
  });
  assert.deepEqual(calculateMatchRewards({ tags: 11, deaths: 0 }), {
    xpEarned: 40,
    creditsEarned: 200,
    rankId: 'rank_4',
  });
  assert.deepEqual(calculateMatchRewards({ tags: 15, deaths: 0 }), {
    xpEarned: 40,
    creditsEarned: 200,
    rankId: 'rank_4',
  });

  const capped = calculateMatchRewards({ won: true, tags: 16, deaths: 0 });
  assert.equal(capped.creditsEarned, MAX_MATCH_CREDITS);
  assert.equal(capped.xpEarned, MAX_MATCH_XP);

  // Death penalties (-5 XP and -10 CR per death) and zero clamp
  assert.deepEqual(calculateMatchRewards({ tags: 6, deaths: 2 }), {
    xpEarned: 10,
    creditsEarned: 55,
    rankId: 'rank_2',
  });
  assert.deepEqual(calculateMatchRewards({ tags: 1, deaths: 3 }), {
    xpEarned: 0,
    creditsEarned: 0,
    rankId: 'rank_1',
  });
  assert.deepEqual(calculateMatchRewards({ tags: 18, deaths: 1 }), {
    xpEarned: 45,
    creditsEarned: 240,
    rankId: 'rank_5',
  });

  const base = createDefaultProfile('RelicHunter');
  const next = applyMatchRewards(
    base,
    {
      won: true,
      gameMode: 'tdm',
      mapId: 'obsidian_vault',
      tags: 8,
      deaths: 2,
      teamScoreCyan: 14,
      teamScoreAmber: 9,
      accuracy: 64,
      creditsEarned: 250,
      xpEarned: 50,
      easterEggFound: true,
      durationSec: 90,
    },
    40,
    25
  );
  assert.equal(next.easterEggUnlocked, true);
  assert.ok(next.unlockedWeaponSkins.includes('prism_relic'));
  assert.equal(next.credits, 100 + 250);
  assert.equal(next.xp, 50);
  assert.equal(next.battlePassXp, 50);
});

test('Heal orbs schedule 5 times per game, pick clear positions, and trigger pickup on walk-through', () => {
  const times = getHealOrbScheduleTimes(120, 5);
  assert.equal(times.length, 5);
  assert.deepEqual(times, [12, 36, 60, 84, 108]);

  const map = MAPS.hyperion_atrium;
  const pos = pickOpenHealOrbPosition(map, 0.42, 0.67);
  assert.ok(Math.abs(pos.x) <= map.arenaHalfSize);
  assert.ok(Math.abs(pos.z) <= map.arenaHalfSize);

  const orb = { x: pos.x, y: pos.y, z: pos.z, active: true };
  assert.equal(checkHealOrbPickup({ x: pos.x + 0.4, y: 0, z: pos.z - 0.3 }, orb), true);
  assert.equal(checkHealOrbPickup({ x: pos.x + 4.0, y: 0, z: pos.z }, orb), false);
  assert.equal(checkHealOrbPickup({ x: pos.x, y: 0, z: pos.z }, { ...orb, active: false }), false);
});

test('Silent anti-cheat validates normal movement/fire and clamps anomalies', () => {
  const ac = createAntiCheatState(0, 0, 0, 1000);
  const okMove = validateMovePacket(ac, 0.5, 0, 0.5, 28, 1100);
  assert.equal(okMove.valid, true);

  // Sudden 25m teleport in 16ms is clamped silently
  const badMove = validateMovePacket(ac, 25, 0, 0, 28, 1116);
  assert.equal(badMove.valid, false);
  assert.ok(badMove.clampedX < 10);

  const okFire = validateFirePacket(ac, 'pulse_carbine', 20, 2000);
  assert.equal(okFire.valid, true);
  // Rapid fire 10ms later rejected
  const badFire = validateFirePacket(ac, 'pulse_carbine', 20, 2010);
  assert.equal(badFire.valid, false);
});

test('Weapon magazines, ammo styles, and strict manual vs empty auto-reload rules match spec', () => {
  assert.equal(WEAPONS.pulse_carbine.magSize, 30);
  assert.equal(WEAPONS.pulse_carbine.ammoStyle, 'gold_bullet');
  assert.equal(WEAPONS.volt_scatter.magSize, 5);
  assert.equal(WEAPONS.volt_scatter.ammoStyle, 'gray_pellets');
  assert.equal(WEAPONS.helios_rail.magSize, 3);
  assert.equal(WEAPONS.helios_rail.ammoStyle, 'rail_lance');
  assert.equal(WEAPONS.arc_repeater.magSize, 35);
  assert.equal(WEAPONS.arc_repeater.ammoStyle, 'emerald_dart');

  // Cannot manually reload at full mag
  assert.equal(canManualReload(30, 30, false), false);
  // Can manually reload whenever 1 or more rounds are spent (magSize - 1 down to 0)
  assert.equal(canManualReload(29, 30, false), true);
  assert.equal(canManualReload(1, 30, false), true);
  assert.equal(canManualReload(0, 30, false), true);
  assert.equal(canManualReload(4, 5, false), true);
  assert.equal(canManualReload(2, 3, false), true);
  assert.equal(canManualReload(34, 35, false), true);
  // Never start another reload while already reloading
  assert.equal(canManualReload(10, 30, true), false);

  // Auto-reload only when magazine hits 0
  assert.equal(shouldAutoReload(30, false), false);
  assert.equal(shouldAutoReload(1, false), false);
  assert.equal(shouldAutoReload(0, false), true);
  assert.equal(shouldAutoReload(0, true), false);
});

test('Multi-pass movement keeps player strictly inside arena borders and out of corner obstacles', () => {
  const map = MAPS.solace_courtyard;
  const bound = map.arenaHalfSize - 0.48 - 0.52;
  const edgeRes = resolvePlayerMovement(
    { x: bound - 0.05, y: 0, z: bound - 0.05 },
    { x: 0, y: 0, z: 0 },
    1,
    1,
    Math.PI * 0.75,
    false,
    true,
    0.05,
    map,
    9.0,
    0.48
  );
  assert.ok(edgeRes.pos.x <= bound + 1e-6);
  assert.ok(edgeRes.pos.z <= bound + 1e-6);
  assert.ok(edgeRes.pos.x >= -bound - 1e-6);
  assert.ok(edgeRes.pos.z >= -bound - 1e-6);
});

test('TDM leaderboard ranks players and bots by highest kills then fewest deaths', () => {
  const sorted = sortLeaderboardEntries([
    { id: 'bot-riftbot', nickname: 'RiftBot', team: 'amber', isBot: true, isLocalPlayer: false, kills: 5, deaths: 4 },
    { id: 'local-player', nickname: 'Skudzi', team: 'cyan', isBot: false, isLocalPlayer: true, kills: 8, deaths: 3 },
    { id: 'bot-astraally', nickname: 'AstraAlly', team: 'cyan', isBot: true, isLocalPlayer: false, kills: 5, deaths: 2 },
    { id: 'bot-vexunit', nickname: 'VexUnit', team: 'amber', isBot: true, isLocalPlayer: false, kills: 8, deaths: 1 },
  ]);
  assert.deepEqual(
    sorted.map((e) => `${e.nickname}:${e.kills}/${e.deaths}`),
    ['VexUnit:8/1', 'Skudzi:8/3', 'AstraAlly:5/2', 'RiftBot:5/4']
  );
});

test('pickRandomMapId selects valid maps and avoids immediate repeat when excluded', () => {
  const allIds = Object.keys(MAPS);
  for (let i = 0; i < 16; i += 1) {
    const chosen = pickRandomMapId('hyperion_atrium', () => i / 16);
    assert.ok(allIds.includes(chosen));
    assert.notEqual(chosen, 'hyperion_atrium');
  }
});

test('Underfoot shot push triggers ONLY with Shotgun (volt_scatter) +0.3x jump height boost', () => {
  const map = MAPS.hyperion_atrium;
  const downHit = castLaserRay(
    { x: 10, y: 1.56, z: 10 },
    { x: 0, y: -1, z: 0 },
    80,
    map,
    []
  );
  assert.equal(downHit.hitType, 'obstacle');
  assert.ok(Math.abs(downHit.distance - 1.56) < 1e-4);

  assert.equal(canTriggerUnderfootJump(-0.95, downHit.distance, 0, 'volt_scatter'), true);
  assert.equal(canTriggerUnderfootJump(-0.95, downHit.distance, 0, 'pulse_carbine'), false);
  assert.equal(canTriggerUnderfootJump(-0.95, downHit.distance, 0, 'helios_rail'), false);
  assert.equal(canTriggerUnderfootJump(-0.95, downHit.distance, 0, 'arc_repeater'), false);
  assert.equal(canTriggerUnderfootJump(-0.95, downHit.distance, 120, 'volt_scatter'), false);
  assert.equal(canTriggerUnderfootJump(-0.2, downHit.distance, 0, 'volt_scatter'), false);
  assert.equal(canTriggerUnderfootJump(-0.95, 6.0, 0, 'volt_scatter'), false);

  const launchedVelY = applyUnderfootJumpVelocity(0);
  assert.equal(launchedVelY, UNDERFOOT_JUMP_VELOCITY);
  const heightRatio = Math.pow(launchedVelY, 2) / Math.pow(NORMAL_JUMP_VELOCITY, 2);
  assert.ok(Math.abs(heightRatio - 1.3) < 1e-5, 'Underfoot jump reaches 1.3x normal jump height');
});

test('Tutorial completion awards +150 CR and +25 XP exactly once', () => {
  const base = createDefaultProfile('Rookie');
  const done = applyTutorialCompletion(base);
  assert.equal(done.tutorialCompleted, true);
  assert.equal(done.credits, 100 + TUTORIAL_REWARD_CREDITS);
  assert.equal(done.xp, TUTORIAL_REWARD_XP);
  assert.equal(done.battlePassXp, TUTORIAL_REWARD_XP);

  const second = applyTutorialCompletion(done);
  assert.equal(second.credits, done.credits);
  assert.equal(second.xp, done.xp);
});

test('Controller radial deadzone filters stick drift and rescales full deflection cleanly', () => {
  const drift = applyControllerDeadzone(0.08, -0.09, 0.15);
  assert.equal(drift.x, 0);
  assert.equal(drift.y, 0);

  const active = applyControllerDeadzone(1, 0, 0.2);
  assert.ok(Math.abs(active.x - 1) < 1e-5);
  assert.equal(active.y, 0);
});

test('mergeLocalAndCloudProfiles preserves newer offline progress and skin unlocks', () => {
  const cloud = {
    ...createDefaultProfile('Skudzi'),
    accountId: 'acc-1234',
    credits: 220,
    xp: 45,
    battlePassXp: 45,
    unlockedWeaponSkins: ['cobalt_standard'],
    lastSyncedAt: '2026-11-19T10:00:00.000Z',
  };
  const localNewer = {
    ...cloud,
    credits: 410,
    xp: 95,
    battlePassXp: 95,
    unlockedWeaponSkins: ['cobalt_standard', 'solar_flare'],
    tutorialCompleted: true,
    lastSyncedAt: '2026-11-19T10:05:00.000Z',
  };

  const merged = mergeLocalAndCloudProfiles(localNewer, cloud);
  assert.equal(merged.credits, 410);
  assert.equal(merged.xp, 95);
  assert.equal(merged.tutorialCompleted, true);
  assert.ok(merged.unlockedWeaponSkins.includes('solar_flare'));
});

test('Map 1 features 3-floor side buildings, 3-5 house-sized box piles, and interior stairs', () => {
  const map1 = MAPS.hyperion_atrium;
  assert.equal(map1.isDaylight, true);
  assert.equal(map1.floorStyle, 'trampled_earth');
  assert.ok(map1.teamSpawns && map1.teamSpawns.cyan.length >= 4 && map1.teamSpawns.amber.length >= 4);
  assert.ok(map1.obstacles.filter((o) => o.kind === 'wood_crate').length >= 30);
  const boxPiles = map1.obstacles.filter((o) => o.kind === 'box_pile');
  assert.ok(boxPiles.length >= 3 && boxPiles.length <= 5, `Expected 3-5 house-sized box piles on Map 1, got ${boxPiles.length}`);
  assert.ok(map1.obstacles.some((o) => o.kind === 'concrete_wall'));
  assert.ok(map1.obstacles.some((o) => o.kind === 'building_floor'));
  assert.ok(map1.obstacles.some((o) => o.kind === 'platform' && o.x === 0 && o.z === 0));

  // Middle courtyard doorway at z = 0 allows walking from yard into West building
  const enterMidWest = resolvePlayerMovement(
    { x: -45.5, y: 0, z: 0 },
    { x: 0, y: 0, z: 0 },
    0,
    -1,
    0,
    false,
    true,
    0.05,
    map1,
    10,
    0.48
  );
  assert.ok(enterMidWest.pos.x < -45.5, 'Player should enter West building via middle doorway (z=0)');

  // North end doorway at z = -47.3 allows walking into West building from North yard
  const enterNorthWest = resolvePlayerMovement(
    { x: -55, y: 0, z: -48.5 },
    { x: 0, y: 0, z: 0 },
    -1,
    0,
    0,
    false,
    true,
    0.05,
    map1,
    10,
    0.48
  );
  assert.ok(enterNorthWest.pos.z > -48.5, 'Player should enter West building via North end doorway');

  // Opposite South end doorway at z = +47.3 allows walking into West building from South yard
  const enterSouthWest = resolvePlayerMovement(
    { x: -55, y: 0, z: 48.5 },
    { x: 0, y: 0, z: 0 },
    1,
    0,
    0,
    false,
    true,
    0.05,
    map1,
    10,
    0.48
  );
  assert.ok(enterSouthWest.pos.z < 48.5, 'Player should enter West building via South end doorway');

  // Solid hiding wall at z = -10 blocks walking through (only 3 ground entrances exist!)
  const blockedAtWall = resolvePlayerMovement(
    { x: -45.5, y: 0, z: -10 },
    { x: 0, y: 0, z: 0 },
    0,
    -1,
    0,
    false,
    true,
    0.05,
    map1,
    10,
    0.48
  );
  assert.ok(blockedAtWall.pos.x >= -46.0 - 0.48 - 1e-4, 'Solid concrete wall at z=-10 must block entry');

  // Small window sill at z = -18.5 blocks walking straight through from ground level
  const blockedAtWindow = resolvePlayerMovement(
    { x: -45.5, y: 0, z: -18.5 },
    { x: 0, y: 0, z: 0 },
    0,
    -1,
    0,
    false,
    true,
    0.05,
    map1,
    10,
    0.48
  );
  assert.ok(blockedAtWindow.pos.x >= -46.0 - 0.48 - 1e-4, 'Window sill at z=-18.5 must block walking straight through');

  // Climb interior F1->F2 staircase smoothly along x = -61.5 from z = -25.5 to z = -12.0
  let pos = { x: -61.5, y: 0, z: -25.5 };
  let vel = { x: 0, y: 0, z: 0 };
  for (let step = 0; step < 36; step++) {
    const res = resolvePlayerMovement(pos, vel, -1, 0, 0, false, true, 0.05, map1, 10, 0.48);
    pos = res.pos;
    vel = res.vel;
  }
  assert.ok(pos.y >= 3.7, `Player should reach Floor 2 (3.8m) via stairs, got y=${pos.y.toFixed(2)}`);

  // Walk freely on Floor 3 (y = 7.60m)
  const floor3Move = resolvePlayerMovement(
    { x: -53, y: 7.6, z: -10 },
    { x: 0, y: 0, z: 0 },
    1,
    0,
    0,
    false,
    true,
    0.05,
    map1,
    10,
    0.48
  );
  assert.ok(floor3Move.pos.z < -10 && Math.abs(floor3Move.pos.y - 7.6) < 0.05, 'Player should move freely on Floor 3');
});

test('Map 2 (Sandyard) touches L/R perimeter walls, has 30+ outdoor obstacles, solid street lights, 2-floor Mid building with L/R stairs & distinct F1/F2 cover, and spawn sniper walls', () => {
  const sandyard = MAPS.orbital_hangar;
  assert.equal(sandyard.isDaylight, true);
  assert.equal(sandyard.floorStyle, 'sandyard');
  assert.ok(sandyard.teamSpawns && sandyard.teamSpawns.cyan.length >= 4 && sandyard.teamSpawns.amber.length >= 4);

  // Full width touching Left (-68) and Right (+68) arena borders
  assert.ok(sandyard.obstacles.some((o) => o.x - o.w * 0.5 <= -67.9), 'Map 2 must touch Left border wall (-68)');
  assert.ok(sandyard.obstacles.some((o) => o.x + o.w * 0.5 >= 67.9), 'Map 2 must touch Right border wall (+68)');

  // At least 30 outdoor varied obstacles (excluding Mid building & street lights)
  const outdoorCover = sandyard.obstacles.filter(
    (o) => (Math.abs(o.x) > 20 || Math.abs(o.z) > 24) && (o.kind === 'wood_crate' || o.kind === 'concrete_wall')
  );
  assert.ok(outdoorCover.length >= 30, `Expected >= 30 outdoor obstacles, got ${outdoorCover.length}`);

  // Mid building Floor 1 (y === 0) & Floor 2 (y === 4.3) interior obstacles: >= 25 small and >= 10 big on EACH floor, placed differently
  const isInsideMid = (o: (typeof sandyard.obstacles)[number]) => Math.abs(o.x) < 18.0 && Math.abs(o.z) < 22.0;
  const f1Cover = sandyard.obstacles.filter((o) => isInsideMid(o) && o.y === 0 && (o.kind === 'wood_crate' || o.kind === 'concrete_wall' || o.kind === 'sandstone_wall'));
  const f2Cover = sandyard.obstacles.filter((o) => isInsideMid(o) && Math.abs(o.y - 4.3) < 0.05 && (o.kind === 'wood_crate' || o.kind === 'concrete_wall' || o.kind === 'sandstone_wall'));
  const f1Small = f1Cover.filter((o) => Math.max(o.w, o.d) < 2.2);
  const f1Big = f1Cover.filter((o) => Math.max(o.w, o.d) >= 2.2);
  const f2Small = f2Cover.filter((o) => Math.max(o.w, o.d) < 2.2);
  const f2Big = f2Cover.filter((o) => Math.max(o.w, o.d) >= 2.2);
  assert.ok(f1Small.length >= 25 && f1Big.length >= 10, `F1 cover needs >=25 small & >=10 big, got ${f1Small.length}/${f1Big.length}`);
  assert.ok(f2Small.length >= 25 && f2Big.length >= 10, `F2 cover needs >=25 small & >=10 big, got ${f2Small.length}/${f2Big.length}`);
  const f1Coords = new Set(f1Cover.map((o) => `${o.x},${o.z}`));
  const f2Coords = new Set(f2Cover.map((o) => `${o.x},${o.z}`));
  const identical = [...f1Coords].filter((k) => f2Coords.has(k));
  assert.ok(identical.length === 0, `F1 and F2 cover must be placed differently, found overlaps: ${identical.join(' ')}`);

  // Solid street lights cannot be walked through or shot through
  const streetLights = sandyard.obstacles.filter((o) => o.kind === 'street_light');
  assert.ok(streetLights.length >= 6, 'Sandyard should have solid street light obstacles');
  const blockedByLight = resolvePlayerMovement(
    { x: -13, y: 0, z: -31.8 },
    { x: 0, y: 0, z: 0 },
    1,
    0,
    0,
    false,
    true,
    0.05,
    sandyard,
    10,
    0.48
  );
  assert.ok(blockedByLight.pos.z >= -32.55 - 0.48 - 1e-4, 'Solid street light must block player walking through');
  const lightRay = castLaserRay({ x: -13, y: 1.56, z: -30 }, { x: 0, y: 0, z: -1 }, 10, sandyard, []);
  assert.equal(lightRay.hitType, 'obstacle', 'Solid street light must block laser shots');

  // Walk cleanly underneath West metal awning (x=-55, z=-22)
  const underAwning = resolvePlayerMovement(
    { x: -55, y: 0, z: -22 },
    { x: 0, y: 0, z: 0 },
    -1,
    0,
    0,
    false,
    true,
    0.05,
    sandyard,
    10,
    0.48
  );
  assert.ok(underAwning.pos.z > -22 && Math.abs(underAwning.pos.y) < 0.01, 'Player should walk under West metal shed awning');

  // Climb North sandstone stairs up to East Balcony (x=55, y=3.4)
  let eastPos = { x: 55, y: 0, z: -26.5 };
  let eastVel = { x: 0, y: 0, z: 0 };
  for (let step = 0; step < 30; step++) {
    const res = resolvePlayerMovement(eastPos, eastVel, -1, 0, 0, false, true, 0.05, sandyard, 10, 0.48);
    eastPos = res.pos;
    eastVel = res.vel;
  }
  assert.ok(eastPos.y >= 3.3, `Player should climb onto Sandyard East Balcony (3.4m), got y=${eastPos.y.toFixed(2)}`);

  // Climb Outside Left staircase directly to Mid Building Floor 2 (x=-33.5 -> -17, z=0, y=4.30)
  let midLPos = { x: -33.5, y: 0, z: 0 };
  let midLVel = { x: 0, y: 0, z: 0 };
  for (let step = 0; step < 38; step++) {
    const res = resolvePlayerMovement(midLPos, midLVel, 0, 1, 0, false, true, 0.05, sandyard, 10, 0.48);
    midLPos = res.pos;
    midLVel = res.vel;
  }
  assert.ok(midLPos.y >= 4.2, `Outside Left stairs must climb onto Mid Building Floor 2 (4.3m), got y=${midLPos.y.toFixed(2)}`);

  // Spawn Sniper Vantage Wall blocks spawn-to-spawn ground sightline & spawn stairs climb to y=2.2m deck
  const spawnGroundRay = castLaserRay({ x: 0, y: 1.56, z: -56 }, { x: 0, y: 0, z: 1 }, 115, sandyard, []);
  assert.equal(spawnGroundRay.hitType, 'obstacle');
  assert.ok(spawnGroundRay.distance < 15, 'Spawn sniper wall must block direct ground spawn-to-spawn sniping');

  let sniperPos = { x: 0, y: 0, z: -52.0 };
  let sniperVel = { x: 0, y: 0, z: 0 };
  for (let step = 0; step < 20; step++) {
    const res = resolvePlayerMovement(sniperPos, sniperVel, -1, 0, 0, false, true, 0.05, sandyard, 10, 0.48);
    sniperPos = res.pos;
    sniperVel = res.vel;
  }
  assert.ok(sniperPos.y >= 2.15, `Spawn sniper stairs should climb to 2.2m deck, got y=${sniperPos.y.toFixed(2)}`);

  // Anti-spawncamp barrier inside North Mid entrance blocks straight doorway shot at z = -18.5
  const doorwayRay = castLaserRay({ x: 0, y: 1.56, z: -25 }, { x: 0, y: 0, z: 1 }, 20, sandyard, []);
  assert.equal(doorwayRay.hitType, 'obstacle');
  assert.ok(doorwayRay.distance < 7.5, 'Anti-spawncamp barrier right inside Floor 1 entrance must block straight doorway shots');
});

test('sampleKillCamClip interpolates attacker perspective smoothly over the 3-second replay', () => {
  const clip = [
    { t: 0, attackerX: 0, attackerY: 0, attackerZ: 10, attackerYaw: 0, victimX: 0, victimY: 0, victimZ: 0 },
    { t: 1.5, attackerX: 3, attackerY: 0, attackerZ: 10, attackerYaw: 0.5, victimX: 2, victimY: 0, victimZ: 0 },
    { t: 3.0, attackerX: 6, attackerY: 0, attackerZ: 10, attackerYaw: 1.0, victimX: 4, victimY: 0, victimZ: 0 },
  ];
  const mid = sampleKillCamClip(clip, 0.5);
  assert.ok(mid);
  assert.ok(Math.abs(mid.attackerX - 3) < 1e-5);
  assert.ok(Math.abs(mid.attackerYaw - 0.5) < 1e-5);
  const end = sampleKillCamClip(clip, 1);
  assert.ok(end);
  assert.ok(Math.abs(end.attackerX - 6) < 1e-5);
});

test('Weapon-specific operator body styles preserve player skin colors while changing body type & Shotgun satin vest', () => {
  const crimson = AVATAR_SKINS.find((s) => s.id === 'crimson_striker')!;
  assert.ok(crimson);

  const arStyle = getOperatorWeaponBodyStyle('pulse_carbine', crimson);
  assert.equal(arStyle.bodyType, 'assault_commando');
  assert.equal(arStyle.hasAssaultGear, true);
  assert.equal(arStyle.isFemaleBody, false);

  const shotgunStyle = getOperatorWeaponBodyStyle('volt_scatter', crimson);
  assert.equal(shotgunStyle.bodyType, 'shotgun_breacher');
  assert.equal(shotgunStyle.hasBreacherVest, true);
  // Light red vest tint on Crimson Striker, plus crimson satin body without blinding glare
  const rVest = Number.parseInt(shotgunStyle.vestColorHex.slice(1, 3), 16);
  const gVest = Number.parseInt(shotgunStyle.vestColorHex.slice(3, 5), 16);
  const rArmor = Number.parseInt(shotgunStyle.armorColorHex.slice(1, 3), 16);
  const gArmor = Number.parseInt(shotgunStyle.armorColorHex.slice(3, 5), 16);
  assert.ok(rVest >= 235 && gVest >= 120 && gVest < rVest, `Expected light red vest, got ${shotgunStyle.vestColorHex}`);
  assert.ok(rArmor > gArmor * 2, `Expected crimson armor hue, got ${shotgunStyle.armorColorHex}`);
  assert.ok(shotgunStyle.armorRoughness >= 0.24 && shotgunStyle.armorMetalness <= 0.52, 'Shotgun finish must stay satin rather than blinding mirror glare');

  const sniperStyle = getOperatorWeaponBodyStyle('helios_rail', crimson);
  assert.equal(sniperStyle.bodyType, 'sniper_marksman');
  assert.equal(sniperStyle.hasFeatherHat, true);

  const smgStyle = getOperatorWeaponBodyStyle('arc_repeater', crimson);
  assert.equal(smgStyle.bodyType, 'smg_woman');
  assert.equal(smgStyle.isFemaleBody, true);
});

test('All 8 maps have zero overlapping AABB obstacles to prevent Z-fighting and mesh clipping', () => {
  assert.equal(MAP_LIST.length, 8);
  const eps = 0.002;
  for (const map of MAP_LIST) {
    for (let i = 0; i < map.obstacles.length; i++) {
      const a = map.obstacles[i];
      const aMinX = a.x - a.w * 0.5 + eps;
      const aMaxX = a.x + a.w * 0.5 - eps;
      const aMinY = a.y + eps;
      const aMaxY = a.y + a.h - eps;
      const aMinZ = a.z - a.d * 0.5 + eps;
      const aMaxZ = a.z + a.d * 0.5 - eps;

      for (let j = i + 1; j < map.obstacles.length; j++) {
        const b = map.obstacles[j];
        const bMinX = b.x - b.w * 0.5 + eps;
        const bMaxX = b.x + b.w * 0.5 - eps;
        const bMinY = b.y + eps;
        const bMaxY = b.y + b.h - eps;
        const bMinZ = b.z - b.d * 0.5 + eps;
        const bMaxZ = b.z + b.d * 0.5 - eps;

        const overlapX = aMinX < bMaxX && aMaxX > bMinX;
        const overlapY = aMinY < bMaxY && aMaxY > bMinY;
        const overlapZ = aMinZ < bMaxZ && aMaxZ > bMinZ;
        assert.equal(
          overlapX && overlapY && overlapZ,
          false,
          `Map ${map.id} obstacles[${i}] (${a.kind ?? 'box'}) and obstacles[${j}] (${b.kind ?? 'box'}) overlap`
        );
      }
    }
  }
});

test('Per-weapon kills & accuracy accumulate across matches and mergeLocalAndCloudProfiles', () => {
  assert.equal(calculateWeaponAccuracy(null), null);
  assert.equal(calculateWeaponAccuracy({ kills: 0, shotsFired: 0, shotsHit: 0 }), null);
  assert.equal(calculateWeaponAccuracy({ kills: 5, shotsFired: 40, shotsHit: 18 }), 45);

  const profile = createDefaultProfile('StatTester');
  const updated = applyMatchRewards(
    profile,
    {
      gameMode: 'tdm',
      mapId: 'orbital_hangar',
      won: true,
      tags: 9,
      deaths: 2,
      accuracy: 50,
      xpEarned: 30,
      creditsEarned: 125,
      easterEggFound: false,
      durationSec: 180,
      weaponStats: {
        pulse_carbine: { kills: 6, shotsFired: 60, shotsHit: 30 },
        volt_scatter: { kills: 0, shotsFired: 0, shotsHit: 0 },
        helios_rail: { kills: 1, shotsFired: 5, shotsHit: 3 },
        arc_repeater: { kills: 2, shotsFired: 25, shotsHit: 12 },
      },
    },
    90,
    45
  );

  assert.ok(updated.stats.weaponStats);
  assert.equal(updated.stats.weaponStats.pulse_carbine.kills, 6);
  assert.equal(calculateWeaponAccuracy(updated.stats.weaponStats.pulse_carbine), 50);
  assert.equal(updated.stats.weaponStats.helios_rail.kills, 1);
  assert.equal(calculateWeaponAccuracy(updated.stats.weaponStats.helios_rail), 60);
  assert.equal(updated.stats.weaponStats.arc_repeater.kills, 2);
  assert.equal(calculateWeaponAccuracy(updated.stats.weaponStats.arc_repeater), 48);

  const cloudCopy = {
    ...profile,
    stats: {
      ...profile.stats,
      weaponStats: {
        pulse_carbine: { kills: 0, shotsFired: 0, shotsHit: 0 },
        volt_scatter: { kills: 0, shotsFired: 0, shotsHit: 0 },
        helios_rail: { kills: 0, shotsFired: 0, shotsHit: 0 },
        arc_repeater: { kills: 5, shotsFired: 50, shotsHit: 25 },
      },
    },
  };
  const merged = mergeLocalAndCloudProfiles(updated, cloudCopy);
  assert.ok(merged.stats.weaponStats);
  assert.equal(merged.stats.weaponStats.pulse_carbine.kills, 6);
  assert.equal(merged.stats.weaponStats.arc_repeater.kills, 5);
});

test('Battle Pass 1-month countdown and automatic season reset work cleanly', () => {
  assert.equal(PASS_SEASON_DURATION_MS, 30 * 24 * 60 * 60 * 1000);
  const now = Date.UTC(2026, 0, 1, 0, 0, 0);
  const endIso = new Date(now + 10 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000 + 42 * 60 * 1000).toISOString();
  const countdown = getBattlePassCountdown(endIso, now);
  assert.equal(countdown.expired, false);
  assert.equal(countdown.days, 10);
  assert.equal(countdown.hours, 3);
  assert.equal(countdown.minutes, 42);
  assert.equal(countdown.totalMinutes, 10 * 24 * 60 + 3 * 60 + 42);

  const baseProfile = createDefaultProfile('SeasonRunner');
  const activeProfile = {
    ...baseProfile,
    passSeasonNumber: 1,
    passSeasonEndsAt: new Date(now + 60_000).toISOString(),
    battlePassXp: 180,
    battlePassPremium: true,
    claimedFreeTiers: [1, 2],
    claimedPremiumTiers: [1],
  };

  const beforeExpire = syncBattlePassSeason(activeProfile, now);
  assert.equal(beforeExpire.resetTriggered, false);
  assert.equal(beforeExpire.profile.battlePassXp, 180);

  const afterExpire = syncBattlePassSeason(activeProfile, now + 120_000);
  assert.equal(afterExpire.resetTriggered, true);
  assert.equal(afterExpire.profile.passSeasonNumber, 2);
  assert.equal(afterExpire.profile.battlePassXp, 0);
  assert.equal(afterExpire.profile.battlePassPremium, false);
  assert.deepEqual(afterExpire.profile.claimedFreeTiers, []);
  assert.deepEqual(afterExpire.profile.claimedPremiumTiers, []);
  assert.ok(Date.parse(afterExpire.profile.passSeasonEndsAt || '') > now + 120_000);
});

test('Invisible adaptive performance tiering targets Intel UHD / low-core laptops without touching discrete GPUs', () => {
  assert.equal(detectLowPerfGpuString('ANGLE (Intel, Intel(R) UHD Graphics 620 Direct3D11)', 4), true);
  assert.equal(detectLowPerfGpuString('Mesa Intel(R) Iris(R) Xe Graphics (TGL GT2)', 8), true);
  assert.equal(detectLowPerfGpuString('ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 Direct3D11)', 8), false);
  assert.equal(detectLowPerfGpuString('AMD Radeon RX 6700 XT', 12), false);

  const t0 = getPerfSettingsForTier(0);
  const steppedDown = computeAdaptivePerfStep({ tier: t0.tier, avgFrameMs: 32, minTier: 0 });
  assert.equal(steppedDown.tier, 1);
  assert.ok(steppedDown.renderScale < 1);
  assert.equal(steppedDown.disableClearcoat, true);

  const steppedUp = computeAdaptivePerfStep({ tier: 2, avgFrameMs: 10, minTier: 1 });
  assert.equal(steppedUp.tier, 1);
  const clampedMin = computeAdaptivePerfStep({ tier: 1, avgFrameMs: 9, minTier: 1 });
  assert.equal(clampedMin.tier, 1);
});

test('Spawn protection blocks 100% of damage for 3 seconds OR until first shot, whichever occurs first', () => {
  assert.equal(SPAWN_PROTECTION_DURATION_MS, 3000);
  const spawnedAt = 10_000;
  let shield = createSpawnProtection(spawnedAt);

  // Immediately after spawn & up to 2.999s: active, -100% damage (0 damage taken)
  assert.equal(isSpawnProtectionActive(shield, spawnedAt), true);
  assert.equal(getSpawnProtectionRemainingMs(shield, spawnedAt + 1200), 1800);
  assert.equal(getSpawnProtectedDamageMultiplier(shield, spawnedAt + 2999), 0);
  const blockedHit = applyIncomingDamageWithSpawnProtection(74, shield, spawnedAt + 1500);
  assert.equal(blockedHit.blocked, true);
  assert.equal(blockedHit.damage, 0);

  // Condition 1: 3 seconds elapsed -> switches off automatically
  assert.equal(isSpawnProtectionActive(shield, spawnedAt + 3000), false);
  assert.equal(getSpawnProtectionRemainingMs(shield, spawnedAt + 3000), 0);
  assert.equal(getSpawnProtectedDamageMultiplier(shield, spawnedAt + 3000), 1);
  const expiredHit = applyIncomingDamageWithSpawnProtection(74, shield, spawnedAt + 3000);
  assert.equal(expiredHit.blocked, false);
  assert.equal(expiredHit.damage, 74);

  // Condition 2: Firing first shot before 3 seconds immediately switches protection off
  shield = createSpawnProtection(20_000);
  assert.equal(isSpawnProtectionActive(shield, 20_250), true);
  shield = clearSpawnProtectionOnShot(shield);
  assert.equal(isSpawnProtectionActive(shield, 20_250), false);
  assert.equal(getSpawnProtectionRemainingMs(shield, 20_250), 0);
  const afterShotHit = applyIncomingDamageWithSpawnProtection(22, shield, 20_250);
  assert.equal(afterShotHit.blocked, false);
  assert.equal(afterShotHit.damage, 22);
});

test('hasProfileCloudDiff detects Battle Pass, loadout, weapon stats, and settings changes', () => {
  const a = createDefaultProfile('CloudSyncUser');
  const b = createDefaultProfile('CloudSyncUser');
  assert.equal(hasProfileCloudDiff(a, b), false);

  const withBpXp = { ...b, battlePassXp: 25 };
  assert.equal(hasProfileCloudDiff(a, withBpXp), true);

  const withWeaponKill = {
    ...b,
    stats: {
      ...b.stats,
      weaponStats: {
        ...b.stats.weaponStats!,
        pulse_carbine: { kills: 1, shotsFired: 10, shotsHit: 5 },
      },
    },
  };
  assert.equal(hasProfileCloudDiff(a, withWeaponKill), true);
});

test('Skin catalog defines ~15 chest skins per colored rarity and differentiates weapon drop odds', () => {
  assert.deepEqual(RARITY_ORDER, ['common', 'uncommon', 'rare', 'epic', 'mythic', 'legendary']);
  const expectedColors = ['#cbd5e1', '#22c55e', '#3b82f6', '#d946ef', '#ef4444', '#eab308'];
  RARITY_ORDER.forEach((rarity, idx) => {
    assert.equal(RARITY_META[rarity].colorHex, expectedColors[idx]);
    const chestSkins = WEAPON_SKINS.filter((s) => s.chestEligible !== false && s.rarity === rarity);
    assert.ok(chestSkins.length >= 15, `Expected at least 15 chest skins in ${rarity}, got ${chestSkins.length}`);
  });

  // Weapon drop percentages must differ across weapons (e.g. sniper vs SMG/AR in Chest 1 vs Chest 3)
  const chest1Weapons = getChestWeaponPercentages('vanguard_crate');
  const chest3Weapons = getChestWeaponPercentages('prism_overlord');
  assert.notEqual(chest1Weapons.helios_rail, chest1Weapons.pulse_carbine);
  assert.ok(
    chest3Weapons.helios_rail > chest1Weapons.helios_rail,
    'Elite chest should favor sniper/high-tier finishes more than starter chest'
  );
});

test('Supply chests enforce 1000/1500/2000 CR pricing, exact % odds, 0.5% Aurum Sovereign drop, and duplicate CR refund', () => {
  assert.equal(CHEST_CATALOG.vanguard_crate.price, 1000);
  assert.equal(CHEST_CATALOG.apex_vault.price, 1500);
  assert.equal(CHEST_CATALOG.prism_overlord.price, 2000);

  for (const chestId of ['vanguard_crate', 'apex_vault', 'prism_overlord'] as const) {
    const pcts = getChestRarityPercentages(chestId);
    const total = pcts.reduce((sum, r) => sum + r.chancePct, 0);
    assert.ok(Math.abs(total - 100) < 1e-4, `Total rarity odds for ${chestId} must equal 100%, got ${total}`);
  }

  // Chest 1: max Epic (0% Mythic, 0% Legendary)
  assert.equal(CHEST_CATALOG.vanguard_crate.rarityChances.mythic, 0);
  assert.equal(CHEST_CATALOG.vanguard_crate.rarityChances.legendary, 0);

  // Chest 2: max Mythic + ONLY aurum_sovereign Legendary at exact 0.5%
  assert.equal(CHEST_CATALOG.apex_vault.rarityChances.legendary, 0.5);
  const chest2LegPool = getChestPoolForRarity(CHEST_CATALOG.apex_vault, 'legendary');
  assert.deepEqual(
    chest2LegPool.map((s) => s.id),
    ['aurum_sovereign']
  );

  // Chest 3: Rare - Legendary only (0% common, 0% uncommon)
  assert.equal(CHEST_CATALOG.prism_overlord.rarityChances.common, 0);
  assert.equal(CHEST_CATALOG.prism_overlord.rarityChances.uncommon, 0);
  assert.ok(CHEST_CATALOG.prism_overlord.rarityChances.legendary > 0);

  // Insufficient CR rejection
  const broke = createDefaultProfile('LowCr');
  const failOpen = rollChestOpen(broke, 'vanguard_crate');
  assert.equal(failOpen.ok, false);

  // High roll (0.999) in Chest 2 triggers exact 0.5% Legendary Aurum Sovereign
  const rich = { ...broke, credits: 5000 };
  const legRoll = rollChestOpen(rich, 'apex_vault', () => 0.998);
  assert.equal(legRoll.ok, true);
  assert.equal(legRoll.skin?.id, 'aurum_sovereign');
  assert.equal(legRoll.isDuplicate, false);
  assert.equal(legRoll.profile.credits, 3500);
  assert.ok(legRoll.profile.unlockedWeaponSkins.includes('aurum_sovereign'));

  // Re-rolling the exact same owned skin grants duplicate salvage CR refund
  const dupRoll = rollChestOpen(legRoll.profile, 'apex_vault', () => 0.998);
  assert.equal(dupRoll.ok, true);
  assert.equal(dupRoll.isDuplicate, true);
  assert.equal(dupRoll.refundCredits, RARITY_META.legendary.salvageCredits);
  assert.equal(
    dupRoll.profile.credits,
    3500 - 1500 + RARITY_META.legendary.salvageCredits
  );
});

test('allocateMatchmakingRoom shares same random-map room up to 12 players per mode then opens a new random map', () => {
  assert.equal(MAX_PLAYERS_PER_ROOM, 12);

  // Player 1 joins TDM -> opens TDM-1 on a random map
  const rooms: Array<{ roomCode: string; mode: 'tdm' | 'ffa'; mapId: keyof typeof MAPS; playerCount: number }> = [];
  const p1 = allocateMatchmakingRoom(rooms, 'tdm', { rng: () => 0.12 });
  assert.equal(p1.isNewRoom, true);
  assert.equal(p1.roomCode, 'TDM-1');
  rooms.push({ roomCode: p1.roomCode, mode: 'tdm', mapId: p1.mapId, playerCount: 1 });

  // Players 2..12 joining TDM must be placed in the exact same TDM-1 room & map
  for (let p = 2; p <= 12; p++) {
    const next = allocateMatchmakingRoom(rooms, 'tdm', { rng: () => 0.85 });
    assert.equal(next.isNewRoom, false);
    assert.equal(next.roomCode, p1.roomCode);
    assert.equal(next.mapId, p1.mapId);
    rooms[0].playerCount = p;
  }

  // Player joining FFA gets a separate FFA room without colliding with full TDM-1
  const ffa1 = allocateMatchmakingRoom(rooms, 'ffa', { rng: () => 0.4 });
  assert.equal(ffa1.isNewRoom, true);
  assert.equal(ffa1.mode, 'ffa');
  assert.notEqual(ffa1.roomCode, p1.roomCode);

  // 13th TDM player arrives when TDM-1 has 12 players -> opens TDM-2 on a DIFFERENT random map
  const p13 = allocateMatchmakingRoom(rooms, 'tdm', { rng: () => 0.12 });
  assert.equal(p13.isNewRoom, true);
  assert.equal(p13.roomCode, 'TDM-2');
  assert.notEqual(p13.mapId, p1.mapId);
});

test('mergeLocalAndCloudProfiles respects newer edited local nickname instead of resetting to old cloud nickname', () => {
  const cloud = {
    ...createDefaultProfile('GoogleAutoName'),
    accountId: 'uid-google-1',
    lastSyncedAt: '2026-11-20T10:00:00.000Z',
  };
  const localEdited = {
    ...cloud,
    nickname: 'CustomAce99',
    lastSyncedAt: '2026-11-20T10:02:00.000Z',
  };
  const merged = mergeLocalAndCloudProfiles(localEdited, cloud);
  assert.equal(merged.nickname, 'CustomAce99');
});

test('Four independent weapon skin slots allow Solar Circuit on AR and Prism Relic on Sniper simultaneously', () => {
  const base = createDefaultProfile('LoadoutPro');
  const profile = {
    ...base,
    equippedWeaponId: 'pulse_carbine' as const,
    unlockedWeaponSkins: [...base.unlockedWeaponSkins, 'solar_flare', 'prism_relic'],
  };

  // Equip Solar Circuit (solar_flare) on AR (pulse_carbine)
  const step1 = equipWeaponSkin(profile, 'solar_flare', 'pulse_carbine');
  assert.equal(step1.ok, true);
  assert.equal(step1.profile.equippedWeaponSkins.pulse_carbine, 'solar_flare');
  assert.equal(step1.profile.equippedWeaponId, 'pulse_carbine');

  // Equip Prism Relic (prism_relic) on Sniper (helios_rail) without changing AR skin or active weapon
  const step2 = equipWeaponSkin(step1.profile, 'prism_relic', 'helios_rail');
  assert.equal(step2.ok, true);
  assert.equal(step2.profile.equippedWeaponSkins.pulse_carbine, 'solar_flare');
  assert.equal(step2.profile.equippedWeaponSkins.helios_rail, 'prism_relic');
  assert.equal(step2.profile.equippedWeaponId, 'pulse_carbine');
  assert.equal(step2.profile.equippedWeaponSkinId, 'solar_flare');

  // Purchasing/equipping for another slot via purchaseStoreItem preserves active weapon & other slots
  const rich = { ...step2.profile, credits: 5000 };
  const step3 = purchaseStoreItem(rich, 'weapon_skin', 'obsidian_gold', 'volt_scatter');
  assert.equal(step3.ok, true);
  assert.equal(step3.profile.equippedWeaponSkins.volt_scatter, 'obsidian_gold');
  assert.equal(step3.profile.equippedWeaponSkins.pulse_carbine, 'solar_flare');
  assert.equal(step3.profile.equippedWeaponSkins.helios_rail, 'prism_relic');
  assert.equal(step3.profile.equippedWeaponId, 'pulse_carbine');
});

test('normalizeEquippedWeaponSkins migrates legacy single skin and repairs invalid skin IDs', () => {
  const normalized = normalizeEquippedWeaponSkins(
    { pulse_carbine: 'invalid_skin_xyz' },
    'prism_relic',
    'helios_rail'
  );
  assert.equal(normalized.pulse_carbine, 'cobalt_standard');
  assert.equal(normalized.helios_rail, 'prism_relic');
  assert.equal(normalized.volt_scatter, 'cobalt_standard');
  assert.equal(normalized.arc_repeater, 'cobalt_standard');
});

test('Rarity color styles skin label only: Legendary includes pink/cyan/emerald 3D paint finishes', () => {
  assert.equal(RARITY_META.legendary.colorHex, '#eab308');
  const legendarySkins = WEAPON_SKINS.filter((s) => s.rarity === 'legendary');
  const nonYellowLegendary = legendarySkins.filter(
    (s) =>
      s.primaryColor.toLowerCase() !== '#eab308' &&
      s.primaryColor.toLowerCase() !== '#facc15' &&
      s.primaryColor.toLowerCase() !== '#fde047'
  );
  assert.ok(
    nonYellowLegendary.length >= 10,
    `Expected diverse non-yellow 3D paint finishes in Legendary tier, found ${nonYellowLegendary.length}`
  );
  // Specifically verify pink & cyan legendary skins exist
  assert.ok(
    legendarySkins.some((s) => s.primaryColor.toLowerCase() === '#ec4899' || s.primaryColor.toLowerCase() === '#db2777'),
    'Expected pink Legendary 3D finish'
  );
  assert.ok(
    legendarySkins.some((s) => s.primaryColor.toLowerCase() === '#083344' && s.secondaryColor.toLowerCase() === '#06b6d4'),
    'Expected cyan Legendary 3D finish'
  );
});

test('Settings default aimMode to hold and profile diff/merge tracks aimMode and equippedWeaponSkins', () => {
  assert.equal(DEFAULT_SETTINGS.aimMode, 'hold');

  const a = createDefaultProfile('SyncTester');
  const b = {
    ...a,
    settings: { ...a.settings, aimMode: 'toggle' as const },
  };
  assert.equal(hasProfileCloudDiff(a, b), true);

  const c = {
    ...a,
    equippedWeaponSkins: { ...a.equippedWeaponSkins, arc_repeater: 'solar_flare' },
  };
  assert.equal(hasProfileCloudDiff(a, c), true);

  const newerCloud = {
    ...a,
    unlockedWeaponSkins: [...a.unlockedWeaponSkins, 'solar_flare', 'prism_relic'],
    equippedWeaponSkins: {
      ...a.equippedWeaponSkins,
      pulse_carbine: 'solar_flare',
      helios_rail: 'prism_relic',
    },
    settings: { ...a.settings, aimMode: 'toggle' as const },
    lastSyncedAt: '2026-11-22T12:00:00.000Z',
  };
  const olderLocal = {
    ...a,
    lastSyncedAt: '2026-11-22T10:00:00.000Z',
  };
  const merged = mergeLocalAndCloudProfiles(olderLocal, newerCloud);
  assert.equal(merged.equippedWeaponSkins.pulse_carbine, 'solar_flare');
  assert.equal(merged.equippedWeaponSkins.helios_rail, 'prism_relic');
  assert.equal(merged.settings.aimMode, 'toggle');
});

