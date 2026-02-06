import { relations, sql } from "drizzle-orm";
import { pgPolicy, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { userIndexTypeAddons } from "./index-types";
import { projects } from "./projects";

// Authenticated role (used for RLS policies)
// Note: Created in 0000_create_auth_functions.sql migration
export const authenticatedRole = "authenticated" as const;

export const users = pgTable(
	"users",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		email: text("email").notNull().unique(),
		passwordHash: text("password_hash").notNull(),
		name: text("name"),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true }),
		deletedAt: timestamp("deleted_at", { withTimezone: true }),
	},
	(table) => [
		// Allow SELECT for ALL roles (including unauthenticated)
		// Unauthenticated access is needed for:
		// - Duplicate email check during signup
		// - User lookup during login
		// Security: passwordHash is bcrypt-hashed, email lookup is necessary for auth
		pgPolicy("users_select_all", {
			for: "select",
			// Omit 'to' parameter to apply to PUBLIC (all roles)
			using: sql`TRUE`,
		}),

		// Users can INSERT their own user record (signup)
		pgPolicy("users_insert_own", {
			for: "insert",
			to: authenticatedRole,
			withCheck: sql`${table.id} = auth.user_id()`,
		}),

		// Users can UPDATE their own record
		pgPolicy("users_update_own", {
			for: "update",
			to: authenticatedRole,
			using: sql`${table.id} = auth.user_id()`,
			withCheck: sql`${table.id} = auth.user_id()`,
		}),

		// Users can DELETE their own record
		pgPolicy("users_delete_own", {
			for: "delete",
			to: authenticatedRole,
			using: sql`${table.id} = auth.user_id()`,
		}),
	],
);

// Relations
export const usersRelations = relations(users, ({ many }) => ({
	ownedProjects: many(projects, { relationName: "projectOwner" }),
	userIndexTypeAddons: many(userIndexTypeAddons),
}));
