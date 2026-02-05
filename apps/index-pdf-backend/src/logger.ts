import type { LogContext } from "@pubint/core";
import pino from "pino";

const isDevelopment = process.env.NODE_ENV !== "production";

export const logger = pino({
	level: process.env.LOG_LEVEL ?? "info",
	base: {
		service: "index-pdf-backend",
		env: process.env.NODE_ENV ?? "development",
	},
	// Pretty print in development, JSON in production
	transport: isDevelopment
		? {
				target: "pino-pretty",
				options: {
					colorize: true,
					translateTime: "HH:MM:ss Z",
					ignore: "pid,hostname",
				},
			}
		: undefined,
	// Redact sensitive fields to prevent accidental logging
	redact: {
		paths: [
			"password",
			"token",
			"authToken",
			"auth_token",
			"*.password",
			"*.token",
		],
		remove: true,
	},
});

export type { LogContext };

export const logEvent = ({
	event,
	context,
}: {
	event: string;
	context: LogContext;
}) => {
	const { requestId, userId, error, metadata } = context;

	const logData: Record<string, unknown> = {
		event,
		...(requestId && { requestId }),
		...(userId && { userId }),
		...(metadata && { metadata }),
	};

	if (error) {
		if (error instanceof Error) {
			logger.error({
				...logData,
				error: {
					message: error.message,
					stack: error.stack,
					name: error.name,
				},
			});
		} else {
			logger.error({
				...logData,
				error: String(error),
			});
		}
	} else {
		logger.info(logData);
	}
};
