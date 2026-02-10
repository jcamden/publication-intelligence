import { relations, sql } from "drizzle-orm";
import {
	bigint,
	boolean,
	integer,
	json,
	pgPolicy,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid,
} from "drizzle-orm/pg-core";
import {
	contextTypeEnum,
	pageConfigModeEnum,
	sourceDocumentStatusEnum,
} from "./enums";
import { indexMentions } from "./indexing";
import { projects } from "./projects";
import { authenticatedRole } from "./users";

// SourceDocument - A PDF or book being indexed
export const sourceDocuments = pgTable(
	"source_documents",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		projectId: uuid("project_id")
			.references(() => projects.id, { onDelete: "cascade" })
			.notNull(),
		title: text("title").notNull(),
		fileName: text("file_name").notNull(),
		fileSize: bigint("file_size", { mode: "number" }),
		contentHash: text("content_hash"),
		pageCount: integer("page_count"),
		storageKey: text("storage_key").notNull(),
		status: sourceDocumentStatusEnum("status").default("uploaded").notNull(),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		processedAt: timestamp("processed_at", { withTimezone: true }),
		deletedAt: timestamp("deleted_at", { withTimezone: true }),
	},
	(table) => [
		// RLS: Inherit access from project
		// The projects table RLS already handles owner access
		pgPolicy("source_documents_project_access", {
			for: "all",
			to: authenticatedRole,
			using: sql`EXISTS (
				SELECT 1 FROM projects
				WHERE projects.id = ${table.projectId}
			)`,
		}),
	],
);

// SourceDocument relations
export const sourceDocumentsRelations = relations(
	sourceDocuments,
	({ one, many }) => ({
		project: one(projects, {
			fields: [sourceDocuments.projectId],
			references: [projects.id],
		}),
		pages: many(documentPages),
		indexMentions: many(indexMentions),
	}),
);

// DocumentPage - Single page within a source document
export const documentPages = pgTable(
	"document_pages",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		documentId: uuid("document_id")
			.references(() => sourceDocuments.id, { onDelete: "cascade" })
			.notNull(),
		pageNumber: integer("page_number").notNull(),
		textContent: text("text_content"),
		metadata: json("metadata"),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => [
		// Each page number appears exactly once per document
		uniqueIndex("unique_document_page").on(table.documentId, table.pageNumber),

		// RLS: Inherit access from source document
		// source_documents RLS inherits from projects RLS
		pgPolicy("document_pages_document_access", {
			for: "all",
			to: authenticatedRole,
			using: sql`EXISTS (
				SELECT 1 FROM source_documents
				WHERE source_documents.id = ${table.documentId}
			)`,
		}),
	],
);

// DocumentPage relations
export const documentPagesRelations = relations(
	documentPages,
	({ one, many }) => ({
		document: one(sourceDocuments, {
			fields: [documentPages.documentId],
			references: [sourceDocuments.id],
		}),
		indexMentions: many(indexMentions),
	}),
);

// Context - Regions for text extraction configuration
export const contexts = pgTable(
	"contexts",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		projectId: uuid("project_id")
			.references(() => projects.id, { onDelete: "cascade" })
			.notNull(),
		name: text("name").notNull(), // User-provided name for the context
		contextType: contextTypeEnum("context_type").notNull(),
		pageConfigMode: pageConfigModeEnum("page_config_mode").notNull(),
		pageNumber: integer("page_number"), // For this_page mode
		pageRange: text("page_range"), // For page_range/custom modes
		everyOther: boolean("every_other").default(false).notNull(),
		startPage: integer("start_page"), // Starting page for every other
		endPage: integer("end_page"), // Ending page for every other (optional)
		bbox: json("bbox"), // BoundingBox coordinates
		color: text("color").notNull(), // Hex color (e.g., "#FCA5A5")
		visible: boolean("visible").default(true).notNull(),
		exceptPages: integer("except_pages").array(), // Pages to exclude from this context
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true }),
		deletedAt: timestamp("deleted_at", { withTimezone: true }),
	},
	(table) => [
		// RLS: Inherit access from project
		pgPolicy("contexts_project_access", {
			for: "all",
			to: authenticatedRole,
			using: sql`EXISTS (
				SELECT 1 FROM projects
				WHERE projects.id = ${table.projectId}
			)`,
		}),
	],
);

// Context relations
export const contextsRelations = relations(contexts, ({ one }) => ({
	project: one(projects, {
		fields: [contexts.projectId],
		references: [projects.id],
	}),
}));
