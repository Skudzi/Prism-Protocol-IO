import test from 'node:test';
import assert from 'node:assert/strict';
import { createDefaultProfile, DEFAULT_SETTINGS, MAPS, WEAPONS, WEAPON_SKINS } from './catalog';
import {
  applyControllerDeadzone,
  applyMatchRewards,
  applyTutorialCompletion,
  applyUnderfootJumpVelocity,
  calculateDamage,
  calculateMatchRewards,
  canManualReload,
  canTriggerEasterEgg,
  canTriggerUnderfootJump,
  castLaserRay,
  checkHealOrbPickup,
  checkJumpPadCollision,
  claimBattlePassTier,
  getHealOrbScheduleTimes,
  getKillRankReward,
  MAX_MATCH_CREDITS,
  MAX_MATCH_XP,
  mergeLocalAndCloudProfiles,
  NORMAL_JUMP_VELOCITY,
  pickOpenHealOrbPosition,
  pickRandomMapId,
  purchaseStoreItem,
  resolvePlayerMovement,
  sampleKillCamClip,
  shouldAutoReload,
  sortLeaderboardEntries,
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

test('Underfoot shot triggers +0.3x jump height boost and floor ray hit', () => {
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

  assert.equal(canTriggerUnderfootJump(-0.95, downHit.distance, 0), true);
  assert.equal(canTriggerUnderfootJump(-0.95, downHit.distance, 120), false);
  assert.equal(canTriggerUnderfootJump(-0.2, downHit.distance, 0), false);
  assert.equal(canTriggerUnderfootJump(-0.95, 6.0, 0), false);

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

test('Map 1 allows entering side buildings through doorways under roofs and uses wooden crates & concrete walls', () => {
  const map1 = MAPS.hyperion_atrium;
  assert.equal(map1.isDaylight, true);
  assert.equal(map1.floorStyle, 'trampled_earth');
  assert.ok(map1.teamSpawns && map1.teamSpawns.cyan.length >= 4 && map1.teamSpawns.amber.length >= 4);
  assert.ok(map1.obstacles.some((o) => o.kind === 'wood_crate'));
  assert.ok(map1.obstacles.some((o) => o.kind === 'concrete_wall'));
  assert.ok(map1.obstacles.some((o) => o.kind === 'platform' && o.x === 0 && o.z === 0));

  // Walk into West building doorway at (x = -46.7, z = 12) from outside (x = -44, z = 12) moving -X
  const enterWest = resolvePlayerMovement(
    { x: -45.5, y: 0, z: 12 },
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
  assert.ok(enterWest.pos.x < -45.5, 'Player should walk smoothly through West doorway into building');

  // Walk freely inside West building underneath roof (y=4.5)
  const insideWest = resolvePlayerMovement(
    { x: -53, y: 0, z: 12 },
    { x: 0, y: 0, z: 0 },
    1,
    0,
    0,
    false,
    true,
    0.05,
    map1,
    8.2,
    0.48
  );
  assert.ok(insideWest.pos.z < 12, 'Player should move freely inside West building under its roof');
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
