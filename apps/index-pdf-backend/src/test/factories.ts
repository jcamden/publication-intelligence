import { randomBytes, randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { and, eq, sql } from "drizzle-orm";
import type { PgliteDatabase } from "drizzle-orm/pglite";
import jwt from "jsonwebtoken";
import { getTestDb } from "../db/client";
import type * as schema from "../db/schema";
import {
	indexEntries,
	indexMentions,
	indexMentionTypes,
	indexVariants,
	projectIndexTypes,
	projects,
	sourceDocuments,
	userIndexTypeAddons,
	users,
} from "../db/schema";

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
	testDb,
}: {
	email?: string;
	password?: string;
	name?: string;
	testDb?: PgliteDatabase<typeof schema>;
} = {}) => {
	// Get testDb from module-level override if not explicitly provided
	const db = testDb || getTestDb();
	if (!db) {
		throw new Error(
			"No test database available. Ensure test is running with proper setup.",
		);
	}
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
	const [user] = await db.transaction(async (tx) => {
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
	testDb,
}: {
	userId: string;
	title?: string;
	description?: string;
	projectDir?: string;
	testDb?: PgliteDatabase<typeof schema>;
}) => {
	// Get testDb from module-level override if not explicitly provided
	const db = testDb || getTestDb();
	if (!db) {
		throw new Error(
			"No test database available. Ensure test is running with proper setup.",
		);
	}

	const dir = projectDir ?? generateProjectDir(title);

	const [project] = await db.transaction(async (tx) => {
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
	testDb,
}: {
	userId: string;
	indexType: "subject" | "author" | "scripture";
	expiresAt?: Date;
	testDb?: PgliteDatabase<typeof schema>;
}) => {
	// Get testDb from module-level override if not explicitly provided
	const db = testDb || getTestDb();
	if (!db) {
		throw new Error(
			"No test database available. Ensure test is running with proper setup.",
		);
	}

	return await db.transaction(async (tx) => {
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

// ============================================================================
// Project Index Type Factory
// ============================================================================

export const createTestProjectIndexType = async ({
	projectId,
	indexType,
	userId,
	colorHue,
	isVisible = true,
	testDb,
}: {
	projectId: string;
	indexType: "subject" | "author" | "scripture";
	userId: string;
	colorHue?: number;
	isVisible?: boolean;
	testDb?: PgliteDatabase<typeof schema>;
}) => {
	// Get testDb from module-level override if not explicitly provided
	const db = testDb || getTestDb();
	if (!db) {
		throw new Error(
			"No test database available. Ensure test is running with proper setup.",
		);
	}

	const defaultColorHue =
		indexType === "subject" ? 230 : indexType === "author" ? 280 : 30;

	return await db.transaction(async (tx) => {
		await tx.execute(
			sql`SELECT set_config('request.jwt.claim.sub', ${userId}, TRUE)`,
		);
		await tx.execute(sql`SET LOCAL ROLE authenticated`);

		const [projectIndexType] = await tx
			.insert(projectIndexTypes)
			.values({
				projectId,
				indexType,
				colorHue: colorHue ?? defaultColorHue,
				isVisible,
			})
			.returning();

		await tx.execute(sql`RESET ROLE`);

		return projectIndexType;
	});
};

// ============================================================================
// Index Entry Factory
// ============================================================================

export const createTestIndexEntry = async ({
	projectId,
	projectIndexTypeId,
	label,
	slug,
	userId,
	description,
	parentId,
	variants,
	testDb,
}: {
	projectId: string;
	projectIndexTypeId: string;
	label: string;
	slug: string;
	userId: string;
	description?: string;
	parentId?: string;
	variants?: string[];
	testDb?: PgliteDatabase<typeof schema>;
}) => {
	// Get testDb from module-level override if not explicitly provided
	const db = testDb || getTestDb();
	if (!db) {
		throw new Error(
			"No test database available. Ensure test is running with proper setup.",
		);
	}

	return await db.transaction(async (tx) => {
		await tx.execute(
			sql`SELECT set_config('request.jwt.claim.sub', ${userId}, TRUE)`,
		);
		await tx.execute(sql`SET LOCAL ROLE authenticated`);

		const [entry] = await tx
			.insert(indexEntries)
			.values({
				projectId,
				projectIndexTypeId,
				label,
				slug,
				description: description ?? null,
				parentId: parentId ?? null,
				status: "active",
				revision: 1,
			})
			.returning();

		if (variants && variants.length > 0) {
			await tx.insert(indexVariants).values(
				variants.map((text) => ({
					entryId: entry.id,
					text,
					variantType: "alias" as const,
					revision: 1,
				})),
			);
		}

		await tx.execute(sql`RESET ROLE`);

		return entry;
	});
};

// ============================================================================
// Source Document Factory
// ============================================================================

export const createTestSourceDocument = async ({
	projectId,
	userId,
	title = `Test Document ${randomBytes(4).toString("hex")}`,
	fileName = "test-document.pdf",
	storageKey = `test/${randomUUID()}.pdf`,
	pageCount,
	testDb,
}: {
	projectId: string;
	userId: string;
	title?: string;
	fileName?: string;
	storageKey?: string;
	pageCount?: number;
	testDb?: PgliteDatabase<typeof schema>;
}) => {
	const db = testDb || getTestDb();
	if (!db) {
		throw new Error(
			"No test database available. Ensure test is running with proper setup.",
		);
	}

	return await db.transaction(async (tx) => {
		await tx.execute(
			sql`SELECT set_config('request.jwt.claim.sub', ${userId}, TRUE)`,
		);
		await tx.execute(sql`SET LOCAL ROLE authenticated`);

		const [document] = await tx
			.insert(sourceDocuments)
			.values({
				projectId,
				title,
				fileName,
				storageKey,
				pageCount: pageCount ?? null,
				status: "uploaded",
			})
			.returning();

		await tx.execute(sql`RESET ROLE`);

		return document;
	});
};

// ============================================================================
// Index Mention Factory
// ============================================================================

export const createTestIndexMention = async ({
	entryId,
	documentId,
	userId,
	pageNumber = 1,
	textSpan = "Test mention text",
	bboxes = [{ x: 100, y: 100, width: 200, height: 20 }],
	projectIndexTypeIds,
	mentionType = "text",
	testDb,
}: {
	entryId: string;
	documentId: string;
	userId: string;
	pageNumber?: number;
	textSpan?: string;
	bboxes?: Array<{ x: number; y: number; width: number; height: number }>;
	projectIndexTypeIds: string[];
	mentionType?: "text" | "region";
	testDb?: PgliteDatabase<typeof schema>;
}) => {
	const db = testDb || getTestDb();
	if (!db) {
		throw new Error(
			"No test database available. Ensure test is running with proper setup.",
		);
	}

	return await db.transaction(async (tx) => {
		await tx.execute(
			sql`SELECT set_config('request.jwt.claim.sub', ${userId}, TRUE)`,
		);
		await tx.execute(sql`SET LOCAL ROLE authenticated`);

		const [mention] = await tx
			.insert(indexMentions)
			.values({
				entryId,
				documentId,
				pageNumber,
				textSpan,
				bboxes: bboxes as unknown as typeof indexMentions.$inferInsert.bboxes,
				rangeType: "single_page",
				mentionType,
				revision: 1,
			})
			.returning();

		await tx.insert(indexMentionTypes).values(
			projectIndexTypeIds.map((projectIndexTypeId) => ({
				indexMentionId: mention.id,
				projectIndexTypeId,
			})),
		);

		await tx.execute(sql`RESET ROLE`);

		return mention;
	});
};
