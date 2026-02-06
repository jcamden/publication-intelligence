import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../../trpc";
import * as projectIndexTypeService from "./project-index-type.service";
import {
	EnableProjectIndexTypeSchema,
	ReorderProjectIndexTypesSchema,
	UpdateProjectIndexTypeSchema,
} from "./project-index-type.types";

// ============================================================================
// tRPC Router - HTTP/API layer for ProjectIndexType management
// ============================================================================

export const projectIndexTypeRouter = router({
	// List project's enabled index types (filtered by user's addons)
	list: protectedProcedure
		.input(z.object({ projectId: z.string().uuid() }))
		.query(async ({ ctx, input }) => {
			try {
				return await projectIndexTypeService.listProjectIndexTypes({
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
							: "Failed to list project index types",
				});
			}
		}),

	// List available index types user can add to project
	listAvailable: protectedProcedure
		.input(z.object({ projectId: z.string().uuid() }))
		.query(async ({ ctx, input }) => {
			try {
				return await projectIndexTypeService.listAvailableIndexTypes({
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
							: "Failed to list available index types",
				});
			}
		}),

	// Enable an index type for project (user must have addon)
	enable: protectedProcedure
		.input(EnableProjectIndexTypeSchema)
		.mutation(async ({ ctx, input }) => {
			try {
				return await projectIndexTypeService.enableProjectIndexType({
					input,
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
							: "Failed to enable index type",
				});
			}
		}),

	// Update project index type (color, visibility)
	update: protectedProcedure
		.input(
			z.object({
				id: z.string().uuid(),
				data: UpdateProjectIndexTypeSchema,
			}),
		)
		.mutation(async ({ ctx, input }) => {
			try {
				return await projectIndexTypeService.updateProjectIndexType({
					id: input.id,
					input: input.data,
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
							: "Failed to update project index type",
				});
			}
		}),

	// Reorder project index types (change ordinals)
	reorder: protectedProcedure
		.input(ReorderProjectIndexTypesSchema)
		.mutation(async ({ ctx, input }) => {
			try {
				await projectIndexTypeService.reorderProjectIndexTypes({
					input,
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
							: "Failed to reorder project index types",
				});
			}
		}),

	// Disable index type in project (soft delete)
	disable: protectedProcedure
		.input(z.object({ id: z.string().uuid() }))
		.mutation(async ({ ctx, input }) => {
			try {
				return await projectIndexTypeService.disableProjectIndexType({
					id: input.id,
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
							: "Failed to disable project index type",
				});
			}
		}),
});
