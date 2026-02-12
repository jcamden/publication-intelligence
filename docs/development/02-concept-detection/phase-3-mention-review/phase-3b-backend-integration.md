# Phase 3b: Backend Integration

**Duration:** 1-2 days  
**Priority:** P0 (Critical path)  
**Status:** Not Started  
**Parallelization:** ❌ **Must wait for Phase 2 to complete**

## Overview

Integrate Phase 3a UI components with Phase 2 backend. Replace mock data with real tRPC queries, implement mutations, add PDF viewer integration, and wire up meaning resolution.

## Goals

1. Replace mock data with real tRPC queries
2. Implement accept/reject/suppress mutations
3. Integrate meaning resolution UI
4. Add PDF viewer highlighting
5. Wire up extraction change detection
6. Implement re-detection merge preview
7. Add optimistic updates

## Integration Points

### 1. Replace Mock Queries

**Before (Phase 3a):**
```typescript
const suggestions = useMemo(() => generateMockSuggestions(), []);
```

**After (Phase 3b):**
```typescript
const { data: suggestions } = trpc.entry.listSuggestions.useQuery({
  projectId,
  filters: {
    minConfidence: filters.minConfidence,
    meaningTypes: filters.meaningTypes,
    validationStatus: filters.validationStatus
  }
});
```

### 2. Implement Mutations

**Accept Suggestion:**
```typescript
const acceptMutation = trpc.entry.acceptSuggestion.useMutation({
  onMutate: async ({ entryId }) => {
    // Optimistic update
    await utils.entry.listSuggestions.cancel();
    const previousData = utils.entry.listSuggestions.getData();
    
    utils.entry.listSuggestions.setData(projectId, (old) => 
      old?.filter(e => e.id !== entryId)
    );
    
    return { previousData };
  },
  onError: (err, variables, context) => {
    // Rollback on error
    utils.entry.listSuggestions.setData(projectId, context?.previousData);
  },
  onSettled: () => {
    // Refetch to ensure consistency
    utils.entry.listSuggestions.invalidate();
  }
});
```

**Suppress Suggestion:**
```typescript
const suppressMutation = trpc.entry.suppressSuggestion.useMutation({
  onSuccess: () => {
    toast.success('Entry suppressed. It will not appear in future detection runs.');
  }
});

const handleSuppress = async (entryId: string) => {
  const confirmed = await confirm({
    title: 'Suppress this suggestion?',
    description: 'This entry will not be suggested again in future detection runs.',
    confirmLabel: 'Suppress',
    cancelLabel: 'Cancel'
  });
  
  if (confirmed) {
    await suppressMutation.mutateAsync({
      entryId,
      scope: 'project',
      suppressionMode: 'block_suggestion'
    });
  }
};
```

### 3. Meaning Resolution Integration

**Change Meaning Action:**
```typescript
const changeMeaningMutation = trpc.entry.changeMeaning.useMutation();

const handleChangeMeaning = async (entryId: string, entry: IndexEntry) => {
  // 1. Get fresh candidates
  const candidates = await trpc.meaning.getCandidates.query({
    label: entry.label,
    indexType: entry.index_type,
    context: entry.mentions[0]?.text_quote // Use first mention as context
  });
  
  // 2. Show modal with candidates
  const selected = await showMeaningPicker({
    label: entry.label,
    currentMeaning: { type: entry.meaning_type, id: entry.meaning_id },
    candidates
  });
  
  if (selected) {
    // 3. Update entry
    await changeMeaningMutation.mutateAsync({
      entryId,
      newMeaningType: selected.meaning_type,
      newMeaningId: selected.meaning_id
    });
  }
};
```

### 4. PDF Viewer Integration

**Preview Mention:**
```typescript
const handlePreviewMention = ({ mention, entry }: { mention: IndexMention; entry: IndexEntry }) => {
  router.push(
    `/projects/${projectDir}/viewer?` + 
    `page=${mention.page_number}&` +
    `highlight=${mention.id}&` +
    `entry=${entry.id}`
  );
};

// In PDF viewer: highlight mention using stored bbox
const PdfMentionHighlight = ({ mention }: { mention: IndexMention }) => {
  const page = usePdfPage(mention.page_number);
  
  // bbox already in PDF.js coordinates (converted in Phase 2 Stage B)
  return (
    <div
      className="mention-highlight"
      style={{
        position: 'absolute',
        left: mention.bbox.x0,
        top: mention.bbox.y0,
        width: mention.bbox.x1 - mention.bbox.x0,
        height: mention.bbox.y1 - mention.bbox.y0,
        backgroundColor: 'rgba(255, 255, 0, 0.3)',
        pointerEvents: 'none'
      }}
    />
  );
};
```

### 5. Extraction Change Detection

**Show Warning Banner:**
```typescript
const ExtractionChangeWarning = ({ runId }: { runId: string }) => {
  const { data: validation } = trpc.detection.validateExtractionVersion.useQuery({ runId });
  
  if (!validation?.changed) return null;
  
  return (
    <Alert variant="warning">
      <AlertTitle>Extraction Changed</AlertTitle>
      <AlertDescription>
        The document extraction has changed since this detection run. 
        Some mentions may now overlap ignored text. 
        Mentions marked "Needs Review" should be verified on PDF.
      </AlertDescription>
      <div className="alert-actions">
        <Button variant="outline" onClick={() => router.push('/settings/extraction')}>
          Review Extraction Settings
        </Button>
        <Button onClick={() => handleReRunDetection()}>
          Re-run Detection
        </Button>
      </div>
    </Alert>
  );
};
```

### 6. Re-Detection Merge Preview

**Show Merge Conflicts:**
```typescript
const ReDetectionMergePreview = ({ projectId }: { projectId: string }) => {
  const { data: mergePreview } = trpc.detection.previewMerge.useQuery({ projectId });
  
  if (!mergePreview?.conflicts) return null;
  
  return (
    <Alert variant="info">
      <AlertTitle>Re-Detection Will Merge Suggestions</AlertTitle>
      <AlertDescription>
        {mergePreview.conflicts.length} existing suggestions will be merged with new mentions:
        <ul>
          {mergePreview.conflicts.map(c => (
            <li key={c.entryId}>
              <strong>{c.label}</strong>: +{c.newMentionCount} new mentions
            </li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
};
```

## tRPC Endpoints Required from Phase 2

### Query Endpoints

```typescript
entry: {
  listSuggestions: ({ projectId, filters }) => IndexEntry[];
  listAccepted: ({ projectId, filters }) => IndexEntry[];
}

detection: {
  validateExtractionVersion: ({ runId }) => { changed: boolean; oldVersion: string; newVersion: string };
  previewMerge: ({ projectId }) => { conflicts: MergeConflict[] };
}

meaning: {
  getCandidates: ({ label, indexType, context }) => MeaningCandidate[];
}
```

### Mutation Endpoints

```typescript
entry: {
  acceptSuggestion: ({ entryId, acceptAllMentions }) => { success: boolean };
  rejectSuggestion: ({ entryId }) => { success: boolean };
  suppressSuggestion: ({ entryId, scope, suppressionMode }) => { success: boolean };
  changeMeaning: ({ entryId, newMeaningType, newMeaningId }) => { success: boolean };
  makeChild: ({ childEntryId, parentEntryId }) => { success: boolean };
  demoteEntry: ({ entryId }) => { success: boolean };
}

mention: {
  acceptSuggestion: ({ mentionId }) => { success: boolean };
  rejectSuggestion: ({ mentionId }) => { success: boolean };
}
```

## Success Criteria (Phase 3b Only)

- [ ] Real tRPC queries replace all mock data
- [ ] Accept/reject/suppress mutations work with optimistic updates
- [ ] Meaning resolution "Change meaning..." action works
- [ ] PDF preview highlights mentions using stored bbox
- [ ] Extraction change warning shows when `extraction_version` mismatch
- [ ] Validation status badges show for `needs_review` mentions
- [ ] Re-detection merge preview shows conflicts before running
- [ ] Batch operations work (accept/reject/suppress multiple)
- [ ] Make Child validation works (can't cross index types)
- [ ] Demote entry shows warning if mentions exist
- [ ] Error handling for failed mutations (with rollback)
- [ ] Toast notifications for user actions

## Dependencies

- **Phase 1**: Complete (schema defined)
- **Phase 2**: Complete (backend API + meaning resolution service)
- **Phase 3a**: Complete (UI components built)

## Testing Focus

**Integration Tests:**
- Accept suggestion → verify `is_suggestion` flipped to false
- Suppress suggestion → verify added to `suppressed_suggestions` table
- Re-run detection → verify suppressed entries not re-created
- Change meaning → verify `meaning_id` updated, merge key changes
- Extraction change → verify `validation_status` flagged

**End-to-End Tests:**
- Full workflow: Extract → Detect → Review → Accept → Render on PDF
- Re-detection workflow: Accept some → Re-run → Merge with existing
- Suppression workflow: Suppress → Re-run → Verify not re-created

## Next Steps

After Phase 3b is complete:
1. **Test full pipeline**: Extract → Detect → Review → Accept
2. **Test re-detection**: Merge logic + suppression rules
3. **Performance testing**: Load testing with large documents
4. **User acceptance testing**: Real indexers with real books
5. **Move to Phase 4** (Optional): Fuzzy matching and metrics
