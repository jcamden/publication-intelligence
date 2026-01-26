type LogLevel = "info" | "warn" | "error" | "debug";

type LogContext = {
	userId?: string;
	requestId?: string;
	error?: Error | unknown;
	metadata?: Record<string, unknown>;
};

const isDevelopment = process.env.NODE_ENV !== "production";

const formatLog = ({
	level,
	event,
	context,
}: {
	level: LogLevel;
	event: string;
	context: LogContext;
}) => {
	const logData = {
		timestamp: new Date().toISOString(),
		level,
		service: "index-pdf-frontend",
		env: process.env.NODE_ENV ?? "development",
		event,
		...context,
	};

	return logData;
};

export const logEvent = ({
	event,
	context = {},
}: {
	event: string;
	context?: LogContext;
}) => {
	const logData = formatLog({ level: "info", event, context });

	if (isDevelopment) {
		console.log(`[${logData.event}]`, logData);
	} else {
		console.log(JSON.stringify(logData));
	}
};

export const logError = ({
	event,
	error,
	context = {},
}: {
	event: string;
	error: Error | unknown;
	context?: LogContext;
}) => {
	const errorData =
		error instanceof Error
			? {
					message: error.message,
					stack: error.stack,
					name: error.name,
				}
			: { message: String(error) };

	const logData = formatLog({
		level: "error",
		event,
		context: {
			...context,
			error: errorData,
		},
	});

	if (isDevelopment) {
		console.error(`[${logData.event}]`, logData);
	} else {
		console.error(JSON.stringify(logData));
	}
};
