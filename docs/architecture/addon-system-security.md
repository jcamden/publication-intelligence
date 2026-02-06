# Addon System Security Model

## Overview

The addon system allows users to purchase/subscribe to index types (e.g., Subject, Author, Scripture) which they can then enable in their projects. This document outlines the security model and implementation patterns.

## Core Principles

### 1. Self-Service Only (MVP)
- **Users can ONLY grant addons to themselves**
- No user-to-user grants (prevents abuse, unauthorized resale, gifting exploits)
- Uses PostgreSQL RLS with `auth.user_id()` to ensure user can only affect their own account
- Payment validation happens **before** addon grant

### 2. No User Enumeration
- Users cannot SELECT other users by ID
- Users can only SELECT their own user record (enforced by RLS: `id = auth.user_id()`)
- Collaboration uses email-based lookup (requires knowing the email)
- Prevents attackers from listing all users in the system

### 3. Time-Limited Subscriptions
- `expiresAt` field enforces subscription expiration
- `null` expiresAt = lifetime/permanent purchase
- Queries automatically filter expired addons: `expiresAt IS NULL OR expiresAt > NOW()`
- Renewal = UPDATE expiresAt (via payment webhook)

## Implementation Patterns

### Pattern 1: Self-Service Purchase (MVP)

```typescript
// Frontend: User completes payment
const session = await stripe.checkout.sessions.create({
  line_items: [{ price: 'price_subject_index_monthly', quantity: 1 }],
  metadata: { userId: user.id, addonName: 'subject' }
});

// Backend: Stripe webhook validates payment and grants addon
app.post('/api/webhooks/stripe', async (req, res) => {
  const event = stripe.webhooks.constructEvent(req.body, sig, secret);
  
  if (event.type === 'checkout.session.completed') {
    const { userId, indexType } = event.data.object.metadata;
    
    // Validate payment was successful
    if (session.payment_status === 'paid') {
      // Grant addon using RLS context for this user
      await withUserContext({
        userId,
        fn: async (tx) => {
          await tx.insert(userIndexTypeAddons)
            .values({
              userId, // RLS enforces user can only grant to self
              indexType, // indexTypeEnum value
              expiresAt: addMonths(new Date(), 1), // +1 month for monthly
            })
            .onConflictDoNothing(); // Ignore if already exists
        }
      });
    }
  }
});
```

**Security guarantees:**
- ✅ Payment validated before grant
- ✅ User can only grant to themselves (via RLS `auth.user_id()`)
- ✅ No way to grant to other users
- ✅ Expiration enforced at query time

### Pattern 2: Admin Grants (Post-MVP)

```typescript
// Admin dashboard (future)
// Uses database superuser connection to bypass RLS

async function adminGrantAddon({ adminToken, targetUserId, indexType, expiresAt }) {
  // 1. Validate admin has permission (check admin role in auth system)
  const admin = await verifyAdminToken(adminToken);
  if (!admin.roles.includes('admin')) throw new UnauthorizedError();
  
  // 2. Use superuser connection to bypass RLS
  const adminDb = createAdminDbClient(); // No RLS enforcement
  
  await adminDb.insert(userIndexTypeAddons)
    .values({
      userId: targetUserId,
      indexType,
      expiresAt,
    })
    .onConflictDoNothing();
  
  // 3. Audit log
  await logAdminAction({
    adminId: admin.id,
    action: 'grant_addon',
    targetUserId,
    details: { indexType, expiresAt }
  });
}
```

**Security guarantees:**
- ✅ Requires admin authentication
- ✅ Uses privileged role (bypasses user access policies)
- ✅ Audit logged for compliance
- ✅ Can grant to any user by ID

**TODO for post-MVP:**
- [ ] Implement admin authentication/RBAC
- [ ] Create admin API endpoints
- [ ] Add audit logging table
- [ ] Build admin UI panel

### Pattern 3: Subscription Tiers (Future)

```typescript
// User subscribes to "Professional" tier
// Backend grants multiple addons atomically

async function grantTierAddons({ userId, tierName }) {
  const tier = SUBSCRIPTION_TIERS[tierName]; 
  // { name: 'Professional', indexTypes: ['subject', 'author', 'scripture'] }
  
  // Grant all addons in tier atomically within single transaction
  await withUserContext({
    userId,
    fn: async (tx) => {
      const values = tier.indexTypes.map((indexType) => ({
        userId,
        indexType,
        expiresAt: tier.duration,
      }));
      
      await tx.insert(userIndexTypeAddons)
        .values(values)
        .onConflictDoNothing();
    }
  });
}
```

## Row-Level Security (RLS) Policies

### users Table
```typescript
// Drizzle schema with RLS policies
export const users = pgTable("users", { /* ... */ }, (table) => [
  // Users can only read their own record
  pgPolicy("users_select_own", {
    for: "select",
    to: authenticatedRole,
    using: sql`${table.id} = auth.user_id()`,
  }),
]);
```

**Why:** Prevents user enumeration, protects user privacy

### user_index_type_addons Table
```typescript
export const userIndexTypeAddons = pgTable("user_index_type_addons", { /* ... */ }, (table) => [
  // Users can only see their own addons
  pgPolicy("user_index_type_addons_select_own", {
    for: "select",
    to: authenticatedRole,
    using: sql`${table.userId} = auth.user_id()`,
  }),
  
  // Users can purchase addons for themselves
  pgPolicy("user_index_type_addons_insert_own", {
    for: "insert",
    to: authenticatedRole,
    withCheck: sql`${table.userId} = auth.user_id()`,
  }),
  
  // Users can manage their own addons
  pgPolicy("user_index_type_addons_update_own", {
    for: "update",
    to: authenticatedRole,
    using: sql`${table.userId} = auth.user_id()`,
  }),
  
  pgPolicy("user_index_type_addons_delete_own", {
    for: "delete",
    to: authenticatedRole,
    using: sql`${table.userId} = auth.user_id()`,
  }),
]);
```

**Why:**
- `select`: Privacy - users shouldn't see others' purchases
- `insert`: Self-service only - can't grant to others via RLS
- `update/delete`: Self-manage subscriptions

## Testing Patterns

```typescript
// In tests: Simulate user purchasing addon for themselves
const user = await createTestUser({ testDb });

// This simulates: User paid → webhook validated → granted addon
await grantIndexTypeAddon({
  testDb,
  userId: user.id,
  indexType: 'subject' // indexTypeEnum value
});

// User can now enable this index type in their projects
const available = await withTestUserContext({
  testDb,
  userId: user.id,
  fn: async (tx) => {
    return await tx.select()
      .from(userIndexTypeAddons)
      .where(eq(userIndexTypeAddons.userId, user.id));
  }
});
```

## Security Checklist

### MVP (Current)
- [x] Self-service purchase only
- [x] No user enumeration (can't SELECT users by ID)
- [x] Users can only grant addons to themselves
- [x] Expiration enforced at query time
- [x] Payment validation before grant (webhook pattern)

### Post-MVP (Future)
- [ ] Admin panel with RBAC
- [ ] Audit logging for all addon grants/revokes
- [ ] Rate limiting on addon purchases
- [ ] Fraud detection (multiple failed payments, etc.)
- [ ] Subscription tier management
- [ ] Addon usage analytics

## Common Vulnerabilities & Mitigations

### 1. User Enumeration
**Attack:** Loop through user IDs to find all users
**Mitigation:** Users can only SELECT themselves, collaboration uses email-based lookup

### 2. Unauthorized Grant
**Attack:** User tries to grant addon to another user
**Mitigation:** RLS policy `userId = auth.user_id()` enforces self-grant only

### 3. Expired Addon Usage
**Attack:** User uses addon after subscription expires
**Mitigation:** All queries filter by `expiresAt IS NULL OR expiresAt > NOW()`

### 4. Payment Bypass
**Attack:** User submits addon grant without payment
**Mitigation:** All grants go through payment webhook which validates payment status

### 5. Admin Privilege Escalation
**Attack:** Regular user tries to use admin role
**Mitigation:** Admin role credentials stored securely, not exposed to frontend

## References

- Schema: `apps/index-pdf-backend/src/db/schema/index-types.ts` (userIndexTypeAddons table)
- Backend: `apps/index-pdf-backend/src/modules/project-index-type/`
- Tests: `apps/index-pdf-backend/src/modules/project-index-type/*.test.ts`
