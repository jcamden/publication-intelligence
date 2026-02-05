import { z } from "zod";

/**
 * Shared Zod validators used across backend and frontend
 * These ensure consistent validation logic throughout the application
 */

export const emailValidator = z
	.string()
	.email("Please enter a valid email address");

export const passwordValidator = z
	.string()
	.min(8, "Password must be at least 8 characters");

export const titleValidator = z.string().min(1, "Title is required").max(500);

export const projectDirValidator = z
	.string()
	.regex(
		/^[a-z0-9]+(?:-[a-z0-9]+)*$/,
		"Project directory must contain only lowercase letters, numbers, and hyphens",
	);
