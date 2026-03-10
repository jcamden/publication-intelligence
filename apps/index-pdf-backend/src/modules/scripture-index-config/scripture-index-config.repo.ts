import { and, eq } from "drizzle-orm";
import { withUserContext } from "../../db/client";
import {
	projectHighlightConfigs,
	scriptureIndexConfigs,
} from "../../db/schema";
import type { ScriptureIndexConfig } from "./scripture-index-config.types";
import type { UpsertScriptureConfigInput } from "./scripture-index-config.types";

function rowToConfig(row: {
	id: string;
	projectId: string;
	projectIndexTypeId: string;
	selectedCanon: string | null;
	includeApocrypha: boolean;
	includeJewishWritings: boolean;
	includeClassicalWritings: boolean;
	includeChristianWritings: boolean;
	includeDeadSeaScrolls: boolean;
	extraBookKeys: string[] | null;
	createdAt: Date;
	updatedAt: Date | null;
}): ScriptureIndexConfig {
	return {
		id: row.id,
		projectId: row.projectId,
		projectIndexTypeId: row.projectIndexTypeId,
		selectedCanon: row.selectedCanon as ScriptureIndexConfig["selectedCanon"],
		includeApocrypha: row.includeApocrypha,
		includeJewishWritings: row.includeJewishWritings,
		includeClassicalWritings: row.includeClassicalWritings,
		includeChristianWritings: row.includeChristianWritings,
		includeDeadSeaScrolls: row.includeDeadSeaScrolls,
		extraBookKeys: row.extraBookKeys ?? [],
		createdAt: row.createdAt.toISOString(),
		updatedAt: row.updatedAt ? row.updatedAt.toISOString() : null,
	};
}

export async function getScriptureConfig({
	projectId,
	projectIndexTypeId,
	userId,
}: {
	projectId: string;
	projectIndexTypeId: string;
	userId: string;
}): Promise<ScriptureIndexConfig | null> {
	return await withUserContext({
		userId,
		fn: async (tx) => {
			const [row] = await tx
				.select()
				.from(scriptureIndexConfigs)
				.where(
					and(
						eq(scriptureIndexConfigs.projectId, projectId),
						eq(
							scriptureIndexConfigs.projectIndexTypeId,
							projectIndexTypeId,
						),
					),
				)
				.limit(1);

			if (!row) return null;
			return rowToConfig(row);
		},
	});
}

export async function upsertScriptureConfig({
	input,
	userId,
}: {
	input: UpsertScriptureConfigInput;
	userId: string;
}): Promise<ScriptureIndexConfig> {
	return await withUserContext({
		userId,
		fn: async (tx) => {
			const now = new Date();
			const values = {
				projectId: input.projectId,
				projectIndexTypeId: input.projectIndexTypeId,
				selectedCanon: input.selectedCanon,
				includeApocrypha: input.includeApocrypha,
				includeJewishWritings: input.includeJewishWritings,
				includeClassicalWritings: input.includeClassicalWritings,
				includeChristianWritings: input.includeChristianWritings,
				includeDeadSeaScrolls: input.includeDeadSeaScrolls,
				extraBookKeys: input.extraBookKeys,
				updatedAt: now,
			};

			const [row] = await tx
				.insert(scriptureIndexConfigs)
				.values({
					...values,
					createdAt: now,
				})
				.onConflictDoUpdate({
					target: [
						scriptureIndexConfigs.projectId,
						scriptureIndexConfigs.projectIndexTypeId,
					],
					set: values,
				})
				.returning();

			if (!row) {
				throw new Error("Failed to upsert scripture index config");
			}
			return rowToConfig(row);
		},
	});
}

export async function getProjectIndexTypeHighlightType({
	projectIndexTypeId,
	userId,
}: {
	projectIndexTypeId: string;
	userId: string;
}): Promise<string | null> {
	return await withUserContext({
		userId,
		fn: async (tx) => {
			const [row] = await tx
				.select({ highlightType: projectHighlightConfigs.highlightType })
				.from(projectHighlightConfigs)
				.where(eq(projectHighlightConfigs.id, projectIndexTypeId))
				.limit(1);
			return row?.highlightType ?? null;
		},
	});
}
