import { protectedProcedure, router } from "../../trpc";
import * as regionService from "./region.service";
import {
	CreateRegionSchema,
	DeleteRegionSchema,
	GetRegionsForPageSchema,
	ListRegionsSchema,
	UpdateRegionSchema,
} from "./region.types";

// ============================================================================
// tRPC Router - HTTP/API layer for Region management
// ============================================================================

export const regionRouter = router({
	list: protectedProcedure
		.input(ListRegionsSchema)
		.query(async ({ input, ctx }) => {
			return await regionService.listRegions({
				projectId: input.projectId,
				includeDeleted: input.includeDeleted,
				userId: ctx.user.id,
				requestId: ctx.requestId,
			});
		}),

	getForPage: protectedProcedure
		.input(GetRegionsForPageSchema)
		.query(async ({ input, ctx }) => {
			return await regionService.getRegionsForPage({
				projectId: input.projectId,
				pageNumber: input.pageNumber,
				userId: ctx.user.id,
				requestId: ctx.requestId,
			});
		}),

	create: protectedProcedure
		.input(CreateRegionSchema)
		.mutation(async ({ input, ctx }) => {
			return await regionService.createRegion({
				input,
				userId: ctx.user.id,
				requestId: ctx.requestId,
			});
		}),

	update: protectedProcedure
		.input(UpdateRegionSchema)
		.mutation(async ({ input, ctx }) => {
			return await regionService.updateRegion({
				input,
				userId: ctx.user.id,
				requestId: ctx.requestId,
			});
		}),

	delete: protectedProcedure
		.input(DeleteRegionSchema)
		.mutation(async ({ input, ctx }) => {
			return await regionService.deleteRegion({
				input,
				userId: ctx.user.id,
				requestId: ctx.requestId,
			});
		}),
});
