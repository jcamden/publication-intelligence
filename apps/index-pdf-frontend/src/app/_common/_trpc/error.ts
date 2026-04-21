/**
 * Extracts a user-friendly message from TRPC/Zod validation errors.
 * When Zod validation fails, error.message can be a JSON array of issues.
 */
export function formatTrpcErrorMessage(
	error: unknown,
	fallback = "Something went wrong. Please try again.",
): string {
	if (!error || typeof error !== "object") return fallback;

	const msg =
		"message" in error &&
		typeof (error as { message?: unknown }).message === "string"
			? (error as { message: string }).message
			: null;

	if (!msg) return fallback;

	// Try to parse Zod-style JSON array: [{ "message": "...", "path": [...] }, ...]
	try {
		const parsed = JSON.parse(msg) as unknown;
		if (Array.isArray(parsed) && parsed.length > 0) {
			const first = parsed[0];
			if (
				first &&
				typeof first === "object" &&
				"message" in first &&
				typeof (first as { message?: unknown }).message === "string"
			) {
				const issueMsg = (first as { message: string }).message;
				return issueMsg.endsWith(".")
					? issueMsg
					: `${issueMsg}. Please try again.`;
			}
		}
	} catch {
		// Not JSON, use message as-is if it looks user-facing
	}

	// If message looks like raw JSON, don't show it
	if (msg.trimStart().startsWith("[")) return fallback;

	return msg || fallback;
}
