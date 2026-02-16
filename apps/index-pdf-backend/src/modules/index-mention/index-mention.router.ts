import { z } from "zod";
import { protectedProcedure, router } from "../../trpc";
import * as indexMentionService from "./index-mention.service";
import {
	BulkCreateIndexMentionsSchema,
	CreateIndexMentionSchema,
	DeleteIndexMentionSchema,
	ListIndexMentionsSchema,
	UpdateIndexMentionSchema,
	UpdateIndexMentionTypesSchema,
} from "./index-mention.types";

// ============================================================================
// tRPC Router - HTTP/API layer for IndexMention management
// ============================================================================

export const indexMentionRouter = router({
	list: protectedProcedure
		.input(ListIndexMentionsSchema)
		.query(async ({ input, ctx }) => {
			return await indexMentionService.listIndexMentions({
				projectId: input.projectId,
				documentId: input.documentId,
				pageNumber: input.pageNumber,
				projectIndexTypeIds: input.projectIndexTypeIds,
				includeDeleted: input.includeDeleted,
				userId: ctx.user.id,
				requestId: ctx.requestId,
			});
		}),

	create: protectedProcedure
		.input(CreateIndexMentionSchema)
		.mutation(async ({ input, ctx }) => {
			return await indexMentionService.createIndexMention({
				input,
				userId: ctx.user.id,
				requestId: ctx.requestId,
			});
		}),

	update: protectedProcedure
		.input(UpdateIndexMentionSchema)
		.mutation(async ({ input, ctx }) => {
			return await indexMentionService.updateIndexMention({
				input,
				userId: ctx.user.id,
				requestId: ctx.requestId,
			});
		}),

	updateIndexTypes: protectedProcedure
		.input(UpdateIndexMentionTypesSchema)
		.mutation(async ({ input, ctx }) => {
			return await indexMentionService.updateIndexMentionTypes({
				input,
				userId: ctx.user.id,
				requestId: ctx.requestId,
			});
		}),

	approve: protectedProcedure
		.input(
			z.object({
				id: z.string().uuid(),
				projectId: z.string().uuid(),
			}),
		)
		.mutation(async ({ input, ctx }) => {
			return await indexMentionService.approveIndexMention({
				id: input.id,
				projectId: input.projectId,
				userId: ctx.user.id,
				requestId: ctx.requestId,
			});
		}),

	bulkCreate: protectedProcedure
		.input(BulkCreateIndexMentionsSchema)
		.mutation(async ({ input, ctx }) => {
			return await indexMentionService.bulkCreateIndexMentions({
				input,
				userId: ctx.user.id,
				requestId: ctx.requestId,
			});
		}),

	delete: protectedProcedure
		.input(DeleteIndexMentionSchema)
		.mutation(async ({ input, ctx }) => {
			return await indexMentionService.deleteIndexMention({
				input,
				userId: ctx.user.id,
				requestId: ctx.requestId,
			});
		}),

	deleteAllByEntry: protectedProcedure
		.input(
			z.object({
				entryId: z.string().uuid(),
				projectId: z.string().uuid(),
			}),
		)
		.mutation(async ({ input, ctx }) => {
			return await indexMentionService.deleteAllMentionsByEntry({
				entryId: input.entryId,
				projectId: input.projectId,
				userId: ctx.user.id,
				requestId: ctx.requestId,
			});
		}),
});
