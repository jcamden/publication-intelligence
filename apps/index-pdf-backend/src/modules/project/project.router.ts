import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createAuthenticatedClient } from "../../db/client";
import { protectedProcedure, router } from "../../trpc";
import * as projectService from "./project.service";
import { CreateProjectSchema, UpdateProjectSchema } from "./project.types";

// ============================================================================
// tRPC Router - HTTP/API layer
// ============================================================================

export const projectRouter = router({
	create: protectedProcedure
		.input(CreateProjectSchema)
		.mutation(async ({ ctx, input }) => {
			try {
				const gelClient = createAuthenticatedClient({
					authToken: ctx.authToken,
				});

				return await projectService.createProject({
					gelClient,
					input,
					userId: ctx.user.id,
					requestId: ctx.requestId,
				});
			} catch (error) {
				// Re-throw TRPCErrors from service layer (e.g., NOT_FOUND)
				if (error instanceof TRPCError) {
					throw error;
				}

				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message:
						error instanceof Error ? error.message : "Failed to create project",
				});
			}
		}),

	list: protectedProcedure.query(async ({ ctx }) => {
		try {
			const gelClient = createAuthenticatedClient({
				authToken: ctx.authToken,
			});

			return await projectService.listProjectsForUser({
				gelClient,
				userId: ctx.user.id,
				requestId: ctx.requestId,
			});
		} catch (error) {
			// Re-throw TRPCErrors from service layer
			if (error instanceof TRPCError) {
				throw error;
			}

			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message:
					error instanceof Error ? error.message : "Failed to list projects",
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

				return await projectService.getProjectById({
					gelClient,
					projectId: input.id,
					userId: ctx.user.id,
					requestId: ctx.requestId,
				});
			} catch (error) {
				// Service layer throws TRPCError with NOT_FOUND via requireFound()
				if (error instanceof TRPCError) {
					throw error;
				}

				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message:
						error instanceof Error ? error.message : "Failed to get project",
				});
			}
		}),

	getByDir: protectedProcedure
		.input(z.object({ projectDir: z.string() }))
		.query(async ({ ctx, input }) => {
			try {
				const gelClient = createAuthenticatedClient({
					authToken: ctx.authToken,
				});

				return await projectService.getProjectByDir({
					gelClient,
					projectDir: input.projectDir,
					userId: ctx.user.id,
					requestId: ctx.requestId,
				});
			} catch (error) {
				// Service layer throws TRPCError with NOT_FOUND via requireFound()
				if (error instanceof TRPCError) {
					throw error;
				}

				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message:
						error instanceof Error ? error.message : "Failed to get project",
				});
			}
		}),

	update: protectedProcedure
		.input(
			z.object({
				id: z.string().uuid(),
				data: UpdateProjectSchema,
			}),
		)
		.mutation(async ({ ctx, input }) => {
			try {
				const gelClient = createAuthenticatedClient({
					authToken: ctx.authToken,
				});

				return await projectService.updateProject({
					gelClient,
					projectId: input.id,
					input: input.data,
					userId: ctx.user.id,
					requestId: ctx.requestId,
				});
			} catch (error) {
				// Service layer throws TRPCError with NOT_FOUND via requireFound()
				if (error instanceof TRPCError) {
					throw error;
				}

				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message:
						error instanceof Error ? error.message : "Failed to update project",
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

				await projectService.deleteProject({
					gelClient,
					projectId: input.id,
					userId: ctx.user.id,
					requestId: ctx.requestId,
				});

				return { success: true };
			} catch (error) {
				// Service layer throws TRPCError with NOT_FOUND via requireFound()
				if (error instanceof TRPCError) {
					throw error;
				}

				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message:
						error instanceof Error ? error.message : "Failed to delete project",
				});
			}
		}),
});
