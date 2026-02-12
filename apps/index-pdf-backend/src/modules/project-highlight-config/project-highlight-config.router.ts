import { z } from "zod";
import { protectedProcedure, router } from "../../trpc";
import * as projectHighlightConfigService from "./project-highlight-config.service";
import {
	EnableProjectHighlightConfigSchema,
	EnableProjectIndexTypeSchema,
	UpdateProjectHighlightConfigSchema,
	UpdateProjectIndexTypeSchema,
} from "./project-highlight-config.types";

// ============================================================================
// tRPC Router - HTTP/API layer for ProjectHighlightConfig management
// ============================================================================

export const projectHighlightConfigRouter = router({
	// List user's available addons (no projectId required)
	listUserAddons: protectedProcedure.query(async ({ ctx }) => {
		return await projectHighlightConfigService.listUserAddons({
			userId: ctx.user.id,
			requestId: ctx.requestId,
		});
	}),

	// Grant addon to user (dev purposes - no billing)
	grantAddon: protectedProcedure
		.input(
			z.object({
				indexType: z.enum(["subject", "author", "scripture"]),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			await projectHighlightConfigService.grantAddon({
				userId: ctx.user.id,
				indexType: input.indexType,
				requestId: ctx.requestId,
			});

			return { success: true };
		}),

	// Revoke addon from user (dev purposes)
	revokeAddon: protectedProcedure
		.input(
			z.object({
				indexType: z.enum(["subject", "author", "scripture"]),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			await projectHighlightConfigService.revokeAddon({
				userId: ctx.user.id,
				indexType: input.indexType,
				requestId: ctx.requestId,
			});

			return { success: true };
		}),

	// List project's enabled highlight configs (both index types and region types)
	list: protectedProcedure
		.input(z.object({ projectId: z.string().uuid() }))
		.query(async ({ ctx, input }) => {
			return await projectHighlightConfigService.listProjectHighlightConfigs({
				projectId: input.projectId,
				userId: ctx.user.id,
				requestId: ctx.requestId,
			});
		}),

	// List available highlight types user can add to project
	listAvailable: protectedProcedure
		.input(z.object({ projectId: z.string().uuid() }))
		.query(async ({ ctx, input }) => {
			return await projectHighlightConfigService.listAvailableHighlightTypes({
				projectId: input.projectId,
				userId: ctx.user.id,
				requestId: ctx.requestId,
			});
		}),

	// Enable a highlight config for project (addon check for index types only)
	enable: protectedProcedure
		.input(EnableProjectHighlightConfigSchema)
		.mutation(async ({ ctx, input }) => {
			return await projectHighlightConfigService.enableProjectHighlightConfig({
				input,
				userId: ctx.user.id,
				requestId: ctx.requestId,
			});
		}),

	// Update project highlight config (color, visibility)
	update: protectedProcedure
		.input(
			z.object({
				id: z.string().uuid(),
				data: UpdateProjectHighlightConfigSchema,
			}),
		)
		.mutation(async ({ ctx, input }) => {
			return await projectHighlightConfigService.updateProjectHighlightConfig({
				id: input.id,
				input: input.data,
				userId: ctx.user.id,
				requestId: ctx.requestId,
			});
		}),

	// Disable highlight config in project (soft delete)
	disable: protectedProcedure
		.input(z.object({ id: z.string().uuid() }))
		.mutation(async ({ ctx, input }) => {
			return await projectHighlightConfigService.disableProjectHighlightConfig({
				id: input.id,
				userId: ctx.user.id,
				requestId: ctx.requestId,
			});
		}),
});

// Legacy export for backward compatibility
export const projectIndexTypeRouter = router({
	// List user's available addons (no projectId required)
	listUserAddons: protectedProcedure.query(async ({ ctx }) => {
		return await projectHighlightConfigService.listUserAddons({
			userId: ctx.user.id,
			requestId: ctx.requestId,
		});
	}),

	// Grant addon to user (dev purposes - no billing)
	grantAddon: protectedProcedure
		.input(
			z.object({
				indexType: z.enum(["subject", "author", "scripture"]),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			await projectHighlightConfigService.grantAddon({
				userId: ctx.user.id,
				indexType: input.indexType,
				requestId: ctx.requestId,
			});

			return { success: true };
		}),

	// Revoke addon from user (dev purposes)
	revokeAddon: protectedProcedure
		.input(
			z.object({
				indexType: z.enum(["subject", "author", "scripture"]),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			await projectHighlightConfigService.revokeAddon({
				userId: ctx.user.id,
				indexType: input.indexType,
				requestId: ctx.requestId,
			});

			return { success: true };
		}),

	// List project's enabled index types (filtered by user's addons)
	list: protectedProcedure
		.input(z.object({ projectId: z.string().uuid() }))
		.query(async ({ ctx, input }) => {
			return await projectHighlightConfigService.listProjectIndexTypes({
				projectId: input.projectId,
				userId: ctx.user.id,
				requestId: ctx.requestId,
			});
		}),

	// List available index types user can add to project
	listAvailable: protectedProcedure
		.input(z.object({ projectId: z.string().uuid() }))
		.query(async ({ ctx, input }) => {
			return await projectHighlightConfigService.listAvailableIndexTypes({
				projectId: input.projectId,
				userId: ctx.user.id,
				requestId: ctx.requestId,
			});
		}),

	// Enable an index type for project (user must have addon)
	enable: protectedProcedure
		.input(EnableProjectIndexTypeSchema)
		.mutation(async ({ ctx, input }) => {
			return await projectHighlightConfigService.enableProjectIndexType({
				input,
				userId: ctx.user.id,
				requestId: ctx.requestId,
			});
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
			return await projectHighlightConfigService.updateProjectIndexType({
				id: input.id,
				input: input.data,
				userId: ctx.user.id,
				requestId: ctx.requestId,
			});
		}),

	// Disable index type in project (soft delete)
	disable: protectedProcedure
		.input(z.object({ id: z.string().uuid() }))
		.mutation(async ({ ctx, input }) => {
			return await projectHighlightConfigService.disableProjectIndexType({
				id: input.id,
				userId: ctx.user.id,
				requestId: ctx.requestId,
			});
		}),
});
