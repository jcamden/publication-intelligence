import { and, eq, inArray, isNull } from "drizzle-orm";
import { withUserContext } from "../../../db/client";
import {
	indexEntries,
	indexEntryGroupEntries,
	indexEntryGroupMatchers,
	indexEntryGroups,
} from "../../../db/schema";
import * as indexEntryGroupRepo from "../../detection/matcher/index-entry-group.repo";

const SEED_SOURCE_SCRIPTURE_BOOTSTRAP = "scripture_bootstrap";

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
