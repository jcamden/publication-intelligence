# SourceDocument Module

MVP implementation of PDF ingestion pipeline.

## Architecture

```
Client (Frontend)
    ↓ (multipart/form-data)
HTTP Route (upload.routes.ts)
    ↓
Service Layer (sourceDocument.service.ts)
    ├─→ Project validation
    ├─→ PDF validation (pdf-utils.ts)
    ├─→ File hash computation
    ├─→ Storage Service (local-file-storage.ts)
    └─→ Repository Layer (sourceDocument.repo.ts)
        └─→ Gel Database
```

## API Endpoints

### Upload PDF (HTTP Multipart)

```
POST /projects/:projectId/source-documents/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

Fields:
- file: PDF file (required)
- title: Document title (optional, defaults to filename)
```

**Example using curl:**

```bash
curl -X POST \
  http://localhost:3001/projects/{projectId}/source-documents/upload \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -F "file=@/path/to/document.pdf" \
  -F "title=My Document Title"
```

**Example using JavaScript:**

```javascript
const formData = new FormData();
formData.append('file', pdfFile);
formData.append('title', 'My Document Title');

const response = await fetch(
  `http://localhost:3001/projects/${projectId}/source-documents/upload`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authToken}`
    },
    body: formData
  }
);

const document = await response.json();
```

### List Documents (tRPC)

```typescript
const documents = await trpc.sourceDocument.listByProject.query({
  projectId: 'uuid'
});
```

### Get Document (tRPC)

```typescript
const document = await trpc.sourceDocument.getById.query({
  id: 'uuid'
});
```

### Delete Document (tRPC)

```typescript
await trpc.sourceDocument.delete.mutate({
  id: 'uuid'
});
```

## Storage

**MVP:** Local filesystem storage
- Location: `apps/index-pdf-backend/.data/source-documents/`
- Files are named with UUID + extension (e.g., `abc-123.pdf`)
- Ignored by git

**Future:** Cloud storage (S3/GCS/Azure Blob)
- StorageService interface allows drop-in replacement
- No domain logic changes required

## Events Emitted

- `source_document.uploaded` - Document successfully uploaded
- `source_document.upload_failed` - Upload validation failed
- `source_document.retrieved` - Document retrieved
- `source_document.list_requested` - List operation
- `source_document.deleted` - Document soft-deleted

## Gel Schema

```
type SourceDocument {
  project: Project
  title: str
  file_name: str
  file_size: int64
  content_hash: str (SHA-256)
  page_count: int32
  status: SourceDocumentStatus (uploaded|processing|processed|failed)
  storage_key: str
  created_at: datetime
  processed_at: datetime
  deleted_at: datetime
}
```

## Validation

- MIME type must be `application/pdf`
- File must start with PDF magic bytes (`%PDF`)
- Maximum file size: 100MB (configurable in server.ts)

## Future Enhancements

NOT implemented in MVP:

- [ ] Text extraction (pdf-parse or pdf.js)
- [ ] DocumentPage creation
- [ ] Page count extraction
- [ ] Background job processing
- [ ] Cloud storage integration
- [ ] LLM processing pipeline
- [ ] IndexMention extraction
