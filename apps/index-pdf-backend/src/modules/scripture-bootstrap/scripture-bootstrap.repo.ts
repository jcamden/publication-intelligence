import { and, eq, inArray, isNull } from "drizzle-orm";
import { withUserContext } from "../../db/client";
import {
	indexEntries,
	indexEntryGroupEntries,
	indexEntryGroupMatchers,
	indexEntryGroups,
	scriptureBootstrapRuns,
} from "../../db/schema";
import * as detectionRepo from "../detection/detection.repo";
import * as indexEntryGroupRepo from "../detection/index-entry-group.repo";

export type BootstrapCounts = {
	entriesCreated: number;
	entriesReused: number;
	matchersCreated: number;
	matchersReused: number;
	groupsCreated: number;
	membershipsCreated: number;
};

const SEED_SOURCE_SCRIPTURE_BOOTSTRAP = "scripture_bootstrap";

/**
 * Find or create a top-level index entry by slug. Idempotent.
 * When reusing, preserves existing label unless forceRefreshFromSource is true.
 * Optional seed provenance (audit only; does not gate edits).
 */
export async function findOrCreateEntry({
	userId,
	projectId,
	projectIndexTypeId,
	slug,
	label,
	seedRunId,
	forceRefreshFromSource,
}: {
	userId: string;
	projectId: string;
	projectIndexTypeId: string;
	slug: string;
	label: string;
	seedRunId?: string | null;
	forceRefreshFromSource?: boolean;
}): Promise<{ entryId: string; created: boolean }> {
	return await withUserContext({
		userId,
		fn: async (tx) => {
			const existing = await tx
				.select({ id: indexEntries.id, label: indexEntries.label })
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
			if (existing[0]) {
				if (forceRefreshFromSource && seedRunId) {
					await tx
						.update(indexEntries)
						.set({
							label,
							updatedAt: new Date(),
							seedRunId,
							seededAt: new Date(),
							seedSource: SEED_SOURCE_SCRIPTURE_BOOTSTRAP,
						})
						.where(eq(indexEntries.id, existing[0].id));
				}
				return { entryId: existing[0].id, created: false };
			}
			const now = new Date();
			const [inserted] = await tx
				.insert(indexEntries)
				.values({
					projectId,
					projectIndexTypeId,
					slug,
					label,
					status: "active",
					parentId: null,
					detectionRunId: null,
					...(seedRunId && {
						seedSource: SEED_SOURCE_SCRIPTURE_BOOTSTRAP,
						seededAt: now,
						seedRunId,
					}),
				})
				.returning({ id: indexEntries.id });
			if (inserted) return { entryId: inserted.id, created: true };
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
			if (!again) throw new Error("Failed to find or create entry");
			return { entryId: again.id, created: false };
		},
	});
}

/**
 * Find or create matcher by normalized text. If a matcher with this text already exists (any entry), return it (reused). Otherwise create under the given entry.
 * Optional seed provenance when creating (audit only; does not gate edits).
 */
export async function findOrCreateMatcher({
	userId,
	entryId,
	projectIndexTypeId,
	normalizedText,
	seedRunId,
}: {
	userId: string;
	entryId: string;
	projectIndexTypeId: string;
	normalizedText: string;
	seedRunId?: string | null;
}): Promise<{ matcherId: string; created: boolean }> {
	const existing = await detectionRepo.getMatcherByTextAndProjectIndexTypeId({
		userId,
		projectIndexTypeId,
		text: normalizedText,
	});
	if (existing) return { matcherId: existing.id, created: false };
	const now = new Date();
	const id = await detectionRepo.createMatcher({
		userId,
		entryId,
		projectIndexTypeId,
		text: normalizedText,
		...(seedRunId && {
			seedSource: SEED_SOURCE_SCRIPTURE_BOOTSTRAP,
			seededAt: now,
			seedRunId,
		}),
	});
	return { matcherId: id, created: true };
}

/** Default group names for corpus buckets. */
export const BOOTSTRAP_GROUP_NAMES = [
	"Canon",
	"Apocrypha",
	"Jewish Writings",
	"Classical Writings",
	"Christian Writings",
	"Dead Sea Scrolls",
	"Extra Books",
] as const;

/**
 * Find group by name for project + index type, or create it. Idempotent.
 * When reusing, preserves existing name/settings unless forceRefreshFromSource is true.
 * Optional seed provenance when creating (audit only; does not gate edits).
 */
export async function findOrCreateGroup({
	userId,
	projectId,
	projectIndexTypeId,
	name,
	sortMode,
	seedRunId,
	forceRefreshFromSource,
}: {
	userId: string;
	projectId: string;
	projectIndexTypeId: string;
	name: string;
	/** Canon sort mode for scripture groups (e.g. protestant); omit for non-canon groups */
	sortMode?: "protestant" | "roman_catholic" | "tanakh" | "eastern_orthodox";
	seedRunId?: string | null;
	forceRefreshFromSource?: boolean;
}): Promise<{ groupId: string; created: boolean }> {
	const groups = await indexEntryGroupRepo.listGroups({
		userId,
		projectId,
		projectIndexTypeId,
	});
	const existing = groups.find((g) => g.name === name);
	if (existing) {
		if (forceRefreshFromSource && sortMode !== undefined) {
			await indexEntryGroupRepo.updateGroup({
				userId,
				groupId: existing.id,
				input: { name, sortMode },
			});
		}
		return { groupId: existing.id, created: false };
	}
	const created = await indexEntryGroupRepo.createGroup({
		userId,
		input: {
			projectId,
			projectIndexTypeId,
			name,
			sortMode: sortMode ?? "a_z",
			...(seedRunId && {
				seedSource: SEED_SOURCE_SCRIPTURE_BOOTSTRAP,
				seededAt: new Date(),
				seedRunId,
			}),
		},
	});
	return { groupId: created.id, created: true };
}

/**
 * Add entry to group at position. With 1:1 constraint, removes from any other group first (transfer).
 * Returns true if a new membership was created (insert or transfer).
 */
export async function ensureEntryInGroup({
	userId,
	groupId,
	entryId,
	position,
}: {
	userId: string;
	groupId: string;
	entryId: string;
	position: number;
}): Promise<boolean> {
	const alreadyInGroup = await indexEntryGroupRepo.hasEntryInGroup({
		userId,
		groupId,
		entryId,
	});
	if (alreadyInGroup) return false;
	await indexEntryGroupRepo.addEntryToGroup({
		userId,
		groupId,
		entryId,
		position,
	});
	return true;
}

/**
 * Add matcher to group at position (idempotent). Returns true if a new membership was created.
 */
export async function ensureMatcherInGroup({
	userId,
	groupId,
	matcherId,
	position,
}: {
	userId: string;
	groupId: string;
	matcherId: string;
	position: number;
}): Promise<boolean> {
	return await withUserContext({
		userId,
		fn: async (tx) => {
			const [existing] = await tx
				.select({ groupId: indexEntryGroupMatchers.groupId })
				.from(indexEntryGroupMatchers)
				.where(
					and(
						eq(indexEntryGroupMatchers.groupId, groupId),
						eq(indexEntryGroupMatchers.matcherId, matcherId),
					),
				)
				.limit(1);
			if (existing) return false;
			await tx
				.insert(indexEntryGroupMatchers)
				.values({ groupId, matcherId, position });
			return true;
		},
	});
}

/**
 * Find entries by slugs and return their current group (if any).
 * Used for previewConflicts to detect entries that would need to be transferred.
 */
export async function findEntriesWithGroupBySlugs({
	userId,
	projectId,
	projectIndexTypeId,
	slugs,
}: {
	userId: string;
	projectId: string;
	projectIndexTypeId: string;
	slugs: string[];
}): Promise<
	Array<{
		slug: string;
		label: string;
		groupId: string | null;
		groupName: string | null;
	}>
> {
	if (slugs.length === 0) return [];

	return await withUserContext({
		userId,
		fn: async (tx) => {
			const rows = await tx
				.select({
					slug: indexEntries.slug,
					label: indexEntries.label,
					groupId: indexEntryGroupEntries.groupId,
					groupName: indexEntryGroups.name,
				})
				.from(indexEntries)
				.leftJoin(
					indexEntryGroupEntries,
					eq(indexEntryGroupEntries.entryId, indexEntries.id),
				)
				.leftJoin(
					indexEntryGroups,
					eq(indexEntryGroups.id, indexEntryGroupEntries.groupId),
				)
				.where(
					and(
						eq(indexEntries.projectId, projectId),
						eq(indexEntries.projectIndexTypeId, projectIndexTypeId),
						inArray(indexEntries.slug, slugs),
						isNull(indexEntries.deletedAt),
					),
				);

			return rows.map((r) => ({
				slug: r.slug,
				label: r.label,
				groupId: r.groupId,
				groupName: r.groupName ?? null,
			}));
		},
	});
}

/**
 * Start a bootstrap run (insert run row with zero counts). Returns run id for provenance.
 * Call updateBootstrapRunCounts with final counts when done.
 */
export async function insertBootstrapRunStart({
	userId,
	projectId,
	projectIndexTypeId,
	configSnapshotHash,
}: {
	userId: string;
	projectId: string;
	projectIndexTypeId: string;
	configSnapshotHash: string;
}): Promise<{ id: string }> {
	return await withUserContext({
		userId,
		fn: async (tx) => {
			const [row] = await tx
				.insert(scriptureBootstrapRuns)
				.values({
					projectId,
					projectIndexTypeId,
					configSnapshotHash,
					entriesCreated: 0,
					entriesReused: 0,
					matchersCreated: 0,
					matchersReused: 0,
					groupsCreated: 0,
					membershipsCreated: 0,
					userId,
				})
				.returning({ id: scriptureBootstrapRuns.id });
			if (!row) throw new Error("Failed to insert bootstrap run");
			return { id: row.id };
		},
	});
}

/**
 * Update a bootstrap run with final counts (call after insertBootstrapRunStart).
 */
export async function updateBootstrapRunCounts({
	userId,
	runId,
	counts,
}: {
	userId: string;
	runId: string;
	counts: BootstrapCounts;
}): Promise<void> {
	await withUserContext({
		userId,
		fn: async (tx) => {
			await tx
				.update(scriptureBootstrapRuns)
				.set({
					entriesCreated: counts.entriesCreated,
					entriesReused: counts.entriesReused,
					matchersCreated: counts.matchersCreated,
					matchersReused: counts.matchersReused,
					groupsCreated: counts.groupsCreated,
					membershipsCreated: counts.membershipsCreated,
				})
				.where(eq(scriptureBootstrapRuns.id, runId));
		},
	});
}
