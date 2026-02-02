# Epic 5: Infrastructure

## Goal

Core services and schemas that enable all other features.

## Status

Partially complete - auth and projects done, document upload in progress.

## Tasks

### ✅ Task 1: Authentication ([COMPLETE])
Gel auth with email/password, JWT tokens, protected routes.

### ✅ Task 2: Project CRUD ([COMPLETE])
Create, read, update, delete projects with ownership.

### 🟡 Task 3: Document Upload ([task-3-document-upload.md](./task-3-document-upload.md))
**Status:** In Progress  
**Duration:** 2-3 days

Upload PDFs, store in filesystem, link to projects.

**Current State:**
- Basic upload endpoint exists
- Missing: File validation, storage organization
- Missing: Progress tracking for large files

**Deliverables:**
- [ ] Multipart upload with progress
- [ ] PDF validation (magic bytes)
- [ ] Storage key generation (UUID-based)
- [ ] File size limits (100MB?)
- [ ] Cleanup on project delete

### ⚪ Task 4: Schema Finalization ([task-4-schema-finalization.md](./task-4-schema-finalization.md))
**Status:** Not Started  
**Duration:** 2-3 days

Complete Gel schema for MVP features.

**Missing Schemas:**
- DocumentPage (text, dimensions, rotation)
- TextAtom (word-level bboxes)
- IndexEntry (label, hierarchy, metadata)
- IndexMention (bbox, page, entry link)

**Deliverables:**
- [ ] All schemas defined
- [ ] Migrations generated
- [ ] Access policies configured
- [ ] Type generation for frontend

## Success Criteria

- ✅ Auth working (login, signup, protected routes)
- ✅ Projects CRUD functional
- ✅ PDF upload with validation
- ✅ All MVP schemas in Gel
- ✅ Frontend types auto-generated
- ✅ Access policies enforced

## Technical Notes

- Use Gel branches for test isolation (already working)
- Store files outside Gel (filesystem or S3)
- Use UUIDs for all entities
- Soft deletes for user data
