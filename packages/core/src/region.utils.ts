/**
 * Region Utilities - Page configuration logic
 *
 * Functions for determining which pages a region applies to.
 */

import type { Region, RegionDerivedPageNumber } from "./region.types";

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
 * Check if a region applies to a specific page
 */
export const appliesToPage = ({
	region,
	targetPage,
}: {
	region: Region;
	targetPage: number;
}): boolean => {
	// Check base page config mode
	switch (region.pageConfigMode) {
		case "this_page":
			if (region.pageNumber !== targetPage) return false;
			break;
		case "all_pages":
			// Applies to all pages
			break;
		case "page_range":
		case "custom": {
			// Parse page range and check if targetPage is in the list
			if (!region.pageRange) return false;

			try {
				const pages = parsePageRange({ rangeStr: region.pageRange });
				if (!pages.includes(targetPage)) return false;
			} catch {
				// Invalid page range, don't apply
				return false;
			}
			break;
		}
	}

	// Apply everyOther filter if enabled
	if (region.everyOther && region.startPage !== undefined) {
		const offset = targetPage - region.startPage;
		if (offset < 0 || offset % 2 !== 0) {
			return false;
		}
		// Check if beyond end page (if specified)
		if (region.endPage !== undefined && targetPage > region.endPage) {
			return false;
		}
	}

	// Check if page is explicitly excluded
	if (region.exceptPages?.includes(targetPage)) {
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
	region,
}: {
	region: Pick<
		Region,
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
	} = region;

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
 * Get all page numbers that a region applies to
 * @param maxPage - Maximum page number in document (required for all_pages mode)
 */
export const getApplicablePages = ({
	region,
	maxPage,
}: {
	region: Region;
	maxPage: number;
}): number[] => {
	const pages: number[] = [];

	// Determine base pages based on mode
	switch (region.pageConfigMode) {
		case "this_page":
			if (region.pageNumber) {
				pages.push(region.pageNumber);
			}
			break;
		case "all_pages":
			for (let i = 1; i <= maxPage; i++) {
				pages.push(i);
			}
			break;
		case "page_range":
		case "custom":
			if (region.pageRange) {
				try {
					pages.push(...parsePageRange({ rangeStr: region.pageRange }));
				} catch {
					// Invalid page range, return empty
					return [];
				}
			}
			break;
	}

	// Apply everyOther filter if enabled
	const filtered =
		region.everyOther && region.startPage !== undefined
			? pages.filter((page) => {
					const startPage = region.startPage;
					if (startPage === undefined) return false;
					const offset = page - startPage;
					if (offset < 0 || offset % 2 !== 0) {
						return false;
					}
					// Check if beyond end page (if specified)
					if (region.endPage !== undefined && page > region.endPage) {
						return false;
					}
					return true;
				})
			: pages;

	// Remove exceptions
	const exceptSet = new Set(region.exceptPages || []);
	return filtered.filter((page) => !exceptSet.has(page));
};

/**
 * Conflict report for a specific page
 */
export type PageNumberConflict = {
	pageNumber: number;
	regions: Array<{ id: string; name: string }>;
};

/**
 * Detect conflicts where multiple page_number regions apply to the same page
 * Returns array of conflicts (pages with 2+ page_number regions)
 *
 * When regionDerivedPageNumbers is provided, only considers regions that have
 * detected text (i.e., regions that appear in the regionDerivedPageNumbers array).
 * This avoids false positives where multiple regions apply to a page but only
 * one has actual text in its bounding box.
 */
export const detectPageNumberConflicts = ({
	regions,
	maxPage,
	regionDerivedPageNumbers,
}: {
	regions: Region[];
	maxPage: number;
	regionDerivedPageNumbers?: RegionDerivedPageNumber[];
}): PageNumberConflict[] => {
	// Filter to only page_number regions
	const pageNumberRegions = regions.filter(
		(reg) => reg.regionType === "page_number",
	);

	// If regionDerivedPageNumbers provided, build a map of page -> regionIds with detected text
	let regionsWithTextPerPage: Map<number, Set<string>> | undefined;
	if (regionDerivedPageNumbers) {
		regionsWithTextPerPage = new Map();
		for (const derived of regionDerivedPageNumbers) {
			if (!regionsWithTextPerPage.has(derived.documentPage)) {
				regionsWithTextPerPage.set(derived.documentPage, new Set());
			}
			regionsWithTextPerPage.get(derived.documentPage)?.add(derived.regionId);
		}
	}

	// Map: pageNumber -> regions that apply to that page
	const conflictsByPage = new Map<number, Region[]>();

	for (const region of pageNumberRegions) {
		const applicablePages = getApplicablePages({ region, maxPage });
		for (const page of applicablePages) {
			// If we have regionDerivedPageNumbers, only count this region if it has detected text on this page
			if (
				regionsWithTextPerPage &&
				!regionsWithTextPerPage.get(page)?.has(region.id)
			) {
				continue;
			}

			if (!conflictsByPage.has(page)) {
				conflictsByPage.set(page, []);
			}
			conflictsByPage.get(page)?.push(region);
		}
	}

	// Return pages with 2+ regions (conflicts)
	return Array.from(conflictsByPage.entries())
		.filter(([_, regs]) => regs.length > 1)
		.map(([page, regs]) => ({
			pageNumber: page,
			regions: regs.map((r) => ({ id: r.id, name: r.name })),
		}));
};
