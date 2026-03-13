import { relations, sql } from "drizzle-orm";
import {
	integer,
	pgPolicy,
	pgTable,
	text,
	timestamp,
	unique,
	uniqueIndex,
	uuid,
} from "drizzle-orm/pg-core";
import { indexEntryGroupSortModeEnum } from "./enums";
import { projectIndexTypes } from "./highlight-configs";
import { indexEntries, indexMatchers } from "./indexing";
import { projects } from "./projects";
import { scriptureBootstrapRuns } from "./scripture-bootstrap-runs";
import { authenticatedRole } from "./users";

/**
 * Index entry groups: project- and index-type-scoped groups of entries/matchers
 * used for matcher detection runs (e.g. "Biblical books", "Subject A–Z").
 * parser_profile_id: predefined profile id (e.g. scripture-biblical) or null for alias-only.
 */
export const indexEntryGroups = pgTable(
	"index_entry_groups",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		projectId: uuid("project_id")
			.references(() => projects.id, { onDelete: "cascade" })
			.notNull(),
		projectIndexTypeId: uuid("project_index_type_id")
			.references(() => projectIndexTypes.id, { onDelete: "cascade" })
			.notNull(),
		name: text("name").notNull(),
		slug: text("slug").notNull(),
		parserProfileId: text("parser_profile_id"), // e.g. "scripture-biblical"; null = alias-only
		sortMode: indexEntryGroupSortModeEnum("sort_mode").default("a_z").notNull(),
		position: integer("position"), // nullable; null = use name as fallback
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true }),
		deletedAt: timestamp("deleted_at", { withTimezone: true }),
		// Seed provenance: audit only; does not gate edit permissions
		seedSource: text("seed_source"),
		seededAt: timestamp("seeded_at", { withTimezone: true }),
		seedRunId: uuid("seed_run_id").references(() => scriptureBootstrapRuns.id, {
			onDelete: "set null",
		}),
	},
	(table) => [
		uniqueIndex("unique_index_entry_group_slug")
			.on(table.projectId, table.projectIndexTypeId, table.slug)
			.where(sql`${table.deletedAt} IS NULL`),
		uniqueIndex("idx_index_entry_groups_project_index_type").on(
			table.projectIndexTypeId,
			table.id,
		),
		pgPolicy("index_entry_groups_project_access", {
			for: "all",
			to: authenticatedRole,
			using: sql`EXISTS (
				SELECT 1 FROM projects
				WHERE projects.id = ${table.projectId}
			)`,
		}),
	],
);

export const indexEntryGroupsRelations = relations(
	indexEntryGroups,
	({ one, many }) => ({
		project: one(projects, {
			fields: [indexEntryGroups.projectId],
			references: [projects.id],
		}),
		projectIndexType: one(projectIndexTypes, {
			fields: [indexEntryGroups.projectIndexTypeId],
			references: [projectIndexTypes.id],
		}),
		entries: many(indexEntryGroupEntries),
		matchers: many(indexEntryGroupMatchers),
	}),
);

/** Join: group ↔ entries with optional position for deterministic ordering. */
export const indexEntryGroupEntries = pgTable(
	"index_entry_group_entries",
	{
		groupId: uuid("group_id")
			.references(() => indexEntryGroups.id, { onDelete: "cascade" })
			.notNull(),
		entryId: uuid("entry_id")
			.references(() => indexEntries.id, { onDelete: "cascade" })
			.notNull(),
		position: integer("position"), // optional; null = unordered
	},
	(table) => [
		unique("unique_index_entry_group_entries_pair").on(
			table.groupId,
			table.entryId,
		),
		pgPolicy("index_entry_group_entries_access", {
			for: "all",
			to: authenticatedRole,
			using: sql`EXISTS (
				SELECT 1 FROM index_entry_groups
				WHERE index_entry_groups.id = ${table.groupId}
			)`,
		}),
	],
);

export const indexEntryGroupEntriesRelations = relations(
	indexEntryGroupEntries,
	({ one }) => ({
		group: one(indexEntryGroups, {
			fields: [indexEntryGroupEntries.groupId],
			references: [indexEntryGroups.id],
		}),
		entry: one(indexEntries, {
			fields: [indexEntryGroupEntries.entryId],
			references: [indexEntries.id],
		}),
	}),
);

/** Join: group ↔ matchers with optional position for deterministic ordering. */
export const indexEntryGroupMatchers = pgTable(
	"index_entry_group_matchers",
	{
		groupId: uuid("group_id")
			.references(() => indexEntryGroups.id, { onDelete: "cascade" })
			.notNull(),
		matcherId: uuid("matcher_id")
			.references(() => indexMatchers.id, { onDelete: "cascade" })
			.notNull(),
		position: integer("position"), // optional; null = unordered
	},
	(table) => [
		unique("unique_index_entry_group_matchers_pair").on(
			table.groupId,
			table.matcherId,
		),
		pgPolicy("index_entry_group_matchers_access", {
			for: "all",
			to: authenticatedRole,
			using: sql`EXISTS (
				SELECT 1 FROM index_entry_groups
				WHERE index_entry_groups.id = ${table.groupId}
			)`,
		}),
	],
);

export const indexEntryGroupMatchersRelations = relations(
	indexEntryGroupMatchers,
	({ one }) => ({
		group: one(indexEntryGroups, {
			fields: [indexEntryGroupMatchers.groupId],
			references: [indexEntryGroups.id],
		}),
		matcher: one(indexMatchers, {
			fields: [indexEntryGroupMatchers.matcherId],
			references: [indexMatchers.id],
		}),
	}),
);
