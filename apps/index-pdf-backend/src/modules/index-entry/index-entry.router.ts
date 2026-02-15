import { z } from "zod";
import { protectedProcedure, router } from "../../trpc";
import * as indexEntryService from "./index-entry.service";
import {
	CreateCrossReferenceSchema,
	CreateIndexEntrySchema,
	DeleteCrossReferenceSchema,
	DeleteIndexEntrySchema,
	TransferMatchersSchema,
	TransferMentionsSchema,
	UpdateIndexEntryParentSchema,
	UpdateIndexEntrySchema,
} from "./index-entry.types";

// ============================================================================
// tRPC Router - HTTP/API layer for IndexEntry management
// ============================================================================

export const indexEntryRouter = router({
	list: protectedProcedure
		.input(
			z.object({
				projectId: z.string().uuid(),
				projectIndexTypeId: z.string().uuid().optional(),
				includeDeleted: z.boolean().optional(),
			}),
		)
		.query(async ({ input, ctx }) => {
			return await indexEntryService.listIndexEntries({
				projectId: input.projectId,
				projectIndexTypeId: input.projectIndexTypeId,
				includeDeleted: input.includeDeleted,
				userId: ctx.user.id,
				requestId: ctx.requestId,
			});
		}),

	create: protectedProcedure
		.input(CreateIndexEntrySchema)
		.mutation(async ({ input, ctx }) => {
			return await indexEntryService.createIndexEntry({
				input,
				userId: ctx.user.id,
				requestId: ctx.requestId,
			});
		}),

	update: protectedProcedure
		.input(UpdateIndexEntrySchema)
		.mutation(async ({ input, ctx }) => {
			return await indexEntryService.updateIndexEntry({
				input,
				userId: ctx.user.id,
				requestId: ctx.requestId,
			});
		}),

	updateParent: protectedProcedure
		.input(UpdateIndexEntryParentSchema)
		.mutation(async ({ input, ctx }) => {
			return await indexEntryService.updateIndexEntryParent({
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
			return await indexEntryService.approveIndexEntry({
				id: input.id,
				projectId: input.projectId,
				userId: ctx.user.id,
				requestId: ctx.requestId,
			});
		}),

	delete: protectedProcedure
		.input(DeleteIndexEntrySchema)
		.mutation(async ({ input, ctx }) => {
			return await indexEntryService.deleteIndexEntry({
				input,
				userId: ctx.user.id,
				requestId: ctx.requestId,
			});
		}),

	search: protectedProcedure
		.input(
			z.object({
				projectId: z.string().uuid(),
				projectIndexTypeId: z.string().uuid(),
				query: z.string().min(1),
				limit: z.number().int().min(1).max(100).optional().default(20),
			}),
		)
		.query(async ({ input, ctx }) => {
			return await indexEntryService.searchIndexEntries({
				projectId: input.projectId,
				projectIndexTypeId: input.projectIndexTypeId,
				query: input.query,
				limit: input.limit,
				userId: ctx.user.id,
				requestId: ctx.requestId,
			});
		}),

	checkExactMatch: protectedProcedure
		.input(
			z.object({
				projectId: z.string().uuid(),
				projectIndexTypeId: z.string().uuid(),
				text: z.string(),
			}),
		)
		.query(async ({ input, ctx }) => {
			return await indexEntryService.checkExactMatch({
				projectId: input.projectId,
				projectIndexTypeId: input.projectIndexTypeId,
				text: input.text,
				userId: ctx.user.id,
				requestId: ctx.requestId,
			});
		}),

	// ============================================================================
	// Cross-Reference Endpoints
	// ============================================================================

	crossReference: router({
		list: protectedProcedure
			.input(
				z.object({
					entryId: z.string().uuid(),
				}),
			)
			.query(async ({ input, ctx }) => {
				return await indexEntryService.listCrossReferences({
					entryId: input.entryId,
					userId: ctx.user.id,
					requestId: ctx.requestId,
				});
			}),

		create: protectedProcedure
			.input(CreateCrossReferenceSchema)
			.mutation(async ({ input, ctx }) => {
				return await indexEntryService.createCrossReference({
					input,
					userId: ctx.user.id,
					requestId: ctx.requestId,
				});
			}),

		delete: protectedProcedure
			.input(DeleteCrossReferenceSchema)
			.mutation(async ({ input, ctx }) => {
				return await indexEntryService.deleteCrossReference({
					input,
					userId: ctx.user.id,
					requestId: ctx.requestId,
				});
			}),

		transferMentions: protectedProcedure
			.input(TransferMentionsSchema)
			.mutation(async ({ input, ctx }) => {
				return await indexEntryService.transferMentions({
					input,
					userId: ctx.user.id,
					requestId: ctx.requestId,
				});
			}),

		transferMatchers: protectedProcedure
			.input(TransferMatchersSchema)
			.mutation(async ({ input, ctx }) => {
				return await indexEntryService.transferMatchers({
					input,
					userId: ctx.user.id,
					requestId: ctx.requestId,
				});
			}),
	}),
});
