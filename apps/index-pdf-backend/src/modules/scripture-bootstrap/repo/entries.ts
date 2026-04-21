import { and, eq, isNull } from "drizzle-orm";
import type { DbTransaction } from "../../../db/client";
import { withUserContext } from "../../../db/client";
import { indexEntries } from "../../../db/schema";
import * as detectionRepo from "../../detection/detection.repo";

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

/** Slug for the Unknown book entry (refs without clear book context). */
export const UNKNOWN_ENTRY_SLUG = "unknown";

/**
 * Ensure the Unknown entry exists for a scripture index type. Idempotent.
 * Call within an existing transaction (e.g. when enabling scripture highlight config).
 * No matchers—Unknown is not matched by text; mentions are assigned via Add Parent tool.
 */
export async function ensureUnknownEntryExistsInTx({
	tx,
	projectId,
	projectIndexTypeId,
}: {
	tx: DbTransaction;
	projectId: string;
	projectIndexTypeId: string;
}): Promise<{ entryId: string; created: boolean }> {
	const existing = await tx
		.select({ id: indexEntries.id })
		.from(indexEntries)
		.where(
			and(
				eq(indexEntries.projectId, projectId),
				eq(indexEntries.projectIndexTypeId, projectIndexTypeId),
				eq(indexEntries.slug, UNKNOWN_ENTRY_SLUG),
				isNull(indexEntries.deletedAt),
			),
		)
		.limit(1);

	if (existing[0]) {
		return { entryId: existing[0].id, created: false };
	}

	const [inserted] = await tx
		.insert(indexEntries)
		.values({
			projectId,
			projectIndexTypeId,
			slug: UNKNOWN_ENTRY_SLUG,
			label: "Unknown",
			status: "active",
			parentId: null,
			detectionRunId: null,
		})
		.returning({ id: indexEntries.id });

	if (!inserted) {
		const [again] = await tx
			.select({ id: indexEntries.id })
			.from(indexEntries)
			.where(
				and(
					eq(indexEntries.projectId, projectId),
					eq(indexEntries.projectIndexTypeId, projectIndexTypeId),
					eq(indexEntries.slug, UNKNOWN_ENTRY_SLUG),
					isNull(indexEntries.deletedAt),
				),
			)
			.limit(1);
		if (!again) throw new Error("Failed to ensure Unknown entry exists");
		return { entryId: again.id, created: false };
	}

	return { entryId: inserted.id, created: true };
}

/**
 * Find or create matcher by text. Stores the original form (e.g. "Revelation") for
 * case-sensitive matching: uppercase matchers reject lowercase text. Optional
 * seed provenance when creating (audit only; does not gate edits).
 */
export async function findOrCreateMatcher({
	userId,
	entryId,
	projectIndexTypeId,
	text,
	seedRunId,
}: {
	userId: string;
	entryId: string;
	projectIndexTypeId: string;
	text: string;
	seedRunId?: string | null;
}): Promise<{ matcherId: string; created: boolean }> {
	const existing = await detectionRepo.getMatcherByTextAndProjectIndexTypeId({
		userId,
		projectIndexTypeId,
		text,
	});
	if (existing) return { matcherId: existing.id, created: false };
	const now = new Date();
	const id = await detectionRepo.createMatcher({
		userId,
		entryId,
		projectIndexTypeId,
		text,
		...(seedRunId && {
			seedSource: SEED_SOURCE_SCRIPTURE_BOOTSTRAP,
			seededAt: now,
			seedRunId,
		}),
	});
	return { matcherId: id, created: true };
}
