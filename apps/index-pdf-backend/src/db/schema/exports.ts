import { relations, sql } from "drizzle-orm";
import { pgPolicy, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { exportFormatEnum } from "./enums";
import { projects } from "./projects";
import { authenticatedRole, users } from "./users";

// ExportedIndex - Generated back-of-book index artifact
export const exportedIndexes = pgTable(
	"exported_indexes",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		projectId: uuid("project_id")
			.references(() => projects.id, { onDelete: "cascade" })
			.notNull(),
		exportedByUserId: uuid("exported_by_user_id")
			.references(() => users.id, { onDelete: "cascade" })
			.notNull(),
		format: exportFormatEnum("format").notNull(),
		content: text("content").notNull(), // Generated index content
		metadata: text("metadata"), // JSON metadata about export
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => [
		// RLS: Inherit access from project
		// The projects table RLS already handles owner access
		pgPolicy("exported_indexes_project_access", {
			for: "all",
			to: authenticatedRole,
			using: sql`EXISTS (
				SELECT 1 FROM projects
				WHERE projects.id = ${table.projectId}
			)`,
		}),
	],
);

// ExportedIndex relations
export const exportedIndexesRelations = relations(
	exportedIndexes,
	({ one }) => ({
		project: one(projects, {
			fields: [exportedIndexes.projectId],
			references: [projects.id],
		}),
		exportedBy: one(users, {
			fields: [exportedIndexes.exportedByUserId],
			references: [users.id],
		}),
	}),
);
