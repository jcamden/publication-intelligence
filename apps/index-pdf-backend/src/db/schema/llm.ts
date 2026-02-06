import { relations, sql } from "drizzle-orm";
import {
	bigint,
	integer,
	json,
	pgPolicy,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid,
} from "drizzle-orm/pg-core";
import { sourceDocuments } from "./documents";
import { llmRunStatusEnum } from "./enums";
import { authenticatedRole, users } from "./users";

// Prompt - LLM template for indexing tasks
export const prompts = pgTable(
	"prompts",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		name: text("name").notNull(),
		version: integer("version").notNull(),
		templateText: text("template_text").notNull(),
		description: text("description"),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => [
		uniqueIndex("unique_name_version").on(table.name, table.version),

		// RLS: All authenticated users can read prompts (system templates)
		pgPolicy("prompts_select_authenticated", {
			for: "select",
			to: authenticatedRole,
			using: sql`true`,
		}),
		// TODO: Add admin role for INSERT/UPDATE/DELETE
	],
);

// Prompt relations
export const promptsRelations = relations(prompts, ({ many }) => ({
	runs: many(llmRuns),
}));

// LLMRun - Execution record of LLM prompt
export const llmRuns = pgTable(
	"llm_runs",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		promptId: uuid("prompt_id")
			.references(() => prompts.id, { onDelete: "cascade" })
			.notNull(),
		documentId: uuid("document_id").references(() => sourceDocuments.id, {
			onDelete: "cascade",
		}),
		executedByUserId: uuid("executed_by_user_id")
			.references(() => users.id, { onDelete: "cascade" })
			.notNull(),
		status: llmRunStatusEnum("status").default("pending").notNull(),
		inputData: json("input_data"), // Prompt variables
		outputData: json("output_data"), // LLM response
		errorMessage: text("error_message"),
		tokenCount: integer("token_count"),
		estimatedCost: bigint("estimated_cost", { mode: "number" }), // In cents
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		startedAt: timestamp("started_at", { withTimezone: true }),
		completedAt: timestamp("completed_at", { withTimezone: true }),
	},
	(table) => [
		// RLS: Users can access runs they executed OR runs from documents in their projects
		// source_documents RLS inherits from projects RLS
		pgPolicy("llm_runs_user_or_document_access", {
			for: "all",
			to: authenticatedRole,
			using: sql`(
				${table.executedByUserId} = auth.user_id()
				OR EXISTS (
					SELECT 1 FROM source_documents
					WHERE source_documents.id = ${table.documentId}
				)
			)`,
		}),
	],
);

// LLMRun relations
export const llmRunsRelations = relations(llmRuns, ({ one }) => ({
	prompt: one(prompts, {
		fields: [llmRuns.promptId],
		references: [prompts.id],
	}),
	document: one(sourceDocuments, {
		fields: [llmRuns.documentId],
		references: [sourceDocuments.id],
	}),
	executedBy: one(users, {
		fields: [llmRuns.executedByUserId],
		references: [users.id],
	}),
}));
