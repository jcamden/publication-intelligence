import { relations, sql } from "drizzle-orm";
import {
	boolean,
	pgPolicy,
	pgTable,
	smallint,
	timestamp,
	uniqueIndex,
	uuid,
} from "drizzle-orm/pg-core";
import { highlightTypeEnum, indexTypeEnum } from "./enums";
import { indexEntries, indexMentions } from "./indexing";
import { projects } from "./projects";
import { authenticatedRole, users } from "./users";

// UserIndexTypeAddon - User's purchased addons (entitlements)
// Note: Only for index types (subject, author, scripture), not region types
export const userIndexTypeAddons = pgTable(
	"user_index_type_addons",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		userId: uuid("user_id")
			.references(() => users.id, { onDelete: "cascade" })
			.notNull(),
		indexType: indexTypeEnum("index_type").notNull(),
		grantedAt: timestamp("granted_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		expiresAt: timestamp("expires_at", { withTimezone: true }), // null = permanent
	},
	(table) => [
		uniqueIndex("unique_user_index_type").on(table.userId, table.indexType),

		// RLS: Users can only access their own addons
		pgPolicy("user_index_type_addons_own_access", {
			for: "all",
			to: authenticatedRole,
			using: sql`${table.userId} = auth.user_id()`,
		}),
	],
);

// UserIndexTypeAddon relations
export const userIndexTypeAddonsRelations = relations(
	userIndexTypeAddons,
	({ one }) => ({
		user: one(users, {
			fields: [userIndexTypeAddons.userId],
			references: [users.id],
		}),
	}),
);

// ProjectHighlightConfig - Unified config for both index types and region types
// Replaces the old project_index_types table
export const projectHighlightConfigs = pgTable(
	"project_highlight_configs",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		projectId: uuid("project_id")
			.references(() => projects.id, { onDelete: "cascade" })
			.notNull(),
		highlightType: highlightTypeEnum("highlight_type").notNull(),
		colorHue: smallint("color_hue").notNull(), // Hue value 0-360
		isVisible: boolean("is_visible").default(true).notNull(),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true }),
		deletedAt: timestamp("deleted_at", { withTimezone: true }), // soft delete
	},
	(table) => [
		// Unique constraint: one highlight type per project (for non-deleted)
		uniqueIndex("unique_project_highlight_type")
			.on(table.projectId, table.highlightType)
			.where(sql`${table.deletedAt} IS NULL`),

		// RLS: Inherit access from project
		// The projects table RLS already handles owner access
		pgPolicy("project_highlight_configs_project_access", {
			for: "all",
			to: authenticatedRole,
			using: sql`EXISTS (
				SELECT 1 FROM projects
				WHERE projects.id = ${table.projectId}
			)`,
		}),
	],
);

// ProjectHighlightConfig relations
export const projectHighlightConfigsRelations = relations(
	projectHighlightConfigs,
	({ one, many }) => ({
		project: one(projects, {
			fields: [projectHighlightConfigs.projectId],
			references: [projects.id],
		}),
		indexEntries: many(indexEntries),
		indexMentions: many(indexMentions),
	}),
);

// Legacy export for backwards compatibility during migration
// TODO: Remove after all references are updated
export const projectIndexTypes = projectHighlightConfigs;
export const projectIndexTypesRelations = projectHighlightConfigsRelations;
