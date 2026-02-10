# Task 5D-4: Polish & Testing

**Duration:** 1-2 days  
**Status:** ⚪ Not Started  
**Dependencies:** Task 5D-3 completion (State migration)

## Overview

Polish the user experience with loading states, error boundaries, network detection, and comprehensive testing of optimistic updates and error handling.

**Key Features:**
- Skeleton loaders for all data fetching
- Error boundaries for graceful degradation
- Network status detection and offline feedback
- Confirmation dialogs for destructive actions
- Comprehensive frontend integration tests

## Loading States

### Skeleton Loaders

**Strategy:** Match content structure for smooth transitions

```typescript
// apps/index-pdf-frontend/src/app/projects/[projectDir]/editor/_components/project-sidebar/components/entry-list-skeleton.tsx

export const EntryListSkeleton = ({ count = 5 }: Props) => {
  return (
    <div className="space-y-2">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="flex items-center gap-2 p-2">
          {/* Icon skeleton */}
          <Skeleton className="h-4 w-4 rounded" />
          {/* Label skeleton */}
          <Skeleton className="h-4 flex-1" />
          {/* Actions skeleton */}
          <Skeleton className="h-4 w-8" />
        </div>
      ))}
    </div>
  );
};
```

### Usage Pattern

```tsx
// apps/index-pdf-frontend/src/app/projects/[projectDir]/editor/_components/project-sidebar/components/project-subject-content/project-subject-content.tsx

export const ProjectSubjectContent = () => {
  const { projectId } = useProject();
  const subjectTypeId = useSubjectIndexTypeId();
  
  const { data: entries, isLoading, error } = trpc.indexEntry.list.useQuery({
    projectId,
    projectIndexTypeId: subjectTypeId,
  });
  
  if (error) {
    return (
      <ErrorState
        title="Failed to load entries"
        message={error.message}
        onRetry={() => utils.indexEntry.list.invalidate()}
      />
    );
  }
  
  if (isLoading) {
    return <EntryListSkeleton />;
  }
  
  if (entries.length === 0) {
    return (
      <EmptyState
        icon={<BookIcon />}
        title="No entries yet"
        description="Create your first subject entry"
        action={<CreateEntryButton />}
      />
    );
  }
  
  return (
    <div>
      {entries.map(entry => (
        <EntryButton key={entry.id} entry={entry} />
      ))}
    </div>
  );
};
```

### Mention List Skeleton

```typescript
// apps/index-pdf-frontend/src/app/projects/[projectDir]/editor/_components/page-sidebar/components/mention-list-skeleton.tsx

export const MentionListSkeleton = ({ count = 3 }: Props) => {
  return (
    <div className="space-y-3">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="border rounded-lg p-3 space-y-2">
          {/* Entry label skeleton */}
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-4 w-32" />
          </div>
          {/* Text span skeleton */}
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-3/4" />
          {/* Actions skeleton */}
          <div className="flex gap-2">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-6 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
};
```

### Inline Loading States

```tsx
// apps/index-pdf-frontend/src/app/projects/[projectDir]/editor/_components/mention-details-popover/mention-details-popover.tsx

export const MentionDetailsPopover = ({ mention }: Props) => {
  const updateMention = useUpdateMention();
  const deleteMention = useDeleteMention();
  
  return (
    <div>
      {/* Form fields */}
      
      <div className="flex gap-2">
        <Button
          onClick={handleSave}
          disabled={updateMention.isLoading}
        >
          {updateMention.isLoading ? (
            <>
              <Spinner className="mr-2" size="sm" />
              Saving...
            </>
          ) : (
            'Save'
          )}
        </Button>
        
        <Button
          variant="destructive"
          onClick={handleDelete}
          disabled={deleteMention.isLoading}
        >
          {deleteMention.isLoading ? (
            <>
              <Spinner className="mr-2" size="sm" />
              Deleting...
            </>
          ) : (
            'Delete'
          )}
        </Button>
      </div>
    </div>
  );
};
```

## Error Boundaries

### Global Error Boundary

```tsx
// apps/index-pdf-frontend/src/components/error-boundary.tsx

import { Component, type ErrorInfo, type ReactNode } from 'react';

type Props = {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
};

type State = {
  hasError: boolean;
  error: Error | null;
};

export class ErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
    error: null,
  };
  
  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error boundary caught:', error, errorInfo);
    // TODO: Log to error tracking service (Sentry, etc.)
  }
  
  reset = () => {
    this.setState({ hasError: false, error: null });
  };
  
  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.reset);
      }
      
      return (
        <div className="flex min-h-screen items-center justify-center">
          <div className="max-w-md space-y-4 text-center">
            <h2 className="text-2xl font-bold">Something went wrong</h2>
            <p className="text-gray-600">{this.state.error.message}</p>
            <Button onClick={() => window.location.reload()}>
              Reload Page
            </Button>
          </div>
        </div>
      );
    }
    
    return this.props.children;
  }
}
```

### Usage in App

```tsx
// apps/index-pdf-frontend/src/app/layout.tsx

import { ErrorBoundary } from '@/components/error-boundary';

export default function RootLayout({ children }: Props) {
  return (
    <html lang="en">
      <body>
        <ErrorBoundary>
          <TrpcProvider>
            {children}
          </TrpcProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
```

### Route-Level Error Boundaries

```tsx
// apps/index-pdf-frontend/src/app/projects/[projectDir]/editor/error.tsx

'use client';

import { useEffect } from 'react';
import { Button } from '@pubint/yabasic';

export default function EditorError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Editor error:', error);
  }, [error]);
  
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="max-w-md space-y-4 text-center">
        <h2 className="text-2xl font-bold">Failed to load editor</h2>
        <p className="text-gray-600">
          {error.message || 'An unexpected error occurred'}
        </p>
        <div className="flex gap-2 justify-center">
          <Button onClick={reset}>Try Again</Button>
          <Button variant="ghost" onClick={() => window.history.back()}>
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
}
```

## Network Status Detection

### Network Hook

```typescript
// apps/index-pdf-frontend/src/hooks/use-network-status.ts

import { useEffect, useState } from 'react';
import { toast } from '@pubint/yabasic';

export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [wasOffline, setWasOffline] = useState(false);
  
  const utils = trpc.useContext();
  
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      
      if (wasOffline) {
        toast.success('Connection restored');
        // Retry all failed queries
        utils.invalidate();
        setWasOffline(false);
      }
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
      toast.warning('No internet connection', {
        duration: Infinity, // Keep showing until online
        id: 'offline-warning',
      });
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [wasOffline, utils]);
  
  return { isOnline, wasOffline };
};
```

### Offline Banner

```tsx
// apps/index-pdf-frontend/src/components/offline-banner.tsx

import { useNetworkStatus } from '@/hooks/use-network-status';
import { Banner } from '@pubint/yabasic';

export const OfflineBanner = () => {
  const { isOnline } = useNetworkStatus();
  
  if (isOnline) return null;
  
  return (
    <Banner variant="warning" className="sticky top-0 z-50">
      You're offline. Changes will be saved when connection is restored.
    </Banner>
  );
};
```

### Usage in Layout

```tsx
// apps/index-pdf-frontend/src/app/projects/[projectDir]/editor/layout.tsx

import { OfflineBanner } from '@/components/offline-banner';

export default function EditorLayout({ children }: Props) {
  return (
    <div>
      <OfflineBanner />
      {children}
    </div>
  );
}
```

## Confirmation Dialogs

### Delete Entry Confirmation

```tsx
// apps/index-pdf-frontend/src/app/projects/[projectDir]/editor/_components/delete-entry-dialog.tsx

import { AlertDialog } from '@pubint/yabasic';

export const DeleteEntryDialog = ({ entry, open, onOpenChange }: Props) => {
  const deleteEntry = useDeleteEntry();
  
  const handleDelete = () => {
    deleteEntry.mutate(
      { id: entry.id, projectId: entry.projectId },
      {
        onSuccess: () => {
          onOpenChange(false);
          toast.success('Entry deleted');
        },
      }
    );
  };
  
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogTitle>Delete Entry</AlertDialogTitle>
      <AlertDialogDescription>
        Are you sure you want to delete "{entry.label}"?
        {entry.childCount > 0 && (
          <p className="mt-2 text-orange-600">
            This entry has {entry.childCount} child entries.
          </p>
        )}
      </AlertDialogDescription>
      
      <AlertDialogActions>
        <Button variant="ghost" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button
          variant="destructive"
          onClick={handleDelete}
          disabled={deleteEntry.isLoading}
        >
          {deleteEntry.isLoading ? 'Deleting...' : 'Delete'}
        </Button>
      </AlertDialogActions>
    </AlertDialog>
  );
};
```

### Delete Entry with Children

```tsx
// apps/index-pdf-frontend/src/app/projects/[projectDir]/editor/_components/delete-entry-with-children-dialog.tsx

export const DeleteEntryWithChildrenDialog = ({ entry, open, onOpenChange }: Props) => {
  const [cascadeToChildren, setCascadeToChildren] = useState(false);
  const deleteEntry = useDeleteEntry();
  
  const handleDelete = () => {
    deleteEntry.mutate(
      {
        id: entry.id,
        projectId: entry.projectId,
        cascadeToChildren,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          toast.success(
            cascadeToChildren
              ? `Deleted "${entry.label}" and ${entry.childCount} children`
              : `Deleted "${entry.label}"`
          );
        },
      }
    );
  };
  
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogTitle>Delete Entry with Children</AlertDialogTitle>
      <AlertDialogDescription>
        This entry has {entry.childCount} child entries.
        
        <div className="mt-4">
          <Checkbox
            checked={cascadeToChildren}
            onCheckedChange={setCascadeToChildren}
            label="Also delete all child entries"
          />
        </div>
        
        {cascadeToChildren && (
          <p className="mt-2 text-red-600 font-medium">
            Warning: This will permanently delete {entry.childCount} child entries.
          </p>
        )}
      </AlertDialogDescription>
      
      <AlertDialogActions>
        <Button variant="ghost" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button
          variant="destructive"
          onClick={handleDelete}
          disabled={deleteEntry.isLoading}
        >
          {deleteEntry.isLoading ? 'Deleting...' : 'Delete'}
        </Button>
      </AlertDialogActions>
    </AlertDialog>
  );
};
```

## Frontend Integration Tests

### Test Structure

```typescript
// apps/index-pdf-frontend/src/app/projects/[projectDir]/editor/_components/project-sidebar/components/project-subject-content/stories/tests/interaction-tests.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, waitFor, within } from '@storybook/test';
import { defaultInteractionTestMeta } from '@pubint/storybook-config';
import { ProjectSubjectContent } from '../project-subject-content';

export default {
  ...defaultInteractionTestMeta,
  title: 'Projects/[ProjectDir]/Editor/ProjectSidebar/ProjectSubjectContent/tests/Interaction Tests',
  component: ProjectSubjectContent,
  tags: ['interaction-test'],
} satisfies Meta<typeof ProjectSubjectContent>;

type Story = StoryObj<typeof ProjectSubjectContent>;

export const CreateEntry: Story = {
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    
    await step('Click create entry button', async () => {
      const createButton = canvas.getByRole('button', { name: /create entry/i });
      await userEvent.click(createButton);
    });
    
    await step('Wait for dialog to open', async () => {
      const dialog = within(document.body).getByRole('dialog');
      await expect(dialog).toBeInTheDocument();
    });
    
    await step('Fill in entry details', async () => {
      const labelInput = within(document.body).getByLabelText(/label/i);
      await userEvent.type(labelInput, 'Phenomenology');
      
      const slugInput = within(document.body).getByLabelText(/slug/i);
      await userEvent.type(slugInput, 'phenomenology');
    });
    
    await step('Submit form', async () => {
      const submitButton = within(document.body).getByRole('button', { name: /create/i });
      await userEvent.click(submitButton);
    });
    
    await step('Verify entry appears in list', async () => {
      await waitFor(async () => {
        const newEntry = canvas.getByText('Phenomenology');
        await expect(newEntry).toBeInTheDocument();
      });
    });
    
    await step('Verify success toast', async () => {
      const toast = within(document.body).getByText(/entry created/i);
      await expect(toast).toBeInTheDocument();
    });
  },
};

export const DeleteEntry: Story = {
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    
    await step('Click delete button on entry', async () => {
      const entry = canvas.getByText('Kant');
      const deleteButton = entry
        .closest('[role="listitem"]')
        ?.querySelector('[aria-label="Delete"]');
      
      if (!deleteButton) throw new Error('Delete button not found');
      await userEvent.click(deleteButton);
    });
    
    await step('Confirm deletion in dialog', async () => {
      const confirmButton = within(document.body).getByRole('button', { name: /delete/i });
      await userEvent.click(confirmButton);
    });
    
    await step('Verify entry removed from list', async () => {
      await waitFor(async () => {
        const entry = canvas.queryByText('Kant');
        await expect(entry).not.toBeInTheDocument();
      });
    });
    
    await step('Verify success toast', async () => {
      const toast = within(document.body).getByText(/entry deleted/i);
      await expect(toast).toBeInTheDocument();
    });
  },
};

export const OptimisticUpdateRollback: Story = {
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    
    // Mock network failure
    await step('Setup network error', async () => {
      // This would require MSW or similar mocking
      // For now, just demonstrate the test structure
    });
    
    await step('Attempt to create entry', async () => {
      const createButton = canvas.getByRole('button', { name: /create entry/i });
      await userEvent.click(createButton);
      
      const labelInput = within(document.body).getByLabelText(/label/i);
      await userEvent.type(labelInput, 'Test Entry');
      
      const submitButton = within(document.body).getByRole('button', { name: /create/i });
      await userEvent.click(submitButton);
    });
    
    await step('Verify optimistic entry appears', async () => {
      const entry = canvas.getByText('Test Entry');
      await expect(entry).toBeInTheDocument();
    });
    
    await step('Verify rollback after error', async () => {
      await waitFor(async () => {
        const entry = canvas.queryByText('Test Entry');
        await expect(entry).not.toBeInTheDocument();
      });
    });
    
    await step('Verify error toast', async () => {
      const toast = within(document.body).getByText(/failed to create entry/i);
      await expect(toast).toBeInTheDocument();
    });
  },
};
```

### Test Coverage Goals

- [ ] Entry creation with optimistic update
- [ ] Entry editing with rollback on error
- [ ] Entry deletion with confirmation
- [ ] Mention creation from draft
- [ ] Mention editing with multi-type update
- [ ] Mention deletion
- [ ] Bulk index type update
- [ ] Drag-drop hierarchy change
- [ ] Cycle detection error message
- [ ] Network offline detection
- [ ] Loading state rendering
- [ ] Empty state rendering
- [ ] Error state rendering

## Implementation Checklist

### Loading States
- [ ] Create `EntryListSkeleton` component
- [ ] Create `MentionListSkeleton` component
- [ ] Add loading states to all data fetching
- [ ] Add inline spinners to mutation buttons
- [ ] Test skeleton structure matches content

### Error Handling
- [ ] Create global `ErrorBoundary` component
- [ ] Add route-level error boundaries
- [ ] Create `ErrorState` component for query errors
- [ ] Add retry buttons to error states
- [ ] Test error boundary fallbacks

### Network Detection
- [ ] Create `useNetworkStatus` hook
- [ ] Create `OfflineBanner` component
- [ ] Add network status to layout
- [ ] Test offline/online transitions
- [ ] Test query retry after reconnection

### Confirmation Dialogs
- [ ] Create `DeleteEntryDialog` component
- [ ] Create `DeleteEntryWithChildrenDialog` component
- [ ] Create `DeleteMentionDialog` component
- [ ] Add confirmations for all destructive actions
- [ ] Test dialog flow

### Empty States
- [ ] Create `EmptyState` component
- [ ] Add empty state to entry lists
- [ ] Add empty state to mention lists
- [ ] Include call-to-action buttons
- [ ] Test empty state rendering

### Integration Tests
- [ ] Write interaction tests for entry CRUD
- [ ] Write interaction tests for mention CRUD
- [ ] Write tests for optimistic updates
- [ ] Write tests for error rollback
- [ ] Write tests for loading states
- [ ] Write tests for empty states
- [ ] Run full test suite

## Related Documentation

- [Task 5D-1: Core Optimistic Updates](./task-5d-1-core-optimistic-updates.md) - Mutation hooks
- [Task 5D-2: Advanced Operations](./task-5d-2-advanced-operations.md) - Complex operations
- [Task 5D-3: State Migration & Cleanup](./task-5d-3-state-migration-cleanup.md) - Real data
- [UI Component Testing Standards](./../../../.cursor/rules/ui-component-testing.mdc) - Testing guidelines
