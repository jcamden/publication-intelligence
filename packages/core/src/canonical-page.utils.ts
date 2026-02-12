/**
 * Canonical Page Numbering Utilities
 *
 * Functions for generating, detecting, and validating canonical page numbers.
 */

import type { BoundingBox } from "./context.types";

export type NumeralType = "arabic" | "roman" | "arbitrary";

/**
 * Detect the numeral type from a canonical page string
 */
export const detectNumeralType = ({ page }: { page: string }): NumeralType => {
	if (/^\d+$/.test(page)) return "arabic";
	if (/^[ivxlcdm]+$/i.test(page)) return "roman";
	return "arbitrary";
};

/**
 * Convert a Roman numeral to a number
 */
const romanToNumber = ({ roman }: { roman: string }): number => {
	const upperRoman = roman.toUpperCase();
	const romanNumerals: Record<string, number> = {
		I: 1,
		V: 5,
		X: 10,
		L: 50,
		C: 100,
		D: 500,
		M: 1000,
	};

	let result = 0;
	for (let i = 0; i < upperRoman.length; i++) {
		const current = romanNumerals[upperRoman[i]];
		const next = romanNumerals[upperRoman[i + 1]];

		if (current === undefined) {
			throw new Error(`Invalid Roman numeral: ${roman}`);
		}

		if (next && current < next) {
			result -= current;
		} else {
			result += current;
		}
	}

	return result;
};

/**
 * Convert a number to a Roman numeral
 */
const numberToRoman = ({ num }: { num: number }): string => {
	if (num < 1 || num > 3999) {
		throw new Error(`Number out of range for Roman numerals: ${num}`);
	}

	const values = [
		1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1,
	] as const;
	const numerals = [
		"m",
		"cm",
		"d",
		"cd",
		"c",
		"xc",
		"l",
		"xl",
		"x",
		"ix",
		"v",
		"iv",
		"i",
	] as const;

	let result = "";
	let remaining = num;

	for (let i = 0; i < values.length; i++) {
		while (remaining >= values[i]) {
			result += numerals[i];
			remaining -= values[i];
		}
	}

	return result;
};

/**
 * Generate a sequence of Roman numerals
 */
export const generateRomanNumerals = ({
	start,
	count,
}: {
	start: string;
	count: number;
}): string[] => {
	const startNum = romanToNumber({ roman: start });
	const result: string[] = [];

	for (let i = 0; i < count; i++) {
		result.push(numberToRoman({ num: startNum + i }));
	}

	return result;
};

/**
 * Generate a sequence of Arabic numerals
 */
export const generateArabicNumerals = ({
	start,
	count,
}: {
	start: number;
	count: number;
}): string[] => {
	const result: string[] = [];

	for (let i = 0; i < count; i++) {
		result.push(String(start + i));
	}

	return result;
};

/**
 * Parse an arbitrary sequence from comma-separated input
 */
export const parseArbitrarySequence = ({
	input,
}: {
	input: string;
}): string[] => {
	return input
		.split(",")
		.map((s) => s.trim())
		.filter((s) => s.length > 0);
};

/**
 * Check if a sequence of values forms a continuous progression
 * Works for Arabic (1, 2, 3) and Roman (i, ii, iii)
 */
export const detectSequenceContinuity = ({
	values,
}: {
	values: string[];
}): boolean => {
	if (values.length < 2) return true;

	const firstType = detectNumeralType({ page: values[0] });

	// All values must be the same type
	for (const value of values) {
		if (detectNumeralType({ page: value }) !== firstType) {
			return false;
		}
	}

	if (firstType === "arbitrary") {
		return false;
	}

	if (firstType === "arabic") {
		// Check if Arabic numbers are sequential
		const numbers = values.map((v) => Number.parseInt(v, 10));
		for (let i = 1; i < numbers.length; i++) {
			if (numbers[i] !== numbers[i - 1] + 1) {
				return false;
			}
		}
		return true;
	}

	if (firstType === "roman") {
		// Check if Roman numerals are sequential
		try {
			const numbers = values.map((v) => romanToNumber({ roman: v }));
			for (let i = 1; i < numbers.length; i++) {
				if (numbers[i] !== numbers[i - 1] + 1) {
					return false;
				}
			}
			return true;
		} catch {
			return false;
		}
	}

	return false;
};

/**
 * Extract page number from PDF text layer at bbox location
 * NOTE: This is a placeholder that will be implemented with PDF.js text extraction
 * For MVP, this will be called from the frontend with PDF.js text layer data
 */
export const extractPageNumberFromBbox = ({
	textContent,
	_bbox,
}: {
	textContent: string;
	_bbox: BoundingBox;
}): string | null => {
	// For now, this is a simple implementation that extracts text
	// In production, this would need to:
	// 1. Get text items from PDF.js getTextContent()
	// 2. Filter text items that intersect with bbox
	// 3. Combine overlapping text items
	// 4. Parse and validate as page number

	const trimmed = textContent.trim();
	if (trimmed.length === 0) return null;

	// Validate that the extracted text looks like a page number
	const isValidPageNumber =
		/^\d+$/.test(trimmed) || // Arabic: 1, 2, 3
		/^[ivxlcdm]+$/i.test(trimmed) || // Roman: i, ii, iii
		/^[a-z]+$/i.test(trimmed); // Alphabetic: a, b, c

	return isValidPageNumber ? trimmed : null;
};

/**
 * Generate canonical page sequence for a rule
 */
export const generateCanonicalPageSequence = ({
	ruleType,
	numeralType,
	startingCanonicalPage,
	arbitrarySequence,
	pageCount,
}: {
	ruleType: "positive" | "negative";
	numeralType?: "arabic" | "roman" | "arbitrary";
	startingCanonicalPage?: string;
	arbitrarySequence?: string[];
	pageCount: number;
}): string[] | null => {
	if (ruleType === "negative") {
		return null;
	}

	if (numeralType === "arabic" && startingCanonicalPage) {
		const start = Number.parseInt(startingCanonicalPage, 10);
		if (Number.isNaN(start)) return null;
		return generateArabicNumerals({ start, count: pageCount });
	}

	if (numeralType === "roman" && startingCanonicalPage) {
		try {
			return generateRomanNumerals({
				start: startingCanonicalPage,
				count: pageCount,
			});
		} catch {
			return null;
		}
	}

	if (numeralType === "arbitrary" && arbitrarySequence) {
		return arbitrarySequence;
	}

	return null;
};
