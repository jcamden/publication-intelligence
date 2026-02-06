import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { eq, sql } from "drizzle-orm";
import jwt from "jsonwebtoken";
import { db } from "../../db/client";
import { users } from "../../db/schema";
import { env } from "../../env";

// ============================================================================
// Auth Service - Custom JWT-based authentication
// ============================================================================

export type AuthTokenPayload = {
	sub: string; // user ID
	email: string;
	name: string | null;
	iat: number;
	exp: number;
};

// ============================================================================
// User Signup
// ============================================================================

export const signup = async ({
	email,
	password,
	name,
}: {
	email: string;
	password: string;
	name?: string;
}) => {
	// Check if user exists
	const existing = await db
		.select()
		.from(users)
		.where(eq(users.email, email))
		.limit(1);

	if (existing.length > 0) {
		throw new Error("User already exists");
	}

	// Hash password (10 rounds)
	const passwordHash = await bcrypt.hash(password, 10);

	// Generate user ID and insert within RLS context
	// RLS policy requires id = auth.user_id(), so we set context to the new ID
	const newUserId = randomUUID();

	const [user] = await db.transaction(async (tx) => {
		// Set auth context for RLS (transaction-scoped)
		await tx.execute(
			sql`SELECT set_config('request.jwt.claim.sub', ${newUserId}, TRUE)`,
		);
		await tx.execute(sql`SET LOCAL ROLE authenticated`);

		// Insert user with pre-generated ID
		return await tx
			.insert(users)
			.values({
				id: newUserId,
				email,
				passwordHash,
				name,
			})
			.returning();
	});

	// Generate JWT
	const token = jwt.sign(
		{
			sub: user.id,
			email: user.email,
			name: user.name,
		} as Omit<AuthTokenPayload, "iat" | "exp">,
		env.JWT_SECRET,
		{ expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions,
	);

	return {
		user: {
			id: user.id,
			email: user.email,
			name: user.name,
		},
		token,
	};
};

// ============================================================================
// User Login
// ============================================================================

export const login = async ({
	email,
	password,
}: {
	email: string;
	password: string;
}) => {
	// Find user
	const [user] = await db
		.select()
		.from(users)
		.where(eq(users.email, email))
		.limit(1);

	if (!user) {
		throw new Error("Invalid email or password");
	}

	// Verify password
	const valid = await bcrypt.compare(password, user.passwordHash);
	if (!valid) {
		throw new Error("Invalid email or password");
	}

	// Generate JWT
	const token = jwt.sign(
		{
			sub: user.id,
			email: user.email,
			name: user.name,
		} as Omit<AuthTokenPayload, "iat" | "exp">,
		env.JWT_SECRET,
		{ expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions,
	);

	return {
		user: {
			id: user.id,
			email: user.email,
			name: user.name,
		},
		token,
	};
};

// ============================================================================
// Token Verification
// ============================================================================

export const verifyToken = ({ token }: { token: string }): AuthTokenPayload => {
	try {
		return jwt.verify(token, env.JWT_SECRET) as AuthTokenPayload;
	} catch (_error) {
		throw new Error("Invalid token");
	}
};
