import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createAuthenticatedClient } from "../../db/client";
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
				const gelClient = createAuthenticatedClient({
					authToken: ctx.authToken,
				});

				return await sourceDocumentService.listSourceDocumentsByProject({
					gelClient,
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
				const gelClient = createAuthenticatedClient({
					authToken: ctx.authToken,
				});

				return await sourceDocumentService.getSourceDocumentById({
					gelClient,
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
				const gelClient = createAuthenticatedClient({
					authToken: ctx.authToken,
				});

				await sourceDocumentService.deleteSourceDocument({
					gelClient,
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
