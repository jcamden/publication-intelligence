import {
	detectSequenceContinuity,
	generateArabicNumerals,
	generateRomanNumerals,
} from "@pubint/core";
import { TRPCError } from "@trpc/server";
import { logEvent } from "../../logger";
import { insertEvent } from "../event/event.repo";
import * as ruleRepo from "./canonical-page-rule.repo";
import type {
	CanonicalPageRule,
	CanonicalPageRuleListItem,
	CreateRuleInput,
	DeleteRuleInput,
	ListRulesInput,
	RuleConflict,
	UpdateRuleInput,
} from "./canonical-page-rule.types";

// ============================================================================
// Service Layer - Business logic and orchestration
// ============================================================================

export const listRules = async ({
	projectId,
	includeDeleted,
	userId,
	requestId,
}: ListRulesInput & {
	userId: string;
	requestId: string;
}): Promise<CanonicalPageRuleListItem[]> => {
	logEvent({
		event: "canonical_page_rule.list_requested",
		context: {
			requestId,
			userId,
			metadata: {
				projectId,
				includeDeleted,
			},
		},
	});

	return await ruleRepo.listRules({
		projectId,
		includeDeleted,
	});
};

export const createRule = async ({
	input,
	userId,
	requestId,
}: {
	input: CreateRuleInput;
	userId: string;
	requestId: string;
}): Promise<CanonicalPageRule> => {
	// Detect conflicts with existing rules
	const conflicts = await detectRuleConflicts({
		projectId: input.projectId,
		documentPageStart: input.documentPageStart,
		documentPageEnd: input.documentPageEnd,
		excludeRuleId: undefined,
	});

	if (conflicts.documentPages.length > 0) {
		logEvent({
			event: "canonical_page_rule.conflict_detected",
			context: {
				requestId,
				userId,
				metadata: {
					projectId: input.projectId,
					conflictingPages: conflicts.documentPages,
					existingRules: conflicts.existingRules.length,
				},
			},
		});

		throw new TRPCError({
			code: "CONFLICT",
			message: "Rule conflicts with existing rules",
			cause: conflicts,
		});
	}

	const rule = await ruleRepo.createRule({ input });

	logEvent({
		event: "canonical_page_rule.created",
		context: {
			requestId,
			userId,
			metadata: {
				ruleId: rule.id,
				projectId: input.projectId,
				ruleType: input.ruleType,
				documentPageRange: `${input.documentPageStart}-${input.documentPageEnd}`,
			},
		},
	});

	await insertEvent({
		type: "canonical_page_rule.created",
		projectId: input.projectId,
		userId,
		entityType: "IndexEntry",
		entityId: rule.id,
		metadata: {
			ruleType: rule.ruleType,
			documentPageStart: rule.documentPageStart,
			documentPageEnd: rule.documentPageEnd,
			label: rule.label,
		},
		requestId,
	});

	// Check for auto-join opportunities
	await autoJoinContiguousRules({
		projectId: input.projectId,
		userId,
		requestId,
	});

	return rule;
};

export const updateRule = async ({
	input,
	userId,
	requestId,
}: {
	input: UpdateRuleInput;
	userId: string;
	requestId: string;
}): Promise<CanonicalPageRule> => {
	const existingRule = await ruleRepo.getRuleById({ id: input.id });

	if (!existingRule) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Rule not found",
		});
	}

	// If updating page range, check for conflicts
	if (input.documentPageStart || input.documentPageEnd) {
		const newStart = input.documentPageStart ?? existingRule.documentPageStart;
		const newEnd = input.documentPageEnd ?? existingRule.documentPageEnd;

		const conflicts = await detectRuleConflicts({
			projectId: existingRule.projectId,
			documentPageStart: newStart,
			documentPageEnd: newEnd,
			excludeRuleId: input.id,
		});

		if (conflicts.documentPages.length > 0) {
			throw new TRPCError({
				code: "CONFLICT",
				message: "Rule update conflicts with existing rules",
				cause: conflicts,
			});
		}
	}

	const rule = await ruleRepo.updateRule({ input });

	logEvent({
		event: "canonical_page_rule.updated",
		context: {
			requestId,
			userId,
			metadata: {
				ruleId: input.id,
				updates: Object.keys(input).filter((k) => k !== "id"),
			},
		},
	});

	// Check for auto-join opportunities
	await autoJoinContiguousRules({
		projectId: existingRule.projectId,
		userId,
		requestId,
	});

	return rule;
};

export const deleteRule = async ({
	input,
	userId,
	requestId,
}: {
	input: DeleteRuleInput;
	userId: string;
	requestId: string;
}): Promise<void> => {
	// Get rule before deletion to access projectId
	const rule = await ruleRepo.getRuleById({ id: input.id });

	if (!rule) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Rule not found",
		});
	}

	await ruleRepo.deleteRule({ id: input.id });

	logEvent({
		event: "canonical_page_rule.deleted",
		context: {
			requestId,
			userId,
			metadata: {
				ruleId: input.id,
			},
		},
	});

	// Check for auto-join opportunities after deletion
	await autoJoinContiguousRules({
		projectId: rule.projectId,
		userId,
		requestId,
	});
};

// ============================================================================
// Conflict Detection Utilities
// ============================================================================

export const detectRuleConflicts = async ({
	projectId,
	documentPageStart,
	documentPageEnd,
	excludeRuleId,
}: {
	projectId: string;
	documentPageStart: number;
	documentPageEnd: number;
	excludeRuleId?: string;
}): Promise<RuleConflict> => {
	const existingRules = await ruleRepo.listRules({
		projectId,
		includeDeleted: false,
	});

	const conflictingRules = existingRules.filter((rule) => {
		if (excludeRuleId && rule.id === excludeRuleId) {
			return false;
		}

		const hasOverlap =
			documentPageStart <= rule.documentPageEnd &&
			documentPageEnd >= rule.documentPageStart;

		return hasOverlap;
	});

	const conflictingPages: number[] = [];

	for (const rule of conflictingRules) {
		const overlapStart = Math.max(documentPageStart, rule.documentPageStart);
		const overlapEnd = Math.min(documentPageEnd, rule.documentPageEnd);

		for (let page = overlapStart; page <= overlapEnd; page++) {
			if (!conflictingPages.includes(page)) {
				conflictingPages.push(page);
			}
		}
	}

	return {
		documentPages: conflictingPages.sort((a, b) => a - b),
		existingRules: conflictingRules.map((rule) => ({
			id: rule.id,
			ruleType: rule.ruleType,
			documentPageStart: rule.documentPageStart,
			documentPageEnd: rule.documentPageEnd,
			label: rule.label,
		})),
	};
};

// ============================================================================
// Auto-Join Contiguous Rules
// ============================================================================

const autoJoinContiguousRules = async ({
	projectId,
	userId,
	requestId,
}: {
	projectId: string;
	userId: string;
	requestId: string;
}): Promise<void> => {
	const rules = await ruleRepo.listRules({
		projectId,
		includeDeleted: false,
	});

	// Sort rules by document page start for proper contiguity checking
	const sortedRules = [...rules].sort(
		(a, b) => a.documentPageStart - b.documentPageStart,
	);

	// Process all rules (both positive and negative)
	for (let i = 0; i < sortedRules.length - 1; i++) {
		const rule1 = sortedRules[i];
		const rule2 = sortedRules[i + 1];

		if (!rule1 || !rule2) continue;

		// Check if rules are contiguous in document pages
		const areContiguousInDocPages =
			rule1.documentPageEnd + 1 === rule2.documentPageStart;

		if (!areContiguousInDocPages) continue;

		// Skip if numeral types don't match
		if (rule1.numeralType !== rule2.numeralType) continue;

		// For positive rules, also check canonical page continuity
		if (rule1.ruleType === "positive" && rule2.ruleType === "positive") {
			const canonical1 = generateCanonicalPages({ rule: rule1 });
			const canonical2 = generateCanonicalPages({ rule: rule2 });

			if (!canonical1 || !canonical2) continue;

			const lastPage1 = canonical1[canonical1.length - 1];
			const firstPage2 = canonical2[0];

			if (!lastPage1 || !firstPage2) continue;

			const combined = [...canonical1, ...canonical2];
			const areContiguousInCanonicalPages = detectSequenceContinuity({
				values: combined,
			});

			if (!areContiguousInCanonicalPages) continue;
		}

		// For negative rules, just check they're both negative
		if (rule1.ruleType !== rule2.ruleType) continue;

		// Determine which rule to keep based on page count, then createdAt
		const rule1PageCount = rule1.documentPageEnd - rule1.documentPageStart + 1;
		const rule2PageCount = rule2.documentPageEnd - rule2.documentPageStart + 1;

		let keepRule: typeof rule1;
		let deleteRule: typeof rule2;

		if (rule1PageCount > rule2PageCount) {
			keepRule = rule1;
			deleteRule = rule2;
		} else if (rule2PageCount > rule1PageCount) {
			keepRule = rule2;
			deleteRule = rule1;
		} else {
			// Equal page counts: keep the one with earlier createdAt
			const rule1Created = new Date(rule1.createdAt).getTime();
			const rule2Created = new Date(rule2.createdAt).getTime();
			if (rule1Created < rule2Created) {
				keepRule = rule1;
				deleteRule = rule2;
			} else {
				keepRule = rule2;
				deleteRule = rule1;
			}
		}

		logEvent({
			event: "canonical_page_rule.auto_join",
			context: {
				requestId,
				userId,
				metadata: {
					projectId,
					keepRuleId: keepRule.id,
					deleteRuleId: deleteRule.id,
					keepRuleRange: `${keepRule.documentPageStart}-${keepRule.documentPageEnd}`,
					deleteRuleRange: `${deleteRule.documentPageStart}-${deleteRule.documentPageEnd}`,
					newRange: `${Math.min(rule1.documentPageStart, rule2.documentPageStart)}-${Math.max(rule1.documentPageEnd, rule2.documentPageEnd)}`,
				},
			},
		});

		// Update keepRule to span both ranges
		await ruleRepo.updateRule({
			input: {
				id: keepRule.id,
				documentPageStart: Math.min(
					rule1.documentPageStart,
					rule2.documentPageStart,
				),
				documentPageEnd: Math.max(rule1.documentPageEnd, rule2.documentPageEnd),
			},
		});

		await ruleRepo.deleteRule({ id: deleteRule.id });

		// After merging, restart the loop to check for additional merges
		// This handles cases where multiple contiguous rules can be merged
		return autoJoinContiguousRules({ projectId, userId, requestId });
	}
};

// ============================================================================
// Canonical Page Generation
// ============================================================================

const generateCanonicalPages = ({
	rule,
}: {
	rule: CanonicalPageRuleListItem;
}): string[] | null => {
	if (rule.ruleType === "negative") {
		return null;
	}

	const pageCount = rule.documentPageEnd - rule.documentPageStart + 1;

	if (rule.numeralType === "arabic" && rule.startingCanonicalPage) {
		const start = Number.parseInt(rule.startingCanonicalPage, 10);
		if (Number.isNaN(start)) return null;
		return generateArabicNumerals({ start, count: pageCount });
	}

	if (rule.numeralType === "roman" && rule.startingCanonicalPage) {
		try {
			return generateRomanNumerals({
				start: rule.startingCanonicalPage,
				count: pageCount,
			});
		} catch {
			return null;
		}
	}

	if (rule.numeralType === "arbitrary" && rule.arbitrarySequence) {
		return rule.arbitrarySequence;
	}

	return null;
};
