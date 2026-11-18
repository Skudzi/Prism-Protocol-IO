# Prism Protocol Security Specification (Phase 0)

## 1. Data Invariants
1. **Strict Ownership**: A player's cloud save at `/users/{userId}` can only be read (`get`), created, or updated by the authenticated, email-verified user whose `request.auth.uid == userId`. Collection listing on `/users` is strictly denied (`allow list: if false`).
2. **Immutable Identity & Timestamps**: `accountId` must match `request.auth.uid` and cannot change after creation. `createdAt` must equal `request.time` on creation and remain immutable on updates. `updatedAt` must always equal `request.time`.
3. **Master Gate on Friends Subcollection**: Operations on `/users/{userId}/friends/{friendId}` validate ownership against the parent `/users/{userId}` document (`get(...).data.accountId == request.auth.uid`), while `allow list` enforces `resource.data.ownerId == request.auth.uid` without costly `get()` lookups.
4. **No PII Storage & No Ghost Fields**: No emails, phone numbers, or addresses are stored in Firestore documents. All writes check `keys().hasAll(...)` and `keys().hasOnly(...)` on `create`, and `affectedKeys().hasOnly(...)` on `update`.
5. **Bounded Types & Patterns**: Every string enforces explicit `.size()` and regex pattern checks matching `firebase-blueprint.json`, every numeric counter enforces non-negative bounds, and every array enforces `.size() <= MAX` plus element type validation.

## 2. The "Dirty Dozen" Payloads (Expected: `PERMISSION_DENIED`)
1. **Unauthenticated Write**: Create `/users/uid1` with `request.auth == null`.
2. **Unverified Email Token**: Create `/users/uid1` with `request.auth.token.email_verified == false`.
3. **Cross-User Impersonation (Path vs UID)**: Signed in as `uid1`, write `/users/uid2`.
4. **Identity Spoofing (UID Field Mismatch)**: Signed in as `uid1`, write `/users/uid1` with `accountId: "uid2"`.
5. **Ghost / Shadow Field Injection**: Write `/users/uid1` including extra field `isAdmin: true` or `role: "admin"`.
6. **Scrape / List Users**: `list` query against `/users` collection.
7. **Client Timestamp Forgery**: Write `/users/uid1` with `createdAt` or `updatedAt` != `request.time`.
8. **Immutable Field Mutation**: Update `/users/uid1` modifying `accountId` or `createdAt`.
9. **Oversized ID Poisoning**: Read/write `/users/uid1/friends/` with a 200-char or invalid-character `friendId`.
10. **Negative Currency / Stat Poisoning**: Write `/users/uid1` with `credits: -500` or `stats.tags: -10`.
11. **Unbounded Array / Wrong Element Type**: Write `/users/uid1` with `unlockedWeaponSkins: [12345]` or `size() > 100`.
12. **Orphaned / Cross-Owner Friend Subcollection Write**: Signed in as `uid1`, create `/users/uid2/friends/friend_a` or omit/spoof `ownerId`.
