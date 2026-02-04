# Task 5D: Optimistic Updates & Error Handling

**Duration:** 1-2 days  
**Status:** ⚪ Not Started  
**Dependencies:** Task 5C completion (IndexMention backend)

## Overview

Polish the user experience with optimistic updates (instant feedback) and graceful error handling (retry, rollback, clear messaging). Migrate from local state to tRPC queries throughout the application.

**Key Features:**
- Optimistic updates for all CRUD operations
- Automatic retry with exponential backoff
- Rollback on failure
- Loading states and skeletons
- Toast notifications for success/error
- Offline detection and queueing

## Optimistic Update Patterns

### Pattern 1: Create Mention (Optimistic)

```typescript
// apps/index-pdf-frontend/src/hooks/use-create-mention.ts

export const useCreateMention = () => {
  const utils = trpc.useContext();
  
  return trpc.indexMention.create.useMutation({
    // BEFORE mutation starts
    onMutate: async (newMention) => {
      // Cancel any outgoing queries (prevent race conditions)
      await utils.indexMention.list.cancel();
      
      // Snapshot current state for rollback
      const previous = utils.indexMention.list.getData({
        documentId: newMention.documentId,
        pageNumber: newMention.pageNumber,
      });
      
      // Optimistically update cache
      utils.indexMention.list.setData(
        {
          documentId: newMention.documentId,
          pageNumber: newMention.pageNumber,
        },
        (old) => [
          ...(old || []),
          {
            id: `temp-${Date.now()}`, // Temporary ID
            ...newMention,
            created_at: new Date().toISOString(),
            entry: null, // Will be filled by server
          } as any,
        ]
      );
      
      // Return context for rollback
      return { previous };
    },
    
    // ON ERROR: Rollback
    onError: (err, newMention, context) => {
      // Restore previous state
      if (context?.previous) {
        utils.indexMention.list.setData(
          {
            documentId: newMention.documentId,
            pageNumber: newMention.pageNumber,
          },
          context.previous
        );
      }
      
      // Show error toast
      toast.error(`Failed to create mention: ${err.message}`);
    },
    
    // ON SUCCESS: Replace temp with real data
    onSuccess: (data, variables) => {
      // Server returns real mention with ID
      // Replace optimistic update with real data
      utils.indexMention.list.setData(
        {
          documentId: variables.documentId,
          pageNumber: variables.pageNumber,
        },
        (old) => 
          (old || []).map(m =>
            m.id.startsWith('temp-') ? data : m
          )
      );
      
      toast.success('Mention created');
    },
    
    // ALWAYS: Refetch to sync
    onSettled: (data, err, variables) => {
      // Refetch to ensure consistency
      utils.indexMention.list.invalidate({
        documentId: variables.documentId,
        pageNumber: variables.pageNumber,
      });
    },
  });
};
```

### Pattern 2: Update Mention (Optimistic)

```typescript
// apps/index-pdf-frontend/src/hooks/use-update-mention.ts

export const useUpdateMention = () => {
  const utils = trpc.useContext();
  
  return trpc.indexMention.update.useMutation({
    onMutate: async (update) => {
      await utils.indexMention.list.cancel();
      
      const previous = utils.indexMention.list.getData({
        documentId: update.documentId,
      });
      
      // Optimistically update the specific mention
      utils.indexMention.list.setData(
        { documentId: update.documentId },
        (old) =>
          (old || []).map(m =>
            m.id === update.id
              ? { ...m, ...update }
              : m
          )
      );
      
      return { previous };
    },
    
    onError: (err, update, context) => {
      if (context?.previous) {
        utils.indexMention.list.setData(
          { documentId: update.documentId },
          context.previous
        );
      }
      toast.error(`Failed to update mention: ${err.message}`);
    },
    
    onSuccess: () => {
      toast.success('Mention updated');
    },
    
    onSettled: (data, err, variables) => {
      utils.indexMention.list.invalidate({
        documentId: variables.documentId,
      });
    },
  });
};
```

### Pattern 3: Delete Mention (Optimistic)

```typescript
// apps/index-pdf-frontend/src/hooks/use-delete-mention.ts

export const useDeleteMention = () => {
  const utils = trpc.useContext();
  
  return trpc.indexMention.delete.useMutation({
    onMutate: async (deleteInput) => {
      await utils.indexMention.list.cancel();
      
      const previous = utils.indexMention.list.getData({
        documentId: deleteInput.documentId,
      });
      
      // Optimistically remove from cache
      utils.indexMention.list.setData(
        { documentId: deleteInput.documentId },
        (old) => (old || []).filter(m => m.id !== deleteInput.id)
      );
      
      return { previous };
    },
    
    onError: (err, deleteInput, context) => {
      if (context?.previous) {
        utils.indexMention.list.setData(
          { documentId: deleteInput.documentId },
          context.previous
        );
      }
      toast.error(`Failed to delete mention: ${err.message}`);
    },
    
    onSuccess: () => {
      toast.success('Mention deleted');
    },
    
    onSettled: (data, err, variables) => {
      utils.indexMention.list.invalidate({
        documentId: variables.documentId,
      });
    },
  });
};
```

## Error Handling Patterns

### Retry with Exponential Backoff

```typescript
// apps/index-pdf-frontend/src/lib/trpc-client.ts

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Retry failed queries
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors (client errors)
        if (error?.data?.httpStatus >= 400 && error?.data?.httpStatus < 500) {
          return false;
        }
        
        // Retry up to 3 times
        return failureCount < 3;
      },
      
      // Exponential backoff: 1s, 2s, 4s
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // Stale time: 5 minutes (data considered fresh for 5 min)
      staleTime: 5 * 60 * 1000,
      
      // Cache time: 10 minutes
      cacheTime: 10 * 60 * 1000,
    },
    mutations: {
      // Retry mutations only on network errors
      retry: (failureCount, error) => {
        if (error?.message?.includes('network')) {
          return failureCount < 3;
        }
        return false;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});
```

### Error Boundaries

```tsx
// apps/index-pdf-frontend/src/components/error-boundary.tsx

export class ErrorBoundary extends React.Component<Props, State> {
  state = { hasError: false, error: null };
  
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error boundary caught:', error, errorInfo);
    // Log to error tracking service
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="error-container">
          <h2>Something went wrong</h2>
          <p>{this.state.error?.message}</p>
          <Button onClick={() => window.location.reload()}>
            Reload Page
          </Button>
        </div>
      );
    }
    
    return this.props.children;
  }
}
```

### Network Status Detection

```typescript
// apps/index-pdf-frontend/src/hooks/use-network-status.ts

export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const utils = trpc.useContext();
  
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Connection restored');
      // Retry failed queries
      utils.invalidate();
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      toast.warning('No internet connection');
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  return { isOnline };
};

// Usage in component:
export const Editor = () => {
  const { isOnline } = useNetworkStatus();
  
  return (
    <>
      {!isOnline && (
        <Banner variant="warning">
          You're offline. Changes will be saved when connection is restored.
        </Banner>
      )}
      {/* ... rest of editor */}
    </>
  );
};
```

## Loading States

### Skeleton Loaders

```tsx
// apps/index-pdf-frontend/src/components/mention-list-skeleton.tsx

export const MentionListSkeleton = () => {
  return (
    <div className="space-y-2">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-2 p-2">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-4 flex-1" />
        </div>
      ))}
    </div>
  );
};

// Usage:
export const PageSubjectContent = () => {
  const { data: mentions, isLoading } = trpc.indexMention.list.useQuery({
    indexTypes: ['subject'],
  });
  
  if (isLoading) {
    return <MentionListSkeleton />;
  }
  
  return (
    <div>
      {mentions?.map(mention => (
        <MentionButton key={mention.id} mention={mention} />
      ))}
    </div>
  );
};
```

### Inline Loading

```tsx
// apps/index-pdf-frontend/src/components/mention-details-popover/mention-details-popover.tsx

export const MentionDetailsPopover = ({ mention }: Props) => {
  const updateMention = useUpdateMention();
  
  const handleSave = () => {
    updateMention.mutate({
      id: mention.id,
      entryId: selectedEntry.id,
      indexTypes: selectedIndexTypes,
    });
  };
  
  return (
    <div>
      {/* ... form fields ... */}
      
      <Button
        onClick={handleSave}
        disabled={updateMention.isLoading}
      >
        {updateMention.isLoading ? (
          <>
            <Spinner className="mr-2" />
            Saving...
          </>
        ) : (
          'Save'
        )}
      </Button>
    </div>
  );
};
```

## State Migration Checklist

### Replace Local State with tRPC

- [ ] **IndexTypes:**
  - [ ] Replace `useState` with `trpc.indexType.list.useQuery`
  - [ ] Update create/update/delete to use mutations
  - [ ] Add optimistic updates

- [ ] **IndexEntries:**
  - [ ] Replace `useState` with `trpc.indexEntry.list.useQuery`
  - [ ] Filter by index type
  - [ ] Update CRUD operations
  - [ ] Add optimistic updates

- [ ] **IndexMentions:**
  - [ ] Replace `useState` with `trpc.indexMention.list.useQuery`
  - [ ] Filter by page and index type
  - [ ] Update CRUD operations
  - [ ] Add optimistic updates
  - [ ] Replace adapter logic

- [ ] **Draft State:**
  - [ ] Keep draft state local in PdfViewer (doesn't need backend)
  - [ ] Only persist when confirmed

## Testing Requirements

- [ ] Optimistic updates work for all CRUD operations
- [ ] Rollback works on error
- [ ] Retry works with exponential backoff
- [ ] Network offline detection works
- [ ] Error toasts display correctly
- [ ] Loading states render properly
- [ ] Skeleton loaders match content structure
- [ ] No flickering during optimistic updates
- [ ] Cache invalidation works correctly
- [ ] Concurrent edits don't corrupt data
- [ ] Performance acceptable (instant perceived latency)

## Implementation Checklist

### Optimistic Updates
- [ ] Create custom hooks for all mutations
- [ ] Implement onMutate for instant feedback
- [ ] Implement onError for rollback
- [ ] Implement onSuccess for toast notifications
- [ ] Implement onSettled for cache sync

### Error Handling
- [ ] Configure retry logic in QueryClient
- [ ] Add error boundaries
- [ ] Add network status detection
- [ ] Add error toast notifications
- [ ] Add validation error display

### Loading States
- [ ] Create skeleton loaders for lists
- [ ] Add inline loading spinners
- [ ] Add disabled states during mutations
- [ ] Add loading overlays for long operations

### State Migration
- [ ] Remove all `useState` for backend data
- [ ] Replace with tRPC queries
- [ ] Update all components to use queries
- [ ] Test each component after migration
- [ ] Remove old state management code

### Polish
- [ ] Add success toasts
- [ ] Add error toasts
- [ ] Add confirmation dialogs for destructive actions
- [ ] Test offline mode
- [ ] Test concurrent edits
- [ ] Performance test with many operations

---

## Phase 5 Completion

After this task, Phase 5 is complete! All backend integration is functional with polished UX.

**Next Phase:** [Phase 6: Context System](../../phase-6-context-system/) - Build UI for ignore/page-number contexts using the Context schema from Task 5A.
