import { randomBytes } from "node:crypto";
import type { Client } from "gel";

// ============================================================================
// Test Data Factories
// ============================================================================

export const generateTestEmail = () =>
	`test-${randomBytes(8).toString("hex")}@example.com`;

export const generateTestPassword = () => randomBytes(16).toString("hex");

export const generateTestTitle = () =>
	`Test Project ${randomBytes(4).toString("hex")}`;

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
	// TODO: Use test branch for better isolation
	// Currently using main for all environments due to auth timing issues
	const branch = "main"; // process.env.NODE_ENV === "test" ? "test" : "main";
	const GEL_AUTH_URL =
		process.env.GEL_AUTH_URL ?? `http://localhost:10701/db/${branch}/ext/auth`;

	const createHash = (await import("node:crypto")).createHash;
	const randomBytes = (await import("node:crypto")).randomBytes;

	const generateCodeVerifier = () => randomBytes(32).toString("base64url");
	const generateCodeChallenge = (verifier: string) =>
		createHash("sha256").update(verifier).digest("base64url");

	const verifier = generateCodeVerifier();
	const challenge = generateCodeChallenge(verifier);

	const response = await fetch(`${GEL_AUTH_URL}/register`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			provider: "builtin::local_emailpassword",
			email,
			password,
			challenge,
			verify_url: "http://localhost:3000/auth/verify",
		}),
	});

	if (!response.ok) {
		throw new Error(`Failed to create test user: ${await response.text()}`);
	}

	const result = (await response.json()) as { code?: string };

	let authToken: string;
	if (result.code?.trim()) {
		const tokenUrl = new URL(`${GEL_AUTH_URL}/token`);
		tokenUrl.searchParams.set("code", result.code);
		tokenUrl.searchParams.set("verifier", verifier);

		const tokenResponse = await fetch(tokenUrl.toString());
		if (!tokenResponse.ok) {
			throw new Error("Failed to exchange code for token");
		}

		const tokenResult = (await tokenResponse.json()) as { auth_token: string };
		authToken = tokenResult.auth_token;
	} else {
		const authResponse = await fetch(`${GEL_AUTH_URL}/authenticate`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				provider: "builtin::local_emailpassword",
				email,
				password,
				challenge: generateCodeChallenge(generateCodeVerifier()),
			}),
		});

		if (!authResponse.ok) {
			throw new Error("Failed to authenticate test user");
		}

		const authResult = (await authResponse.json()) as { code: string };
		const newVerifier = generateCodeVerifier();
		const tokenUrl = new URL(`${GEL_AUTH_URL}/token`);
		tokenUrl.searchParams.set("code", authResult.code);
		tokenUrl.searchParams.set("verifier", newVerifier);

		const tokenResponse = await fetch(tokenUrl.toString());
		const tokenResult = (await tokenResponse.json()) as { auth_token: string };
		authToken = tokenResult.auth_token;
	}

	// Create User record in database (required for global current_user)
	const { createGelClient } = await import("../db/client");
	const gel = createGelClient();
	const authenticatedClient = gel.withGlobals({
		"ext::auth::client_token": authToken,
	});

	const user = await authenticatedClient.querySingle<{
		id: string;
		email: string;
		name: string | null;
	}>(
		`
		INSERT User {
			email := <str>$email,
			name := <optional str>$name,
			identity := global ext::auth::ClientTokenIdentity
		}
		UNLESS CONFLICT ON .identity
		ELSE (
			SELECT User FILTER .identity = global ext::auth::ClientTokenIdentity
		)
	`,
		{
			email,
			name: name ?? null,
		},
	);

	if (!user) {
		throw new Error("Failed to create User record in database");
	}

	return {
		email,
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
	gelClient,
	title = generateTestTitle(),
	description,
}: {
	gelClient: Client;
	title?: string;
	description?: string;
}) => {
	const project = await gelClient.querySingle<{
		id: string;
		title: string;
		description: string | null;
	}>(
		`
		INSERT Project {
			title := <str>$title,
			description := <optional str>$description,
			owner := global current_user,
			collaborators := {}
		}
	`,
		{
			title,
			description: description ?? null,
		},
	);

	if (!project) {
		throw new Error("Failed to create test project");
	}

	return project;
};
