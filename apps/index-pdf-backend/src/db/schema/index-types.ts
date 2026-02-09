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
import { indexTypeEnum } from "./enums";
import { indexEntries, indexMentions } from "./indexing";
import { projects } from "./projects";
import { authenticatedRole, users } from "./users";

// UserIndexTypeAddon - User's purchased addons (entitlements)
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

// ProjectIndexType - Enabled index types in a project with customization
export const projectIndexTypes = pgTable(
	"project_index_types",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		projectId: uuid("project_id")
			.references(() => projects.id, { onDelete: "cascade" })
			.notNull(),
		indexType: indexTypeEnum("index_type").notNull(),
		colorHue: smallint("color_hue").notNull(), // Hue value 0-360
		isVisible: boolean("is_visible").default(true).notNull(),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true }),
		deletedAt: timestamp("deleted_at", { withTimezone: true }), // soft delete
	},
	(table) => [
		// Unique constraint: one index type per project (for non-deleted)
		uniqueIndex("unique_project_index_type")
			.on(table.projectId, table.indexType)
			.where(sql`${table.deletedAt} IS NULL`),

		// RLS: Inherit access from project
		// The projects table RLS already handles owner access
		pgPolicy("project_index_types_project_access", {
			for: "all",
			to: authenticatedRole,
			using: sql`EXISTS (
				SELECT 1 FROM projects
				WHERE projects.id = ${table.projectId}
			)`,
		}),
	],
);

// ProjectIndexType relations
export const projectIndexTypesRelations = relations(
	projectIndexTypes,
	({ one, many }) => ({
		project: one(projects, {
			fields: [projectIndexTypes.projectId],
			references: [projects.id],
		}),
		indexEntries: many(indexEntries),
		indexMentions: many(indexMentions),
	}),
);
