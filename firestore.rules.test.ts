import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

// Verify finalized firestore.rules satisfies Eight Pillars & Dirty Dozen invariants structurally
const rulesText = fs.readFileSync('firestore.rules', 'utf8');

test('firestore.rules includes rules_version = 2 and default-deny safety net', () => {
  assert.match(rulesText, /rules_version\s*=\s*'2'/);
  assert.match(rulesText, /match \/\{document=\*\*\}\s*\{\s*allow read, write: if false;/);
});

test('firestore.rules blocks unverified users, blanket /users lists, and ghost fields', () => {
  assert.match(rulesText, /request\.auth\.token\.email_verified == true/);
  assert.match(rulesText, /allow list:\s*if false;/);
  assert.match(rulesText, /keys\(\)\.hasAll\(/);
  assert.match(rulesText, /keys\(\)\.hasOnly\(/);
  assert.match(rulesText, /affectedKeys\(\)\.hasOnly\(/);
});

test('firestore.rules enforces immutable accountId/createdAt, bounded timestamps, and Master Gate on friends', () => {
  assert.match(rulesText, /incoming\(\)\.accountId == existing\(\)\.accountId/);
  assert.match(rulesText, /incoming\(\)\.createdAt == existing\(\)\.createdAt/);
  assert.match(rulesText, /incoming\(\)\.createdAt == incoming\(\)\.updatedAt/);
  assert.match(rulesText, /isValidIsoTimestamp\(data\.createdAt\)/);
  assert.match(rulesText, /isParentUserOwner\(userId\)/);
  assert.match(rulesText, /resource\.data\.ownerId == request\.auth\.uid/);
});

test('firestore.rules validates weaponStats, passSeason fields, and controller settings', () => {
  assert.match(rulesText, /isValidWeaponStatsMap\(stats\.weaponStats\)/);
  assert.match(rulesText, /'passSeasonNumber',\s*'passSeasonEndsAt'/);
  assert.match(rulesText, /'controllerEnabled',\s*'controllerSensitivity'/);
  assert.match(rulesText, /'controllerDeadzone',\s*'controllerInvertY',\s*'controllerVibration'/);
});

test('firestore.rules stays under Firestore 10-call regex .matches() limit', () => {
  const matchesCalls = rulesText.match(/\.matches\(/g) ?? [];
  assert.ok(matchesCalls.length <= 5, `Too many .matches() definitions (${matchesCalls.length})`);
});

test('firestore.rules allows up to 250 unlocked weapon skins and nickname identity updates', () => {
  assert.match(rulesText, /isValidSkinList\(data\.unlockedWeaponSkins,\s*250\)/);
  assert.match(rulesText, /isProfileIdentitySyncAction[\s\S]*'nickname'/);
});

test('firestore.rules validates per-weapon equippedWeaponSkins map and settings.aimMode', () => {
  assert.match(rulesText, /isValidEquippedWeaponSkinsMap\(data\.equippedWeaponSkins\)/);
  assert.match(rulesText, /s\.aimMode is string && s\.aimMode in \['hold', 'toggle'\]/);
});

test('firestore.rules validates daily and weekly missions state with empty-list guarding', () => {
  assert.match(rulesText, /isValidMissionsState\(data\.missions\)/);
  assert.match(rulesText, /isValidWeeklyWeaponKillsMap\(m\.weeklyWeaponKills\)/);
  assert.match(rulesText, /arr\.size\(\) == 0 \|\| isValidSkinId\(arr\[0\]\)/);
  assert.match(rulesText, /isProfileProgressionSyncAction[\s\S]*'missions'/);
});

