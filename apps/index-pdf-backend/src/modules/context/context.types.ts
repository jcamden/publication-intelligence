import type { Context as CoreContext } from "@pubint/core";
import { z } from "zod";

// ============================================================================
// TypeScript Types
// ============================================================================

export type Context = CoreContext;

export type ContextListItem = {
	id: string;
	projectId: string;
	name: string;
	contextType: "ignore" | "page_number";
	pageConfigMode: "this_page" | "all_pages" | "page_range" | "custom";
	pageNumber?: number;
	pageRange?: string;
	everyOther: boolean;
	startPage?: number;
	bbox: {
		x: number;
		y: number;
		width: number;
		height: number;
	};
	color: string;
	visible: boolean;
	extractedPageNumber?: string;
	createdAt: string;
};

// ============================================================================
// Zod Schemas for Validation
// ============================================================================

export const BoundingBoxSchema = z.object({
	x: z.number(),
	y: z.number(),
	width: z.number(),
	height: z.number(),
});

export const ContextTypeEnum = z.enum(["ignore", "page_number"]);

export const PageConfigModeEnum = z.enum([
	"this_page",
	"all_pages",
	"page_range",
	"custom",
]);

export const ListContextsSchema = z.object({
	projectId: z.string().uuid(),
	includeDeleted: z.boolean().optional(),
});

export type ListContextsInput = z.infer<typeof ListContextsSchema>;

export const GetContextsForPageSchema = z.object({
	projectId: z.string().uuid(),
	pageNumber: z.number().int().min(1),
});

export type GetContextsForPageInput = z.infer<typeof GetContextsForPageSchema>;

export const CreateContextSchema = z.object({
	projectId: z.string().uuid(),
	name: z.string().min(1),
	contextType: ContextTypeEnum,
	bbox: BoundingBoxSchema,
	pageConfigMode: PageConfigModeEnum,
	pageNumber: z.number().int().min(1).optional(),
	pageRange: z.string().optional(),
	everyOther: z.boolean().optional(),
	startPage: z.number().int().min(1).optional(),
	color: z
		.string()
		.regex(/^#[0-9A-Fa-f]{6}$/)
		.optional(), // Hex color
	visible: z.boolean().optional(),
});

export type CreateContextInput = z.infer<typeof CreateContextSchema>;

export const UpdateContextSchema = z.object({
	id: z.string().uuid(),
	name: z.string().min(1).optional(),
	contextType: ContextTypeEnum.optional(),
	bbox: BoundingBoxSchema.optional(),
	pageConfigMode: PageConfigModeEnum.optional(),
	pageNumber: z.number().int().min(1).optional(),
	pageRange: z.string().optional(),
	everyOther: z.boolean().optional(),
	startPage: z.number().int().min(1).optional(),
	color: z
		.string()
		.regex(/^#[0-9A-Fa-f]{6}$/)
		.optional(),
	visible: z.boolean().optional(),
	extractedPageNumber: z.string().optional(),
});

export type UpdateContextInput = z.infer<typeof UpdateContextSchema>;

export const DeleteContextSchema = z.object({
	id: z.string().uuid(),
});

export type DeleteContextInput = z.infer<typeof DeleteContextSchema>;
