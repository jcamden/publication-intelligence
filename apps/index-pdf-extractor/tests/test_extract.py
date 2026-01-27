"""
Tests for PDF extraction functionality.
"""

import json
import os
from pathlib import Path

import pytest

from extract_pdf import extract_pdf, normalize_text


# Get the directory where this test file is located
TEST_DIR = Path(__file__).parent
SAMPLE_PDF = TEST_DIR / "sample.pdf"


class TestNormalizeText:
    """Tests for text normalization."""

    def test_lowercase(self):
        assert normalize_text("HELLO") == "hello"
        assert normalize_text("Hello World") == "hello world"

    def test_trim_whitespace(self):
        assert normalize_text("  hello  ") == "hello"
        assert normalize_text("\n\thello\t\n") == "hello"

    def test_collapse_spaces(self):
        assert normalize_text("hello    world") == "hello world"
        assert normalize_text("hello  \n  world") == "hello world"

    def test_remove_punctuation(self):
        assert normalize_text("hello, world!") == "hello world"
        assert normalize_text("test@example.com") == "testexamplecom"
        assert normalize_text("it's a test") == "its a test"

    def test_preserve_alphanumeric(self):
        assert normalize_text("test123") == "test123"
        assert normalize_text("123 abc") == "123 abc"

    def test_combined_normalization(self):
        text = "  HELLO,   World!  123  "
        expected = "hello world 123"
        assert normalize_text(text) == expected

    def test_normalized_differs_from_original(self):
        """Normalized text should differ from original when punctuation exists."""
        text = "Hello, World!"
        normalized = normalize_text(text)
        assert normalized != text
        assert normalized == "hello world"


@pytest.mark.skipif(
    not SAMPLE_PDF.exists(),
    reason="sample.pdf not found. Create a sample PDF to run these tests."
)
class TestExtractPdf:
    """Tests for PDF extraction.
    
    These tests require a sample.pdf file in the tests/ directory.
    You can create one manually or use a script to generate it.
    """

    def test_extract_returns_dict(self):
        """Extract should return a dictionary."""
        result = extract_pdf(str(SAMPLE_PDF))
        assert isinstance(result, dict)
        assert "pages" in result

    def test_extract_has_at_least_one_page(self):
        """Extract should return at least one page."""
        result = extract_pdf(str(SAMPLE_PDF))
        assert len(result["pages"]) >= 1

    def test_page_structure(self):
        """Each page should have required fields."""
        result = extract_pdf(str(SAMPLE_PDF))
        page = result["pages"][0]

        assert "page_number" in page
        assert "text" in page
        assert "spans" in page

        assert isinstance(page["page_number"], int)
        assert isinstance(page["text"], str)
        assert isinstance(page["spans"], list)

    def test_page_numbers_start_at_one(self):
        """Page numbers should be 1-indexed."""
        result = extract_pdf(str(SAMPLE_PDF))
        first_page = result["pages"][0]
        assert first_page["page_number"] == 1

    def test_spans_exist(self):
        """Spans should exist for non-empty PDFs."""
        result = extract_pdf(str(SAMPLE_PDF))
        page = result["pages"][0]

        # Assuming sample.pdf has text content
        if page["text"].strip():
            assert len(page["spans"]) > 0

    def test_span_structure(self):
        """Each span should have required fields."""
        result = extract_pdf(str(SAMPLE_PDF))
        page = result["pages"][0]

        # Skip test if no spans
        if not page["spans"]:
            pytest.skip("No spans found in sample PDF")

        span = page["spans"][0]

        assert "text" in span
        assert "normalized_text" in span
        assert "bbox" in span

        assert isinstance(span["text"], str)
        assert isinstance(span["normalized_text"], str)
        assert isinstance(span["bbox"], dict)

    def test_bbox_values_are_numeric(self):
        """Bounding box values should be numeric."""
        result = extract_pdf(str(SAMPLE_PDF))
        page = result["pages"][0]

        # Skip test if no spans
        if not page["spans"]:
            pytest.skip("No spans found in sample PDF")

        span = page["spans"][0]
        bbox = span["bbox"]

        assert "x" in bbox
        assert "y" in bbox
        assert "width" in bbox
        assert "height" in bbox

        assert isinstance(bbox["x"], (int, float))
        assert isinstance(bbox["y"], (int, float))
        assert isinstance(bbox["width"], (int, float))
        assert isinstance(bbox["height"], (int, float))

        # Bounding box values should be non-negative
        assert bbox["width"] >= 0
        assert bbox["height"] >= 0

    def test_normalized_text_differs_when_punctuation_exists(self):
        """Normalized text should differ from raw text when punctuation exists."""
        result = extract_pdf(str(SAMPLE_PDF))
        page = result["pages"][0]

        # Find a span with punctuation
        found_punctuation_span = False
        for span in page["spans"]:
            # Check if original text has punctuation that would be removed
            has_punctuation = any(
                char in span["text"] for char in ".,!?;:'\"-()[]{}@#$%^&*"
            )

            if has_punctuation:
                assert span["normalized_text"] != span["text"]
                found_punctuation_span = True
                break

        # If we found a span with punctuation, the test passed
        # If not, we can't fully test this requirement
        if not found_punctuation_span:
            pytest.skip("No spans with punctuation found in sample PDF")

    def test_json_serializable(self):
        """Result should be JSON serializable."""
        result = extract_pdf(str(SAMPLE_PDF))

        # Should not raise exception
        json_str = json.dumps(result)
        assert isinstance(json_str, str)

        # Should be able to parse back
        parsed = json.loads(json_str)
        assert parsed == result

    def test_file_not_found(self):
        """Should raise FileNotFoundError for non-existent file."""
        with pytest.raises(FileNotFoundError):
            extract_pdf("/nonexistent/path/to/file.pdf")

    def test_invalid_pdf(self, tmp_path):
        """Should raise error for invalid PDF file."""
        # Create a non-PDF file
        fake_pdf = tmp_path / "fake.pdf"
        fake_pdf.write_text("This is not a PDF file")

        with pytest.raises(Exception):  # PyMuPDF raises fitz.FileDataError
            extract_pdf(str(fake_pdf))
