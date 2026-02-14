/**
 * Bounding Box Conversion Utilities
 *
 * PyMuPDF uses bottom-left origin, PDF.js uses top-left origin.
 * These utilities handle coordinate system conversion, including rotation and scale.
 */

import type { BBox } from "./text-atom.types";

export type Rotation = 0 | 90 | 180 | 270;

/**
 * Convert PyMuPDF bbox to PDF.js viewport coordinates
 *
 * @param bbox - PyMuPDF bounding box (bottom-left origin)
 * @param pageHeight - Page height in PDF points
 * @param scale - Viewport scale factor (default: 1.0)
 * @param rotation - Page rotation in degrees (default: 0)
 * @returns PDF.js bounding box (top-left origin)
 */
export const convertPyMuPdfToPdfJs = ({
	bbox,
	pageHeight,
	scale = 1.0,
	rotation = 0,
}: {
	bbox: BBox;
	pageHeight: number;
	scale?: number;
	rotation?: Rotation;
}): BBox => {
	const { x0, y0, x1, y1 } = bbox;

	// Step 1: Flip Y-axis (PyMuPDF uses bottom-left origin)
	const y0Flipped = pageHeight - y1;
	const y1Flipped = pageHeight - y0;

	// Step 2: Apply rotation
	let xFinal: number;
	let yFinal: number;
	let widthFinal: number;
	let heightFinal: number;

	switch (rotation) {
		case 0:
			xFinal = x0;
			yFinal = y0Flipped;
			widthFinal = x1 - x0;
			heightFinal = y1 - y0;
			break;
		case 90:
			xFinal = y0Flipped;
			yFinal = pageHeight - x1;
			widthFinal = y1 - y0;
			heightFinal = x1 - x0;
			break;
		case 180:
			xFinal = pageHeight - x1;
			yFinal = pageHeight - y1Flipped;
			widthFinal = x1 - x0;
			heightFinal = y1 - y0;
			break;
		case 270:
			xFinal = pageHeight - y1Flipped;
			yFinal = x0;
			widthFinal = y1 - y0;
			heightFinal = x1 - x0;
			break;
	}

	// Step 3: Apply scale
	return {
		x0: xFinal * scale,
		y0: yFinal * scale,
		x1: (xFinal + widthFinal) * scale,
		y1: (yFinal + heightFinal) * scale,
	};
};

/**
 * Convert PDF.js bbox to PyMuPDF coordinates
 * (Inverse of convertPyMuPdfToPdfJs)
 *
 * @param bbox - PDF.js bounding box (top-left origin)
 * @param pageHeight - Page height in PDF points
 * @param scale - Viewport scale factor (default: 1.0)
 * @param rotation - Page rotation in degrees (default: 0)
 * @returns PyMuPDF bounding box (bottom-left origin)
 */
export const convertPdfJsToPyMuPdf = ({
	bbox,
	pageHeight,
	scale = 1.0,
	rotation = 0,
}: {
	bbox: BBox;
	pageHeight: number;
	scale?: number;
	rotation?: Rotation;
}): BBox => {
	// Undo scale first
	const x0Unscaled = bbox.x0 / scale;
	const y0Unscaled = bbox.y0 / scale;
	const x1Unscaled = bbox.x1 / scale;
	const y1Unscaled = bbox.y1 / scale;

	const width = x1Unscaled - x0Unscaled;
	const height = y1Unscaled - y0Unscaled;

	// Undo rotation
	let xOriginal: number;
	let yOriginal: number;

	switch (rotation) {
		case 0:
			xOriginal = x0Unscaled;
			yOriginal = pageHeight - y0Unscaled - height;
			break;
		case 90:
			xOriginal = pageHeight - y0Unscaled - height;
			yOriginal = x0Unscaled;
			break;
		case 180:
			xOriginal = pageHeight - x0Unscaled - width;
			yOriginal = y0Unscaled;
			break;
		case 270:
			xOriginal = y0Unscaled;
			yOriginal = pageHeight - x0Unscaled - width;
			break;
	}

	return {
		x0: xOriginal,
		y0: yOriginal,
		x1: xOriginal + width,
		y1: yOriginal + height,
	};
};
