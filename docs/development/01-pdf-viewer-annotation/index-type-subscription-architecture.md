# Index Type Subscription Architecture

**Status:** Design Document  
**Related:** Phase 5 Schema Changes

## Overview

This document describes the architecture for subscription-based index type access control and project-level configuration.

## Architecture Layers

### Layer 1: System Templates (`IndexTypeTemplate`)

**Purpose:** Define what index types exist in the system

**Seeded at deployment:**
- Subject (hue=230 blue, base_tier=true)
- Author (hue=30 orange, base_tier=false)
- Scripture (hue=120 green, base_tier=false)
- Context (hue=340 pink, base_tier=false)

**Properties:**
- `name`: System-wide unique identifier
- `default_hue`: Default OKLCH hue (0-360)
- `ordinal`: Display order
- `is_base_tier`: Whether included in free tier

### Layer 2: User Entitlements (`UserIndexTypeEntitlement`)

**Purpose:** Control which index types a user has ACCESS to

**Grants:**
- **Base Tier (Free):** Subject only
- **Premium Tier:** All 4 types
- **Addons:** Individual types (future)
- **Trials:** Temporary access with expiration

**Properties:**
- `user`: Who has access
- `template`: Which type they can use
- `granted_via`: How they got access ('base_tier', 'premium_tier', 'trial', etc.)
- `expires_at`: Optional expiration for trials

### Layer 3: Project Configuration (`ProjectIndexType`)

**Purpose:** Configure which entitled types are ENABLED per project with custom colors

**Behavior:**
- User can only enable types they have entitlement for
- Each type can have project-specific hue (0-360)
- User can disable entitled types they don't need
- User can reorder types per project
- Default: Enable all entitled types on project creation

**Properties:**
- `project`: Which project
- `template`: Which type (must have entitlement)
- `hue`: Project-specific OKLCH hue
- `enabled`: Whether active in this project
- `ordinal`: Display order in this project

## Business Logic Flows

### User Signup

```typescript
async function createUser({ email, subscriptionTier }) {
  const user = await db.insert(User).values({ email });
  
  // Grant base tier types (Subject)
  const baseTemplates = await db.query.indexTypeTemplate.findMany({
    where: eq(indexTypeTemplate.isBaseTier, true)
  });
  
  await db.insert(userIndexTypeEntitlement).values(
    baseTemplates.map(template => ({
      userId: user.id,
      templateId: template.id,
      grantedVia: 'base_tier'
    }))
  );
  
  // Grant premium types if applicable
  if (subscriptionTier === 'premium') {
    const premiumTemplates = await db.query.indexTypeTemplate.findMany({
      where: eq(indexTypeTemplate.isBaseTier, false)
    });
    
    await db.insert(userIndexTypeEntitlement).values(
      premiumTemplates.map(template => ({
        userId: user.id,
        templateId: template.id,
        grantedVia: 'premium_tier'
      }))
    );
  }
  
  return user;
}
```

### Project Creation

```typescript
async function createProject({ userId, name }) {
  const project = await db.insert(Project).values({ userId, name });
  
  // Get all index types user has access to
  const entitlements = await db.query.userIndexTypeEntitlement.findMany({
    where: and(
      eq(userIndexTypeEntitlement.userId, userId),
      or(
        isNull(userIndexTypeEntitlement.expiresAt),
        gt(userIndexTypeEntitlement.expiresAt, new Date())
      )
    ),
    with: { template: true }
  });
  
  // Enable all entitled types with default colors
  await db.insert(projectIndexType).values(
    entitlements.map((ent) => ({
      projectId: project.id,
      templateId: ent.templateId,
      hue: ent.template.defaultHue,
      enabled: true,
      ordinal: ent.template.ordinal
    }))
  );
  
  return project;
}
```

### Subscription Upgrade

```typescript
async function upgradeSubscription({ userId, newTier }) {
  if (newTier === 'premium') {
    // Grant premium index types
    const premiumTemplates = await db.query.indexTypeTemplate.findMany({
      where: eq(indexTypeTemplate.isBaseTier, false)
    });
    
    // Check which ones user doesn't already have
    const existingEntitlements = await db.query.userIndexTypeEntitlement.findMany({
      where: eq(userIndexTypeEntitlement.userId, userId)
    });
    const existingTemplateIds = new Set(existingEntitlements.map(e => e.templateId));
    
    const newTemplates = premiumTemplates.filter(t => !existingTemplateIds.has(t.id));
    
    // Grant new entitlements
    await db.insert(userIndexTypeEntitlement).values(
      newTemplates.map(template => ({
        userId,
        templateId: template.id,
        grantedVia: 'premium_tier'
      }))
    );
    
    // Add newly available types to existing projects
    const userProjects = await db.query.project.findMany({
      where: eq(project.userId, userId)
    });
    
    for (const project of userProjects) {
      await db.insert(projectIndexType).values(
        newTemplates.map(template => ({
          projectId: project.id,
          templateId: template.id,
          hue: template.defaultHue,
          enabled: true,
          ordinal: template.ordinal
        }))
      );
    }
  }
}
```

### Subscription Downgrade

```typescript
async function downgradeSubscription({ userId, newTier }) {
  if (newTier === 'base') {
    // Remove premium entitlements
    const premiumTemplates = await db.query.indexTypeTemplate.findMany({
      where: eq(indexTypeTemplate.isBaseTier, false)
    });
    const premiumTemplateIds = premiumTemplates.map(t => t.id);
    
    await db.delete(userIndexTypeEntitlement).where(
      and(
        eq(userIndexTypeEntitlement.userId, userId),
        inArray(userIndexTypeEntitlement.templateId, premiumTemplateIds)
      )
    );
    
    // Disable (but don't delete) premium types in projects
    // This preserves data if user re-subscribes
    const userProjects = await db.query.project.findMany({
      where: eq(project.userId, userId)
    });
    
    for (const project of userProjects) {
      await db.update(projectIndexType)
        .set({ enabled: false })
        .where(
          and(
            eq(projectIndexType.projectId, project.id),
            inArray(projectIndexType.templateId, premiumTemplateIds)
          )
        );
    }
  }
}
```

### Enable Index Type in Project

```typescript
async function enableProjectIndexType({ 
  projectId, 
  templateId, 
  userId 
}) {
  // Verify user has entitlement
  const hasEntitlement = await db.query.userIndexTypeEntitlement.findFirst({
    where: and(
      eq(userIndexTypeEntitlement.userId, userId),
      eq(userIndexTypeEntitlement.templateId, templateId),
      or(
        isNull(userIndexTypeEntitlement.expiresAt),
        gt(userIndexTypeEntitlement.expiresAt, new Date())
      )
    )
  });
  
  if (!hasEntitlement) {
    throw new Error('User does not have access to this index type');
  }
  
  // Enable the type
  await db.update(projectIndexType)
    .set({ enabled: true })
    .where(
      and(
        eq(projectIndexType.projectId, projectId),
        eq(projectIndexType.templateId, templateId)
      )
    );
}
```

### Update Project Index Type Color

```typescript
async function updateProjectIndexTypeColor({
  projectId,
  templateId,
  hue,
  userId
}) {
  // Verify user owns project
  const project = await db.query.project.findFirst({
    where: and(
      eq(project.id, projectId),
      eq(project.userId, userId)
    )
  });
  
  if (!project) {
    throw new Error('Project not found or access denied');
  }
  
  // Update hue
  await db.update(projectIndexType)
    .set({ hue, updatedAt: new Date() })
    .where(
      and(
        eq(projectIndexType.projectId, projectId),
        eq(projectIndexType.templateId, templateId)
      )
    );
}
```

## Query Patterns

### Get User's Available Index Types

```typescript
const availableTypes = await db.query.userIndexTypeEntitlement.findMany({
  where: and(
    eq(userIndexTypeEntitlement.userId, userId),
    or(
      isNull(userIndexTypeEntitlement.expiresAt),
      gt(userIndexTypeEntitlement.expiresAt, new Date())
    )
  ),
  with: { template: true }
});
```

### Get Project's Enabled Index Types

```typescript
const enabledTypes = await db.query.projectIndexType.findMany({
  where: and(
    eq(projectIndexType.projectId, projectId),
    eq(projectIndexType.enabled, true),
    isNull(projectIndexType.deletedAt)
  ),
  with: { template: true },
  orderBy: [asc(projectIndexType.ordinal)]
});
```

### Get Index Entries by Type

```typescript
const subjectEntries = await db.query.indexEntry.findMany({
  where: and(
    eq(indexEntry.projectId, projectId),
    eq(indexEntry.projectIndexType.template.name, 'subject'),
    isNull(indexEntry.deletedAt)
  ),
  with: {
    projectIndexType: {
      with: { template: true }
    }
  }
});
```

### Check if User Can Use Index Type

```typescript
async function canUserUseIndexType({ userId, templateName }) {
  const entitlement = await db.query.userIndexTypeEntitlement.findFirst({
    where: and(
      eq(userIndexTypeEntitlement.userId, userId),
      eq(userIndexTypeEntitlement.template.name, templateName),
      or(
        isNull(userIndexTypeEntitlement.expiresAt),
        gt(userIndexTypeEntitlement.expiresAt, new Date())
      )
    )
  });
  
  return !!entitlement;
}
```

## UI Patterns

### Project Settings → Index Types

```typescript
function ProjectIndexTypeSettings({ projectId }) {
  // Get what user has access to (entitlements)
  const { data: entitledTypes } = trpc.userIndexTypeEntitlement.list.useQuery();
  
  // Get what's configured for this project
  const { data: projectTypes } = trpc.projectIndexType.list.useQuery({ projectId });
  
  // Mutations
  const toggleType = trpc.projectIndexType.toggle.useMutation();
  const updateColor = trpc.projectIndexType.updateColor.useMutation();
  const reorder = trpc.projectIndexType.reorder.useMutation();
  
  return (
    <div>
      <h2>Index Types</h2>
      {entitledTypes?.map(entitlement => {
        const projectConfig = projectTypes?.find(
          pt => pt.templateId === entitlement.templateId
        );
        
        return (
          <IndexTypeCard
            key={entitlement.id}
            name={entitlement.template.name}
            label={entitlement.template.label}
            enabled={projectConfig?.enabled ?? false}
            hue={projectConfig?.hue ?? entitlement.template.defaultHue}
            onToggle={(enabled) => 
              toggleType.mutate({ 
                projectId, 
                templateId: entitlement.templateId, 
                enabled 
              })
            }
            onColorChange={(hue) =>
              updateColor.mutate({
                projectId,
                templateId: entitlement.templateId,
                hue
              })
            }
          />
        );
      })}
    </div>
  );
}
```

### Subscription Upsell

```typescript
function IndexTypeEntitlementBanner({ user }) {
  const { data: entitlements } = trpc.userIndexTypeEntitlement.list.useQuery();
  const hasOnlyBase = entitlements?.every(e => e.template.isBaseTier);
  
  if (hasOnlyBase) {
    return (
      <Banner>
        <p>You're using the free tier with Subject index only.</p>
        <Button href="/pricing">
          Upgrade to Premium for Author, Scripture, and Context indexes
        </Button>
      </Banner>
    );
  }
  
  return null;
}
```

## Testing Strategy

### Unit Tests
- [ ] User signup grants correct entitlements based on tier
- [ ] Project creation enables all entitled types
- [ ] Subscription upgrade grants new entitlements and adds to projects
- [ ] Subscription downgrade removes entitlements and disables in projects
- [ ] Cannot enable index type without entitlement (throws error)
- [ ] Expired entitlements are filtered out
- [ ] Color updates persist correctly

### Integration Tests
- [ ] End-to-end user journey: signup → create project → upgrade → use new types
- [ ] Downgrade preserves data (entries/mentions remain, just disabled)
- [ ] Re-upgrade restores access to preserved data
- [ ] Multi-project user: upgrade affects all projects

### Edge Cases
- [ ] User with expired trial entitlement cannot enable type
- [ ] User downgrades while actively using premium types (graceful disable)
- [ ] Project with no enabled types (edge case: all disabled)
- [ ] User deletes project with premium types (cascade delete)

## Migration from localStorage

Current localStorage schema:
```typescript
{
  "color-config": {
    "subject": { "hue": 230 },
    "author": { "hue": 30 },
    "scripture": { "hue": 120 },
    "context": { "hue": 340 }
  }
}
```

Migration strategy:
1. On first project load after schema migration, read localStorage
2. If custom hues exist, update ProjectIndexType records
3. Clear localStorage key to prevent re-migration
4. All future changes persist to database only

```typescript
async function migrateLocalStorageColors({ projectId, userId }) {
  const localConfig = localStorage.getItem('color-config');
  if (!localConfig) return;
  
  try {
    const config = JSON.parse(localConfig);
    
    for (const [typeName, { hue }] of Object.entries(config)) {
      await trpc.projectIndexType.updateColor.mutate({
        projectId,
        typeName,
        hue
      });
    }
    
    localStorage.removeItem('color-config');
  } catch (err) {
    console.error('Failed to migrate color config:', err);
  }
}
```

## Future Enhancements

### Add-on Index Types
- Allow purchasing individual index types without full premium
- Grant specific entitlements per add-on purchase

### Custom Index Types (Phase 6+)
- Allow users to create fully custom index types
- Store as IndexTypeTemplate with user ownership
- Still subject to subscription limits (e.g., "5 custom types in premium")

### ~~Organization/Team Subscriptions~~ *(Not in MVP)*
- ~~Workspace-level subscriptions~~
- ~~All workspace members inherit entitlements~~
- ~~Workspace admins manage which types are available~~

### Usage Analytics
- Track which index types are most used
- Inform product decisions about pricing tiers
- Identify candidates for base tier promotion

## Related Documentation

- [Phase 5 Schema Changes](./phase-5-schema-changes.md) - Database schema
- [Phase 6 Context System](./phase-6-context-system.md) - Context-specific features
