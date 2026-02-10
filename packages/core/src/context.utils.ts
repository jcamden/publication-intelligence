/**
 * Context Utilities - Page configuration logic
 *
 * Functions for determining which pages a context applies to.
 */

import type { Context } from "./context.types";

/**
 * Parse a page range string into an array of page numbers
 * Examples:
 * - "1-5" → [1, 2, 3, 4, 5]
 * - "1-2,5-6,8" → [1, 2, 5, 6, 8]
 * - "10" → [10]
 */
export const parsePageRange = ({
	rangeStr,
}: {
	rangeStr: string;
}): number[] => {
	const pages = new Set<number>();

	// Split by comma to handle multiple ranges/individual pages
	const parts = rangeStr.split(",").map((p) => p.trim());

	for (const part of parts) {
		if (part.includes("-")) {
			// Range: "1-5"
			const [startStr, endStr] = part.split("-").map((s) => s.trim());
			const start = Number.parseInt(startStr, 10);
			const end = Number.parseInt(endStr, 10);

			if (Number.isNaN(start) || Number.isNaN(end)) {
				throw new Error(`Invalid page range: ${part}`);
			}

			if (start > end) {
				throw new Error(`Invalid range: start (${start}) > end (${end})`);
			}

			for (let i = start; i <= end; i++) {
				pages.add(i);
			}
		} else {
			// Individual page: "8"
			const pageNum = Number.parseInt(part, 10);
			if (Number.isNaN(pageNum)) {
				throw new Error(`Invalid page number: ${part}`);
			}
			pages.add(pageNum);
		}
	}

	return Array.from(pages).sort((a, b) => a - b);
};

/**
 * Check if a context applies to a specific page
 */
export const appliesToPage = ({
	context,
	targetPage,
}: {
	context: Context;
	targetPage: number;
}): boolean => {
	// Check base page config mode
	switch (context.pageConfigMode) {
		case "this_page":
			if (context.pageNumber !== targetPage) return false;
			break;
		case "all_pages":
			// Applies to all pages
			break;
		case "page_range":
		case "custom": {
			// Parse page range and check if targetPage is in the list
			if (!context.pageRange) return false;

			try {
				const pages = parsePageRange({ rangeStr: context.pageRange });
				if (!pages.includes(targetPage)) return false;
			} catch {
				// Invalid page range, don't apply
				return false;
			}
			break;
		}
	}

	// Apply everyOther filter if enabled
	if (context.everyOther && context.startPage !== undefined) {
		const offset = targetPage - context.startPage;
		if (offset < 0 || offset % 2 !== 0) {
			return false;
		}
	}

	return true;
};

/**
 * Validate page range string format
 * Returns error message if invalid, null if valid
 */
export const validatePageRange = ({
	rangeStr,
	maxPage,
}: {
	rangeStr: string;
	maxPage?: number;
}): string | null => {
	try {
		const pages = parsePageRange({ rangeStr });

		if (pages.length === 0) {
			return "Page range must contain at least one page";
		}

		if (maxPage !== undefined) {
			const invalidPages = pages.filter((p) => p < 1 || p > maxPage);
			if (invalidPages.length > 0) {
				return `Pages out of range: ${invalidPages.join(", ")} (max: ${maxPage})`;
			}
		}

		return null;
	} catch (error) {
		return error instanceof Error ? error.message : "Invalid page range format";
	}
};

/**
 * Get a human-readable summary of page configuration
 */
export const getPageConfigSummary = ({
	context,
}: {
	context: Pick<
		Context,
		"pageConfigMode" | "pageNumber" | "pageRange" | "everyOther" | "startPage"
	>;
}): string => {
	const { pageConfigMode, pageNumber, pageRange, everyOther, startPage } =
		context;

	let base = "";

	switch (pageConfigMode) {
		case "this_page":
			base = `Page ${pageNumber}`;
			break;
		case "all_pages":
			base = "All pages";
			break;
		case "page_range":
			base = `Pages ${pageRange}`;
			break;
		case "custom":
			base = `Custom: ${pageRange}`;
			break;
	}

	if (everyOther && startPage !== undefined) {
		base += ` (every other, starting page ${startPage})`;
	}

	return base;
};
