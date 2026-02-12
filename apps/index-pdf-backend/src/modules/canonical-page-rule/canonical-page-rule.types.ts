import type { CanonicalPageRule as CoreCanonicalPageRule } from "@pubint/core";
import { z } from "zod";

// ============================================================================
// TypeScript Types
// ============================================================================

export type CanonicalPageRule = CoreCanonicalPageRule;

export type CanonicalPageRuleListItem = {
	id: string;
	projectId: string;
	ruleType: "positive" | "negative";
	documentPageStart: number;
	documentPageEnd: number;
	label?: string;
	numeralType?: "arabic" | "roman" | "arbitrary";
	startingCanonicalPage?: string;
	arbitrarySequence?: string[];
	createdAt: string;
	updatedAt?: string;
};

// ============================================================================
// Zod Schemas for Validation
// ============================================================================

export const RuleTypeEnum = z.enum(["positive", "negative"]);

export const NumeralTypeEnum = z.enum(["arabic", "roman", "arbitrary"]);

export const ListRulesSchema = z.object({
	projectId: z.string().uuid(),
	includeDeleted: z.boolean().optional(),
});

export type ListRulesInput = z.infer<typeof ListRulesSchema>;

export const CreateRuleSchema = z
	.object({
		projectId: z.string().uuid(),
		ruleType: RuleTypeEnum,
		documentPageStart: z.number().int().min(1),
		documentPageEnd: z.number().int().min(1),
		label: z.string().optional(),

		// For positive rules only:
		numeralType: NumeralTypeEnum.optional(),
		startingCanonicalPage: z.string().optional(),
		arbitrarySequence: z.array(z.string()).optional(),
	})
	.refine(
		(data) => {
			return data.documentPageStart <= data.documentPageEnd;
		},
		{
			message: "documentPageStart must be <= documentPageEnd",
		},
	)
	.refine(
		(data) => {
			if (data.ruleType === "positive") {
				return data.numeralType !== undefined;
			}
			return true;
		},
		{
			message: "numeralType is required for positive rules",
		},
	)
	.refine(
		(data) => {
			if (
				data.ruleType === "positive" &&
				(data.numeralType === "arabic" || data.numeralType === "roman")
			) {
				return data.startingCanonicalPage !== undefined;
			}
			return true;
		},
		{
			message:
				"startingCanonicalPage is required for arabic and roman numeral types",
		},
	)
	.refine(
		(data) => {
			if (data.ruleType === "positive" && data.numeralType === "arbitrary") {
				return data.arbitrarySequence !== undefined;
			}
			return true;
		},
		{
			message: "arbitrarySequence is required for arbitrary numeral type",
		},
	)
	.refine(
		(data) => {
			if (data.ruleType === "positive" && data.numeralType === "arbitrary") {
				const pageCount = data.documentPageEnd - data.documentPageStart + 1;
				return data.arbitrarySequence?.length === pageCount;
			}
			return true;
		},
		{
			message:
				"arbitrarySequence length must match document page range (documentPageEnd - documentPageStart + 1)",
		},
	);

export type CreateRuleInput = z.infer<typeof CreateRuleSchema>;

export const UpdateRuleSchema = z
	.object({
		id: z.string().uuid(),
		label: z.string().optional(),
		documentPageStart: z.number().int().min(1).optional(),
		documentPageEnd: z.number().int().min(1).optional(),
		numeralType: NumeralTypeEnum.optional(),
		startingCanonicalPage: z.string().optional(),
		arbitrarySequence: z.array(z.string()).optional(),
	})
	.refine(
		(data) => {
			if (
				data.documentPageStart !== undefined &&
				data.documentPageEnd !== undefined
			) {
				return data.documentPageStart <= data.documentPageEnd;
			}
			return true;
		},
		{
			message: "documentPageStart must be <= documentPageEnd",
		},
	);

export type UpdateRuleInput = z.infer<typeof UpdateRuleSchema>;

export const DeleteRuleSchema = z.object({
	id: z.string().uuid(),
});

export type DeleteRuleInput = z.infer<typeof DeleteRuleSchema>;

export type RuleConflict = {
	documentPages: number[];
	existingRules: Array<{
		id: string;
		ruleType: "positive" | "negative";
		documentPageStart: number;
		documentPageEnd: number;
		label?: string;
	}>;
};
