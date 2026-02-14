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
	uuid,
} from "drizzle-orm/pg-core";
import {
	pageConfigModeEnum,
	regionTypeEnum,
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
		indexMentions: many(indexMentions),
	}),
);

// Region - Regions for text extraction configuration
export const regions = pgTable(
	"regions",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		projectId: uuid("project_id")
			.references(() => projects.id, { onDelete: "cascade" })
			.notNull(),
		name: text("name").notNull(), // User-provided name for the region
		regionType: regionTypeEnum("region_type").notNull(),
		pageConfigMode: pageConfigModeEnum("page_config_mode").notNull(),
		pageNumber: integer("page_number"), // For this_page mode
		pageRange: text("page_range"), // For page_range/custom modes
		everyOther: boolean("every_other").default(false).notNull(),
		startPage: integer("start_page"), // Starting page for every other
		endPage: integer("end_page"), // Ending page for every other (optional)
		bbox: json("bbox"), // BoundingBox coordinates
		color: text("color").notNull(), // Hex color (e.g., "#FCA5A5")
		visible: boolean("visible").default(true).notNull(),
		exceptPages: integer("except_pages").array(), // Pages to exclude from this region
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true }),
		deletedAt: timestamp("deleted_at", { withTimezone: true }),
	},
	(table) => [
		// RLS: Inherit access from project
		pgPolicy("regions_project_access", {
			for: "all",
			to: authenticatedRole,
			using: sql`EXISTS (
				SELECT 1 FROM projects
				WHERE projects.id = ${table.projectId}
			)`,
		}),
	],
);

// Region relations
export const regionsRelations = relations(regions, ({ one }) => ({
	project: one(projects, {
		fields: [regions.projectId],
		references: [projects.id],
	}),
}));
