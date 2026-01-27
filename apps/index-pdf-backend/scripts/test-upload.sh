#!/bin/bash
set -e

# Quick test script for PDF upload functionality
# Run from apps/index-pdf-backend directory

echo "🧪 Testing PDF Upload Pipeline"
echo "================================"
echo ""

# Check if server is running
if ! curl -s http://localhost:3001/health > /dev/null; then
    echo "❌ Server is not running!"
    echo "Start it with: pnpm dev"
    exit 1
fi

echo "✅ Server is running"
echo ""

# Create a minimal test PDF
TEST_PDF="test-upload.pdf"
cat > "$TEST_PDF" << 'EOF'
%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>
endobj
4 0 obj
<< /Length 44 >>
stream
BT
/F1 12 Tf
100 700 Td
(Test PDF Upload) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000247 00000 n 
trailer
<< /Size 5 /Root 1 0 R >>
startxref
340
%%EOF
EOF

echo "✅ Created test PDF: $TEST_PDF"
echo ""

# Check if we have auth token
if [ -z "$AUTH_TOKEN" ]; then
    echo "⚠️  No AUTH_TOKEN environment variable set"
    echo ""
    echo "To test the upload endpoint, you need:"
    echo "1. A valid auth token"
    echo "2. A project ID"
    echo ""
    echo "Steps:"
    echo "  1. Register/login to get a token"
    echo "  2. Create a project and note its ID"
    echo "  3. Set environment variables:"
    echo ""
    echo "     export AUTH_TOKEN='your_token_here'"
    echo "     export PROJECT_ID='your_project_id'"
    echo ""
    echo "  4. Run this script again"
    echo ""
    echo "Or run the integration tests instead:"
    echo "  pnpm test"
    exit 0
fi

if [ -z "$PROJECT_ID" ]; then
    echo "❌ No PROJECT_ID environment variable set"
    echo "Create a project first and export PROJECT_ID"
    exit 1
fi

echo "🚀 Uploading PDF..."
echo ""

RESPONSE=$(curl -s -X POST \
    "http://localhost:3001/projects/$PROJECT_ID/source-documents/upload" \
    -H "Authorization: Bearer $AUTH_TOKEN" \
    -F "file=@$TEST_PDF" \
    -F "title=Test Upload Script")

# Check if upload succeeded
if echo "$RESPONSE" | grep -q '"id"'; then
    echo "✅ Upload successful!"
    echo ""
    echo "Response:"
    echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
    
    # Extract document ID
    DOC_ID=$(echo "$RESPONSE" | jq -r '.id' 2>/dev/null)
    
    if [ -n "$DOC_ID" ] && [ "$DOC_ID" != "null" ]; then
        echo ""
        echo "📋 Document ID: $DOC_ID"
        
        # Test listing
        echo ""
        echo "📝 Listing documents in project..."
        curl -s "http://localhost:3001/trpc/sourceDocument.listByProject?input=%7B%22projectId%22%3A%22$PROJECT_ID%22%7D" \
            -H "Authorization: Bearer $AUTH_TOKEN" | jq '.' 2>/dev/null || echo "OK"
        
        # Check storage
        echo ""
        echo "💾 Checking local storage..."
        if [ -d ".data/source-documents" ]; then
            FILE_COUNT=$(ls -1 .data/source-documents | wc -l | tr -d ' ')
            echo "✅ Found $FILE_COUNT file(s) in storage"
            ls -lh .data/source-documents
        else
            echo "⚠️  Storage directory not found"
        fi
    fi
else
    echo "❌ Upload failed!"
    echo ""
    echo "Response:"
    echo "$RESPONSE"
fi

# Cleanup
rm -f "$TEST_PDF"
echo ""
echo "🧹 Cleaned up test PDF"
