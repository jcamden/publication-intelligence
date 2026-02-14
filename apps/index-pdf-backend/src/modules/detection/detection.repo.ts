import { and, desc, eq, sql } from "drizzle-orm";
import { withUserContext } from "../../db/client";
import {
	detectionRuns,
	indexEntries,
	indexMentions,
	indexMentionTypes,
	projectIndexTypes,
	suppressedSuggestions,
} from "../../db/schema";
import type {
	CreateDetectionRunInput,
	CreateSuppressionInput,
	DetectionRun,
	DetectionRunListItem,
	SuppressedSuggestion,
	UpdateDetectionRunProgressInput,
	UpdateDetectionRunStatusInput,
} from "./detection.types";

// ============================================================================
// Repository Layer - Drizzle ORM queries
// ============================================================================

export const createDetectionRun = async ({
	userId,
	input,
}: {
	userId: string;
	input: CreateDetectionRunInput;
}): Promise<DetectionRun> => {
	return await withUserContext({
		userId,
		fn: async (tx) => {
			const [newRun] = await tx
				.insert(detectionRuns)
				.values({
					projectId: input.projectId,
					indexType: input.indexType,
					model: input.model,
					promptVersion: input.promptVersion,
					settingsHash: input.settingsHash,
					totalPages: input.totalPages,
					pageRangeStart: input.pageRangeStart,
					pageRangeEnd: input.pageRangeEnd,
					status: "queued",
					entriesCreated: 0,
					mentionsCreated: 0,
				})
				.returning();

			if (!newRun) {
				throw new Error("Failed to create detection run");
			}

			return {
				id: newRun.id,
				projectId: newRun.projectId,
				status: newRun.status,
				createdAt: newRun.createdAt,
				startedAt: newRun.startedAt,
				finishedAt: newRun.finishedAt,
				progressPage: newRun.progressPage,
				totalPages: newRun.totalPages,
				pageRangeStart: newRun.pageRangeStart,
				pageRangeEnd: newRun.pageRangeEnd,
				model: newRun.model,
				promptVersion: newRun.promptVersion,
				settingsHash: newRun.settingsHash,
				indexType: newRun.indexType,
				errorMessage: newRun.errorMessage,
				costEstimateUsd: newRun.costEstimateUsd,
				actualCostUsd: newRun.actualCostUsd,
				entriesCreated: newRun.entriesCreated,
				mentionsCreated: newRun.mentionsCreated,
			};
		},
	});
};

export const getDetectionRun = async ({
	userId,
	runId,
}: {
	userId: string;
	runId: string;
}): Promise<DetectionRun | null> => {
	return await withUserContext({
		userId,
		fn: async (tx) => {
			const [run] = await tx
				.select()
				.from(detectionRuns)
				.where(eq(detectionRuns.id, runId))
				.limit(1);

			if (!run) {
				return null;
			}

			return {
				id: run.id,
				projectId: run.projectId,
				status: run.status,
				createdAt: run.createdAt,
				startedAt: run.startedAt,
				finishedAt: run.finishedAt,
				progressPage: run.progressPage,
				totalPages: run.totalPages,
				pageRangeStart: run.pageRangeStart,
				pageRangeEnd: run.pageRangeEnd,
				model: run.model,
				promptVersion: run.promptVersion,
				settingsHash: run.settingsHash,
				indexType: run.indexType,
				errorMessage: run.errorMessage,
				costEstimateUsd: run.costEstimateUsd,
				actualCostUsd: run.actualCostUsd,
				entriesCreated: run.entriesCreated,
				mentionsCreated: run.mentionsCreated,
			};
		},
	});
};

export const listDetectionRuns = async ({
	userId,
	projectId,
}: {
	userId: string;
	projectId: string;
}): Promise<DetectionRunListItem[]> => {
	return await withUserContext({
		userId,
		fn: async (tx) => {
			const runs = await tx
				.select({
					id: detectionRuns.id,
					projectId: detectionRuns.projectId,
					status: detectionRuns.status,
					createdAt: detectionRuns.createdAt,
					startedAt: detectionRuns.startedAt,
					finishedAt: detectionRuns.finishedAt,
					progressPage: detectionRuns.progressPage,
					totalPages: detectionRuns.totalPages,
					pageRangeStart: detectionRuns.pageRangeStart,
					pageRangeEnd: detectionRuns.pageRangeEnd,
					model: detectionRuns.model,
					indexType: detectionRuns.indexType,
					entriesCreated: detectionRuns.entriesCreated,
					mentionsCreated: detectionRuns.mentionsCreated,
				})
				.from(detectionRuns)
				.where(eq(detectionRuns.projectId, projectId))
				.orderBy(desc(detectionRuns.createdAt));

			return runs;
		},
	});
};

export const updateDetectionRunStatus = async ({
	userId,
	input,
}: {
	userId: string;
	input: UpdateDetectionRunStatusInput;
}): Promise<void> => {
	await withUserContext({
		userId,
		fn: async (tx) => {
			await tx
				.update(detectionRuns)
				.set({
					status: input.status,
					startedAt: input.startedAt,
					finishedAt: input.finishedAt,
					errorMessage: input.errorMessage,
				})
				.where(eq(detectionRuns.id, input.runId));
		},
	});
};

export const updateDetectionRunProgress = async ({
	userId,
	input,
}: {
	userId: string;
	input: UpdateDetectionRunProgressInput;
}): Promise<void> => {
	await withUserContext({
		userId,
		fn: async (tx) => {
			await tx
				.update(detectionRuns)
				.set({
					progressPage: input.progressPage,
					entriesCreated: input.entriesCreated,
					mentionsCreated: input.mentionsCreated,
				})
				.where(eq(detectionRuns.id, input.runId));
		},
	});
};

export const cancelDetectionRun = async ({
	userId,
	runId,
}: {
	userId: string;
	runId: string;
}): Promise<void> => {
	await withUserContext({
		userId,
		fn: async (tx) => {
			await tx
				.update(detectionRuns)
				.set({
					status: "cancelled",
					finishedAt: new Date(),
				})
				.where(
					and(eq(detectionRuns.id, runId), eq(detectionRuns.status, "queued")),
				);
		},
	});
};

// ============================================================================
// Suppression Management
// ============================================================================

export const getSuppressedSuggestions = async ({
	userId,
	projectId,
}: {
	userId: string;
	projectId: string;
}): Promise<SuppressedSuggestion[]> => {
	return await withUserContext({
		userId,
		fn: async (tx) => {
			const results = await tx
				.select()
				.from(suppressedSuggestions)
				.where(eq(suppressedSuggestions.projectId, projectId));

			return results.map((r) => ({
				id: r.id,
				projectId: r.projectId,
				indexType: r.indexType,
				normalizedLabel: r.normalizedLabel,
				meaningType: r.meaningType,
				meaningId: r.meaningId,
				scope: r.scope,
				suppressionMode: r.suppressionMode,
				suppressedAt: r.suppressedAt,
				suppressedBy: r.suppressedBy,
				reason: r.reason,
			}));
		},
	});
};

export const createSuppression = async ({
	userId,
	input,
}: {
	userId: string;
	input: CreateSuppressionInput;
}): Promise<SuppressedSuggestion> => {
	return await withUserContext({
		userId,
		fn: async (tx) => {
			const [suppression] = await tx
				.insert(suppressedSuggestions)
				.values({
					projectId: input.projectId,
					indexType: input.indexType,
					normalizedLabel: input.normalizedLabel,
					meaningType: input.meaningType,
					meaningId: input.meaningId,
					suppressedBy: input.suppressedBy || userId,
					reason: input.reason,
				})
				.returning();

			if (!suppression) {
				throw new Error("Failed to create suppression");
			}

			return {
				id: suppression.id,
				projectId: suppression.projectId,
				indexType: suppression.indexType,
				normalizedLabel: suppression.normalizedLabel,
				meaningType: suppression.meaningType,
				meaningId: suppression.meaningId,
				scope: suppression.scope,
				suppressionMode: suppression.suppressionMode,
				suppressedAt: suppression.suppressedAt,
				suppressedBy: suppression.suppressedBy,
				reason: suppression.reason,
			};
		},
	});
};

// ============================================================================
// Entry & Mention Creation
// ============================================================================

export const createSuggestedEntry = async ({
	userId,
	projectId,
	projectIndexTypeId,
	detectionRunId,
	label,
	meaningType,
	meaningId,
	description,
}: {
	userId: string;
	projectId: string;
	projectIndexTypeId: string;
	detectionRunId: string;
	label: string;
	meaningType?: string;
	meaningId?: string;
	description?: string;
}): Promise<string> => {
	return await withUserContext({
		userId,
		fn: async (tx) => {
			// Generate slug from label
			const slug = label
				.toLowerCase()
				.replace(/[^a-z0-9]+/g, "-")
				.replace(/^-+|-+$/g, "");

			// Check if entry already exists
			const [existingEntry] = await tx
				.select({ id: indexEntries.id })
				.from(indexEntries)
				.where(
					and(
						eq(indexEntries.projectId, projectId),
						eq(indexEntries.projectIndexTypeId, projectIndexTypeId),
						eq(indexEntries.slug, slug),
					),
				)
				.limit(1);

			if (existingEntry) {
				return existingEntry.id;
			}

			// Create new entry
			const [entry] = await tx
				.insert(indexEntries)
				.values({
					projectId,
					projectIndexTypeId,
					detectionRunId,
					slug,
					label,
					meaningType,
					meaningId,
					description,
					status: "suggested",
				})
				.returning({ id: indexEntries.id });

			if (!entry) {
				throw new Error("Failed to create index entry");
			}

			return entry.id;
		},
	});
};

export const createSuggestedMention = async ({
	userId,
	entryId,
	documentId,
	detectionRunId,
	pageNumber,
	textSpan,
	bboxes,
	projectIndexTypeId,
}: {
	userId: string;
	entryId: string;
	documentId: string;
	detectionRunId: string;
	pageNumber: number;
	textSpan: string;
	bboxes: Array<{ x: number; y: number; width: number; height: number }>;
	projectIndexTypeId: string;
}): Promise<string> => {
	return await withUserContext({
		userId,
		fn: async (tx) => {
			const [mention] = await tx
				.insert(indexMentions)
				.values({
					entryId,
					documentId,
					detectionRunId,
					pageNumber,
					textSpan,
					bboxes: bboxes as never,
					rangeType: "single_page",
					mentionType: "text",
				})
				.returning({ id: indexMentions.id });

			if (!mention) {
				throw new Error("Failed to create index mention");
			}

			// Create junction table entry to link mention to its index type
			await tx.insert(indexMentionTypes).values({
				indexMentionId: mention.id,
				projectIndexTypeId,
			});

			return mention.id;
		},
	});
};

export const getProjectIndexTypeByType = async ({
	userId,
	projectId,
	indexType,
}: {
	userId: string;
	projectId: string;
	indexType: string;
}): Promise<string | null> => {
	return await withUserContext({
		userId,
		fn: async (tx) => {
			const [result] = await tx
				.select({ id: projectIndexTypes.id })
				.from(projectIndexTypes)
				.where(
					and(
						eq(projectIndexTypes.projectId, projectId),
						sql`${projectIndexTypes.highlightType}::text = ${indexType}`,
					),
				)
				.limit(1);

			return result?.id || null;
		},
	});
};
