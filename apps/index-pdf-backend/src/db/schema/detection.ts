import { relations, sql } from "drizzle-orm";
import {
	boolean,
	integer,
	json,
	numeric,
	pgPolicy,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid,
} from "drizzle-orm/pg-core";
import {
	detectionRunScopeEnum,
	detectionRunStatusEnum,
	detectionRunTypeEnum,
} from "./enums";
import { indexEntries, indexMentions } from "./indexing";
import { projects } from "./projects";
import { authenticatedRole, users } from "./users";

// DetectionRuns - tracks LLM and matcher detection jobs
export const detectionRuns = pgTable(
	"detection_runs",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		projectId: uuid("project_id")
			.references(() => projects.id, { onDelete: "cascade" })
			.notNull(),
		runType: detectionRunTypeEnum("run_type").default("llm").notNull(),
		scope: detectionRunScopeEnum("scope"), // null for legacy LLM rows
		pageId: uuid("page_id"), // required when scope is page
		indexEntryGroupIds: json("index_entry_group_ids").$type<string[]>(),
		runAllGroups: boolean("run_all_groups"),
		status: detectionRunStatusEnum("status").default("queued").notNull(),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		startedAt: timestamp("started_at", { withTimezone: true }),
		finishedAt: timestamp("finished_at", { withTimezone: true }),
		progressPage: integer("progress_page"),
		totalPages: integer("total_pages"),
		/** Current pipeline phase label for SSE reconnect + UI. */
		phase: text("phase"),
		/** Current phase progress in [0,1] for SSE reconnect + UI. */
		phaseProgress: numeric("phase_progress", { precision: 6, scale: 4 }),
		pageRangeStart: integer("page_range_start"),
		pageRangeEnd: integer("page_range_end"),
		model: text("model"), // LLM only
		promptVersion: text("prompt_version"), // LLM only
		settingsHash: text("settings_hash"), // both (matcher uses hash of scope/group selection)
		indexType: text("index_type").notNull(),
		errorMessage: text("error_message"),
		costEstimateUsd: numeric("cost_estimate_usd", { precision: 10, scale: 4 }),
		actualCostUsd: numeric("actual_cost_usd", { precision: 10, scale: 4 }),
		entriesCreated: integer("entries_created").default(0),
		mentionsCreated: integer("mentions_created").default(0),
	},
	(table) => [
		pgPolicy("detection_runs_project_access", {
			for: "all",
			to: authenticatedRole,
			using: sql`EXISTS (
				SELECT 1 FROM projects
				WHERE projects.id = ${table.projectId}
			)`,
		}),
	],
);

// DetectionRuns relations
export const detectionRunsRelations = relations(
	detectionRuns,
	({ one, many }) => ({
		project: one(projects, {
			fields: [detectionRuns.projectId],
			references: [projects.id],
		}),
		entries: many(indexEntries),
		mentions: many(indexMentions),
	}),
);

// SuppressedSuggestions - prevents re-suggesting rejected entries
export const suppressedSuggestions = pgTable(
	"suppressed_suggestions",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		projectId: uuid("project_id")
			.references(() => projects.id, { onDelete: "cascade" })
			.notNull(),
		indexType: text("index_type").notNull(),
		normalizedLabel: text("normalized_label").notNull(),
		meaningType: text("meaning_type"),
		meaningId: text("meaning_id"),
		scope: text("scope").default("project"),
		suppressionMode: text("suppression_mode").default("block_suggestion"),
		suppressedAt: timestamp("suppressed_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		suppressedBy: uuid("suppressed_by").references(() => users.id),
		reason: text("reason"),
	},
	(table) => [
		uniqueIndex("unique_suppression").on(
			table.projectId,
			table.indexType,
			table.normalizedLabel,
			table.meaningType,
			table.meaningId,
			table.scope,
		),
		pgPolicy("suppressed_suggestions_project_access", {
			for: "all",
			to: authenticatedRole,
			using: sql`EXISTS (
				SELECT 1 FROM projects
				WHERE projects.id = ${table.projectId}
			)`,
		}),
	],
);

// SuppressedSuggestions relations
export const suppressedSuggestionsRelations = relations(
	suppressedSuggestions,
	({ one }) => ({
		project: one(projects, {
			fields: [suppressedSuggestions.projectId],
			references: [projects.id],
		}),
		suppressedBy: one(users, {
			fields: [suppressedSuggestions.suppressedBy],
			references: [users.id],
		}),
	}),
);
