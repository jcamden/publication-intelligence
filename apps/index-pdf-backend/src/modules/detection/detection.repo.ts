import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { withUserContext } from "../../db/client";
import {
	detectionRuns,
	indexEntries,
	indexMatchers,
	indexMentions,
	projectIndexTypes,
	suppressedSuggestions,
} from "../../db/schema";
import type { AliasInput } from "./alias-engine.types";
import { bboxesHash as computeBboxesHash } from "./bbox-canonical.utils";
import type {
	CreateDetectionRunInput,
	CreateSuppressionInput,
	DetectionRun,
	DetectionRunListItem,
	SuppressedSuggestion,
	UpdateDetectionRunProgressInput,
	UpdateDetectionRunStatusInput,
} from "./detection.types";
import { isLlmRunInput } from "./detection.types";

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
			const base = {
				projectId: input.projectId,
				indexType: input.indexType,
				settingsHash: input.settingsHash,
				totalPages: input.totalPages,
				status: "queued" as const,
				entriesCreated: 0,
				mentionsCreated: 0,
			};

			const values = isLlmRunInput(input)
				? {
						...base,
						runType: "llm" as const,
						scope: null,
						pageId: null,
						indexEntryGroupIds: null,
						runAllGroups: null,
						model: input.model,
						promptVersion: input.promptVersion,
						pageRangeStart: input.pageRangeStart,
						pageRangeEnd: input.pageRangeEnd,
					}
				: {
						...base,
						runType: "matcher" as const,
						scope: input.scope,
						pageId: input.pageId ?? null,
						indexEntryGroupIds: input.indexEntryGroupIds ?? null,
						runAllGroups: input.runAllGroups ?? null,
						model: null,
						promptVersion: null,
						pageRangeStart: undefined,
						pageRangeEnd: undefined,
					};

			const [newRun] = await tx
				.insert(detectionRuns)
				.values(values)
				.returning();

			if (!newRun) {
				throw new Error("Failed to create detection run");
			}

			return mapRowToDetectionRun(newRun);
		},
	});
};

function mapRowToDetectionRun(row: {
	id: string;
	projectId: string;
	runType: "llm" | "matcher";
	scope: "project" | "page" | null;
	pageId: string | null;
	indexEntryGroupIds: string[] | null;
	runAllGroups: boolean | null;
	status: string;
	createdAt: Date;
	startedAt: Date | null;
	finishedAt: Date | null;
	progressPage: number | null;
	totalPages: number | null;
	pageRangeStart: number | null;
	pageRangeEnd: number | null;
	model: string | null;
	promptVersion: string | null;
	settingsHash: string | null;
	indexType: string;
	errorMessage: string | null;
	costEstimateUsd: string | null;
	actualCostUsd: string | null;
	entriesCreated: number | null;
	mentionsCreated: number | null;
}): DetectionRun {
	return {
		id: row.id,
		projectId: row.projectId,
		runType: row.runType,
		scope: row.scope,
		pageId: row.pageId,
		indexEntryGroupIds: row.indexEntryGroupIds,
		runAllGroups: row.runAllGroups,
		status: row.status as DetectionRun["status"],
		createdAt: row.createdAt,
		startedAt: row.startedAt,
		finishedAt: row.finishedAt,
		progressPage: row.progressPage,
		totalPages: row.totalPages,
		pageRangeStart: row.pageRangeStart,
		pageRangeEnd: row.pageRangeEnd,
		model: row.model,
		promptVersion: row.promptVersion,
		settingsHash: row.settingsHash,
		indexType: row.indexType,
		errorMessage: row.errorMessage,
		costEstimateUsd: row.costEstimateUsd,
		actualCostUsd: row.actualCostUsd,
		entriesCreated: row.entriesCreated,
		mentionsCreated: row.mentionsCreated,
	};
}

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

			return mapRowToDetectionRun(run);
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
				.select()
				.from(detectionRuns)
				.where(eq(detectionRuns.projectId, projectId))
				.orderBy(desc(detectionRuns.createdAt));

			return runs.map((r) => ({
				id: r.id,
				projectId: r.projectId,
				runType: r.runType,
				scope: r.scope,
				pageId: r.pageId,
				indexEntryGroupIds: r.indexEntryGroupIds,
				runAllGroups: r.runAllGroups,
				status: r.status,
				createdAt: r.createdAt,
				startedAt: r.startedAt,
				finishedAt: r.finishedAt,
				progressPage: r.progressPage,
				totalPages: r.totalPages,
				pageRangeStart: r.pageRangeStart,
				pageRangeEnd: r.pageRangeEnd,
				model: r.model,
				indexType: r.indexType,
				entriesCreated: r.entriesCreated,
				mentionsCreated: r.mentionsCreated,
			}));
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
}: {
	userId: string;
	projectId: string;
	projectIndexTypeId: string;
	detectionRunId: string;
	label: string;
	meaningType?: string;
	meaningId?: string;
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
}): Promise<string | null> => {
	return await withUserContext({
		userId,
		fn: async (tx) => {
			const bboxesHash = computeBboxesHash(bboxes);
			const inserted = await tx
				.insert(indexMentions)
				.values({
					entryId,
					projectIndexTypeId,
					documentId,
					detectionRunId,
					pageNumber,
					textSpan,
					bboxes: bboxes as never,
					bboxesHash,
					rangeType: "single_page",
					mentionType: "text",
				})
				.onConflictDoNothing({
					target: [
						indexMentions.projectIndexTypeId,
						indexMentions.entryId,
						indexMentions.pageNumber,
						indexMentions.bboxesHash,
					],
				})
				.returning({ id: indexMentions.id });

			const mention = inserted[0];
			return mention?.id ?? null;
		},
	});
};

/**
 * Insert matcher mention candidates with bboxes_hash. ON CONFLICT DO NOTHING so
 * duplicates (same project_index_type_id + entry_id + page_number + bboxes_hash)
 * are skipped. Returns count of rows actually inserted (created); conflicts count as dedupe.
 */
export const insertMatcherMentionsBatch = async ({
	userId,
	documentId,
	detectionRunId,
	projectIndexTypeId,
	candidates,
}: {
	userId: string;
	documentId: string;
	detectionRunId: string;
	projectIndexTypeId: string;
	candidates: Array<{
		entryId: string;
		pageNumber: number;
		textSpan: string;
		bboxes: Array<{ x: number; y: number; width: number; height: number }>;
	}>;
}): Promise<number> => {
	if (candidates.length === 0) return 0;
	return await withUserContext({
		userId,
		fn: async (tx) => {
			const values = candidates.map((c) => ({
				entryId: c.entryId,
				projectIndexTypeId,
				documentId,
				detectionRunId,
				pageNumber: c.pageNumber,
				textSpan: c.textSpan,
				bboxes: c.bboxes as never,
				bboxesHash: computeBboxesHash(c.bboxes),
				rangeType: "single_page" as const,
				mentionType: "text" as const,
			}));
			const inserted = await tx
				.insert(indexMentions)
				.values(values)
				.onConflictDoNothing({
					target: [
						indexMentions.projectIndexTypeId,
						indexMentions.entryId,
						indexMentions.pageNumber,
						indexMentions.bboxesHash,
					],
				})
				.returning({ id: indexMentions.id });
			return inserted.length;
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

/**
 * Fetch matcher by id and projectIndexTypeId. Returns entryId when matcher exists
 * and its entry is not deleted. Used for subject resolution (Task 5.1) to validate
 * candidate matcherId before persisting mention.
 */
export const getMatcherByIdAndProjectIndexTypeId = async ({
	userId,
	matcherId,
	projectIndexTypeId,
}: {
	userId: string;
	matcherId: string;
	projectIndexTypeId: string;
}): Promise<{ entryId: string } | null> => {
	return await withUserContext({
		userId,
		fn: async (tx) => {
			const [row] = await tx
				.select({ entryId: indexMatchers.entryId })
				.from(indexMatchers)
				.innerJoin(
					indexEntries,
					and(
						eq(indexMatchers.entryId, indexEntries.id),
						eq(indexEntries.projectIndexTypeId, indexMatchers.projectIndexTypeId),
					),
				)
				.where(
					and(
						eq(indexMatchers.id, matcherId),
						eq(indexMatchers.projectIndexTypeId, projectIndexTypeId),
						isNull(indexEntries.deletedAt),
					),
				)
				.limit(1);
			return row ?? null;
		},
	});
};

/**
 * Fetch matcher with parent entry fields for scripture resolution (Task 5.2).
 * Returns entryId, projectId, label, slug when matcher exists and entry is not deleted.
 */
export const getMatcherWithEntry = async ({
	userId,
	matcherId,
	projectIndexTypeId,
}: {
	userId: string;
	matcherId: string;
	projectIndexTypeId: string;
}): Promise<{
	entryId: string;
	projectId: string;
	label: string;
	slug: string;
} | null> => {
	return await withUserContext({
		userId,
		fn: async (tx) => {
			const [row] = await tx
				.select({
					entryId: indexMatchers.entryId,
					projectId: indexEntries.projectId,
					label: indexEntries.label,
					slug: indexEntries.slug,
				})
				.from(indexMatchers)
				.innerJoin(
					indexEntries,
					and(
						eq(indexMatchers.entryId, indexEntries.id),
						eq(indexEntries.projectIndexTypeId, indexMatchers.projectIndexTypeId),
					),
				)
				.where(
					and(
						eq(indexMatchers.id, matcherId),
						eq(indexMatchers.projectIndexTypeId, projectIndexTypeId),
						isNull(indexEntries.deletedAt),
					),
				)
				.limit(1);
			return row ?? null;
		},
	});
};

/**
 * Find entry by project, index type, and slug (Task 5.2 child lookup).
 * Returns id and parentId for verification.
 */
export const getEntryByProjectTypeAndSlug = async ({
	userId,
	projectId,
	projectIndexTypeId,
	slug,
}: {
	userId: string;
	projectId: string;
	projectIndexTypeId: string;
	slug: string;
}): Promise<{ id: string; parentId: string | null } | null> => {
	return await withUserContext({
		userId,
		fn: async (tx) => {
			const [row] = await tx
				.select({ id: indexEntries.id, parentId: indexEntries.parentId })
				.from(indexEntries)
				.where(
					and(
						eq(indexEntries.projectId, projectId),
						eq(indexEntries.projectIndexTypeId, projectIndexTypeId),
						eq(indexEntries.slug, slug),
						isNull(indexEntries.deletedAt),
					),
				)
				.limit(1);
			return row ?? null;
		},
	});
};

/**
 * Create child entry under parent; idempotent: on slug conflict re-query and return existing id (Task 5.2).
 */
export const createChildEntry = async ({
	userId,
	projectId,
	projectIndexTypeId,
	parentId,
	slug,
	label,
	detectionRunId,
}: {
	userId: string;
	projectId: string;
	projectIndexTypeId: string;
	parentId: string;
	slug: string;
	label: string;
	detectionRunId: string;
}): Promise<string> => {
	return await withUserContext({
		userId,
		fn: async (tx) => {
			const [existing] = await tx
				.select({ id: indexEntries.id })
				.from(indexEntries)
				.where(
					and(
						eq(indexEntries.projectId, projectId),
						eq(indexEntries.projectIndexTypeId, projectIndexTypeId),
						eq(indexEntries.slug, slug),
						isNull(indexEntries.deletedAt),
					),
				)
				.limit(1);
			if (existing) return existing.id;

			const [inserted] = await tx
				.insert(indexEntries)
				.values({
					projectId,
					projectIndexTypeId,
					parentId,
					slug,
					label,
					detectionRunId,
					status: "active",
				})
				.returning({ id: indexEntries.id });
			if (inserted) return inserted.id;
			// Race: another tx inserted same slug; re-query
			const [again] = await tx
				.select({ id: indexEntries.id })
				.from(indexEntries)
				.where(
					and(
						eq(indexEntries.projectId, projectId),
						eq(indexEntries.projectIndexTypeId, projectIndexTypeId),
						eq(indexEntries.slug, slug),
						isNull(indexEntries.deletedAt),
					),
				)
				.limit(1);
			if (!again) throw new Error("Failed to create or find child entry");
			return again.id;
		},
	});
};

/**
 * Find matcher by text and projectIndexTypeId (Task 5.2 child matcher lookup).
 */
export const getMatcherByTextAndProjectIndexTypeId = async ({
	userId,
	projectIndexTypeId,
	text,
}: {
	userId: string;
	projectIndexTypeId: string;
	text: string;
}): Promise<{ id: string; entryId: string } | null> => {
	return await withUserContext({
		userId,
		fn: async (tx) => {
			const [row] = await tx
				.select({ id: indexMatchers.id, entryId: indexMatchers.entryId })
				.from(indexMatchers)
				.where(
					and(
						eq(indexMatchers.projectIndexTypeId, projectIndexTypeId),
						eq(indexMatchers.text, text),
					),
				)
				.limit(1);
			return row ?? null;
		},
	});
};

/**
 * Create matcher for entry; idempotent: on (projectIndexTypeId, text) conflict re-query and return existing id (Task 5.2).
 */
export const createMatcher = async ({
	userId,
	entryId,
	projectIndexTypeId,
	text,
}: {
	userId: string;
	entryId: string;
	projectIndexTypeId: string;
	text: string;
}): Promise<string> => {
	return await withUserContext({
		userId,
		fn: async (tx) => {
			const [existing] = await tx
				.select({ id: indexMatchers.id })
				.from(indexMatchers)
				.where(
					and(
						eq(indexMatchers.projectIndexTypeId, projectIndexTypeId),
						eq(indexMatchers.text, text),
					),
				)
				.limit(1);
			if (existing) return existing.id;

			try {
				const [inserted] = await tx
					.insert(indexMatchers)
					.values({
						entryId,
						projectIndexTypeId,
						text,
					})
					.returning({ id: indexMatchers.id });
				if (inserted) return inserted.id;
			} catch {
				// Unique conflict: re-query
			}
			const [again] = await tx
				.select({ id: indexMatchers.id })
				.from(indexMatchers)
				.where(
					and(
						eq(indexMatchers.projectIndexTypeId, projectIndexTypeId),
						eq(indexMatchers.text, text),
					),
				)
				.limit(1);
			if (!again) throw new Error("Failed to create or find matcher");
			return again.id;
		},
	});
};

/**
 * List matcher alias rows for a matcher detection run.
 * Used to build the alias index (one snapshot per run).
 * When runAllGroups: all matchers for project + index type.
 * When indexEntryGroupIds: Phase 6 will filter by group membership; until then
 * we return all matchers for project + index type with synthetic groupId.
 */
export const listMatcherAliasesForRun = async ({
	userId,
	projectId,
	projectIndexTypeId,
	indexType,
	indexEntryGroupIds: _indexEntryGroupIds,
	runAllGroups: _runAllGroups,
}: {
	userId: string;
	projectId: string;
	projectIndexTypeId: string;
	indexType: string;
	indexEntryGroupIds: string[] | null;
	runAllGroups: boolean | null;
}): Promise<AliasInput[]> => {
	return await withUserContext({
		userId,
		fn: async (tx) => {
			const rows = await tx
				.select({
					alias: indexMatchers.text,
					matcherId: indexMatchers.id,
					entryId: indexMatchers.entryId,
				})
				.from(indexMatchers)
				.innerJoin(
					indexEntries,
					and(
						eq(indexMatchers.entryId, indexEntries.id),
						eq(indexEntries.projectIndexTypeId, indexMatchers.projectIndexTypeId),
					),
				)
				.where(
					and(
						eq(indexEntries.projectId, projectId),
						eq(indexMatchers.projectIndexTypeId, projectIndexTypeId),
						isNull(indexEntries.deletedAt),
					),
				);

			// Synthetic groupId until Phase 6 index_entry_groups: one group per run.
			const groupId = projectIndexTypeId;
			return rows.map((r) => ({
				alias: r.alias,
				matcherId: r.matcherId,
				entryId: r.entryId,
				indexType,
				groupId,
			}));
		},
	});
};
