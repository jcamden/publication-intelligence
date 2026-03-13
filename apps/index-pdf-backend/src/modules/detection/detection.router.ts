import { protectedProcedure, router } from "../../trpc";
import * as detectionService from "./detection.service";
import {
	AddEntryToGroupSchema,
	CancelDetectionRunSchema,
	CreateIndexEntryGroupSchema,
	DeleteIndexEntryGroupSchema,
	GetDetectionRunSchema,
	GetIndexEntryGroupSchema,
	ListDetectionRunsSchema,
	ListIndexEntryGroupsSchema,
	MergeGroupsSchema,
	RemoveEntryFromGroupSchema,
	ReorderGroupEntriesSchema,
	ReorderGroupsSchema,
	RunLlmSchema,
	RunMatcherSchema,
	UpdateIndexEntryGroupSchema,
} from "./detection.types";
import * as indexEntryGroupRepo from "./index-entry-group.repo";

// ============================================================================
// tRPC Router - HTTP/API layer
// ============================================================================

export const detectionRouter = router({
	runLlm: protectedProcedure
		.input(RunLlmSchema)
		.mutation(async ({ ctx, input }) => {
			return await detectionService.runLlm({
				userId: ctx.user.id,
				input,
			});
		}),

	runMatcher: protectedProcedure
		.input(RunMatcherSchema)
		.mutation(async ({ ctx, input }) => {
			return await detectionService.runMatcher({
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

	listIndexEntryGroups: protectedProcedure
		.input(ListIndexEntryGroupsSchema)
		.query(async ({ ctx, input }) => {
			return await indexEntryGroupRepo.listGroupsWithMeta({
				userId: ctx.user.id,
				projectId: input.projectId,
				projectIndexTypeId: input.projectIndexTypeId,
			});
		}),

	getIndexEntryGroup: protectedProcedure
		.input(GetIndexEntryGroupSchema)
		.query(async ({ ctx, input }) => {
			return await indexEntryGroupRepo.getGroupWithEntries({
				userId: ctx.user.id,
				groupId: input.groupId,
			});
		}),

	createIndexEntryGroup: protectedProcedure
		.input(CreateIndexEntryGroupSchema)
		.mutation(async ({ ctx, input }) => {
			return await indexEntryGroupRepo.createGroup({
				userId: ctx.user.id,
				input: {
					projectId: input.projectId,
					projectIndexTypeId: input.projectIndexTypeId,
					name: input.name,
					slug: input.slug,
					parserProfileId: input.parserProfileId,
					sortMode: input.sortMode,
				},
			});
		}),

	updateIndexEntryGroup: protectedProcedure
		.input(UpdateIndexEntryGroupSchema)
		.mutation(async ({ ctx, input }) => {
			const { groupId, ...rest } = input;
			return await indexEntryGroupRepo.updateGroup({
				userId: ctx.user.id,
				groupId,
				input: rest,
			});
		}),

	deleteIndexEntryGroup: protectedProcedure
		.input(DeleteIndexEntryGroupSchema)
		.mutation(async ({ ctx, input }) => {
			return await indexEntryGroupRepo.deleteGroup({
				userId: ctx.user.id,
				groupId: input.groupId,
			});
		}),

	addEntryToGroup: protectedProcedure
		.input(AddEntryToGroupSchema)
		.mutation(async ({ ctx, input }) => {
			return await indexEntryGroupRepo.addEntryToGroup({
				userId: ctx.user.id,
				groupId: input.groupId,
				entryId: input.entryId,
				position: input.position,
			});
		}),

	removeEntryFromGroup: protectedProcedure
		.input(RemoveEntryFromGroupSchema)
		.mutation(async ({ ctx, input }) => {
			await indexEntryGroupRepo.removeEntryFromGroup({
				userId: ctx.user.id,
				groupId: input.groupId,
				entryId: input.entryId,
			});
			return { success: true };
		}),

	reorderGroupEntries: protectedProcedure
		.input(ReorderGroupEntriesSchema)
		.mutation(async ({ ctx, input }) => {
			await indexEntryGroupRepo.reorderGroupEntries({
				userId: ctx.user.id,
				groupId: input.groupId,
				entryIds: input.entryIds,
			});
			return { success: true };
		}),

	reorderGroups: protectedProcedure
		.input(ReorderGroupsSchema)
		.mutation(async ({ ctx, input }) => {
			await indexEntryGroupRepo.reorderGroups({
				userId: ctx.user.id,
				projectId: input.projectId,
				projectIndexTypeId: input.projectIndexTypeId,
				groupIds: input.groupIds,
			});
			return { success: true };
		}),

	mergeGroups: protectedProcedure
		.input(MergeGroupsSchema)
		.mutation(async ({ ctx, input }) => {
			await indexEntryGroupRepo.mergeGroups({
				userId: ctx.user.id,
				sourceGroupId: input.sourceGroupId,
				targetGroupId: input.targetGroupId,
			});
			return { success: true };
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
