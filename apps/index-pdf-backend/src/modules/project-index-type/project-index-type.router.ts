import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../../trpc";
import * as projectIndexTypeService from "./project-index-type.service";
import {
	EnableProjectIndexTypeSchema,
	UpdateProjectIndexTypeSchema,
} from "./project-index-type.types";

// ============================================================================
// tRPC Router - HTTP/API layer for ProjectIndexType management
// ============================================================================

export const projectIndexTypeRouter = router({
	// List user's available addons (no projectId required)
	listUserAddons: protectedProcedure.query(async ({ ctx }) => {
		try {
			return await projectIndexTypeService.listUserAddons({
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
					error instanceof Error ? error.message : "Failed to list user addons",
			});
		}
	}),

	// Grant addon to user (dev purposes - no billing)
	grantAddon: protectedProcedure
		.input(
			z.object({
				indexType: z.enum(["subject", "author", "scripture"]),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			try {
				await projectIndexTypeService.grantAddon({
					userId: ctx.user.id,
					indexType: input.indexType,
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
						error instanceof Error ? error.message : "Failed to grant addon",
				});
			}
		}),

	// Revoke addon from user (dev purposes)
	revokeAddon: protectedProcedure
		.input(
			z.object({
				indexType: z.enum(["subject", "author", "scripture"]),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			try {
				await projectIndexTypeService.revokeAddon({
					userId: ctx.user.id,
					indexType: input.indexType,
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
						error instanceof Error ? error.message : "Failed to revoke addon",
				});
			}
		}),

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
