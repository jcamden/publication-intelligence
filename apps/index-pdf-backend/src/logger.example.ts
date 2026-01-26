/**
 * Logger Usage Examples
 *
 * This file demonstrates how to use the structured logging system.
 * DO NOT import this file - it's for reference only.
 */

import { logEvent, logger } from "./logger";

// Example types for demonstration purposes
type ExampleContext = {
	requestId: string;
	user: { id: string };
};

type ExampleInput = {
	id: string;
	title: string;
};

// Example 1: Basic event logging in a tRPC procedure
export const exampleProcedure = async ({
	ctx,
	input,
}: {
	ctx: ExampleContext;
	input: ExampleInput;
}) => {
	logEvent({
		event: "document.created",
		context: {
			requestId: ctx.requestId,
			userId: ctx.user.id,
			metadata: {
				documentId: input.id,
				title: input.title,
			},
		},
	});
};

// Example 2: Error logging
export const exampleErrorLogging = async ({ ctx }: { ctx: ExampleContext }) => {
	try {
		// ... some operation
		throw new Error("Something went wrong");
	} catch (error) {
		logEvent({
			event: "document.creation_failed",
			context: {
				requestId: ctx.requestId,
				userId: ctx.user.id,
				error,
				metadata: {
					attemptedTitle: "My Doc",
				},
			},
		});
	}
};

// Example 3: Direct logger usage for custom scenarios
export const exampleDirectLogger = () => {
	logger.info({
		event: "cache.hit",
		metadata: { key: "user:123", ttl: 3600 },
	});

	logger.warn({
		event: "rate_limit.approaching",
		metadata: { userId: "123", requests: 95, limit: 100 },
	});

	logger.debug({
		event: "query.executed",
		metadata: { sql: "SELECT * FROM users", duration: 45 },
	});
};

// Example 4: Logging without request context (background jobs)
export const exampleBackgroundJob = () => {
	logEvent({
		event: "job.started",
		context: {
			metadata: {
				jobType: "pdf_indexing",
				batchSize: 100,
			},
		},
	});
};

// Example 5: Rich metadata
export const exampleRichMetadata = ({ ctx }: { ctx: ExampleContext }) => {
	logEvent({
		event: "search.query_executed",
		context: {
			requestId: ctx.requestId,
			userId: ctx.user.id,
			metadata: {
				query: "machine learning",
				filters: {
					dateRange: "2024-01-01:2024-12-31",
					tags: ["ai", "ml"],
				},
				resultsCount: 42,
				durationMs: 156,
			},
		},
	});
};
