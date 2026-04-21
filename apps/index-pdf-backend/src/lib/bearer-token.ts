const BEARER_PREFIX = "Bearer ";

/**
 * Returns the token from an `Authorization: Bearer <token>` header, or undefined.
 */
export function parseBearerToken(
	authorizationHeader: string | undefined,
): string | undefined {
	if (!authorizationHeader?.startsWith(BEARER_PREFIX)) {
		return undefined;
	}
	return authorizationHeader.slice(BEARER_PREFIX.length);
}
