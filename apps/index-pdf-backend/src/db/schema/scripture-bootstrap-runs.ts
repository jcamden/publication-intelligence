import { relations, sql } from "drizzle-orm";
import {
	integer,
	pgPolicy,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";
import { projectHighlightConfigs } from "./highlight-configs";
import { projects } from "./projects";
import { authenticatedRole, users } from "./users";

/**
 * Scripture bootstrap run audit: timestamp, config snapshot hash, counts, actor.
 * One row per run (no uniqueness constraint; append-only).
 */
export const scriptureBootstrapRuns = pgTable(
	"scripture_bootstrap_runs",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		projectId: uuid("project_id")
			.references(() => projects.id, { onDelete: "cascade" })
			.notNull(),
		projectIndexTypeId: uuid("project_index_type_id")
			.references(() => projectHighlightConfigs.id, { onDelete: "cascade" })
			.notNull(),
		configSnapshotHash: text("config_snapshot_hash").notNull(),
		entriesCreated: integer("entries_created").notNull(),
		entriesReused: integer("entries_reused").notNull(),
		matchersCreated: integer("matchers_created").notNull(),
		matchersReused: integer("matchers_reused").notNull(),
		groupsCreated: integer("groups_created").notNull(),
		membershipsCreated: integer("memberships_created").notNull(),
		userId: uuid("user_id")
			.references(() => users.id, { onDelete: "set null" })
			.notNull(),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => [
		pgPolicy("scripture_bootstrap_runs_project_access", {
			for: "all",
			to: authenticatedRole,
			using: sql`EXISTS (
				SELECT 1 FROM projects
				WHERE projects.id = ${table.projectId}
			)`,
		}),
	],
);

export const scriptureBootstrapRunsRelations = relations(
	scriptureBootstrapRuns,
	({ one }) => ({
		project: one(projects, {
			fields: [scriptureBootstrapRuns.projectId],
			references: [projects.id],
		}),
		projectIndexType: one(projectHighlightConfigs, {
			fields: [scriptureBootstrapRuns.projectIndexTypeId],
			references: [projectHighlightConfigs.id],
		}),
		user: one(users, {
			fields: [scriptureBootstrapRuns.userId],
			references: [users.id],
		}),
	}),
);
