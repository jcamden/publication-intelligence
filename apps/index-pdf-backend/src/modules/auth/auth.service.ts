import { createHash, randomBytes } from "node:crypto";

// ============================================================================
// Auth Service - Business logic for authentication
// ============================================================================

const GEL_AUTH_URL =
	process.env.GEL_AUTH_URL ?? "http://localhost:10701/db/main/ext/auth";

// ============================================================================
// PKCE Helper Functions
// ============================================================================

export const generateCodeVerifier = (): string => {
	return randomBytes(32).toString("base64url");
};

export const generateCodeChallenge = (verifier: string): string => {
	return createHash("sha256").update(verifier).digest("base64url");
};

// ============================================================================
// Token Exchange
// ============================================================================

export const exchangeCodeForToken = async ({
	code,
	verifier,
}: {
	code: string;
	verifier: string;
}): Promise<string> => {
	const url = new URL(`${GEL_AUTH_URL}/token`);
	url.searchParams.set("code", code);
	url.searchParams.set("verifier", verifier);

	const response = await fetch(url.toString(), {
		method: "GET",
	});

	if (!response.ok) {
		const error = await response.text();
		throw new Error(error || "Token exchange failed");
	}

	const result = (await response.json()) as { auth_token: string };
	return result.auth_token;
};

// ============================================================================
// Authentication
// ============================================================================

export const getAuthToken = async ({
	email,
	password,
}: {
	email: string;
	password: string;
}): Promise<string> => {
	const verifier = generateCodeVerifier();
	const challenge = generateCodeChallenge(verifier);

	const response = await fetch(`${GEL_AUTH_URL}/authenticate`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			provider: "builtin::local_emailpassword",
			email,
			password,
			challenge,
		}),
	});

	if (!response.ok) {
		const error = await response.text();
		throw new Error(error || "Authentication failed");
	}

	const result = (await response.json()) as { code: string };
	return await exchangeCodeForToken({ code: result.code, verifier });
};

export const registerUser = async ({
	email,
	password,
	challenge,
	verifyUrl,
}: {
	email: string;
	password: string;
	challenge: string;
	verifyUrl?: string;
}): Promise<{ code?: string; email: string; provider: string }> => {
	const response = await fetch(`${GEL_AUTH_URL}/register`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			provider: "builtin::local_emailpassword",
			email,
			password,
			challenge,
			verify_url: verifyUrl ?? "http://localhost:3000/auth/verify",
		}),
	});

	if (!response.ok) {
		const error = await response.text();
		throw new Error(error || "Signup failed");
	}

	const result = (await response.json()) as {
		code?: string;
		email: string;
		provider: string;
	};

	return result;
};
