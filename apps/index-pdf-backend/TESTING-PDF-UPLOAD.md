# Testing PDF Upload Pipeline

## Quick Start (Recommended)

The **fastest and most reliable** way to test:

```bash
cd apps/index-pdf-backend

# Run all tests (service + integration + storage)
pnpm test

# Or run specific test suites
pnpm vitest src/modules/source-document/sourceDocument.service.test.ts
pnpm vitest src/modules/source-document/sourceDocument.integration.test.ts
pnpm vitest src/infrastructure/storage/storage.test.ts
```

Tests automatically:
- ✅ Reset the test database (no manual migration needed)
- ✅ Test PDF validation and upload logic
- ✅ Test HTTP multipart endpoint
- ✅ Test storage operations (save/get/delete)
- ✅ Test access control
- ✅ Clean up after themselves

## Test Coverage

The vitest suite tests:

### Service Layer Tests (`sourceDocument.service.test.ts`)
- Upload valid PDF documents
- Reject invalid files (wrong MIME type, missing magic bytes)
- Compute and store SHA-256 file hashes
- Emit domain events
- List/get/delete documents
- Access control validation

### HTTP Integration Tests (`sourceDocument.integration.test.ts`)
- Upload PDF via multipart/form-data
- Authentication requirements
- tRPC endpoints (list, get, delete)
- Cross-user authorization

### Storage Tests (`storage.test.ts`)
- Save files with UUID keys
- Retrieve files by storage key
- Check file existence
- Delete files gracefully

## Prerequisites (Manual Testing Only)

If you want to test manually with curl/Postman:

1. **Apply Gel Migration**

```bash
cd db/gel
edgedb migration create
edgedb migrate
```

2. **Start the Backend Server**

```bash
cd apps/index-pdf-backend
pnpm dev
```

The server should start on `http://localhost:3001`

## Option 1: Automated Integration Tests (Vitest)

Run the test suite:

```bash
cd apps/index-pdf-backend
pnpm test
```

This will:
- Reset the test database
- Run all integration tests including SourceDocument tests
- Test storage service, upload validation, and access control

## Option 2: Manual Testing with curl

### Step 1: Register a Test User

```bash
# Set your auth URL (adjust branch if needed)
export GEL_AUTH_URL="http://localhost:10702/db/main/ext/auth"

# Generate PKCE challenge
export CODE_VERIFIER=$(openssl rand -base64 32 | tr -d '=+/' | cut -c1-43)
export CODE_CHALLENGE=$(echo -n $CODE_VERIFIER | openssl dgst -binary -sha256 | openssl base64 | tr -d '=+/' | tr '/+' '_-')

# Register user
curl -X POST "$GEL_AUTH_URL/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"provider\": \"builtin::local_emailpassword\",
    \"email\": \"test@example.com\",
    \"password\": \"SecurePassword123!\",
    \"challenge\": \"$CODE_CHALLENGE\",
    \"verify_url\": \"http://localhost:3000/auth/verify\"
  }"

# This returns a code, extract it and exchange for token
# (Or use the auth endpoints in your backend)
```

### Step 2: Get Auth Token

If you already have a user, authenticate:

```bash
curl -X POST "http://localhost:3001/trpc/auth.login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePassword123!"
  }'
```

Save the `auth_token` from the response.

### Step 3: Create a Project

```bash
export AUTH_TOKEN="your_token_here"

curl -X POST "http://localhost:3001/trpc/project.create" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d '{
    "title": "My Test Project",
    "description": "Testing PDF uploads"
  }'
```

Save the `project.id` from the response.

### Step 4: Create a Test PDF

```bash
# Create a minimal valid PDF for testing
cat > test-document.pdf << 'EOF'
%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/Font <<
/F1 <<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
>>
>>
>>
endobj
4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
100 700 Td
(Test PDF) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000317 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
410
%%EOF
EOF
```

### Step 5: Upload the PDF

```bash
export PROJECT_ID="your_project_id_here"

curl -X POST "http://localhost:3001/projects/$PROJECT_ID/source-documents/upload" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -F "file=@test-document.pdf" \
  -F "title=My First Document"
```

**Success Response:**

```json
{
  "id": "uuid-here",
  "project": { "id": "project-uuid" },
  "title": "My First Document",
  "file_name": "test-document.pdf",
  "file_size": 410,
  "content_hash": "sha256-hash-here",
  "page_count": null,
  "status": "uploaded",
  "storage_key": "uuid-generated.pdf",
  "created_at": "2026-01-27T01:23:45.678Z",
  "processed_at": null,
  "deleted_at": null,
  "is_deleted": false
}
```

### Step 6: Verify Upload

List documents in project:

```bash
curl "http://localhost:3001/trpc/sourceDocument.listByProject?input={\"projectId\":\"$PROJECT_ID\"}" \
  -H "Authorization: Bearer $AUTH_TOKEN"
```

Get specific document:

```bash
export DOC_ID="document_uuid_from_upload"

curl "http://localhost:3001/trpc/sourceDocument.getById?input={\"id\":\"$DOC_ID\"}" \
  -H "Authorization: Bearer $AUTH_TOKEN"
```

### Step 7: Verify Storage

Check that the file was saved:

```bash
ls -lh apps/index-pdf-backend/.data/source-documents/
```

You should see a file with a UUID name (e.g., `abc-123-def.pdf`)

### Step 8: Test Validation

Try uploading a non-PDF file (should fail):

```bash
echo "Not a PDF" > fake.pdf

curl -X POST "http://localhost:3001/projects/$PROJECT_ID/source-documents/upload" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -F "file=@fake.pdf" \
  -F "title=Should Fail"
```

**Expected Error:**

```json
{
  "error": "Invalid PDF file format. File does not start with PDF magic bytes"
}
```

## Option 3: Test with JavaScript/Node

Create a test script:

```javascript
// test-upload.js
const fs = require('fs');
const FormData = require('form-data');
const fetch = require('node-fetch');

const AUTH_TOKEN = 'your_token_here';
const PROJECT_ID = 'your_project_id';
const API_URL = 'http://localhost:3001';

async function testUpload() {
  const form = new FormData();
  form.append('file', fs.createReadStream('./test-document.pdf'));
  form.append('title', 'Uploaded via Node.js');
  
  const response = await fetch(
    `${API_URL}/projects/${PROJECT_ID}/source-documents/upload`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        ...form.getHeaders()
      },
      body: form
    }
  );
  
  const result = await response.json();
  console.log('Upload result:', result);
  
  // List documents
  const listResponse = await fetch(
    `${API_URL}/trpc/sourceDocument.listByProject?input=${encodeURIComponent(JSON.stringify({ projectId: PROJECT_ID }))}`,
    {
      headers: { 'Authorization': `Bearer ${AUTH_TOKEN}` }
    }
  );
  
  const documents = await listResponse.json();
  console.log('Documents:', documents);
}

testUpload().catch(console.error);
```

Run it:

```bash
node test-upload.js
```

## Troubleshooting

### Server won't start
- Check that Gel is running: `edgedb instance status`
- Check `.env` file has correct `GEL_DSN`
- Check port 3001 is not in use

### Upload returns 401 Unauthorized
- Token may be expired, get a fresh one
- Check Authorization header format: `Bearer <token>`

### Upload returns 404 Not Found (project)
- Verify project ID is correct
- Check that user owns or has access to the project

### File validation fails
- Check file is actually a PDF (starts with `%PDF`)
- Try with the minimal test PDF above

### Can't find uploaded file
- Check `.data/source-documents/` directory exists
- Check file permissions

## Verify Events Were Logged

Check application logs for events:

```bash
# Look for log entries with these event types:
# - source_document.uploaded
# - source_document.retrieved
# - source_document.list_requested
```

Check Gel Event table:

```bash
edgedb query "
  SELECT Event {
    entity_type,
    action,
    metadata,
    created_at
  }
  FILTER .entity_type = EntityType.SourceDocument
  ORDER BY .created_at DESC
  LIMIT 10
"
```

## Next Steps After Testing

Once upload works:

1. **Add text extraction**: Integrate pdf-parse or pdf.js
2. **Create DocumentPage records**: Split PDF into pages
3. **Extract page count**: Use PDF library to get page count
4. **Add background processing**: Move heavy work to job queue
5. **Migrate to cloud storage**: Replace LocalFileStorage with S3Storage
