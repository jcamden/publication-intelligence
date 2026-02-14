import { relations, sql } from "drizzle-orm";
import {
	pgPolicy,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid,
} from "drizzle-orm/pg-core";
import { canonicalPageRules } from "./canonical-page-rules";
import { regions, sourceDocuments } from "./documents";
import { projectIndexTypes } from "./highlight-configs";
import { indexEntries } from "./indexing";
import { projectSettings } from "./project-settings";
import { authenticatedRole, users } from "./users";

// Project - Container for indexing work
// MVP: Simple single-user ownership model
export const projects = pgTable(
	"projects",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		title: text("title").notNull(),
		description: text("description"),
		projectDir: text("project_dir").notNull(),
		ownerId: uuid("owner_id")
			.references(() => users.id, { onDelete: "cascade" })
			.notNull(),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true }),
		deletedAt: timestamp("deleted_at", { withTimezone: true }),
	},
	(table) => [
		// Unique constraints only for non-deleted projects
		uniqueIndex("unique_owner_dir")
			.on(table.ownerId, table.projectDir)
			.where(sql`${table.deletedAt} IS NULL`),
		uniqueIndex("unique_owner_title")
			.on(table.ownerId, table.title)
			.where(sql`${table.deletedAt} IS NULL`),

		// RLS Policy: Owner has full access
		pgPolicy("projects_owner_full_access", {
			for: "all",
			to: authenticatedRole,
			using: sql`${table.ownerId} = auth.user_id()`,
		}),
	],
);

// Project relations
export const projectsRelations = relations(projects, ({ one, many }) => ({
	owner: one(users, {
		fields: [projects.ownerId],
		references: [users.id],
		relationName: "projectOwner",
	}),
	sourceDocuments: many(sourceDocuments),
	indexEntries: many(indexEntries),
	projectIndexTypes: many(projectIndexTypes),
	regions: many(regions),
	canonicalPageRules: many(canonicalPageRules),
	settings: one(projectSettings, {
		fields: [projects.id],
		references: [projectSettings.projectId],
	}),
}));
