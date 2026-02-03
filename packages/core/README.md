# @pubint/core

Shared core library for common types and utilities used across the publication-intelligence monorepo.

## Contents

**Types:**
- `Document` - Base document type with id, title, content, and optional metadata
- `DocumentPage` - Document page type with page number, content, and optional metadata

**Utilities:**
- `createDocument()` - Factory function for creating document objects

## Usage

```typescript
import { Document, createDocument } from '@pubint/core';

const doc: Document = createDocument({
  id: '123',
  title: 'My Document',
  content: 'Document content',
  metadata: { author: 'John Doe' }
});
```

## Purpose

Serves as a foundation package for shared domain models and utilities that multiple packages/apps need to reference, preventing code duplication and ensuring consistent type definitions across the codebase.
