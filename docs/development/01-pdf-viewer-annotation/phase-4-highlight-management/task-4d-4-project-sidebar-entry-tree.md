# Task 4D-4: Project Sidebar Entry Tree

**Duration:** 3 hours  
**Status:** ⚪ Not Started  
**Dependencies:** Task 4D-1, 4D-2, 4D-3 completion

## Goal

Display IndexEntry hierarchies in project sidebar sections with expand/collapse, mention counts, and entry creation integration.

## Component Structure

```
entry-tree/
├── index.ts
├── entry-tree.tsx
├── components/
│   ├── entry-item.tsx
│   └── create-entry-button.tsx
└── stories/
    ├── entry-tree.stories.tsx
    └── tests/
        ├── interaction-tests.stories.tsx
        └── visual-regression-tests.stories.tsx
```

## Component API

### EntryTree Component

```typescript
type EntryTreeProps = {
  entries: IndexEntry[]; // All entries for this index type
  mentions: Mention[]; // For showing counts
  onEntryClick?: (entry: IndexEntry) => void; // Optional click handler
  onCreateEntry: () => void; // Open entry creation modal
};
```

**Usage:**
```typescript
<EntryTree
  entries={subjectEntries}
  mentions={mentions}
  onEntryClick={(entry) => {
    // Navigate to entry details or filter mentions
    console.log('Clicked entry:', entry);
  }}
  onCreateEntry={() => {
    setEntryCreationModalOpen(true);
  }}
/>
```

## Implementation

### EntryTree Component

Recursive rendering with expand/collapse state:

```typescript
export const EntryTree = ({
  entries,
  mentions,
  onEntryClick,
  onCreateEntry,
}: EntryTreeProps) => {
  const topLevelEntries = useMemo(
    () => entries.filter(e => e.parentId === null),
    [entries]
  );
  
  if (entries.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-sm text-gray-500 mb-3">No entries yet</p>
        <CreateEntryButton onClick={onCreateEntry} />
      </div>
    );
  }
  
  return (
    <div className="space-y-1">
      <div className="p-2">
        <CreateEntryButton onClick={onCreateEntry} />
      </div>
      {topLevelEntries.map(entry => (
        <EntryTreeNode
          key={entry.id}
          entry={entry}
          entries={entries}
          mentions={mentions}
          depth={0}
          onEntryClick={onEntryClick}
        />
      ))}
    </div>
  );
};
```

### EntryTreeNode Component (Recursive)

```typescript
type EntryTreeNodeProps = {
  entry: IndexEntry;
  entries: IndexEntry[]; // All entries (for finding children)
  mentions: Mention[]; // For counts
  depth: number;
  onEntryClick?: (entry: IndexEntry) => void;
};

const EntryTreeNode = ({
  entry,
  entries,
  mentions,
  depth,
  onEntryClick,
}: EntryTreeNodeProps) => {
  const children = useMemo(
    () => entries.filter(e => e.parentId === entry.id),
    [entries, entry.id]
  );
  
  const [expanded, setExpanded] = useState(true);
  
  const hasChildren = children.length > 0;
  
  return (
    <div>
      <EntryItem
        entry={entry}
        mentions={mentions}
        depth={depth}
        hasChildren={hasChildren}
        expanded={expanded}
        onToggleExpand={() => setExpanded(!expanded)}
        onClick={onEntryClick}
      />
      {hasChildren && expanded && (
        <div>
          {children.map(child => (
            <EntryTreeNode
              key={child.id}
              entry={child}
              entries={entries}
              mentions={mentions}
              depth={depth + 1}
              onEntryClick={onEntryClick}
            />
          ))}
        </div>
      )}
    </div>
  );
};
```

## EntryItem Component

Displays individual entry with indentation, expand/collapse icon, and mention count:

```typescript
type EntryItemProps = {
  entry: IndexEntry;
  mentions: Mention[];
  depth: number;
  hasChildren: boolean;
  expanded: boolean;
  onToggleExpand: () => void;
  onClick?: (entry: IndexEntry) => void;
};

export const EntryItem = ({
  entry,
  mentions,
  depth,
  hasChildren,
  expanded,
  onToggleExpand,
  onClick,
}: EntryItemProps) => {
  const mentionCount = useMemo(
    () => mentions.filter(m => m.entryId === entry.id).length,
    [mentions, entry.id]
  );
  
  return (
    <button
      type="button"
      onClick={() => onClick?.(entry)}
      className="group w-full flex items-center gap-2 px-2 py-1.5 hover:bg-gray-100 rounded text-left"
      style={{ paddingLeft: `${8 + depth * 20}px` }}
    >
      {/* Expand/collapse icon */}
      {hasChildren ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleExpand();
          }}
          className="flex-shrink-0 w-4 h-4 flex items-center justify-center hover:bg-gray-200 rounded"
        >
          {expanded ? (
            <ChevronDownIcon className="w-3 h-3" />
          ) : (
            <ChevronRightIcon className="w-3 h-3" />
          )}
        </button>
      ) : (
        <div className="w-4" /> // Spacer for alignment
      )}
      
      {/* Entry label */}
      <span className="flex-1 text-sm font-medium text-gray-900 truncate">
        {entry.label}
      </span>
      
      {/* Mention count badge */}
      {mentionCount > 0 && (
        <span className="flex-shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
          {mentionCount}
        </span>
      )}
    </button>
  );
};
```

## CreateEntryButton Component

```typescript
type CreateEntryButtonProps = {
  onClick: () => void;
};

export const CreateEntryButton = ({ onClick }: CreateEntryButtonProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded"
    >
      <PlusIcon className="w-4 h-4" />
      <span>Create Entry</span>
    </button>
  );
};
```

## Update Project Content Components

Replace placeholder content in existing sidebar content components:

### ProjectSubjectContent

```typescript
// apps/index-pdf-frontend/src/app/projects/[projectDir]/editor/_components/project-sidebar/components/project-subject-content/project-subject-content.tsx

import { EntryTree } from '../../../entry-tree';
import { EntryCreationModal } from '../../../entry-creation-modal';
import { useState, useMemo } from 'react';

export const ProjectSubjectContent = () => {
  // TODO: Replace with tRPC query when backend ready
  const indexEntries = []; // From editor state or context
  const mentions = []; // From editor state or context
  
  const [modalOpen, setModalOpen] = useState(false);
  
  const subjectEntries = useMemo(
    () => indexEntries.filter(e => e.indexType === 'subject'),
    [indexEntries]
  );
  
  return (
    <>
      <EntryTree
        entries={subjectEntries}
        mentions={mentions}
        onCreateEntry={() => setModalOpen(true)}
      />
      <EntryCreationModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        indexType="subject"
        existingEntries={subjectEntries}
        onCreate={(entry) => {
          // TODO: Create entry via tRPC
          const newEntry = {
            ...entry,
            id: crypto.randomUUID(),
          };
          // Add to state
          return newEntry;
        }}
      />
    </>
  );
};
```

### ProjectAuthorContent

```typescript
// Same pattern as ProjectSubjectContent, but with indexType='author'
export const ProjectAuthorContent = () => {
  const indexEntries = []; // From editor state
  const mentions = []; // From editor state
  
  const [modalOpen, setModalOpen] = useState(false);
  
  const authorEntries = useMemo(
    () => indexEntries.filter(e => e.indexType === 'author'),
    [indexEntries]
  );
  
  return (
    <>
      <EntryTree
        entries={authorEntries}
        mentions={mentions}
        onCreateEntry={() => setModalOpen(true)}
      />
      <EntryCreationModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        indexType="author"
        existingEntries={authorEntries}
        onCreate={(entry) => {
          // TODO: tRPC
          return { ...entry, id: crypto.randomUUID() };
        }}
      />
    </>
  );
};
```

### ProjectScriptureContent

```typescript
// Same pattern, indexType='scripture'
```

## State Management Considerations

**For now (mock data):**
- Pass `indexEntries` and `mentions` as props
- Manage state in parent editor component

**For Phase 5 (backend integration):**
- Use tRPC queries in each content component
- Cache management via TanStack Query
- Real-time updates via optimistic updates

**Temporary approach:**
```typescript
// In editor.tsx
const [indexEntries, setIndexEntries] = useState<IndexEntry[]>(mockIndexEntries);

// Pass via context or props
<ProjectSidebar
  indexEntries={indexEntries}
  onCreateEntry={(entry) => {
    setIndexEntries(prev => [...prev, { ...entry, id: crypto.randomUUID() }]);
  }}
/>
```

## Storybook Tests

### Documentation Story

```typescript
export const Default: Story = {
  args: {
    entries: mockSubjectEntries,
    mentions: mockMentions,
    onCreateEntry: () => console.log('Create entry'),
  },
};

export const EmptyState: Story = {
  args: {
    entries: [],
    mentions: [],
    onCreateEntry: () => console.log('Create entry'),
  },
};

export const FlatList: Story = {
  args: {
    entries: mockSubjectEntries.filter(e => e.parentId === null), // Only top-level
    mentions: mockMentions,
    onCreateEntry: () => console.log('Create entry'),
  },
};
```

### Interaction Tests

```typescript
export const ExpandCollapseNodes: Story = {
  args: Default.args,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    
    await step('Find parent entry', async () => {
      const philosophyEntry = canvas.getByText('Philosophy');
      expect(philosophyEntry).toBeInTheDocument();
    });
    
    await step('Click expand icon', async () => {
      const expandButton = canvas.getAllByRole('button')[1]; // First expand button
      await userEvent.click(expandButton);
    });
    
    await step('Verify children visible', async () => {
      await waitFor(() => {
        const kantEntry = canvas.getByText('Kant, Immanuel');
        expect(kantEntry).toBeInTheDocument();
      });
    });
  },
};

export const CreateEntry: Story = {
  args: Default.args,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    
    await step('Click create entry button', async () => {
      const createButton = canvas.getByText('Create Entry');
      await userEvent.click(createButton);
    });
    
    // onCreateEntry callback should be called
  },
};
```

### Visual Regression Tests

```typescript
export const EmptyStateVRT: Story = {
  args: EmptyState.args,
  globals: {
    ...defaultGlobals,
    viewport: { value: 'mobile1' }, // 375x667
  },
};

export const FlatListVRT: Story = {
  args: FlatList.args,
  globals: {
    ...defaultGlobals,
    viewport: { value: 'mobile1' },
  },
};

export const NestedHierarchyVRT: Story = {
  args: Default.args,
  globals: {
    ...defaultGlobals,
    viewport: { value: 'mobile1' },
  },
};
```

## Files to Create/Update

**New files:**
- `apps/index-pdf-frontend/src/app/projects/[projectDir]/editor/_components/entry-tree/index.ts`
- `apps/index-pdf-frontend/src/app/projects/[projectDir]/editor/_components/entry-tree/entry-tree.tsx`
- `apps/index-pdf-frontend/src/app/projects/[projectDir]/editor/_components/entry-tree/components/entry-item.tsx`
- `apps/index-pdf-frontend/src/app/projects/[projectDir]/editor/_components/entry-tree/components/create-entry-button.tsx`
- `apps/index-pdf-frontend/src/app/projects/[projectDir]/editor/_components/entry-tree/stories/entry-tree.stories.tsx`
- `apps/index-pdf-frontend/src/app/projects/[projectDir]/editor/_components/entry-tree/stories/tests/interaction-tests.stories.tsx`
- `apps/index-pdf-frontend/src/app/projects/[projectDir]/editor/_components/entry-tree/stories/tests/visual-regression-tests.stories.tsx`

**Update files:**
- `apps/index-pdf-frontend/src/app/projects/[projectDir]/editor/_components/project-sidebar/components/project-subject-content/project-subject-content.tsx`
- `apps/index-pdf-frontend/src/app/projects/[projectDir]/editor/_components/project-sidebar/components/project-author-content/project-author-content.tsx`
- `apps/index-pdf-frontend/src/app/projects/[projectDir]/editor/_components/project-sidebar/components/project-scripture-content/project-scripture-content.tsx`

## Success Criteria

- ✅ Displays entry hierarchy with indentation
- ✅ Expand/collapse functionality works
- ✅ Mention counts shown per entry
- ✅ Create Entry button opens modal
- ✅ Empty state handled gracefully
- ✅ Integrated in all project sidebar sections
- ✅ Comprehensive test coverage

## Next Task

[Task 4D-5: Index Type Color Configuration](./task-4d-5-color-configuration.md)
