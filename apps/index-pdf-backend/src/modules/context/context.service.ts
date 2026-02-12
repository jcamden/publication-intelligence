import { validatePageRange } from "@pubint/core";
import { TRPCError } from "@trpc/server";
import { logEvent } from "../../logger";
import { insertEvent } from "../event/event.repo";
import * as contextRepo from "./context.repo";
import type {
	Context,
	ContextListItem,
	CreateContextInput,
	DeleteContextInput,
	GetContextsForPageInput,
	ListContextsInput,
	UpdateContextInput,
} from "./context.types";

// ============================================================================
// Service Layer - Business logic and orchestration
// ============================================================================

export const listContexts = async ({
	projectId,
	includeDeleted,
	userId,
	requestId,
}: ListContextsInput & {
	userId: string;
	requestId: string;
}): Promise<ContextListItem[]> => {
	logEvent({
		event: "context.list_requested",
		context: {
			requestId,
			userId,
			metadata: {
				projectId,
				includeDeleted,
			},
		},
	});

	return await contextRepo.listContexts({
		projectId,
		includeDeleted,
	});
};

export const getContextsForPage = async ({
	projectId,
	pageNumber,
	userId,
	requestId,
}: GetContextsForPageInput & {
	userId: string;
	requestId: string;
}): Promise<ContextListItem[]> => {
	logEvent({
		event: "context.get_for_page_requested",
		context: {
			requestId,
			userId,
			metadata: {
				projectId,
				pageNumber,
			},
		},
	});

	return await contextRepo.getContextsForPage({
		projectId,
		pageNumber,
	});
};

export const createContext = async ({
	input,
	userId,
	requestId,
}: {
	input: CreateContextInput;
	userId: string;
	requestId: string;
}): Promise<Context> => {
	// Validate page range if provided
	if (
		(input.pageConfigMode === "page_range" ||
			input.pageConfigMode === "custom") &&
		input.pageRange
	) {
		const validationError = validatePageRange({ rangeStr: input.pageRange });
		if (validationError) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: validationError,
			});
		}
	}

	// Validate page number for this_page mode
	if (input.pageConfigMode === "this_page" && !input.pageNumber) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "pageNumber is required for this_page mode",
		});
	}

	// Validate page range for page_range and custom modes
	if (
		(input.pageConfigMode === "page_range" ||
			input.pageConfigMode === "custom") &&
		!input.pageRange
	) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: `pageRange is required for ${input.pageConfigMode} mode`,
		});
	}

	// Validate everyOther requires startPage
	if (input.everyOther && !input.startPage) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "startPage is required when everyOther is true",
		});
	}

	const context = await contextRepo.createContext({ input });

	logEvent({
		event: "context.created",
		context: {
			requestId,
			userId,
			metadata: {
				contextId: context.id,
				projectId: input.projectId,
				contextType: input.contextType,
				pageConfigMode: input.pageConfigMode,
			},
		},
	});

	await insertEvent({
		type: "context.created",
		projectId: input.projectId,
		userId,
		entityType: "IndexEntry", // TODO: Add Context to entityTypeEnum
		entityId: context.id,
		metadata: {
			contextType: context.contextType,
			pageConfigMode: context.pageConfigMode,
			color: context.color,
		},
		requestId,
	});

	return context;
};

export const updateContext = async ({
	input,
	userId,
	requestId,
}: {
	input: UpdateContextInput;
	userId: string;
	requestId: string;
}): Promise<Context> => {
	// Validate page range if provided
	if (input.pageRange !== undefined) {
		const validationError = validatePageRange({ rangeStr: input.pageRange });
		if (validationError) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: validationError,
			});
		}
	}

	try {
		const context = await contextRepo.updateContext({ input });

		logEvent({
			event: "context.updated",
			context: {
				requestId,
				userId,
				metadata: {
					contextId: input.id,
					updates: Object.keys(input).filter((k) => k !== "id"),
				},
			},
		});

		return context;
	} catch (error) {
		if (error instanceof Error && error.message === "Context not found") {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Context not found",
			});
		}
		throw error;
	}
};

export const deleteContext = async ({
	input,
	userId,
	requestId,
}: {
	input: DeleteContextInput;
	userId: string;
	requestId: string;
}): Promise<void> => {
	await contextRepo.deleteContext({ id: input.id });

	logEvent({
		event: "context.deleted",
		context: {
			requestId,
			userId,
			metadata: {
				contextId: input.id,
			},
		},
	});
};
