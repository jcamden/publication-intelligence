# Task 2: LLM Integration & Concept Detection

**Status:** ⚪ Not Started  
**Dependencies:** Task 1 (Text Extraction)  
**Duration:** 4-5 days

## Overview

Integrate OpenRouter for LLM-based concept detection, using modular prompts per index type with sliding window processing. Generate candidate index entries with confidence scores, cost estimation, and user controls.

This task is the core AI-powered feature that generates draft index entries from extracted text.

## Requirements

### 1. OpenRouter Integration

- [ ] Create OpenRouter API client
- [ ] Configure API key (environment variable)
- [ ] Support model selection (GPT-4, Claude 3.5 Sonnet, etc.)
- [ ] Implement rate limiting (respect OpenRouter limits)
- [ ] Error handling and retries
- [ ] Cost tracking per request

**Why OpenRouter for MVP?**
- Single API for multiple LLM providers
- Transparent pricing
- No vendor lock-in
- Easy to add more models later

### 2. Modular Prompt System

Design prompts as composable modules that can be combined when processing multiple index types simultaneously.

**Prompt Structure:**

```typescript
type PromptModule = {
  indexType: IndexType;
  systemPrompt: string;      // Role and general instructions
  detectionCriteria: string;  // What to look for
  examples: string;          // Few-shot examples
  outputFormat: string;      // JSON schema for suggestions
};
```

**Output Format (Pass 1 - Detection):**

```json
{
  "suggestions": [
    {
      "term": "string (the index term)",
      "pageNumbers": "array of integers (pages where term appears)"
    }
  ]
}
```

**Example Pass 1 Response:**

```json
{
  "suggestions": [
    {
      "term": "divine simplicity",
      "pageNumbers": [5, 12, 18, 23, 45, 67]
    },
    {
      "term": "modal realism",
      "pageNumbers": [23, 45, 67]
    },
    {
      "term": "free will",
      "pageNumbers": [8, 14, 22, 35, 41, 58, 62, 73, 89, 95]
    }
  ]
}
```

**Output Format (Pass 2 - Confidence Rating, Optional):**

```json
{
  "ratings": [
    {
      "term": "string (the index term from Pass 1)",
      "indexability": "number 0.0-1.0 (would a reader look this up?)",
      "specificity": "number 0.0-1.0 (concrete vs. generic?)",
      "overallConfidence": "number 0.0-1.0 (average of above 2)"
    }
  ]
}
```

**Example Pass 2 Response:**

```json
{
  "ratings": [
    {
      "term": "divine simplicity",
      "indexability": 0.90,
      "specificity": 0.85,
      "overallConfidence": 0.875
    },
    {
      "term": "modal realism",
      "indexability": 0.85,
      "specificity": 0.90,
      "overallConfidence": 0.875
    },
    {
      "term": "free will",
      "indexability": 0.95,
      "specificity": 0.88,
      "overallConfidence": 0.915
    }
  ]
}
```

**System Prompt (Shared Base):**
```
You are an expert indexer creating index entries for a scholarly publication.

The text includes page markers like "--- Page 5 ---" to indicate page boundaries.
For each suggested term, you MUST specify which page numbers it appears on.
Only include pages where the term actually appears (not the entire window range).

Example:
"--- Page 12 ---
The doctrine of divine simplicity...
--- Page 13 ---
...holds that God is not composed of parts."

→ Output: { "term": "divine simplicity", "pageNumbers": [12, 13] }

Do NOT include generic language, common verbs, or everyday words.
Focus on substantive terms a reader would look up.
```

**Per-Type Detection Criteria:**

**Subject Index:**
```
Identify KEY CONCEPTS, THEMES, and TECHNICAL TERMS discussed in the text.

INCLUDE:
- Specific concepts (e.g., "divine simplicity", "modal realism", "social contract")
- Technical terms (e.g., "transubstantiation", "soteriology", "epistemology")  
- Philosophical/theological/academic themes (e.g., "free will", "incarnation", "justice")
- Abstract ideas discussed substantively (e.g., "virtue", "causation", "identity")

EXCLUDE:
- Proper nouns (people, places, organizations) - these belong in other indexes
- Common verbs (do, have, make, get, see)
- Generic nouns (thing, person, way, time, book, chapter)
- Everyday adjectives (very, really, always, never, good, bad)
- Structural terms (introduction, conclusion, section, paragraph)

Focus on conceptual content that readers would look up to understand the subject matter.
```

**Author Index:**
```
Identify AUTHORS mentioned or discussed in the text.

INCLUDE:
- Proper names of authors, scholars, thinkers, writers
- Format: "LastName, FirstName" (e.g., "Aquinas, Thomas", "Plantinga, Alvin")
- Both cited sources and authors discussed as subjects
- Historical and contemporary figures whose work is relevant

EXCLUDE:
- Fictional characters
- Hypothetical persons used in examples
- The current book's author (unless they're citing themselves)
- Generic references to "the author" without a name

Look for: author names near scholarly discussion, citations, quotations, or intellectual engagement.
Names need not be formally cited - substantive mention is sufficient.
```

**Scripture Index:**
```
Identify BIBLICAL and SCRIPTURAL REFERENCES in standard citation format.

INCLUDE:
- Format: "Book Chapter:Verse" (e.g., "Genesis 1:1", "Matthew 5:3-10")
- Canonical books only (66 Protestant canon or expanded Catholic canon)
- Both explicit citations and clear allusions

EXCLUDE:
- Non-scriptural religious texts (unless enabled)
- Apocryphal works (unless enabled)
- Vague references without specific passage

Match standard abbreviations and full book names.
```

*Similar criteria for Person, Place, Organization, Event, Bibliography, Concept index types...*

**Combined Prompt (Multiple Index Types):**

When user runs detection for multiple index types at once:

```
You are generating candidate entries for THREE index types:

1. SUBJECT INDEX
{subject detection criteria}

2. AUTHOR INDEX  
{author detection criteria}

3. SCRIPTURE INDEX
{scripture detection criteria}

Process the text and return suggestions grouped by index type.
```

### 3. Sliding Window Processing

**Strategy:**
- Window size: 2000 tokens (~1500 words)
- Overlap: 500 tokens (25% overlap to avoid missing concepts at boundaries)
- Process sequentially (not parallel, to save costs)
- **Preserve page boundaries** with page markers

**Why Sliding Windows?**
- Fits within LLM context limits
- Maintains cross-page context (avoids missing multi-page concepts)
- Cheaper than full-document processing
- Allows progress tracking

**Critical: Page Boundary Preservation**

Each page's text is marked with page numbers so the LLM knows exactly where concepts appear:

```
--- Page 5 ---
[text from page 5]

--- Page 6 ---
[text from page 6]

--- Page 7 ---
[text from page 7]
```

**Example Window:**
```
--- Page 12 ---
The doctrine of divine simplicity holds that God is not composed of parts...

--- Page 13 ---
...but is utterly simple. This has profound implications for our understanding
of divine attributes. Critics of divine simplicity, such as Plantinga...

--- Page 14 ---
...argue that the doctrine is incoherent. However, defenders like Aquinas...
```

When the LLM suggests "divine simplicity", it outputs:
```json
{
  "term": "divine simplicity",
  "pageNumbers": [12, 13],  // Concept actually appears on pages 12-13, not 12-14
  "indexability": 0.9,
  "specificity": 0.85,
  "relevance": 0.9
}
```

**Implementation:**

```typescript
type TextWindow = {
  startPage: number;
  endPage: number;
  text: string;  // Includes page markers
  tokenCount: number;
  overlapWithPrevious: number; // tokens of overlap
  pageMap: Map<number, { startOffset: number; endOffset: number }>; // For verification
};

function createSlidingWindows({
  pages,
  windowSizeTokens = 2000,
  overlapTokens = 500,
}: {
  pages: Array<{ pageNumber: number; indexableText: string }>;
  windowSizeTokens?: number;
  overlapTokens?: number;
}): TextWindow[] {
  const windows: TextWindow[] = [];
  let currentWindowParts: Array<{ pageNumber: number; text: string }> = [];
  let currentTokens = 0;
  
  for (const page of pages) {
    // Add page marker + text
    const pageMarker = `\n--- Page ${page.pageNumber} ---\n`;
    const pageWithMarker = pageMarker + page.indexableText;
    const pageTokens = estimateTokens(pageWithMarker);
    
    if (currentTokens + pageTokens > windowSizeTokens && currentWindowParts.length > 0) {
      // Save current window
      const windowText = currentWindowParts
        .map(p => `\n--- Page ${p.pageNumber} ---\n${p.text}`)
        .join('\n');
      
      windows.push({
        startPage: currentWindowParts[0].pageNumber,
        endPage: currentWindowParts[currentWindowParts.length - 1].pageNumber,
        text: windowText,
        tokenCount: currentTokens,
        overlapWithPrevious: windows.length > 0 ? overlapTokens : 0,
        pageMap: buildPageMap(windowText, currentWindowParts),
      });
      
      // Start new window with overlap (keep last N tokens, which includes page markers)
      const overlapParts = getOverlapParts(currentWindowParts, overlapTokens);
      currentWindowParts = [...overlapParts, { pageNumber: page.pageNumber, text: page.indexableText }];
      currentTokens = estimateTokens(currentWindowParts.map(p => `\n--- Page ${p.pageNumber} ---\n${p.text}`).join('\n'));
    } else {
      currentWindowParts.push({ pageNumber: page.pageNumber, text: page.indexableText });
      currentTokens += pageTokens;
    }
  }
  
  // Save final window
  if (currentWindowParts.length > 0) {
    const windowText = currentWindowParts
      .map(p => `\n--- Page ${p.pageNumber} ---\n${p.text}`)
      .join('\n');
    
    windows.push({
      startPage: currentWindowParts[0].pageNumber,
      endPage: currentWindowParts[currentWindowParts.length - 1].pageNumber,
      text: windowText,
      tokenCount: currentTokens,
      overlapWithPrevious: windows.length > 0 ? overlapTokens : 0,
      pageMap: buildPageMap(windowText, currentWindowParts),
    });
  }
  
  return windows;
}

function buildPageMap(
  windowText: string,
  parts: Array<{ pageNumber: number; text: string }>
): Map<number, { startOffset: number; endOffset: number }> {
  const map = new Map();
  let offset = 0;
  
  for (const part of parts) {
    const marker = `\n--- Page ${part.pageNumber} ---\n`;
    const startOffset = windowText.indexOf(marker, offset) + marker.length;
    const endOffset = startOffset + part.text.length;
    
    map.set(part.pageNumber, { startOffset, endOffset });
    offset = endOffset;
  }
  
  return map;
}
```

**Prompt Instruction:**

Include in system prompt:

```
CRITICAL: For each suggested term, you MUST specify which page numbers it appears on.

The text includes page markers like "--- Page 5 ---". Use these to determine
the exact page number(s) where each concept appears.

If a concept appears on multiple pages, list all page numbers.

Example:
Text includes:
"--- Page 12 ---
The doctrine of divine simplicity...
--- Page 13 ---
...holds that God is not composed of parts."

Output:
{
  "term": "divine simplicity",
  "pageNumbers": [12, 13],  // Appears on both pages
  ...
}

Do NOT guess page numbers. Only include pages where the term actually appears.
```

### 4. Two-Pass Detection Strategy

**Problem with Confidence Scoring:**
- Confidence scoring (especially Relevance) requires full-text context
- For fragment-based processing (single page, chapter), LLM can't judge overall relevance
- Confidence scoring is expensive (adds complexity to prompt, increases output tokens)

**Solution: Optional Two-Pass Approach**

**Pass 1: Fast Detection (Required)**
```json
{
  "term": "divine simplicity",
  "pageNumbers": [12, 13]
}
```
- Just identify terms + page numbers
- No confidence scoring
- Fast and cheap
- User always runs this pass

**Pass 2: Confidence Rating (Optional)**
```json
{
  "term": "divine simplicity",
  "indexability": 0.90,
  "specificity": 0.85,
  "overallConfidence": 0.875  // Average of indexability + specificity
}
```
- User pays extra to rate suggestions
- Only sends list of terms (no full text) - much cheaper!
- Two dimensions: Indexability + Specificity (no Relevance)
- Helps user prioritize which suggestions to review first

**Pass 2 Prompt (Confidence Rating):**
```
You are rating index entry suggestions for quality.

For each term, rate on a 0-1 scale:
- Indexability: Would a reader look this up? (0 = no, 1 = definitely)
- Specificity: Is it concrete vs. generic? (0 = generic, 1 = specific concept)

Output format:
{
  "ratings": [
    { "term": "divine simplicity", "indexability": 0.90, "specificity": 0.85 },
    { "term": "free will", "indexability": 0.95, "specificity": 0.88 }
  ]
}

Terms to rate:
[list of 50-100 terms from detection pass]
```

**Why This Works:**
- Detection pass is fast (no extra scoring overhead)
- Confidence rating is optional (user controls cost)
- Rating is cheap (just term list, no full text)
- No Relevance needed (Indexability + Specificity sufficient for prioritization)
- Can rate 100 terms in single API call

**Layer 1: Post-Processing Filters (Application)**
```typescript
type VettingRules = {
  // Separate thresholds for each dimension
  minIndexability: number;        // Default: 0.6
  minSpecificity: number;         // Default: 0.6
  minRelevance: number;           // Default: 0.5
  minOverallConfidence: number;   // Default: 0.6 (avg of above 3)
  
  // Post-processing filters
  minLength: number;              // Default: 3 characters
  minOccurrences: number;         // Default: 2 times in document
  blocklist: string[];            // Common words to exclude
  requireCapitalization?: boolean; // For Author/Person indexes
  
  // User preference
  showLowConfidence: boolean;     // Show suggestions below thresholds
};

function applySuggestionFilters(
  suggestions: RawSuggestion[],
  rules: VettingRules,
  documentText: string
): FilteredSuggestion[] {
  return suggestions.filter(suggestion => {
    // Three-dimensional confidence thresholds
    if (suggestion.indexability < rules.minIndexability) return false;
    if (suggestion.specificity < rules.minSpecificity) return false;
    if (suggestion.relevance < rules.minRelevance) return false;
    if (suggestion.overallConfidence < rules.minOverallConfidence) return false;
    
    // Length check
    if (suggestion.term.length < rules.minLength) return false;
    
    // Occurrence count
    const occurrences = countOccurrences(documentText, suggestion.term);
    if (occurrences < rules.minOccurrences) return false;
    
    // Blocklist check
    if (rules.blocklist.includes(suggestion.term.toLowerCase())) return false;
    
    // Capitalization check (for proper nouns)
    if (rules.requireCapitalization && !/^[A-Z]/.test(suggestion.term)) {
      return false;
    }
    
    return true;
  });
}
```

**Layer 3: User Controls (Settings)**
- **Three separate threshold sliders**:
  - Indexability threshold (0.0 - 1.0, default: 0.6)
  - Specificity threshold (0.0 - 1.0, default: 0.6)
  - Relevance threshold (0.0 - 1.0, default: 0.5)
  - Overall minimum (calculated from averages)
- **Post-processing controls**:
  - Minimum word length (3 chars default)
  - Minimum occurrences (2 default, adjustable per index type)
  - Custom blocklist editor (textarea with comma-separated values)
  - "Use Default Blocklist" button to restore defaults
- **Visibility toggle**: "Show low-confidence suggestions" (overrides thresholds)

### 5. Cost Estimation & User Controls

**Detection Settings Modal (Step 1):**

```
┌─────────────────────────────────────────┐
│ Detection Settings                      │
│                                         │
│ Index Types to Detect:                  │
│ ☑ Subject Index                        │
│ ☑ Author Index                         │
│ ☐ Scripture Index (not configured)     │
│                                         │
│ LLM Model:                              │
│ [GPT-4 Turbo            ▼]             │
│                                         │
│ Post-Processing Filters:                │
│                                         │
│ Minimum word length: [3]                │
│                                         │
│ Minimum occurrences (per index type):   │
│ • Subject: [2] (can be 1+)             │
│ • Author: [1] (can be 1+)              │
│ • Scripture: [1] (can be 1+)           │
│                                         │
│ Blocklist (comma-separated):            │
│ [thing, person, chapter, very, ...]    │
│ [Use Default Blocklist]                 │
│                                         │
│ ☐ Also run confidence rating pass       │
│   (optional, adds extra cost)           │
│                                         │
│ [Cancel]                   [Next: Cost] │
└─────────────────────────────────────────┘
```

**Cost Estimation Modal (Step 2):**

```
┌─────────────────────────────────────────┐
│ Start Concept Detection                 │
│                                         │
│ Index Types: Subject, Author            │
│ Model: GPT-4 Turbo                      │
│                                         │
│ Document: 200 pages                     │
│ Indexable text: ~45,000 words          │
│                                         │
│ Pass 1: Detection (Required)            │
│ • Input tokens: ~60,000                │
│ • Output tokens: ~3,000 (est.)         │
│ • Cost: $0.90 - $1.10                  │
│                                         │
│ ☑ Pass 2: Confidence Rating (Optional) │
│ • Input tokens: ~1,000 (term list)     │
│ • Output tokens: ~500 (ratings)        │
│ • Additional cost: $0.05 - $0.10       │
│                                         │
│ Total Estimated Cost: $0.95 - $1.20    │
│                                         │
│ Post-Processing Filters:                │
│ • Min occurrences: 2 (Subject), 1 (Author)│
│ • Min length: 3 chars                  │
│ • Blocklist: 127 common words          │
│                                         │
│ ☐ Don't show this warning again        │
│                                         │
│ [Back: Settings]       [Start Detection]│
└─────────────────────────────────────────┘
```

**If confidence rating is enabled, show:**
```
┌─────────────────────────────────────────┐
│ Confidence Rating Complete              │
│                                         │
│ 234 suggestions detected                │
│ 189 rated (Pass 2 complete)            │
│                                         │
│ Filter by confidence:                   │
│                                         │
│ Indexability: 0.6+                      │
│ ├────────●──────────────┤               │
│ 0.0     0.6           1.0               │
│                                         │
│ Specificity: 0.6+                       │
│ ├────────●──────────────┤               │
│ 0.0     0.6           1.0               │
│                                         │
│ ☐ Hide unrated suggestions              │
│   (45 suggestions not rated)            │
│                                         │
│ [Apply Filters]                         │
└─────────────────────────────────────────┘
```

**Cost Calculation:**

```typescript
type CostEstimate = {
  inputTokens: number;
  outputTokensEstimate: number;
  model: string;
  costUSD: { min: number; max: number };
};

function estimateCost({
  indexableText,
  indexTypes,
  model,
}: {
  indexableText: string;
  indexTypes: IndexType[];
  model: string;
}): CostEstimate {
  // Estimate input tokens (text + prompt)
  const textTokens = estimateTokens(indexableText);
  const promptTokens = estimatePromptTokens(indexTypes);
  const inputTokens = textTokens + promptTokens;
  
  // Estimate output tokens (5-10 suggestions per window, 50 tokens each)
  const windowCount = Math.ceil(textTokens / 1500); // Sliding windows
  const outputTokensEstimate = windowCount * 8 * 50; // 8 suggestions/window avg
  
  // Lookup pricing for model
  const pricing = getModelPricing(model); // e.g., GPT-4: $10/1M input, $30/1M output
  
  const costMin = (inputTokens * pricing.inputCostPer1M / 1_000_000) +
                  (outputTokensEstimate * 0.8 * pricing.outputCostPer1M / 1_000_000);
  const costMax = (inputTokens * pricing.inputCostPer1M / 1_000_000) +
                  (outputTokensEstimate * 1.2 * pricing.outputCostPer1M / 1_000_000);
  
  return {
    inputTokens,
    outputTokensEstimate,
    model,
    costUSD: { min: costMin, max: costMax },
  };
}
```

**Tracking Actual Costs:**

Store actual costs in database:

```typescript
type DetectionJob = {
  id: string;
  projectId: string;
  indexTypes: IndexType[];
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt: Date;
  completedAt?: Date;
  windowsTotal: number;
  windowsProcessed: number;
  suggestionsGenerated: number;
  suggestionsAccepted: number;
  actualCostUSD: number;
  model: string;
  metadata: {
    inputTokens: number;
    outputTokens: number;
    averageConfidence: number;
  };
};
```

### 6. API Endpoints

**tRPC Router: `conceptDetection`**

```typescript
conceptDetection: {
  estimateCost: // Get cost estimate before starting (Pass 1 + optional Pass 2)
  startDetection: // Initiate detection job (Pass 1)
  getDetectionStatus: // Poll job progress
  pauseDetection: // Pause ongoing job
  resumeDetection: // Resume paused job
  cancelDetection: // Cancel and clean up
  
  // Pass 2 (optional confidence rating)
  startConfidenceRating: // Rate existing suggestions (Pass 2)
  getConfidenceRatingStatus: // Poll rating progress
}
```

**Key Endpoint: `startDetection`**

```typescript
startDetection: protectedProcedure
  .input(z.object({
    projectId: z.string().uuid(),
    documentId: z.string().uuid(),
    indexTypes: z.array(indexTypeEnum),
    settings: z.object({
      model: z.string().default('openai/gpt-4-turbo'),
      confidenceThreshold: z.number().min(0).max(1).default(0.6),
      minOccurrences: z.number().min(1).default(2),
    }).optional(),
  }))
  .mutation(async ({ input, ctx }) => {
    // 1. Verify text extraction is complete
    const document = await ctx.db.query.sourceDocuments.findFirst({
      where: eq(sourceDocuments.id, input.documentId),
    });
    
    if (document.extractionStatus !== 'completed') {
      throw new TRPCError({
        code: 'PRECONDITION_FAILED',
        message: 'Text extraction must be completed first',
      });
    }
    
    // 2. Fetch indexable text from document_pages
    const pages = await ctx.db.query.documentPages.findMany({
      where: eq(documentPages.documentId, input.documentId),
      orderBy: asc(documentPages.pageNumber),
    });
    
    // 3. Create sliding windows
    const windows = createSlidingWindows({
      pages: pages.map(p => ({
        pageNumber: p.pageNumber,
        indexableText: p.indexableText,
      })),
    });
    
    // 4. Create detection job
    const job = await ctx.db.insert(detectionJobs).values({
      projectId: input.projectId,
      documentId: input.documentId,
      indexTypes: input.indexTypes,
      status: 'pending',
      windowsTotal: windows.length,
      windowsProcessed: 0,
      model: input.settings?.model ?? 'openai/gpt-4-turbo',
      settings: input.settings,
    }).returning();
    
    // 5. Enqueue processing job
    await enqueueDetectionJob({
      jobId: job.id,
      windows,
      indexTypes: input.indexTypes,
      settings: input.settings,
    });
    
    logEvent({
      event: 'concept_detection.started',
      context: {
        requestId: ctx.requestId,
        userId: ctx.userId,
        projectId: input.projectId,
        documentId: input.documentId,
        indexTypes: input.indexTypes,
        metadata: {
          windowsTotal: windows.length,
          model: input.settings?.model,
        },
      },
    });
    
    return { jobId: job.id };
  }),
```

## Processing Pipeline

### Pass 1: Detection (Required)

**Step-by-Step Flow:**

1. **Fetch Extracted Text** (from Task 1)
   - Get all document_pages.indexableText
   - Order by page number

2. **Create Sliding Windows**
   - 2000 token windows with 500 token overlap
   - Add page markers: `--- Page N ---`
   - Track page ranges for each window

3. **Build Prompts** (Pass 1 - Detection Only)
   - Combine system prompt + detection criteria for selected index types
   - Include few-shot examples
   - Specify JSON output format (term + pageNumbers only)
   - **No confidence scoring instructions**

4. **Process Windows Sequentially**
   - For each window:
     - Call OpenRouter API with prompt + window text
     - Parse JSON response (array of {term, pageNumbers})
     - Store raw suggestions in database (confidence fields = null)

5. **Apply Post-Processing Filters**
   - Filter by min length, occurrences, blocklist
   - Deduplicate across windows (merge overlapping suggestions)
   - **No confidence filtering** (no scores yet)

6. **Store Suggestions**
   - Insert into `index_entry_suggestions` table
   - Set indexability, specificity, overallConfidence to NULL
   - Link to pages where term appeared

7. **Update Job Status**
   - Mark Pass 1 as completed
   - Calculate actual cost
   - Generate summary statistics

**Pass 1 Output:**
```
234 suggestions detected
Cost: $0.95
Time: 8 minutes
```

### Pass 2: Confidence Rating (Optional)

**User decides:** "I want to prioritize review. Let's rate these suggestions."

**Step-by-Step Flow:**

1. **Fetch Unrated Suggestions**
   - Query suggestions where `overallConfidence IS NULL`
   - Extract just the terms (not full text)

2. **Build Rating Prompt** (Pass 2 - Confidence Only)
   - Send list of 50-100 terms at a time
   - Ask LLM to rate Indexability + Specificity
   - Much smaller prompt (no full text context)

3. **Process in Batches**
   - Batch size: 100 terms per API call
   - For 234 suggestions: 3 batches
   - Each batch returns ratings for all terms

4. **Update Suggestions**
   - For each rated term:
     - Update indexability, specificity, overallConfidence
     - Set ratedAt timestamp

5. **Update Job Status**
   - Mark Pass 2 as completed
   - Calculate additional cost
   - Show rating statistics

**Pass 2 Output:**
```
189 suggestions rated (45 skipped due to filtering)
Additional cost: $0.08
Time: 2 minutes
Total cost: $1.03
```

**Now user can filter by confidence:**
```
Indexability >= 0.7: 142 suggestions
Specificity >= 0.7: 156 suggestions
Overall >= 0.7: 134 suggestions
```

## Database Schema

**DetectionJob Table (new):**
```typescript
export const detectionJobs = pgTable("detection_jobs", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .references(() => projects.id, { onDelete: "cascade" })
    .notNull(),
  documentId: uuid("document_id")
    .references(() => sourceDocuments.id, { onDelete: "cascade" })
    .notNull(),
  indexTypes: indexTypeEnum("index_types").array().notNull(),
  status: detectionStatusEnum("status").default("pending").notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  windowsTotal: integer("windows_total").notNull(),
  windowsProcessed: integer("windows_processed").default(0).notNull(),
  suggestionsGenerated: integer("suggestions_generated").default(0).notNull(),
  actualCostUSD: numeric("actual_cost_usd", { precision: 10, scale: 4 }),
  model: text("model").notNull(),
  settings: json("settings"), // Detection settings snapshot
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
```

**IndexEntrySuggestion Table (new):**
```typescript
export const indexEntrySuggestions = pgTable("index_entry_suggestions", {
  id: uuid("id").primaryKey().defaultRandom(),
  detectionJobId: uuid("detection_job_id")
    .references(() => detectionJobs.id, { onDelete: "cascade" })
    .notNull(),
  projectId: uuid("project_id")
    .references(() => projects.id, { onDelete: "cascade" })
    .notNull(),
  projectIndexTypeId: uuid("project_index_type_id")
    .references(() => projectIndexTypes.id, { onDelete: "cascade" })
    .notNull(),
  term: text("term").notNull(), // The suggested index term
  
  // Two-dimensional confidence scores (OPTIONAL - only if Pass 2 was run)
  indexability: numeric("indexability", { precision: 3, scale: 2 }), // 0.00 - 1.00 (nullable)
  specificity: numeric("specificity", { precision: 3, scale: 2 }), // 0.00 - 1.00 (nullable)
  overallConfidence: numeric("overall_confidence", { precision: 3, scale: 2 }), // Average of above 2 (nullable)
  
  occurrences: integer("occurrences").notNull(), // Count in document (post-processing verification)
  firstSeenPage: integer("first_seen_page"),
  pageNumbers: integer("page_numbers").array(), // All pages where term appears (from LLM Pass 1)
  
  status: suggestionStatusEnum("status").default("pending").notNull(), // pending, accepted, rejected
  acceptedAsEntryId: uuid("accepted_as_entry_id")
    .references(() => indexEntries.id, { onDelete: "set null" }),
  
  metadata: json("metadata"), // Additional metadata (window IDs, raw LLM response, etc.)
  
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  ratedAt: timestamp("rated_at", { withTimezone: true }), // When confidence rating (Pass 2) was done
});
```

**Indexes for filtering:**
```typescript
// Index for confidence filtering queries (only used if Pass 2 was run)
index("idx_suggestions_confidence").on(
  indexEntrySuggestions.overallConfidence,
  indexEntrySuggestions.indexability,
  indexEntrySuggestions.specificity
),

// Index for project + status queries
index("idx_suggestions_project_status").on(
  indexEntrySuggestions.projectId,
  indexEntrySuggestions.status
),

// Index for unrated suggestions (Pass 2 not run)
index("idx_suggestions_unrated").on(
  indexEntrySuggestions.projectId,
  indexEntrySuggestions.ratedAt
),
```

**Enums:**
```sql
CREATE TYPE detection_status AS ENUM('pending', 'running', 'paused', 'completed', 'failed', 'cancelled');
CREATE TYPE suggestion_status AS ENUM('pending', 'accepted', 'rejected');
```

## Frontend Integration

### Project Settings - Concept Detection Panel

```
┌─────────────────────────────────────────┐
│ Concept Detection                       │
│                                         │
│ Status: ✅ Completed                    │
│ Last run: 3 hours ago                   │
│ Model: GPT-4 Turbo                      │
│ Cost: $1.32                             │
│                                         │
│ Suggestions generated: 234              │
│ • Subject: 156 suggestions              │
│ • Author: 48 suggestions                │
│ • Scripture: 30 suggestions             │
│                                         │
│ Accepted: 89 entries                    │
│ Pending review: 145 suggestions         │
│                                         │
│ [Run Detection Again]                   │
└─────────────────────────────────────────┘
```

### Detection Settings Modal

```
┌─────────────────────────────────────────┐
│ Detection Settings                      │
│                                         │
│ Index Types to Detect:                  │
│ ☑ Subject Index                        │
│ ☑ Author Index                         │
│ ☐ Scripture Index (not configured)     │
│                                         │
│ LLM Model:                              │
│ [GPT-4 Turbo            ▼]             │
│                                         │
│ Confidence Threshold: 0.6               │
│ ├────────●──────────────┤               │
│ 0.0     0.6           1.0               │
│                                         │
│ Minimum Occurrences: [2]                │
│                                         │
│ ☐ Show low-confidence suggestions       │
│                                         │
│ [Cancel]                   [Next: Cost] │
└─────────────────────────────────────────┘
```

## Testing Requirements

### Backend Tests

- [ ] **Unit: OpenRouter client**
  - Makes correct API calls
  - Parses JSON responses
  - Handles errors and retries

- [ ] **Unit: Sliding window creation**
  - Creates correct window sizes
  - Overlap calculation correct
  - Page ranges tracked accurately

- [ ] **Unit: Prompt building**
  - Combines modules correctly
  - Includes all detection criteria
  - Valid JSON schema

- [ ] **Unit: Post-processing filters**
  - Confidence threshold filtering
  - Blocklist exclusions
  - Occurrence counting

- [ ] **Integration: Full detection pipeline**
  - End-to-end from text to suggestions
  - Stores suggestions correctly
  - Tracks costs accurately
  - Updates job status

### Frontend Tests

- [ ] **Interaction: Detection flow**
  - Settings modal opens
  - Cost estimate displays
  - Starts detection job
  - Progress updates
  - Shows completion

## Success Criteria

- [x] OpenRouter API integrated
- [x] Modular prompts for each index type
- [x] Sliding window processing works
- [x] Confidence scores filter suggestions
- [x] Cost estimation accurate (within 20%)
- [x] User can control detection settings
- [x] Detection completes in < 10min for 200-page book
- [x] Suggestions stored with metadata
- [x] Actual costs tracked

## Next Task

[Task 3: Suggestion Management UI](./task-3-suggestion-management.md) provides the two-column interface for reviewing and accepting suggestions.

## Notes

**Model Selection (MVP):**
- Default: GPT-4 Turbo (best accuracy, reasonable cost)
- Alternative: Claude 3.5 Sonnet (similar quality, different strengths)
- Future: Fine-tuned models for indexing

**Deduplication Strategy:**
- Suggestions from overlapping windows may include same term
- Merge duplicates: keep highest confidence score
- Combine page numbers from all occurrences

**Pause/Resume Support:**
- User can pause long-running jobs
- Resume from last processed window
- Useful for very large documents (500+ pages)

**Error Handling:**
- Retry failed windows (up to 3 attempts)
- Skip window if still failing (log error)
- Continue processing remaining windows
- Show partial results even if some windows fail
