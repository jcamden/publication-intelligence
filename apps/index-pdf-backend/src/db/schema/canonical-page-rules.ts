import { relations, sql } from "drizzle-orm";
import {
	integer,
	pgPolicy,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";
import { canonicalPageRuleTypeEnum, numeralTypeEnum } from "./enums";
import { projects } from "./projects";
import { authenticatedRole } from "./users";

// CanonicalPageRule - User-defined rules for canonical page numbering
// Positive rules define canonical page numbers for document page ranges
// Negative rules mark document pages as ignored (not indexed)
export const canonicalPageRules = pgTable(
	"canonical_page_rules",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		projectId: uuid("project_id")
			.references(() => projects.id, { onDelete: "cascade" })
			.notNull(),
		ruleType: canonicalPageRuleTypeEnum("rule_type").notNull(),
		documentPageStart: integer("document_page_start").notNull(),
		documentPageEnd: integer("document_page_end").notNull(),
		label: text("label"),

		// For positive rules only (null for negative rules):
		numeralType: numeralTypeEnum("numeral_type"),
		startingCanonicalPage: text("starting_canonical_page"),
		arbitrarySequence: text("arbitrary_sequence").array(),

		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true }),
		deletedAt: timestamp("deleted_at", { withTimezone: true }),
	},
	(table) => [
		// RLS: Inherit access from project
		pgPolicy("canonical_page_rules_project_access", {
			for: "all",
			to: authenticatedRole,
			using: sql`EXISTS (
				SELECT 1 FROM projects
				WHERE projects.id = ${table.projectId}
			)`,
		}),
	],
);

// CanonicalPageRule relations
export const canonicalPageRulesRelations = relations(
	canonicalPageRules,
	({ one }) => ({
		project: one(projects, {
			fields: [canonicalPageRules.projectId],
			references: [projects.id],
		}),
	}),
);
