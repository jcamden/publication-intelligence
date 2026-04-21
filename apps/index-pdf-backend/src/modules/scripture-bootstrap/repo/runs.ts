import { eq } from "drizzle-orm";
import { withUserContext } from "../../../db/client";
import { scriptureBootstrapRuns } from "../../../db/schema";

export type BootstrapCounts = {
	entriesCreated: number;
	entriesReused: number;
	matchersCreated: number;
	matchersReused: number;
	groupsCreated: number;
	membershipsCreated: number;
};

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
