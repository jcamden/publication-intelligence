"""
Generate a sample PDF for testing.

This script creates a simple PDF with text content for testing the extraction functionality.
Run this once to set up the test fixture.
"""

import fitz  # PyMuPDF


def generate_sample_pdf(output_path: str):
    """
    Generate a simple PDF with text content for testing.

    Args:
        output_path: Path where the PDF should be saved
    """
    # Create a new PDF document
    doc = fitz.open()

    # Add first page
    page1 = doc.new_page(width=612, height=792)  # Standard letter size in points

    # Insert text with different styles
    text_content = [
        ("Hello, World!", 50, 50, 16),
        ("This is a sample PDF document.", 50, 80, 12),
        ("It contains multiple lines of text!", 50, 110, 12),
        ("Page 1 of 2", 50, 750, 10),
    ]

    for text, x, y, fontsize in text_content:
        page1.insert_text(
            (x, y),
            text,
            fontsize=fontsize,
            fontname="helv",
        )

    # Add second page
    page2 = doc.new_page(width=612, height=792)

    text_content_page2 = [
        ("Second Page", 50, 50, 16),
        ("Testing multi-page extraction.", 50, 80, 12),
        ("Numbers: 123, 456, 789", 50, 110, 12),
        ("Special characters: @#$%", 50, 140, 12),
        ("Page 2 of 2", 50, 750, 10),
    ]

    for text, x, y, fontsize in text_content_page2:
        page2.insert_text(
            (x, y),
            text,
            fontsize=fontsize,
            fontname="helv",
        )

    # Save the PDF
    doc.save(output_path)
    doc.close()

    print(f"Generated sample PDF: {output_path}")


if __name__ == "__main__":
    import os
    from pathlib import Path

    # Generate in the tests directory
    script_dir = Path(__file__).parent
    output_path = script_dir / "sample.pdf"

    generate_sample_pdf(str(output_path))
