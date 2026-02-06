import { TRPCError } from "@trpc/server";
import { z } from "zod";
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
				return await projectService.createProject({
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
			return await projectService.listProjectsForUser({
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
				return await projectService.getProjectById({
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
				return await projectService.getProjectByDir({
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
				return await projectService.updateProject({
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
				await projectService.deleteProject({
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
