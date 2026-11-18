import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

// Verify finalized firestore.rules satisfies Eight Pillars &Dirty Dozen invariants structurally
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

test('firestore.rules enforces immutable accountId/createdAt, server timestamps, and Master Gate on friends', () => {
  assert.match(rulesText, /incoming\(\)\.accountId == existing\(\)\.accountId/);
  assert.match(rulesText, /incoming\(\)\.createdAt == existing\(\)\.createdAt/);
  assert.match(rulesText, /incoming\(\)\.updatedAt == request\.time/);
  assert.match(rulesText, /isParentUserOwner\(userId\)/);
  assert.match(rulesText, /resource\.data\.ownerId == request\.auth\.uid/);
});
