# Phase 3a: Mention Review UI Components

**Duration:** 3-4 days  
**Priority:** P0 (Critical path)  
**Status:** Not Started  
**Parallelization:** ✅ **Can run in parallel with Phase 2**

## Overview

Build UI components for the mention review interface using mock data. This phase can start as soon as Phase 1 completes and schema is defined. No backend integration required - purely frontend component development.

## Goals

1. Create two-column layout skeleton
2. Build all UI components with mock data
3. Implement client-side filtering and sorting
4. Create Storybook stories for all components
5. Implement visual design and interactions
6. Set up state management (Jotai atoms)

## Key Components to Build

### 1. Layout Components

**SuggestionReviewLayout**
- Two-column responsive layout
- Action buttons between columns (→, ←, 🔗, 🚫)
- Filters panel (collapsible)
- Empty states for both columns

### 2. Entry Components

**EntryCard**
- Checkbox for selection
- Entry label display
- Meaning badge component
- Confidence display (if rated)
- Mention count + page summary
- Expand/collapse mentions
- Action buttons (Accept All, Reject, Suppress)

**MeaningBadge**
- Badge with color coding (WordNet=blue, Wikidata=green, Custom=gray)
- Tooltip with full gloss
- "Change meaning..." action link

**ConfidenceDisplay**
- Overall confidence bar
- Breakdown display (I:90/S:85)
- Conditional rendering (only if rated)

### 3. Mention Components

**MentionCard**
- Page number display
- Text quote preview
- Validation status badge (if needs review)
- Preview button (navigate to PDF)
- Accept/reject buttons

### 4. Filter Components

**FiltersPanel**
- Confidence slider (min overall confidence)
- Meaning type multi-select
- Minimum mentions input
- Validation status multi-select
- Search input

### 5. Action Components

**ActionButtons**
- Accept (→) - enabled when suggestions selected
- Demote (←) - enabled when entries selected
- Make Child (🔗) - enabled when 1 suggestion + 1 entry selected
- Suppress (🚫) - enabled when suggestions selected
- Disabled states with tooltips

### 6. State Management

**Jotai Atoms:**
```typescript
// Selection state
export const selectedSuggestionsAtom = atom<string[]>([]);
export const selectedEntriesAtom = atom<string[]>([]);

// Filter state
export const suggestionsFiltersAtom = atom<SuggestionFilters>({
  minConfidence: 0.6,
  meaningTypes: undefined,
  minMentions: 1,
  search: '',
  validationStatus: undefined
});

// Expanded state (which entries show mentions)
export const expandedEntriesAtom = atom<Set<string>>(new Set());
```

## Mock Data Structure

```typescript
// Mock types matching Phase 2 schema
type MockIndexEntry = {
  id: string;
  label: string;
  normalized_label: string;
  index_type: 'subject' | 'author' | 'scripture';
  meaning_type: 'wordnet' | 'wikidata' | 'custom';
  meaning_id: string | null;
  meaning_gloss: string | null;
  is_suggestion: boolean;
  suggestion_status: 'suggested' | 'accepted' | 'rejected' | 'suppressed';
  indexability?: number;
  specificity?: number;
  overall_confidence?: number;
  mentions: MockIndexMention[];
};

type MockIndexMention = {
  id: string;
  page_number: number;
  text_quote: string;
  char_range: [number, number];
  bbox: { x0: number; y0: number; x1: number; y1: number };
  is_suggestion: boolean;
  validation_status: 'valid' | 'needs_review' | 'invalid';
};

// Mock data generator
export const generateMockSuggestions = (): MockIndexEntry[] => [
  {
    id: '1',
    label: 'Divine Simplicity',
    normalized_label: 'divine simplicity',
    index_type: 'subject',
    meaning_type: 'wordnet',
    meaning_id: 'oewn:simplicity.n.02',
    meaning_gloss: 'The quality of being simple or uncompounded',
    is_suggestion: true,
    suggestion_status: 'suggested',
    indexability: 0.90,
    specificity: 0.88,
    overall_confidence: 0.89,
    mentions: [
      {
        id: 'm1',
        page_number: 5,
        text_quote: 'divine simplicity',
        char_range: [16, 33],
        bbox: { x0: 72, y0: 680, x1: 165, y1: 695 },
        is_suggestion: true,
        validation_status: 'valid'
      },
      {
        id: 'm2',
        page_number: 12,
        text_quote: 'divine simplicity',
        char_range: [84, 101],
        bbox: { x0: 124, y0: 520, x1: 217, y1: 535 },
        is_suggestion: true,
        validation_status: 'valid'
      }
    ]
  },
  {
    id: '2',
    label: 'Aquinas, Thomas',
    normalized_label: 'aquinas, thomas',
    index_type: 'author',
    meaning_type: 'wikidata',
    meaning_id: 'wikidata:Q9438',
    meaning_gloss: 'Italian Dominican friar and priest (1225-1274)',
    is_suggestion: true,
    suggestion_status: 'suggested',
    indexability: 0.95,
    specificity: 0.92,
    overall_confidence: 0.94,
    mentions: [
      {
        id: 'm3',
        page_number: 8,
        text_quote: 'Aquinas',
        char_range: [45, 52],
        bbox: { x0: 156, y0: 600, x1: 195, y1: 615 },
        is_suggestion: true,
        validation_status: 'valid'
      }
    ]
  }
];
```

## Storybook Stories

### EntryCard Stories

```tsx
// phase-3-mention-review/stories/entry-card.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import { EntryCard } from '../components/entry-card';

const meta: Meta<typeof EntryCard> = {
  title: 'Epic 2/Phase 3/EntryCard',
  component: EntryCard,
};

export default meta;
type Story = StoryObj<typeof EntryCard>;

// Documentation stories
export const SubjectEntry: Story = {
  args: {
    entry: {
      id: '1',
      label: 'Divine Simplicity',
      meaning_type: 'wordnet',
      meaning_gloss: 'The quality of being simple or uncompounded',
      overall_confidence: 0.89,
      indexability: 0.90,
      specificity: 0.88,
      mentions: [
        { page_number: 5, text_quote: 'divine simplicity', validation_status: 'valid' },
        { page_number: 12, text_quote: 'divine simplicity', validation_status: 'valid' }
      ]
    },
    isSelected: false,
    onSelect: () => {},
    onAccept: () => {},
    onReject: () => {},
    onSuppress: () => {}
  }
};

export const AuthorEntry: Story = {
  args: {
    entry: {
      id: '2',
      label: 'Aquinas, Thomas',
      meaning_type: 'wikidata',
      meaning_gloss: 'Italian Dominican friar (1225-1274)',
      overall_confidence: 0.94,
      mentions: [
        { page_number: 8, text_quote: 'Aquinas', validation_status: 'valid' }
      ]
    },
    isSelected: false
  }
};

export const CustomEntry: Story = {
  args: {
    entry: {
      label: 'Hypostatic Union',
      meaning_type: 'custom',
      meaning_gloss: null,
      mentions: [
        { page_number: 15, text_quote: 'hypostatic union', validation_status: 'valid' }
      ]
    }
  }
};

export const NeedsReview: Story = {
  args: {
    entry: {
      label: 'Faith',
      meaning_type: 'wordnet',
      mentions: [
        { page_number: 23, text_quote: 'faith', validation_status: 'needs_review' }
      ]
    }
  }
};
```

### Interaction Tests

```tsx
// phase-3-mention-review/stories/tests/interaction-tests.stories.tsx

import { expect, userEvent, within } from '@storybook/test';
import { defaultInteractionTestMeta } from '@pubint/storybook-config';

export default {
  ...defaultInteractionTestMeta,
  title: 'Epic 2/Phase 3/tests/Interaction Tests'
};

export const AcceptSuggestion: Story = {
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    
    await step('Select suggestion', async () => {
      const checkbox = canvas.getByRole('checkbox', { name: /divine simplicity/i });
      await userEvent.click(checkbox);
    });
    
    await step('Click accept button', async () => {
      const acceptButton = canvas.getByRole('button', { name: /accept/i });
      await userEvent.click(acceptButton);
      
      // Verify entry moved to accepted column
      const acceptedColumn = canvas.getByTestId('accepted-entries-column');
      await expect(within(acceptedColumn).getByText('Divine Simplicity')).toBeInTheDocument();
    });
  }
};
```

## Success Criteria (Phase 3a Only)

- [ ] Two-column layout component created with responsive design
- [ ] EntryCard component complete with all states (selected, expanded, with/without confidence)
- [ ] MentionCard component complete with validation status badges
- [ ] MeaningBadge component with WordNet/Wikidata/Custom variants
- [ ] ConfidenceDisplay component with bar + breakdown
- [ ] ActionButtons component with disabled states and tooltips
- [ ] FiltersPanel component with all filter types
- [ ] Jotai atoms for selection, filters, expanded state
- [ ] Mock data generator with realistic examples
- [ ] Storybook documentation stories for all components
- [ ] Interaction tests for key workflows (select, accept, filter)
- [ ] Visual design matches design system
- [ ] Empty states for both columns
- [ ] Loading states for async operations

## What This Phase Does NOT Include

**Excluded from Phase 3a (waiting for Phase 3b):**
- ❌ Real tRPC queries (use mock data)
- ❌ Accept/reject/suppress mutations (use mock functions)
- ❌ Meaning resolution integration (mock candidates)
- ❌ PDF viewer integration (mock preview action)
- ❌ Re-detection merge logic (backend only)
- ❌ Extraction validation (backend only)

## Dependencies

- Phase 1 complete (for schema definitions to create types)
- PDF Viewer exists (for layout context, not integration)
- Design system components (Button, Badge, Tooltip, etc.)

## Deliverables

1. **Component Library**: All UI components with Storybook docs
2. **Mock Data**: Realistic test data matching Phase 2 schema
3. **State Management**: Jotai atoms for selection and filters
4. **Interaction Tests**: Coverage for key user workflows
5. **Visual Design**: Complete UI ready for backend integration

## Next Steps

After Phase 3a is complete:
1. **Review with stakeholders**: Verify UI/UX meets requirements
2. **Wait for Phase 2 backend**: Backend API must complete
3. **Move to Phase 3b**: Backend integration
