import { eq } from "drizzle-orm";
import { db } from "../../db/client";
import { users } from "../../db/schema/users";
import type { UserSettings } from "./user-settings.types";

// ============================================================================
// Repository: User Settings Data Access
// ============================================================================

export const getUserSettings = async ({
	userId,
}: {
	userId: string;
}): Promise<UserSettings | null> => {
	const [user] = await db
		.select({
			openrouterApiKey: users.openrouterApiKey,
			defaultDetectionModel: users.defaultDetectionModel,
		})
		.from(users)
		.where(eq(users.id, userId));

	if (!user) return null;

	return {
		openrouterApiKey: user.openrouterApiKey,
		defaultDetectionModel: user.defaultDetectionModel,
	};
};

export const updateUserSettings = async ({
	userId,
	openrouterApiKey,
	defaultDetectionModel,
}: {
	userId: string;
	openrouterApiKey?: string;
	defaultDetectionModel?: string;
}): Promise<UserSettings> => {
	const updateData: {
		openrouterApiKey?: string | null;
		defaultDetectionModel?: string | null;
		updatedAt: Date;
	} = {
		updatedAt: new Date(),
	};

	if (openrouterApiKey !== undefined) {
		updateData.openrouterApiKey = openrouterApiKey || null;
	}

	if (defaultDetectionModel !== undefined) {
		updateData.defaultDetectionModel = defaultDetectionModel || null;
	}

	const [updated] = await db
		.update(users)
		.set(updateData)
		.where(eq(users.id, userId))
		.returning({
			openrouterApiKey: users.openrouterApiKey,
			defaultDetectionModel: users.defaultDetectionModel,
		});

	if (!updated) {
		throw new Error("User not found");
	}

	return {
		openrouterApiKey: updated.openrouterApiKey,
		defaultDetectionModel: updated.defaultDetectionModel,
	};
};
