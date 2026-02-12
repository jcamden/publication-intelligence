/**
 * Canonical Page Rule Types
 *
 * Shared types for canonical page numbering system
 */

import type { NumeralType } from "./canonical-page.utils";

export type CanonicalPageRuleType = "positive" | "negative";

export type CanonicalPageRule = {
	id: string;
	projectId: string;
	ruleType: CanonicalPageRuleType;
	documentPageStart: number;
	documentPageEnd: number;
	label?: string;

	// For positive rules only:
	numeralType?: NumeralType;
	startingCanonicalPage?: string;
	arbitrarySequence?: string[];

	createdAt: string;
	updatedAt?: string;
	deletedAt?: string;
};

export type CanonicalPageSource =
	| "unaccounted"
	| "context"
	| "rule-positive"
	| "rule-negative";

export type CanonicalPageColor = "red" | "blue" | "green" | "gray";

export type CanonicalPageInfo = {
	canonicalPage: string | null;
	source: CanonicalPageSource;
	sourceId?: string;
	color: CanonicalPageColor;
};
