import { TRPCError } from "@trpc/server";

/**
 * Asserts that a value is not null/undefined, throwing NOT_FOUND if it is.
 *
 * This helper enforces the distinction between:
 * - NOT_FOUND: Object doesn't exist OR user lacks permission to see it
 * - Access policies already filtered it out (returns empty set)
 *
 * Security principle: Never reveal whether an object exists if user can't access it.
 * Both "doesn't exist" and "forbidden" return 404, not 403.
 *
 * @example
 * ```typescript
 * const project = await projectRepo.getById({ id });
 * return requireFound(project); // Throws NOT_FOUND if null
 * ```
 */
export const requireFound = <T>(value: T | null | undefined): T => {
	if (value === null || value === undefined) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Resource not found",
		});
	}
	return value;
};

/**
 * Asserts that a value is defined, throwing INTERNAL_SERVER_ERROR if not.
 *
 * Use this for required fields that should always exist (programming errors).
 * Do NOT use this for user-facing resources (use requireFound instead).
 *
 * @example
 * ```typescript
 * const userId = requireDefined(session.userId); // Should always exist
 * ```
 */
export const requireDefined = <T>(
	value: T | null | undefined,
	message = "Required value is missing",
): T => {
	if (value === null || value === undefined) {
		throw new TRPCError({
			code: "INTERNAL_SERVER_ERROR",
			message,
		});
	}
	return value;
};

/**
 * Throws FORBIDDEN error with optional message.
 *
 * Use this when you explicitly check permissions in code (not via policies).
 * Prefer access policies over this when possible.
 *
 * @example
 * ```typescript
 * if (project.owner.id !== currentUserId && !project.isPublic) {
 *   throw forbidden("You don't have access to this project");
 * }
 * ```
 */
export const forbidden = (message = "Access denied"): never => {
	throw new TRPCError({
		code: "FORBIDDEN",
		message,
	});
};

/**
 * Throws BAD_REQUEST error with message.
 *
 * Use this for validation errors that aren't caught by Zod.
 *
 * @example
 * ```typescript
 * if (startDate > endDate) {
 *   throw badRequest("Start date must be before end date");
 * }
 * ```
 */
export const badRequest = (message: string): never => {
	throw new TRPCError({
		code: "BAD_REQUEST",
		message,
	});
};

/**
 * Throws UNAUTHORIZED error with optional message.
 *
 * Use this when authentication is required but missing/invalid.
 *
 * @example
 * ```typescript
 * if (!authToken) {
 *   throw unauthorized("Authentication required");
 * }
 * ```
 */
export const unauthorized = (message = "Authentication required"): never => {
	throw new TRPCError({
		code: "UNAUTHORIZED",
		message,
	});
};
