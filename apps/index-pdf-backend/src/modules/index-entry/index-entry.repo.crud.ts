import { and, eq, inArray, isNull, sql } from "drizzle-orm";
import { withUserContext } from "../../db/client";
import { indexEntries, indexMatchers, indexMentions } from "../../db/schema";
import type {
	CreateIndexEntryInput,
	IndexEntry,
	UpdateIndexEntryInput,
	UpdateIndexEntryParentInput,
} from "./index-entry.types";
import { generateSlug } from "./slug-utils";

// ============================================================================
// Repository Layer — entry CRUD (transactions)
// ============================================================================

export const createIndexEntry = async ({
	input,
	userId,
}: {
	input: CreateIndexEntryInput;
	userId: string;
}): Promise<IndexEntry> => {
	return await withUserContext({
		userId,
		fn: async (tx) => {
			// Generate slug from label and hierarchy if not provided
			const slug =
				input.slug ||
				(await generateSlug({
					label: input.label,
					parentId: input.parentId || null,
					getEntryById: async (id: string) => {
						const result = await tx
							.select({
								label: indexEntries.label,
								parentId: indexEntries.parentId,
							})
							.from(indexEntries)
							.where(eq(indexEntries.id, id))
							.limit(1);
						return result[0] || null;
					},
				}));

			const [entry] = await tx
				.insert(indexEntries)
				.values({
					projectId: input.projectId,
					projectIndexTypeId: input.projectIndexTypeId,
					slug,
					label: input.label,
					parentId: input.parentId || null,
					status: "active",
					revision: 1,
				})
				.returning();

			if (!entry) {
				throw new Error("Failed to create index entry");
			}

			if (input.matchers && input.matchers.length > 0) {
				await tx.insert(indexMatchers).values(
					input.matchers.map((text) => ({
						entryId: entry.id,
						projectIndexTypeId: entry.projectIndexTypeId,
						text,
						matcherType: "alias" as const,
						revision: 1,
					})),
				);
			}

			const matchers = input.matchers
				? await tx
						.select({
							id: indexMatchers.id,
							entryId: indexMatchers.entryId,
							text: indexMatchers.text,
							matcherType: indexMatchers.matcherType,
							revision: indexMatchers.revision,
							createdAt: indexMatchers.createdAt,
							updatedAt: indexMatchers.updatedAt,
						})
						.from(indexMatchers)
						.where(eq(indexMatchers.entryId, entry.id))
				: [];

			return {
				id: entry.id,
				projectId: entry.projectId,
				projectIndexTypeId: entry.projectIndexTypeId,
				slug: entry.slug,
				label: entry.label,
				status: entry.status,
				revision: entry.revision,
				parentId: entry.parentId,
				createdAt: entry.createdAt.toISOString(),
				updatedAt: entry.updatedAt?.toISOString() || null,
				deletedAt: entry.deletedAt?.toISOString() || null,
				matchers: matchers.map((m) => ({
					id: m.id,
					entryId: m.entryId,
					text: m.text,
					matcherType: m.matcherType,
					revision: m.revision,
					createdAt: m.createdAt.toISOString(),
					updatedAt: m.updatedAt?.toISOString() || null,
				})),
			};
		},
	});
};

export const updateIndexEntry = async ({
	input,
	userId,
}: {
	input: UpdateIndexEntryInput;
	userId: string;
}): Promise<IndexEntry | null> => {
	return await withUserContext({
		userId,
		fn: async (tx) => {
			const updateValues: Partial<typeof indexEntries.$inferInsert> = {
				updatedAt: new Date(),
			};

			if (input.label !== undefined) {
				updateValues.label = input.label;
			}

			const result = await tx
				.update(indexEntries)
				.set({
					...updateValues,
					revision: sql`${indexEntries.revision} + 1`,
				})
				.where(eq(indexEntries.id, input.id))
				.returning({ id: indexEntries.id });

			if (result.length === 0) {
				return null;
			}

			if (input.matchers !== undefined) {
				await tx
					.delete(indexMatchers)
					.where(eq(indexMatchers.entryId, input.id));

				if (input.matchers.length > 0) {
					await tx.insert(indexMatchers).values(
						input.matchers.map((text) => ({
							entryId: input.id,
							projectIndexTypeId: input.projectIndexTypeId,
							text,
							matcherType: "alias" as const,
							revision: 1,
						})),
					);
				}
			}

			const entry = await tx
				.select({
					id: indexEntries.id,
					projectId: indexEntries.projectId,
					projectIndexTypeId: indexEntries.projectIndexTypeId,
					slug: indexEntries.slug,
					label: indexEntries.label,
					status: indexEntries.status,
					revision: indexEntries.revision,
					parentId: indexEntries.parentId,
					createdAt: indexEntries.createdAt,
					updatedAt: indexEntries.updatedAt,
					deletedAt: indexEntries.deletedAt,
				})
				.from(indexEntries)
				.where(eq(indexEntries.id, input.id))
				.limit(1);

			if (entry.length === 0) {
				return null;
			}

			const matchers = await tx
				.select({
					id: indexMatchers.id,
					entryId: indexMatchers.entryId,
					text: indexMatchers.text,
					matcherType: indexMatchers.matcherType,
					revision: indexMatchers.revision,
					createdAt: indexMatchers.createdAt,
					updatedAt: indexMatchers.updatedAt,
				})
				.from(indexMatchers)
				.where(eq(indexMatchers.entryId, input.id));

			const e = entry[0];
			return {
				id: e.id,
				projectId: e.projectId,
				projectIndexTypeId: e.projectIndexTypeId,
				slug: e.slug,
				label: e.label,
				status: e.status,
				revision: e.revision,
				parentId: e.parentId,
				createdAt: e.createdAt.toISOString(),
				updatedAt: e.updatedAt?.toISOString() || null,
				deletedAt: e.deletedAt?.toISOString() || null,
				matchers: matchers.map((m) => ({
					id: m.id,
					entryId: m.entryId,
					text: m.text,
					matcherType: m.matcherType,
					revision: m.revision,
					createdAt: m.createdAt.toISOString(),
					updatedAt: m.updatedAt?.toISOString() || null,
				})),
			};
		},
	});
};

export const approveIndexEntry = async ({
	id,
	userId,
}: {
	id: string;
	userId: string;
}): Promise<IndexEntry | null> => {
	return await withUserContext({
		userId,
		fn: async (tx) => {
			try {
				// First check if entry exists
				const existingEntry = await tx
					.select({ id: indexEntries.id, status: indexEntries.status })
					.from(indexEntries)
					.where(eq(indexEntries.id, id))
					.limit(1);

				if (existingEntry.length === 0) {
					console.error(`[approveIndexEntry] Entry not found: ${id}`);
					return null;
				}

				console.log(
					`[approveIndexEntry] Approving entry ${id} with current status: ${existingEntry[0].status}`,
				);

				const result = await tx
					.update(indexEntries)
					.set({
						status: "active",
						updatedAt: new Date(),
						revision: sql`${indexEntries.revision} + 1`,
					})
					.where(eq(indexEntries.id, id))
					.returning({ id: indexEntries.id });

				if (result.length === 0) {
					console.error(
						`[approveIndexEntry] Update returned no results for ${id}`,
					);
					return null;
				}

				const entry = await tx
					.select({
						id: indexEntries.id,
						projectId: indexEntries.projectId,
						projectIndexTypeId: indexEntries.projectIndexTypeId,
						slug: indexEntries.slug,
						label: indexEntries.label,
						status: indexEntries.status,
						revision: indexEntries.revision,
						parentId: indexEntries.parentId,
						createdAt: indexEntries.createdAt,
						updatedAt: indexEntries.updatedAt,
						deletedAt: indexEntries.deletedAt,
					})
					.from(indexEntries)
					.where(eq(indexEntries.id, id))
					.limit(1);

				if (entry.length === 0) {
					console.error(
						`[approveIndexEntry] Entry vanished after update: ${id}`,
					);
					return null;
				}

				const matchers = await tx
					.select({
						id: indexMatchers.id,
						entryId: indexMatchers.entryId,
						text: indexMatchers.text,
						matcherType: indexMatchers.matcherType,
						revision: indexMatchers.revision,
						createdAt: indexMatchers.createdAt,
						updatedAt: indexMatchers.updatedAt,
					})
					.from(indexMatchers)
					.where(eq(indexMatchers.entryId, id));

				console.log(
					`[approveIndexEntry] Successfully approved entry ${id}, found ${matchers.length} matchers`,
				);

				const e = entry[0];
				return {
					id: e.id,
					projectId: e.projectId,
					projectIndexTypeId: e.projectIndexTypeId,
					slug: e.slug,
					label: e.label,
					status: e.status,
					revision: e.revision,
					parentId: e.parentId,
					createdAt: e.createdAt.toISOString(),
					updatedAt: e.updatedAt?.toISOString() || null,
					deletedAt: e.deletedAt?.toISOString() || null,
					matchers: matchers.map((m) => ({
						id: m.id,
						entryId: m.entryId,
						text: m.text,
						matcherType: m.matcherType,
						revision: m.revision,
						createdAt: m.createdAt.toISOString(),
						updatedAt: m.updatedAt?.toISOString() || null,
					})),
				};
			} catch (error) {
				console.error(
					`[approveIndexEntry] Error approving entry ${id}:`,
					error,
				);
				throw error;
			}
		},
	});
};

export const updateIndexEntryParent = async ({
	input,
	userId,
}: {
	input: UpdateIndexEntryParentInput;
	userId: string;
}): Promise<IndexEntry | null> => {
	return await withUserContext({
		userId,
		fn: async (tx) => {
			// First update the parentId
			const result = await tx
				.update(indexEntries)
				.set({
					parentId: input.parentId || null,
					updatedAt: new Date(),
					revision: sql`${indexEntries.revision} + 1`,
				})
				.where(eq(indexEntries.id, input.id))
				.returning({ id: indexEntries.id });

			if (result.length === 0) {
				return null;
			}

			// Get the updated entry to regenerate its slug
			const entryData = await tx
				.select({
					id: indexEntries.id,
					label: indexEntries.label,
					parentId: indexEntries.parentId,
				})
				.from(indexEntries)
				.where(eq(indexEntries.id, input.id))
				.limit(1);

			if (entryData.length === 0) {
				return null;
			}

			// Regenerate slug for the moved entry
			const newSlug = await generateSlug({
				label: entryData[0].label,
				parentId: entryData[0].parentId,
				getEntryById: async (id: string) => {
					const result = await tx
						.select({
							label: indexEntries.label,
							parentId: indexEntries.parentId,
						})
						.from(indexEntries)
						.where(eq(indexEntries.id, id))
						.limit(1);
					return result[0] || null;
				},
			});

			await tx
				.update(indexEntries)
				.set({ slug: newSlug })
				.where(eq(indexEntries.id, input.id));

			// Get all descendants and regenerate their slugs
			const descendants = await getDescendants({ entryId: input.id, tx });

			for (const descendant of descendants) {
				const descendantData = await tx
					.select({
						label: indexEntries.label,
						parentId: indexEntries.parentId,
					})
					.from(indexEntries)
					.where(eq(indexEntries.id, descendant.id))
					.limit(1);

				if (descendantData.length > 0) {
					const descendantSlug = await generateSlug({
						label: descendantData[0].label,
						parentId: descendantData[0].parentId,
						getEntryById: async (id: string) => {
							const result = await tx
								.select({
									label: indexEntries.label,
									parentId: indexEntries.parentId,
								})
								.from(indexEntries)
								.where(eq(indexEntries.id, id))
								.limit(1);
							return result[0] || null;
						},
					});

					await tx
						.update(indexEntries)
						.set({ slug: descendantSlug })
						.where(eq(indexEntries.id, descendant.id));
				}
			}

			// Now fetch the final entry with all fields
			const entry = await tx
				.select({
					id: indexEntries.id,
					projectId: indexEntries.projectId,
					projectIndexTypeId: indexEntries.projectIndexTypeId,
					slug: indexEntries.slug,
					label: indexEntries.label,
					status: indexEntries.status,
					revision: indexEntries.revision,
					parentId: indexEntries.parentId,
					createdAt: indexEntries.createdAt,
					updatedAt: indexEntries.updatedAt,
					deletedAt: indexEntries.deletedAt,
				})
				.from(indexEntries)
				.where(eq(indexEntries.id, input.id))
				.limit(1);

			if (entry.length === 0) {
				return null;
			}

			const matchers = await tx
				.select({
					id: indexMatchers.id,
					entryId: indexMatchers.entryId,
					text: indexMatchers.text,
					matcherType: indexMatchers.matcherType,
					revision: indexMatchers.revision,
					createdAt: indexMatchers.createdAt,
					updatedAt: indexMatchers.updatedAt,
				})
				.from(indexMatchers)
				.where(eq(indexMatchers.entryId, input.id));

			const e = entry[0];
			return {
				id: e.id,
				projectId: e.projectId,
				projectIndexTypeId: e.projectIndexTypeId,
				slug: e.slug,
				label: e.label,
				status: e.status,
				revision: e.revision,
				parentId: e.parentId,
				createdAt: e.createdAt.toISOString(),
				updatedAt: e.updatedAt?.toISOString() || null,
				deletedAt: e.deletedAt?.toISOString() || null,
				matchers: matchers.map((m) => ({
					id: m.id,
					entryId: m.entryId,
					text: m.text,
					matcherType: m.matcherType,
					revision: m.revision,
					createdAt: m.createdAt.toISOString(),
					updatedAt: m.updatedAt?.toISOString() || null,
				})),
			};
		},
	});
};

export const deleteIndexEntry = async ({
	id,
	userId,
	cascadeToChildren = false,
}: {
	id: string;
	userId: string;
	cascadeToChildren?: boolean;
}): Promise<IndexEntry | null> => {
	return await withUserContext({
		userId,
		fn: async (tx) => {
			if (cascadeToChildren) {
				const descendants = await getDescendants({ entryId: id, tx });
				const allIds = [id, ...descendants.map((d) => d.id)];

				// Soft-delete all associated mentions
				await tx
					.update(indexMentions)
					.set({ deletedAt: new Date() })
					.where(inArray(indexMentions.entryId, allIds));

				await tx
					.update(indexEntries)
					.set({ deletedAt: new Date() })
					.where(inArray(indexEntries.id, allIds));
			} else {
				// Soft-delete all associated mentions
				await tx
					.update(indexMentions)
					.set({ deletedAt: new Date() })
					.where(eq(indexMentions.entryId, id));

				await tx
					.update(indexEntries)
					.set({ deletedAt: new Date() })
					.where(eq(indexEntries.id, id));
			}

			const entry = await tx
				.select({
					id: indexEntries.id,
					projectId: indexEntries.projectId,
					projectIndexTypeId: indexEntries.projectIndexTypeId,
					slug: indexEntries.slug,
					label: indexEntries.label,
					status: indexEntries.status,
					revision: indexEntries.revision,
					parentId: indexEntries.parentId,
					createdAt: indexEntries.createdAt,
					updatedAt: indexEntries.updatedAt,
					deletedAt: indexEntries.deletedAt,
				})
				.from(indexEntries)
				.where(eq(indexEntries.id, id))
				.limit(1);

			if (entry.length === 0) {
				return null;
			}

			const matchers = await tx
				.select({
					id: indexMatchers.id,
					entryId: indexMatchers.entryId,
					text: indexMatchers.text,
					matcherType: indexMatchers.matcherType,
					revision: indexMatchers.revision,
					createdAt: indexMatchers.createdAt,
					updatedAt: indexMatchers.updatedAt,
				})
				.from(indexMatchers)
				.where(eq(indexMatchers.entryId, id));

			const e = entry[0];
			return {
				id: e.id,
				projectId: e.projectId,
				projectIndexTypeId: e.projectIndexTypeId,
				slug: e.slug,
				label: e.label,
				status: e.status,
				revision: e.revision,
				parentId: e.parentId,
				createdAt: e.createdAt.toISOString(),
				updatedAt: e.updatedAt?.toISOString() || null,
				deletedAt: e.deletedAt?.toISOString() || null,
				matchers: matchers.map((m) => ({
					id: m.id,
					entryId: m.entryId,
					text: m.text,
					matcherType: m.matcherType,
					revision: m.revision,
					createdAt: m.createdAt.toISOString(),
					updatedAt: m.updatedAt?.toISOString() || null,
				})),
			};
		},
	});
};
const getDescendants = async ({
	entryId,
	tx,
}: {
	entryId: string;
	tx: Parameters<Parameters<typeof withUserContext>[0]["fn"]>[0];
}): Promise<Array<{ id: string }>> => {
	const children = await tx
		.select({ id: indexEntries.id })
		.from(indexEntries)
		.where(
			and(eq(indexEntries.parentId, entryId), isNull(indexEntries.deletedAt)),
		);

	if (children.length === 0) {
		return [];
	}

	const allDescendants = [...children];

	for (const child of children) {
		const grandchildren = await getDescendants({ entryId: child.id, tx });
		allDescendants.push(...grandchildren);
	}

	return allDescendants;
};
