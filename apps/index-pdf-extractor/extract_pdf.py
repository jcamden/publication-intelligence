"""
PDF text extraction using PyMuPDF.

This module provides canonical text extraction from PDF files,
extracting word-level text with bounding boxes for Index PDF platform.
"""

import json
import re
import sys
from typing import TypedDict

import fitz  # PyMuPDF


class BBox(TypedDict):
    """Bounding box coordinates (PyMuPDF format: x0, y0, x1, y1)."""
    x0: float
    y0: float
    x1: float
    y1: float


class Dimensions(TypedDict):
    """Page dimensions in PDF points."""
    width: float
    height: float


class Word(TypedDict):
    """Word with text and bounding box."""
    text: str
    bbox: BBox
    block_no: int
    line_no: int
    word_no: int


class Page(TypedDict):
    """Page with full text, words, and dimensions."""
    page_number: int
    text: str
    words: list[Word]
    dimensions: Dimensions


class ExtractionResult(TypedDict):
    """Complete extraction result."""
    pages: list[Page]




def extract_pdf(path: str, pages: list[int] | None = None) -> ExtractionResult:
    """
    Extract text and words from a PDF file using PyMuPDF.

    Args:
        path: Path to PDF file
        pages: Optional list of page numbers (1-indexed) to extract.
               If None, extracts all pages.

    Returns:
        Dictionary containing pages with:
        - Full page text
        - Word-level text with bounding boxes
        - Page dimensions (width, height in PDF points)

    Raises:
        FileNotFoundError: If PDF file doesn't exist
        fitz.FileDataError: If file is not a valid PDF
    """
    doc = fitz.open(path)
    result_pages: list[Page] = []

    # Determine which pages to extract
    if pages is None:
        # Extract all pages
        pages_to_extract = range(len(doc))
    else:
        # Convert 1-indexed page numbers to 0-indexed
        pages_to_extract = [p - 1 for p in pages if 0 < p <= len(doc)]

    for page_num in pages_to_extract:
        page = doc[page_num]

        # Extract full page text
        page_text = page.get_text()

        # Extract words using PyMuPDF's built-in word extraction
        # Returns list of tuples: (x0, y0, x1, y1, "word", block_no, line_no, word_no)
        word_list = page.get_text("words")
        
        page_words: list[Word] = []
        for word_tuple in word_list:
            x0, y0, x1, y1, text, block_no, line_no, word_no = word_tuple
            
            # Skip empty words
            if not text.strip():
                continue
            
            word_data: Word = {
                "text": text,
                "bbox": {
                    "x0": float(x0),
                    "y0": float(y0),
                    "x1": float(x1),
                    "y1": float(y1),
                },
                "block_no": int(block_no),
                "line_no": int(line_no),
                "word_no": int(word_no),
            }
            
            page_words.append(word_data)
        
        # Get page dimensions from page rectangle
        page_rect = page.rect
        dimensions: Dimensions = {
            "width": float(page_rect.width),
            "height": float(page_rect.height),
        }

        page_data: Page = {
            "page_number": page_num + 1,  # 1-indexed for human readability
            "text": page_text,
            "words": page_words,
            "dimensions": dimensions,
        }

        result_pages.append(page_data)

    doc.close()

    return {"pages": result_pages}


def main():
    """CLI entry point."""
    if len(sys.argv) < 2:
        print("Usage: python extract_pdf.py <path_to_pdf> [output_json_path] [--pages 1,2,3]", file=sys.stderr)
        sys.exit(1)

    pdf_path = sys.argv[1]
    output_path = None
    page_numbers = None

    # Parse optional arguments
    i = 2
    while i < len(sys.argv):
        arg = sys.argv[i]
        if arg == '--pages':
            if i + 1 < len(sys.argv):
                page_str = sys.argv[i + 1]
                page_numbers = [int(p.strip()) for p in page_str.split(',')]
                i += 2
            else:
                print("Error: --pages requires a comma-separated list of page numbers", file=sys.stderr)
                sys.exit(1)
        elif not output_path:
            output_path = arg
            i += 1
        else:
            i += 1

    try:
        result = extract_pdf(pdf_path, pages=page_numbers)
        
        if output_path:
            # Write to file for large PDFs
            with open(output_path, 'w') as f:
                json.dump(result, f)
            print(f"Extraction complete: {len(result['pages'])} pages")
        else:
            # Print to stdout for small PDFs or testing
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
