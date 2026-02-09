import { z } from "zod";
import { protectedProcedure, router } from "../../trpc";
import * as sourceDocumentService from "./sourceDocument.service";

// ============================================================================
// tRPC Router - HTTP/API layer
// ============================================================================

export const sourceDocumentRouter = router({
	listByProject: protectedProcedure
		.input(z.object({ projectId: z.string().uuid() }))
		.query(async ({ ctx, input }) => {
			return await sourceDocumentService.listSourceDocumentsByProject({
				projectId: input.projectId,
				userId: ctx.user.id,
				requestId: ctx.requestId,
			});
		}),

	getById: protectedProcedure
		.input(z.object({ id: z.string().uuid() }))
		.query(async ({ ctx, input }) => {
			return await sourceDocumentService.getSourceDocumentById({
				documentId: input.id,
				userId: ctx.user.id,
				requestId: ctx.requestId,
			});
		}),

	delete: protectedProcedure
		.input(z.object({ id: z.string().uuid() }))
		.mutation(async ({ ctx, input }) => {
			await sourceDocumentService.deleteSourceDocument({
				documentId: input.id,
				userId: ctx.user.id,
				requestId: ctx.requestId,
			});

			return { success: true };
		}),
});
