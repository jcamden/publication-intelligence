import { and, eq, isNull } from "drizzle-orm";
import { db } from "../../db/client";
import { canonicalPageRules } from "../../db/schema";
import type {
	CanonicalPageRule,
	CanonicalPageRuleListItem,
	CreateRuleInput,
	ListRulesInput,
	UpdateRuleInput,
} from "./canonical-page-rule.types";

// ============================================================================
// Repository Layer - Database operations
// ============================================================================

export const listRules = async ({
	projectId,
	includeDeleted = false,
}: ListRulesInput): Promise<CanonicalPageRuleListItem[]> => {
	const whereConditions = [eq(canonicalPageRules.projectId, projectId)];

	if (!includeDeleted) {
		whereConditions.push(isNull(canonicalPageRules.deletedAt));
	}

	const results = await db
		.select({
			id: canonicalPageRules.id,
			projectId: canonicalPageRules.projectId,
			ruleType: canonicalPageRules.ruleType,
			documentPageStart: canonicalPageRules.documentPageStart,
			documentPageEnd: canonicalPageRules.documentPageEnd,
			label: canonicalPageRules.label,
			numeralType: canonicalPageRules.numeralType,
			startingCanonicalPage: canonicalPageRules.startingCanonicalPage,
			arbitrarySequence: canonicalPageRules.arbitrarySequence,
			createdAt: canonicalPageRules.createdAt,
			updatedAt: canonicalPageRules.updatedAt,
		})
		.from(canonicalPageRules)
		.where(and(...whereConditions))
		.orderBy(canonicalPageRules.documentPageStart);

	return results.map((row) => ({
		id: row.id,
		projectId: row.projectId,
		ruleType: row.ruleType,
		documentPageStart: row.documentPageStart,
		documentPageEnd: row.documentPageEnd,
		label: row.label ?? undefined,
		numeralType: row.numeralType ?? undefined,
		startingCanonicalPage: row.startingCanonicalPage ?? undefined,
		arbitrarySequence: row.arbitrarySequence ?? undefined,
		createdAt: row.createdAt.toISOString(),
		updatedAt: row.updatedAt?.toISOString(),
	}));
};

export const getRuleById = async ({
	id,
}: {
	id: string;
}): Promise<CanonicalPageRule | null> => {
	const [result] = await db
		.select()
		.from(canonicalPageRules)
		.where(
			and(eq(canonicalPageRules.id, id), isNull(canonicalPageRules.deletedAt)),
		);

	if (!result) {
		return null;
	}

	return {
		id: result.id,
		projectId: result.projectId,
		ruleType: result.ruleType,
		documentPageStart: result.documentPageStart,
		documentPageEnd: result.documentPageEnd,
		label: result.label ?? undefined,
		numeralType: result.numeralType ?? undefined,
		startingCanonicalPage: result.startingCanonicalPage ?? undefined,
		arbitrarySequence: result.arbitrarySequence ?? undefined,
		createdAt: result.createdAt.toISOString(),
		updatedAt: result.updatedAt?.toISOString(),
		deletedAt: result.deletedAt?.toISOString(),
	};
};

export const createRule = async ({
	input,
}: {
	input: CreateRuleInput;
}): Promise<CanonicalPageRule> => {
	const [newRule] = await db
		.insert(canonicalPageRules)
		.values({
			projectId: input.projectId,
			ruleType: input.ruleType,
			documentPageStart: input.documentPageStart,
			documentPageEnd: input.documentPageEnd,
			label: input.label,
			numeralType: input.numeralType,
			startingCanonicalPage: input.startingCanonicalPage,
			arbitrarySequence: input.arbitrarySequence,
		})
		.returning();

	if (!newRule) {
		throw new Error("Failed to create canonical page rule");
	}

	return {
		id: newRule.id,
		projectId: newRule.projectId,
		ruleType: newRule.ruleType,
		documentPageStart: newRule.documentPageStart,
		documentPageEnd: newRule.documentPageEnd,
		label: newRule.label ?? undefined,
		numeralType: newRule.numeralType ?? undefined,
		startingCanonicalPage: newRule.startingCanonicalPage ?? undefined,
		arbitrarySequence: newRule.arbitrarySequence ?? undefined,
		createdAt: newRule.createdAt.toISOString(),
		updatedAt: newRule.updatedAt?.toISOString(),
		deletedAt: newRule.deletedAt?.toISOString(),
	};
};

export const updateRule = async ({
	input,
}: {
	input: UpdateRuleInput;
}): Promise<CanonicalPageRule> => {
	const [updatedRule] = await db
		.update(canonicalPageRules)
		.set({
			...input,
			id: undefined,
			updatedAt: new Date(),
		})
		.where(
			and(
				eq(canonicalPageRules.id, input.id),
				isNull(canonicalPageRules.deletedAt),
			),
		)
		.returning();

	if (!updatedRule) {
		throw new Error("Rule not found");
	}

	return {
		id: updatedRule.id,
		projectId: updatedRule.projectId,
		ruleType: updatedRule.ruleType,
		documentPageStart: updatedRule.documentPageStart,
		documentPageEnd: updatedRule.documentPageEnd,
		label: updatedRule.label ?? undefined,
		numeralType: updatedRule.numeralType ?? undefined,
		startingCanonicalPage: updatedRule.startingCanonicalPage ?? undefined,
		arbitrarySequence: updatedRule.arbitrarySequence ?? undefined,
		createdAt: updatedRule.createdAt.toISOString(),
		updatedAt: updatedRule.updatedAt?.toISOString(),
		deletedAt: updatedRule.deletedAt?.toISOString(),
	};
};

export const deleteRule = async ({ id }: { id: string }): Promise<void> => {
	await db
		.update(canonicalPageRules)
		.set({ deletedAt: new Date() })
		.where(eq(canonicalPageRules.id, id));
};
