import { DEFAULT_CONTEXT_COLORS } from "@pubint/core";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "../../db/client";
import { contexts } from "../../db/schema";
import type {
	Context,
	ContextListItem,
	CreateContextInput,
	GetContextsForPageInput,
	ListContextsInput,
	UpdateContextInput,
} from "./context.types";

// ============================================================================
// Repository Layer - Database operations
// ============================================================================

export const listContexts = async ({
	projectId,
	includeDeleted = false,
}: ListContextsInput): Promise<ContextListItem[]> => {
	const whereConditions = [eq(contexts.projectId, projectId)];

	if (!includeDeleted) {
		whereConditions.push(isNull(contexts.deletedAt));
	}

	const results = await db
		.select({
			id: contexts.id,
			projectId: contexts.projectId,
			name: contexts.name,
			contextType: contexts.contextType,
			pageConfigMode: contexts.pageConfigMode,
			pageNumber: contexts.pageNumber,
			pageRange: contexts.pageRange,
			everyOther: contexts.everyOther,
			startPage: contexts.startPage,
			endPage: contexts.endPage,
			exceptPages: contexts.exceptPages,
			bbox: contexts.bbox,
			color: contexts.color,
			visible: contexts.visible,
			createdAt: contexts.createdAt,
		})
		.from(contexts)
		.where(and(...whereConditions))
		.orderBy(contexts.createdAt);

	return results.map((row) => ({
		id: row.id,
		projectId: row.projectId,
		name: row.name,
		contextType: row.contextType,
		pageConfigMode: row.pageConfigMode,
		pageNumber: row.pageNumber ?? undefined,
		pageRange: row.pageRange ?? undefined,
		everyOther: row.everyOther,
		startPage: row.startPage ?? undefined,
		endPage: row.endPage ?? undefined,
		exceptPages: row.exceptPages ?? undefined,
		bbox: row.bbox as { x: number; y: number; width: number; height: number },
		color: row.color,
		visible: row.visible,
		createdAt: row.createdAt.toISOString(),
	}));
};

export const getContextsForPage = async ({
	projectId,
	pageNumber,
}: GetContextsForPageInput): Promise<ContextListItem[]> => {
	// Get all contexts for the project (excluding deleted)
	const allContexts = await listContexts({ projectId, includeDeleted: false });

	// Filter in-memory using the appliesToPage logic
	// Import from @pubint/core
	const { appliesToPage } = await import("@pubint/core");

	return allContexts.filter((context) =>
		appliesToPage({
			context: {
				...context,
				createdAt: new Date(context.createdAt),
			},
			targetPage: pageNumber,
		}),
	);
};

export const createContext = async ({
	input,
}: {
	input: CreateContextInput;
}): Promise<Context> => {
	// Set default color based on context type if not provided
	const color = input.color || DEFAULT_CONTEXT_COLORS[input.contextType];

	const [newContext] = await db
		.insert(contexts)
		.values({
			projectId: input.projectId,
			name: input.name,
			contextType: input.contextType,
			bbox: input.bbox,
			pageConfigMode: input.pageConfigMode,
			pageNumber: input.pageNumber,
			pageRange: input.pageRange,
			everyOther: input.everyOther ?? false,
			startPage: input.startPage,
			endPage: input.endPage,
			exceptPages: input.exceptPages,
			color,
			visible: input.visible ?? true,
		})
		.returning();

	return {
		...newContext,
		bbox: newContext.bbox as {
			x: number;
			y: number;
			width: number;
			height: number;
		},
		createdAt: newContext.createdAt,
		updatedAt: newContext.updatedAt ?? undefined,
		deletedAt: newContext.deletedAt ?? undefined,
		pageNumber: newContext.pageNumber ?? undefined,
		pageRange: newContext.pageRange ?? undefined,
		startPage: newContext.startPage ?? undefined,
		endPage: newContext.endPage ?? undefined,
		exceptPages: newContext.exceptPages ?? undefined,
	};
};

export const updateContext = async ({
	input,
}: {
	input: UpdateContextInput;
}): Promise<Context> => {
	const updateData: Record<string, unknown> = {
		updatedAt: new Date(),
	};

	if (input.name !== undefined) {
		updateData.name = input.name;
	}
	if (input.contextType !== undefined) {
		updateData.contextType = input.contextType;
	}
	if (input.bbox !== undefined) {
		updateData.bbox = input.bbox;
	}
	if (input.pageConfigMode !== undefined) {
		updateData.pageConfigMode = input.pageConfigMode;
	}
	if (input.pageNumber !== undefined) {
		updateData.pageNumber = input.pageNumber;
	}
	if (input.pageRange !== undefined) {
		updateData.pageRange = input.pageRange;
	}
	if (input.everyOther !== undefined) {
		updateData.everyOther = input.everyOther;
	}
	if (input.startPage !== undefined) {
		updateData.startPage = input.startPage;
	}
	if (input.endPage !== undefined) {
		updateData.endPage = input.endPage;
	}
	if (input.exceptPages !== undefined) {
		updateData.exceptPages = input.exceptPages;
	}
	if (input.color !== undefined) {
		updateData.color = input.color;
	}
	if (input.visible !== undefined) {
		updateData.visible = input.visible;
	}

	const [updatedContext] = await db
		.update(contexts)
		.set(updateData)
		.where(and(eq(contexts.id, input.id), isNull(contexts.deletedAt)))
		.returning();

	if (!updatedContext) {
		throw new Error("Context not found");
	}

	return {
		...updatedContext,
		bbox: updatedContext.bbox as {
			x: number;
			y: number;
			width: number;
			height: number;
		},
		createdAt: updatedContext.createdAt,
		updatedAt: updatedContext.updatedAt ?? undefined,
		deletedAt: updatedContext.deletedAt ?? undefined,
		pageNumber: updatedContext.pageNumber ?? undefined,
		pageRange: updatedContext.pageRange ?? undefined,
		startPage: updatedContext.startPage ?? undefined,
		endPage: updatedContext.endPage ?? undefined,
		exceptPages: updatedContext.exceptPages ?? undefined,
	};
};

export const deleteContext = async ({ id }: { id: string }): Promise<void> => {
	await db
		.update(contexts)
		.set({ deletedAt: new Date() })
		.where(and(eq(contexts.id, id), isNull(contexts.deletedAt)));
};
