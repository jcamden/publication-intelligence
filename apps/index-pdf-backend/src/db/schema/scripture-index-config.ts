import { relations, sql } from "drizzle-orm";
import {
	boolean,
	json,
	pgPolicy,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid,
} from "drizzle-orm/pg-core";
import { projectHighlightConfigs } from "./highlight-configs";
import { projects } from "./projects";
import { authenticatedRole } from "./users";

/**
 * Scripture index config: selected canon and corpus toggles per project + index type.
 * One row per (project_id, project_index_type_id). Only for scripture-type index.
 */
export const scriptureIndexConfigs = pgTable(
	"scripture_index_configs",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		projectId: uuid("project_id")
			.references(() => projects.id, { onDelete: "cascade" })
			.notNull(),
		projectIndexTypeId: uuid("project_index_type_id")
			.references(() => projectHighlightConfigs.id, { onDelete: "cascade" })
			.notNull(),
		selectedCanon: text("selected_canon"), // Canon id from @pubint/core canon registry; null = none selected
		includeApocrypha: boolean("include_apocrypha").default(false).notNull(),
		includeJewishWritings: boolean("include_jewish_writings")
			.default(false)
			.notNull(),
		includeClassicalWritings: boolean("include_classical_writings")
			.default(false)
			.notNull(),
		includeChristianWritings: boolean("include_christian_writings")
			.default(false)
			.notNull(),
		includeDeadSeaScrolls: boolean("include_dead_sea_scrolls")
			.default(false)
			.notNull(),
		alwaysDisplayUnknownEntry: boolean("always_display_unknown_entry")
			.default(false)
			.notNull(),
		extraBookKeys: json("extra_book_keys").$type<string[]>().default([]),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true }),
	},
	(table) => [
		uniqueIndex("unique_scripture_index_config_project_index_type").on(
			table.projectId,
			table.projectIndexTypeId,
		),
		pgPolicy("scripture_index_configs_project_access", {
			for: "all",
			to: authenticatedRole,
			using: sql`EXISTS (
				SELECT 1 FROM projects
				WHERE projects.id = ${table.projectId}
			)`,
		}),
	],
);

export const scriptureIndexConfigsRelations = relations(
	scriptureIndexConfigs,
	({ one }) => ({
		project: one(projects, {
			fields: [scriptureIndexConfigs.projectId],
			references: [projects.id],
		}),
		projectIndexType: one(projectHighlightConfigs, {
			fields: [scriptureIndexConfigs.projectIndexTypeId],
			references: [projectHighlightConfigs.id],
		}),
	}),
);
