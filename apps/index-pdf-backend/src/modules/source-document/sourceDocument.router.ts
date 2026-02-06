import { TRPCError } from "@trpc/server";
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
			try {
				return await sourceDocumentService.listSourceDocumentsByProject({
					projectId: input.projectId,
					userId: ctx.user.id,
					requestId: ctx.requestId,
				});
			} catch (error) {
				if (error instanceof TRPCError) {
					throw error;
				}

				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message:
						error instanceof Error
							? error.message
							: "Failed to list source documents",
				});
			}
		}),

	getById: protectedProcedure
		.input(z.object({ id: z.string().uuid() }))
		.query(async ({ ctx, input }) => {
			try {
				return await sourceDocumentService.getSourceDocumentById({
					documentId: input.id,
					userId: ctx.user.id,
					requestId: ctx.requestId,
				});
			} catch (error) {
				if (error instanceof TRPCError) {
					throw error;
				}

				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message:
						error instanceof Error
							? error.message
							: "Failed to get source document",
				});
			}
		}),

	delete: protectedProcedure
		.input(z.object({ id: z.string().uuid() }))
		.mutation(async ({ ctx, input }) => {
			try {
				await sourceDocumentService.deleteSourceDocument({
					documentId: input.id,
					userId: ctx.user.id,
					requestId: ctx.requestId,
				});

				return { success: true };
			} catch (error) {
				if (error instanceof TRPCError) {
					throw error;
				}

				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message:
						error instanceof Error
							? error.message
							: "Failed to delete source document",
				});
			}
		}),
});
