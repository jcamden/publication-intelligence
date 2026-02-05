/**
 * Shared logging types used across backend and frontend
 * Backend uses Pino, frontend uses custom logger, but types are consistent
 */

export type LogLevel = "info" | "warn" | "error" | "debug";

export type LogContext = {
	userId?: string;
	requestId?: string;
	error?: Error | unknown;
	metadata?: Record<string, unknown>;
};
