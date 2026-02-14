import { protectedProcedure, router } from "../../trpc";
import * as detectionService from "./detection.service";
import {
	CancelDetectionRunSchema,
	GetDetectionRunSchema,
	ListDetectionRunsSchema,
	RunDetectionSchema,
} from "./detection.types";

// ============================================================================
// tRPC Router - HTTP/API layer
// ============================================================================

export const detectionRouter = router({
	runDetection: protectedProcedure
		.input(RunDetectionSchema)
		.mutation(async ({ ctx, input }) => {
			return await detectionService.runDetection({
				userId: ctx.user.id,
				input,
			});
		}),

	getDetectionRun: protectedProcedure
		.input(GetDetectionRunSchema)
		.query(async ({ ctx, input }) => {
			return await detectionService.getDetectionRun({
				userId: ctx.user.id,
				runId: input.runId,
			});
		}),

	listDetectionRuns: protectedProcedure
		.input(ListDetectionRunsSchema)
		.query(async ({ ctx, input }) => {
			return await detectionService.listDetectionRuns({
				userId: ctx.user.id,
				projectId: input.projectId,
			});
		}),

	cancelDetectionRun: protectedProcedure
		.input(CancelDetectionRunSchema)
		.mutation(async ({ ctx, input }) => {
			await detectionService.cancelDetectionRun({
				userId: ctx.user.id,
				runId: input.runId,
			});
			return { success: true };
		}),
});
