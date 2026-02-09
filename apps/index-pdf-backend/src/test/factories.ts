import { randomBytes, randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { and, eq, sql } from "drizzle-orm";
import jwt from "jsonwebtoken";
import { projects, userIndexTypeAddons, users } from "../db/schema";
import { testDb } from "./setup";

// ============================================================================
// Test Data Factories
// ============================================================================

export const generateTestEmail = () =>
	`test-${randomBytes(8).toString("hex")}@example.com`;

export const generateTestPassword = () => randomBytes(16).toString("hex");

export const generateTestTitle = () =>
	`Test Project ${randomBytes(4).toString("hex")}`;

export const generateProjectDir = (title?: string) => {
	if (title) {
		// Convert title to valid project_dir format
		return title
			.toLowerCase()
			.replace(/[^a-z0-9\s-]/g, "")
			.replace(/\s+/g, "-")
			.replace(/-+/g, "-")
			.slice(0, 100);
	}
	return `test-project-${randomBytes(4).toString("hex")}`;
};

// ============================================================================
// User Factory
// ============================================================================

export const createTestUser = async ({
	email = generateTestEmail(),
	password = generateTestPassword(),
	name,
}: {
	email?: string;
	password?: string;
	name?: string;
} = {}) => {
	const JWT_SECRET: string = process.env.JWT_SECRET || "test-secret-key";
	const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || "7d") as
		| string
		| number;

	// Hash password
	const passwordHash = await bcrypt.hash(password, 10);

	// Generate UUID for user BEFORE insertion
	// This is needed so we can set up auth context for RLS policies
	const userUuid = randomUUID();

	// Insert user with pre-generated UUID and auth context for RLS
	const [user] = await testDb.transaction(async (tx) => {
		// Set auth context so RLS policies allow the insert
		await tx.execute(
			sql`SELECT set_config('request.jwt.claim.sub', ${userUuid}, TRUE)`,
		);
		await tx.execute(sql`SET LOCAL ROLE authenticated`);

		// Insert with pre-generated UUID
		const result = await tx
			.insert(users)
			.values({
				id: userUuid,
				email,
				passwordHash,
				name: name ?? null,
			})
			.returning();

		// Grant default "subject" addon to new user (matching production signup)
		await tx.insert(userIndexTypeAddons).values({
			userId: userUuid,
			indexType: "subject",
		});

		// Reset role
		await tx.execute(sql`RESET ROLE`);

		return result;
	});

	// Generate JWT token (matching production auth.service.ts)
	const authToken = jwt.sign(
		{
			sub: user.id,
			email: user.email,
			name: user.name,
		},
		JWT_SECRET,
		{ expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions,
	);

	return {
		email: user.email,
		password,
		name: user.name,
		authToken,
		userId: user.id,
	};
};

// ============================================================================
// Project Factory
// ============================================================================

export const createTestProject = async ({
	userId,
	title = generateTestTitle(),
	description,
	projectDir,
}: {
	userId: string;
	title?: string;
	description?: string;
	projectDir?: string;
}) => {
	const dir = projectDir ?? generateProjectDir(title);

	const [project] = await testDb.transaction(async (tx) => {
		// Set auth context so RLS policies allow the insert
		await tx.execute(
			sql`SELECT set_config('request.jwt.claim.sub', ${userId}, TRUE)`,
		);
		await tx.execute(sql`SET LOCAL ROLE authenticated`);

		const result = await tx
			.insert(projects)
			.values({
				title,
				description: description ?? null,
				projectDir: dir,
				ownerId: userId,
			})
			.returning();

		// Reset role
		await tx.execute(sql`RESET ROLE`);

		return result;
	});

	return project;
};

// ============================================================================
// Index Type Addon Factory
// ============================================================================

/**
 * Grant an index type addon to a user
 * Simulates self-service purchase where user buys addon for themselves
 *
 * In production: Payment webhook → validates payment → grants addon
 * In tests: Directly grants addon to simulate purchase
 *
 * @param userId - User ID to grant addon to
 * @param definitionName - Name of index type to grant
 * @param expiresAt - Optional expiration (null = lifetime)
 */
export const grantIndexTypeAddon = async ({
	userId,
	indexType,
	expiresAt,
}: {
	userId: string;
	indexType: "subject" | "author" | "scripture";
	expiresAt?: Date;
}) => {
	return await testDb.transaction(async (tx) => {
		// Set auth context so RLS policies work
		await tx.execute(
			sql`SELECT set_config('request.jwt.claim.sub', ${userId}, TRUE)`,
		);
		await tx.execute(sql`SET LOCAL ROLE authenticated`);

		// Check if addon already exists
		const existing = await tx
			.select()
			.from(userIndexTypeAddons)
			.where(
				and(
					eq(userIndexTypeAddons.userId, userId),
					eq(userIndexTypeAddons.indexType, indexType),
				),
			)
			.limit(1);

		if (existing.length > 0) {
			await tx.execute(sql`RESET ROLE`);
			return existing[0];
		}

		// Insert addon
		const [addon] = await tx
			.insert(userIndexTypeAddons)
			.values({
				userId,
				indexType,
				expiresAt: expiresAt ?? null,
			})
			.returning();

		// Reset role
		await tx.execute(sql`RESET ROLE`);

		return addon;
	});
};
