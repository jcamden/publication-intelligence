import { relations, sql } from "drizzle-orm";
import {
	foreignKey,
	index,
	integer,
	json,
	pgPolicy,
	pgTable,
	text,
	timestamp,
	unique,
	uniqueIndex,
	uuid,
} from "drizzle-orm/pg-core";
import { detectionRuns } from "./detection";
import { sourceDocuments } from "./documents";
import {
	indexEntryStatusEnum,
	matcherTypeEnum,
	mentionRangeTypeEnum,
	mentionTypeEnum,
	relationTypeEnum,
} from "./enums";
import { projectIndexTypes } from "./highlight-configs";
import { projects } from "./projects";
import { scriptureBootstrapRuns } from "./scripture-bootstrap-runs";
import { authenticatedRole } from "./users";

// IndexEntry - A concept to appear in the index
export const indexEntries = pgTable(
	"index_entries",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		projectId: uuid("project_id")
			.references(() => projects.id, { onDelete: "cascade" })
			.notNull(),
		projectIndexTypeId: uuid("project_index_type_id")
			.references(() => projectIndexTypes.id, { onDelete: "cascade" })
			.notNull(),
		slug: text("slug").notNull(), // Stable identifier, never changes
		label: text("label").notNull(), // Display name, mutable
		status: indexEntryStatusEnum("status").default("active").notNull(),
		revision: integer("revision").default(1).notNull(),
		parentId: uuid("parent_id"), // Self-referential, nullable for top-level entries
		detectionRunId: uuid("detection_run_id").references(
			() => detectionRuns.id,
			{
				onDelete: "set null",
			},
		), // null if manually created
		meaningType: text("meaning_type"), // e.g., "wordnet", "wikidata"
		meaningId: text("meaning_id"), // external canonical ID
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true }),
		deletedAt: timestamp("deleted_at", { withTimezone: true }),
		// Seed provenance: audit only; does not gate edit permissions
		seedSource: text("seed_source"), // e.g. "scripture_bootstrap"
		seededAt: timestamp("seeded_at", { withTimezone: true }),
		seedRunId: uuid("seed_run_id").references(() => scriptureBootstrapRuns.id, {
			onDelete: "set null",
		}),
	},
	(table) => [
		// Required by composite FK from index_matchers (entry_id, project_index_type_id)
		unique("unique_index_entry_id_type").on(table.id, table.projectIndexTypeId),

		// Slug uniqueness per project AND index type (excluding soft-deleted entries)
		uniqueIndex("unique_project_index_type_slug")
			.on(table.projectId, table.projectIndexTypeId, table.slug)
			.where(sql`${table.deletedAt} IS NULL`),

		// RLS: Inherit access from project
		// The projects table RLS already handles owner access
		pgPolicy("index_entries_project_access", {
			for: "all",
			to: authenticatedRole,
			using: sql`EXISTS (
				SELECT 1 FROM projects
				WHERE projects.id = ${table.projectId}
			)`,
		}),
	],
);

// IndexEntry relations
export const indexEntriesRelations = relations(
	indexEntries,
	({ one, many }) => ({
		project: one(projects, {
			fields: [indexEntries.projectId],
			references: [projects.id],
		}),
		projectIndexType: one(projectIndexTypes, {
			fields: [indexEntries.projectIndexTypeId],
			references: [projectIndexTypes.id],
		}),
		parent: one(indexEntries, {
			fields: [indexEntries.parentId],
			references: [indexEntries.id],
			relationName: "entryHierarchy",
		}),
		detectionRun: one(detectionRuns, {
			fields: [indexEntries.detectionRunId],
			references: [detectionRuns.id],
		}),
		children: many(indexEntries, { relationName: "entryHierarchy" }),
		matchers: many(indexMatchers),
		mentions: many(indexMentions),
		relationsFrom: many(indexRelations, { relationName: "relationFrom" }),
		relationsTo: many(indexRelations, { relationName: "relationTo" }),
	}),
);

// IndexMatcher - Terms that should match to this entry
export const indexMatchers = pgTable(
	"index_matchers",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		entryId: uuid("entry_id")
			.references(() => indexEntries.id, { onDelete: "cascade" })
			.notNull(),
		projectIndexTypeId: uuid("project_index_type_id")
			.references(() => projectIndexTypes.id, { onDelete: "cascade" })
			.notNull(),
		text: text("text").notNull(),
		matcherType: matcherTypeEnum("matcher_type").default("alias").notNull(),
		revision: integer("revision").default(1).notNull(),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true }),
		// Seed provenance: audit only; does not gate edit permissions
		seedSource: text("seed_source"),
		seededAt: timestamp("seeded_at", { withTimezone: true }),
		seedRunId: uuid("seed_run_id").references(() => scriptureBootstrapRuns.id, {
			onDelete: "set null",
		}),
	},
	(table) => [
		// Enforce deterministic matcher -> entry mapping per index type.
		// This still allows same matcher text across different index types
		// (e.g. "genesis" in subject and scripture).
		uniqueIndex("unique_project_index_type_matcher_text").on(
			table.projectIndexTypeId,
			table.text,
		),

		// Enforce that matcher's project_index_type_id matches its entry's type.
		foreignKey({
			columns: [table.entryId, table.projectIndexTypeId],
			foreignColumns: [indexEntries.id, indexEntries.projectIndexTypeId],
			name: "index_matchers_entry_id_project_index_type_id_fk",
		}),

		// RLS: Inherit access from index entry
		// index_entries RLS inherits from projects RLS
		pgPolicy("index_matchers_entry_access", {
			for: "all",
			to: authenticatedRole,
			using: sql`EXISTS (
				SELECT 1 FROM index_entries
				WHERE index_entries.id = ${table.entryId}
			)`,
		}),
	],
);

// IndexMatcher relations
export const indexMatchersRelations = relations(indexMatchers, ({ one }) => ({
	entry: one(indexEntries, {
		fields: [indexMatchers.entryId],
		references: [indexEntries.id],
	}),
	projectIndexType: one(projectIndexTypes, {
		fields: [indexMatchers.projectIndexTypeId],
		references: [projectIndexTypes.id],
	}),
}));

// IndexRelation - Cross-references between IndexEntries
export const indexRelations = pgTable(
	"index_relations",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		fromEntryId: uuid("from_entry_id")
			.references(() => indexEntries.id, { onDelete: "cascade" })
			.notNull(),
		toEntryId: uuid("to_entry_id").references(() => indexEntries.id, {
			onDelete: "cascade",
		}), // Nullable for arbitrary cross-references
		arbitraryValue: text("arbitrary_value"), // For freeform cross-references
		relationType: relationTypeEnum("relation_type").notNull(),
		revision: integer("revision").default(1).notNull(),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true }),
	},
	(table) => [
		// Prevent duplicate relationships
		uniqueIndex("unique_from_to_type").on(
			table.fromEntryId,
			table.toEntryId,
			table.relationType,
		),

		// RLS: Inherit access from source entry
		// index_entries RLS inherits from projects RLS
		pgPolicy("index_relations_entry_access", {
			for: "all",
			to: authenticatedRole,
			using: sql`EXISTS (
				SELECT 1 FROM index_entries
				WHERE index_entries.id = ${table.fromEntryId}
			)`,
		}),
	],
);

// IndexRelation relations
export const indexRelationsRelations = relations(indexRelations, ({ one }) => ({
	fromEntry: one(indexEntries, {
		fields: [indexRelations.fromEntryId],
		references: [indexEntries.id],
		relationName: "relationFrom",
	}),
	toEntry: one(indexEntries, {
		fields: [indexRelations.toEntryId],
		references: [indexEntries.id],
		relationName: "relationTo",
	}),
}));

// IndexMention - An occurrence of a concept in the text
export const indexMentions = pgTable(
	"index_mentions",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		entryId: uuid("entry_id")
			.references(() => indexEntries.id, { onDelete: "cascade" })
			.notNull(),
		projectIndexTypeId: uuid("project_index_type_id")
			.references(() => projectIndexTypes.id, { onDelete: "cascade" })
			.notNull(),
		documentId: uuid("document_id")
			.references(() => sourceDocuments.id, { onDelete: "cascade" })
			.notNull(),
		pageNumber: integer("page_number").notNull(), // Page number (validated against sourceDocuments.pageCount)
		pageNumberEnd: integer("page_number_end"), // For page ranges
		textSpan: text("text_span").notNull(), // The actual text
		bboxes: json("bboxes"), // Array of BoundingBox coordinates
		bboxesHash: text("bboxes_hash"), // SHA-256 of canonical bbox JSON for uniqueness (Task 4.2)
		rangeType: mentionRangeTypeEnum("range_type")
			.default("single_page")
			.notNull(),
		mentionType: mentionTypeEnum("mention_type").default("text").notNull(),
		pageSublocation: text("page_sublocation"), // Within-page location (e.g., "10:45.a")
		suggestedByLlmId: uuid("suggested_by_llm_id"), // References llm_runs (legacy)
		detectionRunId: uuid("detection_run_id").references(
			() => detectionRuns.id,
			{
				onDelete: "set null",
			},
		), // null if manually created
		revision: integer("revision").default(1).notNull(),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true }),
		deletedAt: timestamp("deleted_at", { withTimezone: true }),
	},
	(table) => [
		// Uniqueness: same entry + page + bbox fingerprint => one mention (Task 4.2). Partial index so existing rows with null bboxes_hash are ignored.
		uniqueIndex("unique_mention_entry_page_bbox")
			.on(
				table.projectIndexTypeId,
				table.entryId,
				table.pageNumber,
				table.bboxesHash,
			)
			.where(sql`${table.bboxesHash} IS NOT NULL`),
		// RLS: Inherit access from entry
		// index_entries RLS inherits from projects RLS
		pgPolicy("index_mentions_entry_access", {
			for: "all",
			to: authenticatedRole,
			using: sql`EXISTS (
				SELECT 1 FROM index_entries
				WHERE index_entries.id = ${table.entryId}
			)`,
		}),
	],
);

// IndexMention relations
export const indexMentionsRelations = relations(indexMentions, ({ one }) => ({
	entry: one(indexEntries, {
		fields: [indexMentions.entryId],
		references: [indexEntries.id],
	}),
	projectIndexType: one(projectIndexTypes, {
		fields: [indexMentions.projectIndexTypeId],
		references: [projectIndexTypes.id],
	}),
	document: one(sourceDocuments, {
		fields: [indexMentions.documentId],
		references: [sourceDocuments.id],
	}),
	detectionRun: one(detectionRuns, {
		fields: [indexMentions.detectionRunId],
		references: [detectionRuns.id],
	}),
}));

// DetectionMatcherPageCoverage - skip already-covered matcher/page pairs on subsequent runs (Task 6.3)
export const detectionMatcherPageCoverage = pgTable(
	"detection_matcher_page_coverage",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		projectId: uuid("project_id")
			.references(() => projects.id, { onDelete: "cascade" })
			.notNull(),
		projectIndexTypeId: uuid("project_index_type_id")
			.references(() => projectIndexTypes.id, { onDelete: "cascade" })
			.notNull(),
		documentId: uuid("document_id")
			.references(() => sourceDocuments.id, { onDelete: "cascade" })
			.notNull(),
		pageNumber: integer("page_number").notNull(),
		matcherId: uuid("matcher_id")
			.references(() => indexMatchers.id, { onDelete: "cascade" })
			.notNull(),
		lastDetectionRunId: uuid("last_detection_run_id").references(
			() => detectionRuns.id,
			{ onDelete: "set null" },
		),
		coveredAt: timestamp("covered_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => [
		uniqueIndex(
			"detection_matcher_page_coverage_project_type_doc_page_matcher_key",
		).on(
			table.projectIndexTypeId,
			table.documentId,
			table.pageNumber,
			table.matcherId,
		),
		index("detection_matcher_page_coverage_run_scope_idx").on(
			table.projectId,
			table.projectIndexTypeId,
			table.documentId,
			table.pageNumber,
		),
		index("detection_matcher_page_coverage_matcher_page_idx").on(
			table.matcherId,
			table.documentId,
			table.pageNumber,
		),
		pgPolicy("detection_matcher_page_coverage_project_access", {
			for: "all",
			to: authenticatedRole,
			using: sql`EXISTS (
				SELECT 1 FROM projects
				WHERE projects.id = ${table.projectId}
			)`,
		}),
	],
);

export const detectionMatcherPageCoverageRelations = relations(
	detectionMatcherPageCoverage,
	({ one }) => ({
		project: one(projects, {
			fields: [detectionMatcherPageCoverage.projectId],
			references: [projects.id],
		}),
		projectIndexType: one(projectIndexTypes, {
			fields: [detectionMatcherPageCoverage.projectIndexTypeId],
			references: [projectIndexTypes.id],
		}),
		document: one(sourceDocuments, {
			fields: [detectionMatcherPageCoverage.documentId],
			references: [sourceDocuments.id],
		}),
		matcher: one(indexMatchers, {
			fields: [detectionMatcherPageCoverage.matcherId],
			references: [indexMatchers.id],
		}),
		lastDetectionRun: one(detectionRuns, {
			fields: [detectionMatcherPageCoverage.lastDetectionRunId],
			references: [detectionRuns.id],
		}),
	}),
);
