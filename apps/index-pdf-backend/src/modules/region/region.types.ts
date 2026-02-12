import type { Region as CoreRegion } from "@pubint/core";
import { z } from "zod";

// ============================================================================
// TypeScript Types
// ============================================================================

export type Region = CoreRegion;

export type RegionListItem = {
	id: string;
	projectId: string;
	name: string;
	regionType: "exclude" | "page_number";
	pageConfigMode: "this_page" | "all_pages" | "page_range" | "custom";
	pageNumber?: number;
	pageRange?: string;
	everyOther: boolean;
	startPage?: number;
	endPage?: number;
	exceptPages?: number[];
	bbox: {
		x: number;
		y: number;
		width: number;
		height: number;
	};
	color: string;
	visible: boolean;
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

export const RegionTypeEnum = z.enum(["exclude", "page_number"]);

export const PageConfigModeEnum = z.enum([
	"this_page",
	"all_pages",
	"page_range",
	"custom",
]);

export const ListRegionsSchema = z.object({
	projectId: z.string().uuid(),
	includeDeleted: z.boolean().optional(),
});

export type ListRegionsInput = z.infer<typeof ListRegionsSchema>;

export const GetRegionsForPageSchema = z.object({
	projectId: z.string().uuid(),
	pageNumber: z.number().int().min(1),
});

export type GetRegionsForPageInput = z.infer<typeof GetRegionsForPageSchema>;

export const CreateRegionSchema = z.object({
	projectId: z.string().uuid(),
	name: z.string().min(1),
	regionType: RegionTypeEnum,
	bbox: BoundingBoxSchema,
	pageConfigMode: PageConfigModeEnum,
	pageNumber: z.number().int().min(1).optional(),
	pageRange: z.string().optional(),
	everyOther: z.boolean().optional(),
	startPage: z.number().int().min(1).optional(),
	endPage: z.number().int().min(1).optional(),
	exceptPages: z.array(z.number().int().min(1)).optional(),
	color: z
		.string()
		.regex(/^#[0-9A-Fa-f]{6}$/)
		.optional(), // Hex color
	visible: z.boolean().optional(),
});

export type CreateRegionInput = z.infer<typeof CreateRegionSchema>;

export const UpdateRegionSchema = z.object({
	id: z.string().uuid(),
	name: z.string().min(1).optional(),
	regionType: RegionTypeEnum.optional(),
	bbox: BoundingBoxSchema.optional(),
	pageConfigMode: PageConfigModeEnum.optional(),
	pageNumber: z.number().int().min(1).optional(),
	pageRange: z.string().optional(),
	everyOther: z.boolean().optional(),
	startPage: z.number().int().min(1).optional(),
	endPage: z.number().int().min(1).optional(),
	exceptPages: z.array(z.number().int().min(1)).optional(),
	color: z
		.string()
		.regex(/^#[0-9A-Fa-f]{6}$/)
		.optional(),
	visible: z.boolean().optional(),
});

export type UpdateRegionInput = z.infer<typeof UpdateRegionSchema>;

export const DeleteRegionSchema = z.object({
	id: z.string().uuid(),
});

export type DeleteRegionInput = z.infer<typeof DeleteRegionSchema>;
