/**
 * Canonical Page Computation
 *
 * Main logic for computing canonical page numbers with proper precedence:
 * 1. User-defined rules (positive/negative)
 * 2. Context-derived page numbers
 * 3. Document page number (baseline)
 */

import type {
	CanonicalPageColor,
	CanonicalPageInfo,
	CanonicalPageRule,
	CanonicalPageSource,
} from "./canonical-page.types";
import { generateCanonicalPageSequence } from "./canonical-page.utils";
import type { Context, ContextDerivedPageNumber } from "./context.types";
import { detectPageNumberConflicts } from "./context.utils";

/**
 * Compute canonical page numbers for all document pages
 * Returns a map of document page → canonical page info
 *
 * Precedence:
 * 1. Check for context conflicts - if any exist, return empty map
 * 2. User-defined rules (positive/negative) - highest priority
 * 3. Context-derived page numbers
 * 4. Unaccounted (document page number) - lowest priority
 */
export const computeCanonicalPages = ({
	documentPageCount,
	contexts,
	rules,
	contextDerivedPageNumbers,
}: {
	documentPageCount: number;
	contexts: Context[];
	rules: CanonicalPageRule[];
	contextDerivedPageNumbers: ContextDerivedPageNumber[];
}): Map<number, CanonicalPageInfo> => {
	const result = new Map<number, CanonicalPageInfo>();

	// Step 1: Check for context conflicts
	// If ANY page has conflicts, canonical pages cannot be computed
	// Pass contextDerivedPageNumbers so we only flag conflicts when multiple
	// contexts have actual detected text on the same page
	const conflicts = detectPageNumberConflicts({
		contexts,
		maxPage: documentPageCount,
		contextDerivedPageNumbers,
	});

	if (conflicts.length > 0) {
		// Return empty map - UI should show conflict resolution required
		return result;
	}

	// Step 2: Initialize all pages as unaccounted (red)
	for (let page = 1; page <= documentPageCount; page++) {
		result.set(page, {
			canonicalPage: String(page),
			source: "unaccounted",
			color: "red",
		});
	}

	// Step 3: Apply context-derived page numbers (blue)
	const contextDerivedMap = new Map<number, ContextDerivedPageNumber>();
	for (const derived of contextDerivedPageNumbers) {
		contextDerivedMap.set(derived.documentPage, derived);
	}

	for (let page = 1; page <= documentPageCount; page++) {
		const contextDerived = contextDerivedMap.get(page);
		if (contextDerived) {
			result.set(page, {
				canonicalPage: contextDerived.canonicalPage,
				source: "context",
				sourceId: contextDerived.contextId,
				color: "green",
			});
		}
	}

	// Step 4: Apply user-defined rules (blue for positive, gray for negative)
	// These OVERRIDE context-derived page numbers
	for (const rule of rules) {
		const pageCount = rule.documentPageEnd - rule.documentPageStart + 1;

		if (rule.ruleType === "negative") {
			// Negative rule: mark pages as ignored (gray)
			for (
				let page = rule.documentPageStart;
				page <= rule.documentPageEnd;
				page++
			) {
				result.set(page, {
					canonicalPage: null,
					source: "rule-negative",
					sourceId: rule.id,
					color: "gray",
				});
			}
		} else {
			// Positive rule: generate canonical pages (blue)
			const sequence = generateCanonicalPageSequence({
				ruleType: rule.ruleType,
				numeralType: rule.numeralType,
				startingCanonicalPage: rule.startingCanonicalPage,
				arbitrarySequence: rule.arbitrarySequence,
				pageCount,
			});

			if (sequence) {
				for (let i = 0; i < sequence.length; i++) {
					const page = rule.documentPageStart + i;
					const canonicalPage = sequence[i];
					if (canonicalPage) {
						result.set(page, {
							canonicalPage,
							source: "rule-positive",
							sourceId: rule.id,
							color: "blue",
						});
					}
				}
			}
		}
	}

	return result;
};

/**
 * Get canonical page info for a specific document page
 */
export const getCanonicalPageForPage = ({
	documentPage,
	canonicalPagesMap,
}: {
	documentPage: number;
	canonicalPagesMap: Map<number, CanonicalPageInfo>;
}): CanonicalPageInfo | null => {
	return canonicalPagesMap.get(documentPage) ?? null;
};

/**
 * Get summary statistics from canonical pages computation
 */
export const getCanonicalPagesStatistics = ({
	canonicalPagesMap,
}: {
	canonicalPagesMap: Map<number, CanonicalPageInfo>;
}): {
	totalPages: number;
	unaccountedPages: number;
	contextDerivedPages: number;
	userDefinedPositivePages: number;
	userDefinedNegativePages: number;
} => {
	let unaccountedPages = 0;
	let contextDerivedPages = 0;
	let userDefinedPositivePages = 0;
	let userDefinedNegativePages = 0;

	for (const [_, info] of canonicalPagesMap.entries()) {
		switch (info.source) {
			case "unaccounted":
				unaccountedPages++;
				break;
			case "context":
				contextDerivedPages++;
				break;
			case "rule-positive":
				userDefinedPositivePages++;
				break;
			case "rule-negative":
				userDefinedNegativePages++;
				break;
		}
	}

	return {
		totalPages: canonicalPagesMap.size,
		unaccountedPages,
		contextDerivedPages,
		userDefinedPositivePages,
		userDefinedNegativePages,
	};
};

/**
 * Segment with metadata for display components
 */
export type CanonicalPageSegment = {
	documentPageRange: { start: number; end: number };
	canonicalPageRange: { start: string | null; end: string | null };
	source: CanonicalPageSource;
	color: CanonicalPageColor;
	ruleId?: string;
	contextIds?: string[]; // Can be multiple contexts for merged context-derived ranges
	contextNames?: string[]; // Corresponding context names
	label?: string;
};

/**
 * Format canonical pages with metadata for rich UI display
 * Returns segments with rule/context information for popovers
 */
export const formatCanonicalPagesWithMetadata = ({
	canonicalPagesMap,
	rules,
	contexts,
}: {
	canonicalPagesMap: Map<number, CanonicalPageInfo>;
	rules: CanonicalPageRule[];
	contexts: Context[];
}): CanonicalPageSegment[] => {
	if (canonicalPagesMap.size === 0) {
		return [];
	}

	const segments: CanonicalPageSegment[] = [];
	let currentSegment: CanonicalPageSegment | null = null;

	const sortedEntries = Array.from(canonicalPagesMap.entries()).sort(
		([a], [b]) => a - b,
	);

	// Create lookup maps for rules and contexts
	const rulesMap = new Map(rules.map((rule) => [rule.id, rule]));
	const contextsMap = new Map(contexts.map((ctx) => [ctx.id, ctx]));

	for (const [docPage, info] of sortedEntries) {
		// Check if we can extend the current segment
		let canExtend = false;

		if (
			currentSegment &&
			docPage === currentSegment.documentPageRange.end + 1
		) {
			if (info.source === "context") {
				// For context-derived: merge if source is context (even if different contexts)
				canExtend = currentSegment.source === "context";
			} else {
				// For rules: merge only if same source and same rule ID
				canExtend =
					info.source === currentSegment.source &&
					info.sourceId === currentSegment.ruleId;
			}
		}

		if (!currentSegment || !canExtend) {
			// Start new segment
			if (currentSegment) {
				segments.push(currentSegment);
			}

			// Get metadata based on source
			let ruleId: string | undefined;
			let contextIds: string[] | undefined;
			let contextNames: string[] | undefined;
			let label: string | undefined;

			if (info.source === "rule-positive" || info.source === "rule-negative") {
				ruleId = info.sourceId;
				const rule = info.sourceId ? rulesMap.get(info.sourceId) : undefined;
				label = rule?.label || undefined;
			} else if (info.source === "context") {
				// Start with current context
				if (info.sourceId) {
					const context = contextsMap.get(info.sourceId);
					contextIds = [info.sourceId];
					contextNames = context?.name ? [context.name] : [];
				}
			}

			currentSegment = {
				documentPageRange: { start: docPage, end: docPage },
				canonicalPageRange: {
					start: info.canonicalPage,
					end: info.canonicalPage,
				},
				source: info.source,
				color: info.color,
				ruleId,
				contextIds,
				contextNames,
				label,
			};
		} else {
			// Extend current segment
			currentSegment.documentPageRange.end = docPage;
			currentSegment.canonicalPageRange.end = info.canonicalPage;

			// For context-derived, add context if it's new
			if (info.source === "context" && info.sourceId) {
				if (!currentSegment.contextIds) {
					currentSegment.contextIds = [];
				}
				if (!currentSegment.contextNames) {
					currentSegment.contextNames = [];
				}

				// Only add if not already in the list
				if (!currentSegment.contextIds.includes(info.sourceId)) {
					const context = contextsMap.get(info.sourceId);
					currentSegment.contextIds.push(info.sourceId);
					if (context?.name) {
						currentSegment.contextNames.push(context.name);
					}
				}
			}
		}
	}

	if (currentSegment) {
		segments.push(currentSegment);
	}

	return segments;
};

/**
 * Format canonical pages as a compact visual string
 * Example: "1-19 🔴  i-x 🔵  1-480 🔵  i-c 🟢"
 */
export const formatCanonicalPagesDisplay = ({
	canonicalPagesMap,
}: {
	canonicalPagesMap: Map<number, CanonicalPageInfo>;
}): string => {
	if (canonicalPagesMap.size === 0) {
		return "(No pages)";
	}

	const segments: Array<{
		startDocPage: number;
		endDocPage: number;
		startCanonical: string | null;
		endCanonical: string | null;
		source: CanonicalPageSource;
		color: CanonicalPageColor;
	}> = [];

	let currentSegment: (typeof segments)[0] | null = null;

	const sortedEntries = Array.from(canonicalPagesMap.entries()).sort(
		([a], [b]) => a - b,
	);

	for (const [docPage, info] of sortedEntries) {
		if (!currentSegment) {
			currentSegment = {
				startDocPage: docPage,
				endDocPage: docPage,
				startCanonical: info.canonicalPage,
				endCanonical: info.canonicalPage,
				source: info.source,
				color: info.color,
			};
		} else if (
			info.source === currentSegment.source &&
			docPage === currentSegment.endDocPage + 1
		) {
			currentSegment.endDocPage = docPage;
			currentSegment.endCanonical = info.canonicalPage;
		} else {
			segments.push(currentSegment);
			currentSegment = {
				startDocPage: docPage,
				endDocPage: docPage,
				startCanonical: info.canonicalPage,
				endCanonical: info.canonicalPage,
				source: info.source,
				color: info.color,
			};
		}
	}

	if (currentSegment) {
		segments.push(currentSegment);
	}

	const colorEmojis: Record<CanonicalPageColor, string> = {
		red: "🔴",
		blue: "🔵",
		green: "🟢",
		gray: "⚪",
	};

	return segments
		.map((segment) => {
			const emoji = colorEmojis[segment.color];

			if (segment.source === "rule-negative") {
				const range =
					segment.startDocPage === segment.endDocPage
						? `${segment.startDocPage}`
						: `${segment.startDocPage}-${segment.endDocPage}`;
				return `${range} ${emoji} (ignored)`;
			}

			if (segment.startCanonical === segment.endCanonical) {
				return `${segment.startCanonical} ${emoji}`;
			}

			return `${segment.startCanonical}-${segment.endCanonical} ${emoji}`;
		})
		.join("  ");
};
