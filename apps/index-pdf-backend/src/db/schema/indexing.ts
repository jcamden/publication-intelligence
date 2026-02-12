import { relations, sql } from "drizzle-orm";
import {
	integer,
	json,
	pgPolicy,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid,
} from "drizzle-orm/pg-core";
import { documentPages, sourceDocuments } from "./documents";
import {
	indexEntryStatusEnum,
	mentionRangeTypeEnum,
	mentionTypeEnum,
	relationTypeEnum,
	variantTypeEnum,
} from "./enums";
import { projectIndexTypes } from "./highlight-configs";
import { projects } from "./projects";
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
		description: text("description"),
		status: indexEntryStatusEnum("status").default("active").notNull(),
		revision: integer("revision").default(1).notNull(),
		parentId: uuid("parent_id"), // Self-referential, nullable for top-level entries
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true }),
		deletedAt: timestamp("deleted_at", { withTimezone: true }),
	},
	(table) => [
		// Slug uniqueness per project AND index type
		uniqueIndex("unique_project_index_type_slug").on(
			table.projectId,
			table.projectIndexTypeId,
			table.slug,
		),

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
		children: many(indexEntries, { relationName: "entryHierarchy" }),
		variants: many(indexVariants),
		mentions: many(indexMentions),
		relationsFrom: many(indexRelations, { relationName: "relationFrom" }),
		relationsTo: many(indexRelations, { relationName: "relationTo" }),
	}),
);

// IndexVariant - Alternative forms of an IndexEntry
export const indexVariants = pgTable(
	"index_variants",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		entryId: uuid("entry_id")
			.references(() => indexEntries.id, { onDelete: "cascade" })
			.notNull(),
		text: text("text").notNull(),
		variantType: variantTypeEnum("variant_type").default("alias").notNull(),
		revision: integer("revision").default(1).notNull(),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true }),
	},
	(table) => [
		// Prevent duplicate variants for the same entry
		uniqueIndex("unique_entry_text").on(table.entryId, table.text),

		// RLS: Inherit access from index entry
		// index_entries RLS inherits from projects RLS
		pgPolicy("index_variants_entry_access", {
			for: "all",
			to: authenticatedRole,
			using: sql`EXISTS (
				SELECT 1 FROM index_entries
				WHERE index_entries.id = ${table.entryId}
			)`,
		}),
	],
);

// IndexVariant relations
export const indexVariantsRelations = relations(indexVariants, ({ one }) => ({
	entry: one(indexEntries, {
		fields: [indexVariants.entryId],
		references: [indexEntries.id],
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
		toEntryId: uuid("to_entry_id")
			.references(() => indexEntries.id, { onDelete: "cascade" })
			.notNull(),
		relationType: relationTypeEnum("relation_type").notNull(),
		note: text("note"),
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
		documentId: uuid("document_id")
			.references(() => sourceDocuments.id, { onDelete: "cascade" })
			.notNull(),
		pageId: uuid("page_id").references(() => documentPages.id, {
			onDelete: "cascade",
		}),
		pageNumber: integer("page_number"), // Denormalized for fast queries
		pageNumberEnd: integer("page_number_end"), // For page ranges
		textSpan: text("text_span").notNull(), // The actual text
		startOffset: integer("start_offset"),
		endOffset: integer("end_offset"),
		bboxes: json("bboxes"), // Array of BoundingBox coordinates
		rangeType: mentionRangeTypeEnum("range_type")
			.default("single_page")
			.notNull(),
		mentionType: mentionTypeEnum("mention_type").default("text").notNull(),
		suggestedByLlmId: uuid("suggested_by_llm_id"), // References llm_runs
		note: text("note"),
		revision: integer("revision").default(1).notNull(),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true }),
		deletedAt: timestamp("deleted_at", { withTimezone: true }),
	},
	(table) => [
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
export const indexMentionsRelations = relations(
	indexMentions,
	({ one, many }) => ({
		entry: one(indexEntries, {
			fields: [indexMentions.entryId],
			references: [indexEntries.id],
		}),
		document: one(sourceDocuments, {
			fields: [indexMentions.documentId],
			references: [sourceDocuments.id],
		}),
		page: one(documentPages, {
			fields: [indexMentions.pageId],
			references: [documentPages.id],
		}),
		mentionTypes: many(indexMentionTypes),
	}),
);

// IndexMentionTypes - Junction table for many-to-many relationship
// (IndexMention can belong to multiple ProjectIndexTypes for multi-highlighting)
export const indexMentionTypes = pgTable(
	"index_mention_types",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		indexMentionId: uuid("index_mention_id")
			.references(() => indexMentions.id, { onDelete: "cascade" })
			.notNull(),
		projectIndexTypeId: uuid("project_index_type_id")
			.references(() => projectIndexTypes.id, { onDelete: "cascade" })
			.notNull(),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => [
		uniqueIndex("unique_mention_type").on(
			table.indexMentionId,
			table.projectIndexTypeId,
		),

		// RLS: Inherit access from mention
		// index_mentions RLS inherits from index_entries RLS which inherits from projects RLS
		pgPolicy("index_mention_types_mention_access", {
			for: "all",
			to: authenticatedRole,
			using: sql`EXISTS (
				SELECT 1 FROM index_mentions
				WHERE index_mentions.id = ${table.indexMentionId}
			)`,
		}),
	],
);

// IndexMentionTypes relations
export const indexMentionTypesRelations = relations(
	indexMentionTypes,
	({ one }) => ({
		mention: one(indexMentions, {
			fields: [indexMentionTypes.indexMentionId],
			references: [indexMentions.id],
		}),
		projectIndexType: one(projectIndexTypes, {
			fields: [indexMentionTypes.projectIndexTypeId],
			references: [projectIndexTypes.id],
		}),
	}),
);
