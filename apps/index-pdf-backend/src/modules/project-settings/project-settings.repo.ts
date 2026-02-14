import { eq } from "drizzle-orm";
import { withUserContext } from "../../db/client";
import { projectSettings } from "../../db/schema";
import type { ProjectSettings } from "./project-settings.types";

// ============================================================================
// Repository Layer - Drizzle ORM queries
// ============================================================================

export const getProjectSettings = async ({
	userId,
	projectId,
}: {
	userId: string;
	projectId: string;
}): Promise<ProjectSettings | null> => {
	return await withUserContext({
		userId,
		fn: async (tx) => {
			const [settings] = await tx
				.select()
				.from(projectSettings)
				.where(eq(projectSettings.projectId, projectId))
				.limit(1);

			if (!settings) {
				return null;
			}

			return {
				id: settings.id,
				projectId: settings.projectId,
				openrouterApiKey: settings.openrouterApiKey,
				defaultDetectionModel: settings.defaultDetectionModel,
				createdAt: settings.createdAt,
				updatedAt: settings.updatedAt,
			};
		},
	});
};

export const upsertProjectSettings = async ({
	userId,
	projectId,
	openrouterApiKey,
	defaultDetectionModel,
}: {
	userId: string;
	projectId: string;
	openrouterApiKey?: string;
	defaultDetectionModel?: string;
}): Promise<ProjectSettings> => {
	return await withUserContext({
		userId,
		fn: async (tx) => {
			// Try to update existing settings
			const [existing] = await tx
				.select()
				.from(projectSettings)
				.where(eq(projectSettings.projectId, projectId))
				.limit(1);

			if (existing) {
				// Update
				const [updated] = await tx
					.update(projectSettings)
					.set({
						openrouterApiKey:
							openrouterApiKey !== undefined
								? openrouterApiKey
								: existing.openrouterApiKey,
						defaultDetectionModel:
							defaultDetectionModel !== undefined
								? defaultDetectionModel
								: existing.defaultDetectionModel,
						updatedAt: new Date(),
					})
					.where(eq(projectSettings.id, existing.id))
					.returning();

				if (!updated) {
					throw new Error("Failed to update project settings");
				}

				return {
					id: updated.id,
					projectId: updated.projectId,
					openrouterApiKey: updated.openrouterApiKey,
					defaultDetectionModel: updated.defaultDetectionModel,
					createdAt: updated.createdAt,
					updatedAt: updated.updatedAt,
				};
			}

			// Insert new
			const [created] = await tx
				.insert(projectSettings)
				.values({
					projectId,
					openrouterApiKey: openrouterApiKey || null,
					defaultDetectionModel: defaultDetectionModel || null,
				})
				.returning();

			if (!created) {
				throw new Error("Failed to create project settings");
			}

			return {
				id: created.id,
				projectId: created.projectId,
				openrouterApiKey: created.openrouterApiKey,
				defaultDetectionModel: created.defaultDetectionModel,
				createdAt: created.createdAt,
				updatedAt: created.updatedAt,
			};
		},
	});
};
