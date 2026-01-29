import { describe, expect, it } from "vitest";
import type { BoundingBox } from "@/types/mentions";
import {
	bboxesOverlap,
	convertPyMuPDFToViewer,
	convertViewerToPyMuPDF,
	mapCanonicalToViewer,
	normalizeText,
} from "./mapping";

describe("PDF Text Mapping", () => {
	describe("normalizeText", () => {
		it("should lowercase and collapse whitespace", () => {
			expect(normalizeText({ text: "Hello  World" })).toBe("hello world");
			expect(normalizeText({ text: "  Multiple   Spaces  " })).toBe(
				"multiple spaces",
			);
			expect(normalizeText({ text: "UPPERCASE" })).toBe("uppercase");
		});

		it("should handle newlines and tabs", () => {
			expect(normalizeText({ text: "Line1\nLine2\tTab" })).toBe(
				"line1 line2 tab",
			);
		});

		it("should trim edges", () => {
			expect(normalizeText({ text: "   text   " })).toBe("text");
		});
	});

	describe("convertPyMuPDFToViewer", () => {
		it("should convert bottom-left origin to top-left origin", () => {
			const pymupdfBbox: BoundingBox = {
				x: 100,
				y: 500, // bottom-left origin
				width: 200,
				height: 50,
			};

			const pageHeight = 800;

			const viewerBbox = convertPyMuPDFToViewer({
				bbox: pymupdfBbox,
				pageHeight,
			});

			// y_viewer = pageHeight - y_pymupdf - height
			// y_viewer = 800 - 500 - 50 = 250
			expect(viewerBbox).toEqual({
				x: 100,
				y: 250,
				width: 200,
				height: 50,
				rotation: undefined,
			});
		});

		it("should preserve rotation", () => {
			const bbox: BoundingBox = {
				x: 50,
				y: 100,
				width: 150,
				height: 30,
				rotation: 90,
			};

			const result = convertPyMuPDFToViewer({ bbox, pageHeight: 600 });
			expect(result.rotation).toBe(90);
		});
	});

	describe("convertViewerToPyMuPDF", () => {
		it("should convert top-left origin to bottom-left origin", () => {
			const viewerBbox: BoundingBox = {
				x: 100,
				y: 250, // top-left origin
				width: 200,
				height: 50,
			};

			const pageHeight = 800;

			const pymupdfBbox = convertViewerToPyMuPDF({
				bbox: viewerBbox,
				pageHeight,
			});

			// y_pymupdf = pageHeight - y_viewer - height
			// y_pymupdf = 800 - 250 - 50 = 500
			expect(pymupdfBbox).toEqual({
				x: 100,
				y: 500,
				width: 200,
				height: 50,
				rotation: undefined,
			});
		});

		it("should round-trip correctly", () => {
			const original: BoundingBox = {
				x: 123,
				y: 456,
				width: 234,
				height: 67,
			};

			const pageHeight = 1000;

			const converted = convertPyMuPDFToViewer({
				bbox: original,
				pageHeight,
			});
			const roundTripped = convertViewerToPyMuPDF({
				bbox: converted,
				pageHeight,
			});

			expect(roundTripped).toEqual({
				...original,
				rotation: undefined,
			});
		});
	});

	describe("bboxesOverlap", () => {
		it("should detect full overlap", () => {
			const a: BoundingBox = { x: 0, y: 0, width: 100, height: 100 };
			const b: BoundingBox = { x: 0, y: 0, width: 100, height: 100 };

			expect(bboxesOverlap({ a, b })).toBe(true);
		});

		it("should detect partial overlap above threshold", () => {
			const a: BoundingBox = { x: 0, y: 0, width: 100, height: 100 };
			const b: BoundingBox = { x: 40, y: 40, width: 100, height: 100 };

			// Overlap area: 60x60 = 3600
			// Min bbox area: 100x100 = 10000
			// Ratio: 3600/10000 = 0.36, below default threshold (0.5)
			expect(bboxesOverlap({ a, b })).toBe(false);

			// With lower threshold
			expect(bboxesOverlap({ a, b, threshold: 0.3 })).toBe(true);
		});

		it("should detect no overlap", () => {
			const a: BoundingBox = { x: 0, y: 0, width: 100, height: 100 };
			const b: BoundingBox = { x: 200, y: 200, width: 100, height: 100 };

			expect(bboxesOverlap({ a, b })).toBe(false);
		});

		it("should detect edge touching (no overlap)", () => {
			const a: BoundingBox = { x: 0, y: 0, width: 100, height: 100 };
			const b: BoundingBox = { x: 100, y: 0, width: 100, height: 100 };

			expect(bboxesOverlap({ a, b })).toBe(false);
		});
	});

	describe("mapCanonicalToViewer", () => {
		it("should return unresolved when no canonical bbox provided", () => {
			const result = mapCanonicalToViewer({
				pageNumber: 1,
				textSpan: "test text",
			});

			expect(result.success).toBe(false);
			expect(result.confidence).toBe("unresolved");
			expect(result.method).toBe("failed");
		});

		it("should convert coordinates when canonical bbox and metadata provided", () => {
			const result = mapCanonicalToViewer({
				pageNumber: 1,
				textSpan: "test text",
				canonicalBbox: {
					x: 100,
					y: 500,
					width: 200,
					height: 50,
				},
				pageMetadata: {
					pageWidth: 600,
					pageHeight: 800,
					scale: 1,
					rotation: 0,
				},
			});

			expect(result.success).toBe(true);
			expect(result.confidence).toBe("medium");
			expect(result.method).toBe("approximate");
			expect(result.bboxes).toHaveLength(1);
			expect(result.bboxes[0]).toEqual({
				x: 100,
				y: 250, // converted from bottom-left to top-left
				width: 200,
				height: 50,
				rotation: undefined,
			});
		});
	});
});
