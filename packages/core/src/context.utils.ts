/**
 * Context Utilities - Page configuration logic
 *
 * Functions for determining which pages a context applies to.
 */

import type { Context, ContextDerivedPageNumber } from "./context.types";

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
		// Check if beyond end page (if specified)
		if (context.endPage !== undefined && targetPage > context.endPage) {
			return false;
		}
	}

	// Check if page is explicitly excluded
	if (context.exceptPages?.includes(targetPage)) {
		return false;
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
		| "pageConfigMode"
		| "pageNumber"
		| "pageRange"
		| "everyOther"
		| "startPage"
		| "endPage"
		| "exceptPages"
	>;
}): string => {
	const {
		pageConfigMode,
		pageNumber,
		pageRange,
		everyOther,
		startPage,
		endPage,
		exceptPages,
	} = context;

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
		if (endPage !== undefined) {
			base += ` (every other, ${startPage}-${endPage})`;
		} else {
			base += ` (every other, starting page ${startPage})`;
		}
	}

	// Add exceptions if any
	if (exceptPages && exceptPages.length > 0) {
		base += ` except ${exceptPages.join(", ")}`;
	}

	return base;
};

/**
 * Get all page numbers that a context applies to
 * @param maxPage - Maximum page number in document (required for all_pages mode)
 */
export const getApplicablePages = ({
	context,
	maxPage,
}: {
	context: Context;
	maxPage: number;
}): number[] => {
	const pages: number[] = [];

	// Determine base pages based on mode
	switch (context.pageConfigMode) {
		case "this_page":
			if (context.pageNumber) {
				pages.push(context.pageNumber);
			}
			break;
		case "all_pages":
			for (let i = 1; i <= maxPage; i++) {
				pages.push(i);
			}
			break;
		case "page_range":
		case "custom":
			if (context.pageRange) {
				try {
					pages.push(...parsePageRange({ rangeStr: context.pageRange }));
				} catch {
					// Invalid page range, return empty
					return [];
				}
			}
			break;
	}

	// Apply everyOther filter if enabled
	const filtered =
		context.everyOther && context.startPage !== undefined
			? pages.filter((page) => {
					const startPage = context.startPage;
					if (startPage === undefined) return false;
					const offset = page - startPage;
					if (offset < 0 || offset % 2 !== 0) {
						return false;
					}
					// Check if beyond end page (if specified)
					if (context.endPage !== undefined && page > context.endPage) {
						return false;
					}
					return true;
				})
			: pages;

	// Remove exceptions
	const exceptSet = new Set(context.exceptPages || []);
	return filtered.filter((page) => !exceptSet.has(page));
};

/**
 * Conflict report for a specific page
 */
export type PageNumberConflict = {
	pageNumber: number;
	contexts: Array<{ id: string; name: string }>;
};

/**
 * Detect conflicts where multiple page_number contexts apply to the same page
 * Returns array of conflicts (pages with 2+ page_number contexts)
 *
 * When contextDerivedPageNumbers is provided, only considers contexts that have
 * detected text (i.e., contexts that appear in the contextDerivedPageNumbers array).
 * This avoids false positives where multiple contexts apply to a page but only
 * one has actual text in its bounding box.
 */
export const detectPageNumberConflicts = ({
	contexts,
	maxPage,
	contextDerivedPageNumbers,
}: {
	contexts: Context[];
	maxPage: number;
	contextDerivedPageNumbers?: ContextDerivedPageNumber[];
}): PageNumberConflict[] => {
	// Filter to only page_number contexts
	const pageNumberContexts = contexts.filter(
		(ctx) => ctx.contextType === "page_number",
	);

	// If contextDerivedPageNumbers provided, build a map of page -> contextIds with detected text
	let contextsWithTextPerPage: Map<number, Set<string>> | undefined;
	if (contextDerivedPageNumbers) {
		contextsWithTextPerPage = new Map();
		for (const derived of contextDerivedPageNumbers) {
			if (!contextsWithTextPerPage.has(derived.documentPage)) {
				contextsWithTextPerPage.set(derived.documentPage, new Set());
			}
			contextsWithTextPerPage.get(derived.documentPage)?.add(derived.contextId);
		}
	}

	// Map: pageNumber -> contexts that apply to that page
	const conflictsByPage = new Map<number, Context[]>();

	for (const context of pageNumberContexts) {
		const applicablePages = getApplicablePages({ context, maxPage });
		for (const page of applicablePages) {
			// If we have contextDerivedPageNumbers, only count this context if it has detected text on this page
			if (
				contextsWithTextPerPage &&
				!contextsWithTextPerPage.get(page)?.has(context.id)
			) {
				continue;
			}

			if (!conflictsByPage.has(page)) {
				conflictsByPage.set(page, []);
			}
			conflictsByPage.get(page)?.push(context);
		}
	}

	// Return pages with 2+ contexts (conflicts)
	return Array.from(conflictsByPage.entries())
		.filter(([_, ctxs]) => ctxs.length > 1)
		.map(([page, ctxs]) => ({
			pageNumber: page,
			contexts: ctxs.map((c) => ({ id: c.id, name: c.name })),
		}));
};
