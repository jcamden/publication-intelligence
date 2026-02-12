import { validatePageRange } from "@pubint/core";
import { TRPCError } from "@trpc/server";
import { logEvent } from "../../logger";
import { insertEvent } from "../event/event.repo";
import * as regionRepo from "./region.repo";
import type {
	CreateRegionInput,
	DeleteRegionInput,
	GetRegionsForPageInput,
	ListRegionsInput,
	Region,
	RegionListItem,
	UpdateRegionInput,
} from "./region.types";

// ============================================================================
// Service Layer - Business logic and orchestration
// ============================================================================

export const listRegions = async ({
	projectId,
	includeDeleted,
	userId,
	requestId,
}: ListRegionsInput & {
	userId: string;
	requestId: string;
}): Promise<RegionListItem[]> => {
	logEvent({
		event: "region.list_requested",
		context: {
			requestId,
			userId,
			metadata: {
				projectId,
				includeDeleted,
			},
		},
	});

	return await regionRepo.listRegions({
		projectId,
		includeDeleted,
	});
};

export const getRegionsForPage = async ({
	projectId,
	pageNumber,
	userId,
	requestId,
}: GetRegionsForPageInput & {
	userId: string;
	requestId: string;
}): Promise<RegionListItem[]> => {
	logEvent({
		event: "region.get_for_page_requested",
		context: {
			requestId,
			userId,
			metadata: {
				projectId,
				pageNumber,
			},
		},
	});

	return await regionRepo.getRegionsForPage({
		projectId,
		pageNumber,
	});
};

export const createRegion = async ({
	input,
	userId,
	requestId,
}: {
	input: CreateRegionInput;
	userId: string;
	requestId: string;
}): Promise<Region> => {
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

	const region = await regionRepo.createRegion({ input });

	logEvent({
		event: "region.created",
		context: {
			requestId,
			userId,
			metadata: {
				regionId: region.id,
				projectId: input.projectId,
				regionType: input.regionType,
				pageConfigMode: input.pageConfigMode,
			},
		},
	});

	await insertEvent({
		type: "region.created",
		projectId: input.projectId,
		userId,
		entityType: "IndexEntry", // TODO: Add Region to entityTypeEnum
		entityId: region.id,
		metadata: {
			regionType: region.regionType,
			pageConfigMode: region.pageConfigMode,
			color: region.color,
		},
		requestId,
	});

	return region;
};

export const updateRegion = async ({
	input,
	userId,
	requestId,
}: {
	input: UpdateRegionInput;
	userId: string;
	requestId: string;
}): Promise<Region> => {
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
		const region = await regionRepo.updateRegion({ input });

		logEvent({
			event: "region.updated",
			context: {
				requestId,
				userId,
				metadata: {
					regionId: input.id,
					updates: Object.keys(input).filter((k) => k !== "id"),
				},
			},
		});

		return region;
	} catch (error) {
		if (error instanceof Error && error.message === "Region not found") {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Region not found",
			});
		}
		throw error;
	}
};

export const deleteRegion = async ({
	input,
	userId,
	requestId,
}: {
	input: DeleteRegionInput;
	userId: string;
	requestId: string;
}): Promise<void> => {
	await regionRepo.deleteRegion({ id: input.id });

	logEvent({
		event: "region.deleted",
		context: {
			requestId,
			userId,
			metadata: {
				regionId: input.id,
			},
		},
	});
};
