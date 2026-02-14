import { relations, sql } from "drizzle-orm";
import { pgPolicy, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { projects } from "./projects";
import { authenticatedRole } from "./users";

// ProjectSettings - stores project-specific configuration
export const projectSettings = pgTable(
	"project_settings",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		projectId: uuid("project_id")
			.references(() => projects.id, { onDelete: "cascade" })
			.notNull()
			.unique(),
		openrouterApiKey: text("openrouter_api_key"), // Encrypted API key
		defaultDetectionModel: text("default_detection_model"),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true }),
	},
	(table) => [
		pgPolicy("project_settings_project_access", {
			for: "all",
			to: authenticatedRole,
			using: sql`EXISTS (
				SELECT 1 FROM projects
				WHERE projects.id = ${table.projectId}
			)`,
		}),
	],
);

// ProjectSettings relations
export const projectSettingsRelations = relations(
	projectSettings,
	({ one }) => ({
		project: one(projects, {
			fields: [projectSettings.projectId],
			references: [projects.id],
		}),
	}),
);
