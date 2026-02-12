import { DEFAULT_REGION_COLORS } from "@pubint/core";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "../../db/client";
import { regions } from "../../db/schema";
import type {
	CreateRegionInput,
	GetRegionsForPageInput,
	ListRegionsInput,
	Region,
	RegionListItem,
	UpdateRegionInput,
} from "./region.types";

// ============================================================================
// Repository Layer - Database operations
// ============================================================================

export const listRegions = async ({
	projectId,
	includeDeleted = false,
}: ListRegionsInput): Promise<RegionListItem[]> => {
	const whereConditions = [eq(regions.projectId, projectId)];

	if (!includeDeleted) {
		whereConditions.push(isNull(regions.deletedAt));
	}

	const results = await db
		.select({
			id: regions.id,
			projectId: regions.projectId,
			name: regions.name,
			regionType: regions.regionType,
			pageConfigMode: regions.pageConfigMode,
			pageNumber: regions.pageNumber,
			pageRange: regions.pageRange,
			everyOther: regions.everyOther,
			startPage: regions.startPage,
			endPage: regions.endPage,
			exceptPages: regions.exceptPages,
			bbox: regions.bbox,
			color: regions.color,
			visible: regions.visible,
			createdAt: regions.createdAt,
		})
		.from(regions)
		.where(and(...whereConditions))
		.orderBy(regions.createdAt);

	return results.map((row) => ({
		id: row.id,
		projectId: row.projectId,
		name: row.name,
		regionType: row.regionType,
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

export const getRegionsForPage = async ({
	projectId,
	pageNumber,
}: GetRegionsForPageInput): Promise<RegionListItem[]> => {
	// Get all regions for the project (excluding deleted)
	const allRegions = await listRegions({ projectId, includeDeleted: false });

	// Filter in-memory using the appliesToPage logic
	// Import from @pubint/core
	const { appliesToPage } = await import("@pubint/core");

	return allRegions.filter((region) =>
		appliesToPage({
			region: {
				...region,
				createdAt: new Date(region.createdAt),
			},
			targetPage: pageNumber,
		}),
	);
};

export const createRegion = async ({
	input,
}: {
	input: CreateRegionInput;
}): Promise<Region> => {
	// Set default color based on region type if not provided
	const color = input.color || DEFAULT_REGION_COLORS[input.regionType];

	const [newRegion] = await db
		.insert(regions)
		.values({
			projectId: input.projectId,
			name: input.name,
			regionType: input.regionType,
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
		...newRegion,
		bbox: newRegion.bbox as {
			x: number;
			y: number;
			width: number;
			height: number;
		},
		createdAt: newRegion.createdAt,
		updatedAt: newRegion.updatedAt ?? undefined,
		deletedAt: newRegion.deletedAt ?? undefined,
		pageNumber: newRegion.pageNumber ?? undefined,
		pageRange: newRegion.pageRange ?? undefined,
		startPage: newRegion.startPage ?? undefined,
		endPage: newRegion.endPage ?? undefined,
		exceptPages: newRegion.exceptPages ?? undefined,
	};
};

export const updateRegion = async ({
	input,
}: {
	input: UpdateRegionInput;
}): Promise<Region> => {
	const updateData: Record<string, unknown> = {
		updatedAt: new Date(),
	};

	if (input.name !== undefined) {
		updateData.name = input.name;
	}
	if (input.regionType !== undefined) {
		updateData.regionType = input.regionType;
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

	const [updatedRegion] = await db
		.update(regions)
		.set(updateData)
		.where(and(eq(regions.id, input.id), isNull(regions.deletedAt)))
		.returning();

	if (!updatedRegion) {
		throw new Error("Region not found");
	}

	return {
		...updatedRegion,
		bbox: updatedRegion.bbox as {
			x: number;
			y: number;
			width: number;
			height: number;
		},
		createdAt: updatedRegion.createdAt,
		updatedAt: updatedRegion.updatedAt ?? undefined,
		deletedAt: updatedRegion.deletedAt ?? undefined,
		pageNumber: updatedRegion.pageNumber ?? undefined,
		pageRange: updatedRegion.pageRange ?? undefined,
		startPage: updatedRegion.startPage ?? undefined,
		endPage: updatedRegion.endPage ?? undefined,
		exceptPages: updatedRegion.exceptPages ?? undefined,
	};
};

export const deleteRegion = async ({ id }: { id: string }): Promise<void> => {
	await db
		.update(regions)
		.set({ deletedAt: new Date() })
		.where(and(eq(regions.id, id), isNull(regions.deletedAt)));
};
