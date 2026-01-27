# Index PDF Extractor

Canonical PDF text extraction service for the Index PDF platform using PyMuPDF.

## Purpose

This service provides the foundational layer for extracting text from PDF documents with high fidelity. It serves as the authoritative text extraction engine that powers the Index PDF platform's document processing pipeline.

**Key responsibilities:**

- Extract full-page text from PDFs
- Extract span-level text with precise bounding box coordinates
- Normalize text for consistent indexing and search
- Provide deterministic, reliable extraction results

This is a standalone Python service designed to be deployed independently (eventually via Google Cloud Run) and called by the backend when PDF text extraction is needed.

## Requirements

- Python 3.11 or higher
- PyMuPDF (fitz)

## Installation

1. Navigate to the extractor directory:

```bash
cd apps/index-pdf-extractor
```

2. Create and activate a virtual environment:

```bash
python3.11 -m venv venv
source venv/bin/activate
```

3. Install dependencies:

```bash
pip install --upgrade pip
pip install -e .
```

This installs PyMuPDF and makes the extractor available for import.

## Usage

**Note**: Make sure your virtual environment is activated before running commands:

```bash
source venv/bin/activate
```

### Command Line

Extract text from a PDF and output JSON to stdout:

```bash
python extract_pdf.py /path/to/document.pdf
```

Output format:

```json
{
  "pages": [
    {
      "page_number": 1,
      "text": "...full page text...",
      "spans": [
        {
          "text": "...span text...",
          "normalized_text": "...normalized...",
          "bbox": {
            "x": 50.0,
            "y": 100.0,
            "width": 120.5,
            "height": 14.2
          }
        }
      ]
    }
  ]
}
```

### Programmatic Usage

```python
from extract_pdf import extract_pdf, normalize_text

# Extract PDF
result = extract_pdf("/path/to/document.pdf")

# Access pages
for page in result["pages"]:
    print(f"Page {page['page_number']}")
    print(f"Full text: {page['text'][:100]}...")
    
    # Access spans
    for span in page["spans"]:
        print(f"  Span: {span['text']}")
        print(f"  Normalized: {span['normalized_text']}")
        print(f"  Position: x={span['bbox']['x']}, y={span['bbox']['y']}")

# Normalize text
normalized = normalize_text("Hello, World!")
print(normalized)  # "hello world"
```

## Testing

### Install Test Dependencies

First, install pytest in your activated virtual environment:

```bash
pip install pytest
```

### Generate Test Fixtures

Next, generate the sample PDF for testing:

```bash
cd tests
python generate_sample_pdf.py
```

This creates `tests/sample.pdf` which is used by the test suite.

### Run Tests

Run the full test suite:

```bash
pytest
```

Run with verbose output:

```bash
pytest -v
```

Run a specific test:

```bash
pytest tests/test_extract.py::TestNormalizeText::test_lowercase
```

## Text Normalization

The `normalize_text()` function applies consistent transformations:

1. **Lowercase**: All text converted to lowercase
2. **Trim whitespace**: Leading/trailing whitespace removed
3. **Collapse spaces**: Multiple spaces reduced to single space
4. **Remove punctuation**: Only alphanumeric characters and spaces preserved

This normalization enables consistent text comparison, deduplication, and indexing across documents.

## How Spans Work

PyMuPDF extracts text in a hierarchical structure:

- **Blocks**: Text regions (paragraphs, columns)
- **Lines**: Horizontal text lines within blocks
- **Spans**: Sequences of characters with identical formatting

Each span includes:

- Raw text content
- Font information (size, family, flags)
- Bounding box coordinates (x, y, width, height)

This service extracts and formats this span data for downstream processing.

## Future Integration

This service will integrate with the Index PDF backend in the following way:

### Current State (MVP)

- Standalone Python service
- Called via subprocess or direct import
- Synchronous extraction

### Future State (Production)

1. **Cloud Run Deployment**: Service deployed as containerized Cloud Run instance
2. **REST API**: Backend calls extraction service via HTTP
3. **Async Processing**: Queue-based processing for large documents
4. **Caching**: Extracted text cached in Gel database
5. **Event Emission**: Extraction completion triggers `document.text_extracted` events

### Integration Points

The backend will:

1. Upload PDF to storage
2. Call extractor service with PDF path or URL
3. Receive JSON response with extracted text
4. Store spans in Gel database
5. Trigger indexing pipeline
6. Emit domain events

## Design Constraints

- **No backend dependencies**: Service is self-contained
- **No Fastify/Next.js integration**: Pure Python, no Node.js coupling
- **No premature optimization**: Clarity over cleverness
- **Deterministic output**: Same PDF always produces same output
- **JSON output**: Standard format for cross-language compatibility

## File Structure

```
apps/index-pdf-extractor/
├── README.md                  # This file
├── pyproject.toml            # Python project configuration
├── __init__.py               # Package marker
├── extract_pdf.py            # Core extraction logic
└── tests/
    ├── generate_sample_pdf.py  # Test fixture generator
    ├── sample.pdf              # Test fixture (generated)
    └── test_extract.py         # Test suite
```

## Development

### Code Style

- Readable and explicit over clever
- Type hints for all function signatures
- Comments explain "why", not "what"
- Functional approach where possible

### Error Handling

The extractor handles common errors:

- `FileNotFoundError`: PDF file doesn't exist
- `fitz.FileDataError`: Invalid PDF format
- Generic exceptions: Unexpected errors during extraction

### Adding Features

When extending the extractor:

1. Keep extraction logic in `extract_pdf.py`
2. Add tests for new functionality
3. Update output schema in README
4. Maintain backward compatibility with existing output format

## Troubleshooting

**Problem**: `ModuleNotFoundError: No module named 'fitz'`

**Solution**: Make sure your virtual environment is activated (`source venv/bin/activate`) and PyMuPDF is installed: `pip install PyMuPDF`

---

**Problem**: Tests fail with "sample.pdf not found"

**Solution**: Generate test fixture: `python tests/generate_sample_pdf.py`

---

**Problem**: Extraction is slow for large PDFs

**Solution**: This is expected for MVP. Future optimization will include parallel page processing and streaming output.

## Contributing

When making changes:

1. Write tests first
2. Ensure all tests pass: `pytest`
3. Update README if behavior changes
4. Keep code simple and documented

## License

Internal use only - Index PDF platform.
