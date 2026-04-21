import { and, eq, inArray, isNull } from "drizzle-orm";
import { withUserContext } from "../../db/client";
import {
	indexEntries,
	indexMatchers,
	indexMentions,
	indexRelations,
} from "../../db/schema";

// ============================================================================
// Repository Layer — bulk / cross-reference mutations
// ============================================================================

export const createCrossReference = async ({
	fromEntryId,
	toEntryId,
	arbitraryValue,
	relationType,
	userId,
}: {
	fromEntryId: string;
	toEntryId: string | null;
	arbitraryValue: string | null;
	relationType: "see" | "see_also" | "qv";
	userId: string;
}): Promise<{
	id: string;
	fromEntryId: string;
	toEntryId: string | null;
	arbitraryValue: string | null;
	relationType: string;
}> => {
	return await withUserContext({
		userId,
		fn: async (tx) => {
			const [relation] = await tx
				.insert(indexRelations)
				.values({
					fromEntryId,
					toEntryId: toEntryId ?? null,
					arbitraryValue: arbitraryValue?.trim() ?? null,
					relationType,
					revision: 1,
				})
				.returning();

			return relation;
		},
	});
};

export const deleteCrossReference = async ({
	id,
	userId,
}: {
	id: string;
	userId: string;
}): Promise<boolean> => {
	return await withUserContext({
		userId,
		fn: async (tx) => {
			const result = await tx
				.delete(indexRelations)
				.where(eq(indexRelations.id, id))
				.returning({ id: indexRelations.id });

			return result.length > 0;
		},
	});
};

export const transferMentions = async ({
	fromEntryId,
	toEntryId,
	userId,
}: {
	fromEntryId: string;
	toEntryId: string;
	userId: string;
}): Promise<number> => {
	return await withUserContext({
		userId,
		fn: async (tx) => {
			const result = await tx
				.update(indexMentions)
				.set({ entryId: toEntryId })
				.where(
					and(
						eq(indexMentions.entryId, fromEntryId),
						isNull(indexMentions.deletedAt),
					),
				)
				.returning({ id: indexMentions.id });

			return result.length;
		},
	});
};

export const transferMatchers = async ({
	fromEntryId,
	toEntryId,
	userId,
}: {
	fromEntryId: string;
	toEntryId: string;
	userId: string;
}): Promise<number> => {
	return await withUserContext({
		userId,
		fn: async (tx) => {
			const result = await tx
				.update(indexMatchers)
				.set({ entryId: toEntryId })
				.where(eq(indexMatchers.entryId, fromEntryId))
				.returning({ id: indexMatchers.id });

			return result.length;
		},
	});
};

export const deleteAllMatchers = async ({
	entryId,
	userId,
}: {
	entryId: string;
	userId: string;
}): Promise<void> => {
	await withUserContext({
		userId,
		fn: async (tx) => {
			await tx.delete(indexMatchers).where(eq(indexMatchers.entryId, entryId));
		},
	});
};

export const addMatchersToEntry = async ({
	entryId,
	matchers,
	userId,
}: {
	entryId: string;
	matchers: string[];
	userId: string;
}): Promise<void> => {
	if (matchers.length === 0) return;

	await withUserContext({
		userId,
		fn: async (tx) => {
			const [entry] = await tx
				.select({
					projectIndexTypeId: indexEntries.projectIndexTypeId,
				})
				.from(indexEntries)
				.where(eq(indexEntries.id, entryId))
				.limit(1);

			if (!entry) {
				throw new Error("Entry not found");
			}

			await tx.insert(indexMatchers).values(
				matchers.map((text) => ({
					entryId,
					projectIndexTypeId: entry.projectIndexTypeId,
					text,
					matcherType: "alias" as const,
					revision: 1,
				})),
			);
		},
	});
};
