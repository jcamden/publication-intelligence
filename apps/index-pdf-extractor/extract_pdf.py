"""
PDF text extraction using PyMuPDF.

This module provides canonical text extraction from PDF files,
extracting both full-page text and span-level text with bounding boxes.
"""

import json
import re
import sys
from typing import TypedDict

import fitz  # PyMuPDF


class BBox(TypedDict):
    """Bounding box coordinates."""
    x: float
    y: float
    width: float
    height: float


class Span(TypedDict):
    """Text span with normalized text and bounding box."""
    text: str
    normalized_text: str
    bbox: BBox


class Page(TypedDict):
    """Page with full text and spans."""
    page_number: int
    text: str
    spans: list[Span]


class ExtractionResult(TypedDict):
    """Complete extraction result."""
    pages: list[Page]


def normalize_text(text: str) -> str:
    """
    Normalize text for consistent comparison and indexing.

    Args:
        text: Raw text string

    Returns:
        Normalized text (lowercase, trimmed, collapsed spaces, no punctuation)
    """
    # Lowercase
    normalized = text.lower()

    # Remove punctuation (keep only alphanumeric and spaces)
    normalized = re.sub(r'[^a-z0-9\s]', '', normalized)

    # Collapse multiple spaces into one
    normalized = re.sub(r'\s+', ' ', normalized)

    # Trim leading/trailing whitespace
    normalized = normalized.strip()

    return normalized


def extract_pdf(path: str) -> ExtractionResult:
    """
    Extract text and spans from a PDF file.

    Args:
        path: Path to PDF file

    Returns:
        Dictionary containing pages with text and spans

    Raises:
        FileNotFoundError: If PDF file doesn't exist
        fitz.FileDataError: If file is not a valid PDF
    """
    doc = fitz.open(path)
    pages: list[Page] = []

    for page_num in range(len(doc)):
        page = doc[page_num]

        # Extract full page text
        page_text = page.get_text()

        # Extract text with detailed span information
        # PyMuPDF provides text in blocks -> lines -> spans hierarchy
        # Each span has: text content, font info, and bounding box
        text_dict = page.get_text("dict")
        spans: list[Span] = []

        # Iterate through blocks (text regions)
        for block in text_dict.get("blocks", []):
            # Only process text blocks (type 0), skip image blocks (type 1)
            if block.get("type") != 0:
                continue

            # Iterate through lines within the block
            for line in block.get("lines", []):
                # Iterate through spans within the line
                # A span is a sequence of characters with the same formatting
                for span in line.get("spans", []):
                    span_text = span.get("text", "")

                    # Skip empty spans
                    if not span_text.strip():
                        continue

                    # Extract bounding box (x0, y0, x1, y1 format)
                    bbox_tuple = span.get("bbox", (0, 0, 0, 0))
                    x0, y0, x1, y1 = bbox_tuple

                    # Convert to x, y, width, height format
                    bbox: BBox = {
                        "x": float(x0),
                        "y": float(y0),
                        "width": float(x1 - x0),
                        "height": float(y1 - y0),
                    }

                    span_data: Span = {
                        "text": span_text,
                        "normalized_text": normalize_text(span_text),
                        "bbox": bbox,
                    }

                    spans.append(span_data)

        page_data: Page = {
            "page_number": page_num + 1,  # 1-indexed for human readability
            "text": page_text,
            "spans": spans,
        }

        pages.append(page_data)

    doc.close()

    return {"pages": pages}


def main():
    """CLI entry point."""
    if len(sys.argv) < 2:
        print("Usage: python extract_pdf.py <path_to_pdf>", file=sys.stderr)
        sys.exit(1)

    pdf_path = sys.argv[1]

    try:
        result = extract_pdf(pdf_path)
        print(json.dumps(result, indent=2))
    except FileNotFoundError:
        print(f"Error: File not found: {pdf_path}", file=sys.stderr)
        sys.exit(1)
    except fitz.FileDataError as e:
        print(f"Error: Invalid PDF file: {e}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
