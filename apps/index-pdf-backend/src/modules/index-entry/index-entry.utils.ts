import { eq } from "drizzle-orm";
import type { DbTransaction } from "../../db/client";
import { indexEntries } from "../../db/schema";

// ============================================================================
// Hierarchy Management Utilities
// ============================================================================

/**
 * Check if setting a new parent would create a cycle in the hierarchy.
 * Traverses up from the new parent to root, checking if we encounter the entry itself.
 */
export const wouldCreateCycle = async ({
	entryId,
	newParentId,
	tx,
}: {
	entryId: string;
	newParentId: string;
	tx: DbTransaction;
}): Promise<boolean> => {
	let currentId: string | null = newParentId;
	const visited = new Set<string>();

	while (currentId) {
		if (currentId === entryId) {
			return true;
		}

		if (visited.has(currentId)) {
			throw new Error("Existing cycle detected in hierarchy");
		}

		visited.add(currentId);

		const entry = await tx
			.select({
				parentId: indexEntries.parentId,
			})
			.from(indexEntries)
			.where(eq(indexEntries.id, currentId))
			.limit(1);

		if (entry.length === 0) {
			break;
		}

		currentId = entry[0].parentId;
	}

	return false;
};

/**
 * Get the depth of an entry in the hierarchy (how many ancestors it has).
 * Top-level entries have depth 0.
 */
export const getDepth = async ({
	entryId,
	tx,
}: {
	entryId: string;
	tx: DbTransaction;
}): Promise<number> => {
	let depth = 0;
	let currentId: string | null = entryId;
	const maxDepth = 10;

	while (currentId && depth < maxDepth) {
		const entry = await tx
			.select({
				parentId: indexEntries.parentId,
			})
			.from(indexEntries)
			.where(eq(indexEntries.id, currentId))
			.limit(1);

		if (entry.length === 0 || !entry[0].parentId) {
			break;
		}

		currentId = entry[0].parentId;
		depth++;
	}

	return depth;
};

/**
 * Validate that a parent has the specified projectIndexTypeId.
 * For creating new entries, pass the desired projectIndexTypeId.
 * For updating existing entries, pass the entry's projectIndexTypeId.
 * Returns false if parent doesn't exist or has different type.
 */
export const validateParentIndexType = async ({
	projectIndexTypeId,
	parentId,
	tx,
}: {
	projectIndexTypeId: string;
	parentId: string;
	tx: DbTransaction;
}): Promise<boolean> => {
	const parent = await tx
		.select({
			projectIndexTypeId: indexEntries.projectIndexTypeId,
		})
		.from(indexEntries)
		.where(eq(indexEntries.id, parentId))
		.limit(1);

	if (parent.length === 0) {
		return false;
	}

	return parent[0].projectIndexTypeId === projectIndexTypeId;
};
