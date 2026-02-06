import { relations, sql } from "drizzle-orm";
import {
	json,
	pgPolicy,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";
import { entityTypeEnum } from "./enums";
import { projects } from "./projects";
import { authenticatedRole, users } from "./users";

// Event - Domain event log for audit/debugging
export const events = pgTable(
	"events",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		type: text("type").notNull(), // e.g., 'auth.user_logged_in', 'project.created'
		projectId: uuid("project_id").references(() => projects.id, {
			onDelete: "cascade",
		}),
		userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
		entityType: entityTypeEnum("entity_type"),
		entityId: uuid("entity_id"),
		metadata: json("metadata"),
		requestId: text("request_id"),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => [
		// RLS: Users can view their own events OR events from their projects
		// The projects table RLS already handles owner access
		pgPolicy("events_user_or_project_access", {
			for: "select",
			to: authenticatedRole,
			using: sql`(
				${table.userId} = auth.user_id()
				OR EXISTS (
					SELECT 1 FROM projects
					WHERE projects.id = ${table.projectId}
				)
			)`,
		}),
		// Events are insert-only (no update/delete by users)
	],
);

// Event relations
export const eventsRelations = relations(events, ({ one }) => ({
	project: one(projects, {
		fields: [events.projectId],
		references: [projects.id],
	}),
	user: one(users, {
		fields: [events.userId],
		references: [users.id],
	}),
}));
