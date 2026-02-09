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
			return await projectService.createProject({
				input,
				userId: ctx.user.id,
				requestId: ctx.requestId,
			});
		}),

	list: protectedProcedure.query(async ({ ctx }) => {
		return await projectService.listProjectsForUser({
			userId: ctx.user.id,
			requestId: ctx.requestId,
		});
	}),

	getById: protectedProcedure
		.input(z.object({ id: z.string().uuid() }))
		.query(async ({ ctx, input }) => {
			return await projectService.getProjectById({
				projectId: input.id,
				userId: ctx.user.id,
				requestId: ctx.requestId,
			});
		}),

	getByDir: protectedProcedure
		.input(z.object({ projectDir: z.string() }))
		.query(async ({ ctx, input }) => {
			return await projectService.getProjectByDir({
				projectDir: input.projectDir,
				userId: ctx.user.id,
				requestId: ctx.requestId,
			});
		}),

	update: protectedProcedure
		.input(
			z.object({
				id: z.string().uuid(),
				data: UpdateProjectSchema,
			}),
		)
		.mutation(async ({ ctx, input }) => {
			return await projectService.updateProject({
				projectId: input.id,
				input: input.data,
				userId: ctx.user.id,
				requestId: ctx.requestId,
			});
		}),

	delete: protectedProcedure
		.input(z.object({ id: z.string().uuid() }))
		.mutation(async ({ ctx, input }) => {
			await projectService.deleteProject({
				projectId: input.id,
				userId: ctx.user.id,
				requestId: ctx.requestId,
			});

			return { success: true };
		}),
});
