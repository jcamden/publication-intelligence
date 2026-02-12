import { protectedProcedure, router } from "../../trpc";
import * as ruleService from "./canonical-page-rule.service";
import {
	CreateRuleSchema,
	DeleteRuleSchema,
	ListRulesSchema,
	UpdateRuleSchema,
} from "./canonical-page-rule.types";

// ============================================================================
// tRPC Router - HTTP/API layer for Canonical Page Rule management
// ============================================================================

export const canonicalPageRuleRouter = router({
	list: protectedProcedure
		.input(ListRulesSchema)
		.query(async ({ input, ctx }) => {
			return await ruleService.listRules({
				projectId: input.projectId,
				includeDeleted: input.includeDeleted,
				userId: ctx.user.id,
				requestId: ctx.requestId,
			});
		}),

	create: protectedProcedure
		.input(CreateRuleSchema)
		.mutation(async ({ input, ctx }) => {
			return await ruleService.createRule({
				input,
				userId: ctx.user.id,
				requestId: ctx.requestId,
			});
		}),

	update: protectedProcedure
		.input(UpdateRuleSchema)
		.mutation(async ({ input, ctx }) => {
			return await ruleService.updateRule({
				input,
				userId: ctx.user.id,
				requestId: ctx.requestId,
			});
		}),

	delete: protectedProcedure
		.input(DeleteRuleSchema)
		.mutation(async ({ input, ctx }) => {
			return await ruleService.deleteRule({
				input,
				userId: ctx.user.id,
				requestId: ctx.requestId,
			});
		}),
});
