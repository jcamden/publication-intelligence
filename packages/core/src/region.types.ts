/**
 * Region Types - Shared between frontend and backend
 *
 * Regions define areas on PDF pages for text extraction configuration:
 * - Ignore regions: Exclude areas from text extraction
 * - Page number regions: Auto-extract canonical page numbers
 */

export type RegionType = "exclude" | "page_number";

export type PageConfigMode =
	| "this_page"
	| "all_pages"
	| "page_range"
	| "custom";

export type BoundingBox = {
	x: number;
	y: number;
	width: number;
	height: number;
};

/**
 * Region entity from database
 */
export type Region = {
	id: string;
	projectId: string;
	name: string; // User-provided name for the region
	regionType: RegionType;
	pageConfigMode: PageConfigMode;
	pageNumber?: number; // For this_page mode
	pageRange?: string; // For page_range/custom modes (e.g., "1-50" or "1-2,5-6,8")
	everyOther: boolean; // Apply every other page
	startPage?: number; // Starting page for every other
	endPage?: number; // Ending page for every other (optional)
	exceptPages?: number[]; // Pages to exclude from this region
	bbox: BoundingBox; // BoundingBox in PDF user space
	color: string; // Hex color (e.g., "#FCA5A5")
	visible: boolean; // Visibility toggle
	createdAt: Date;
	updatedAt?: Date;
	deletedAt?: Date;
};

/**
 * Input for creating a new region
 */
export type CreateRegionInput = {
	projectId: string;
	name: string;
	regionType: RegionType;
	bbox: BoundingBox;
	pageConfigMode: PageConfigMode;
	pageNumber?: number;
	pageRange?: string;
	everyOther?: boolean;
	startPage?: number;
	endPage?: number;
	exceptPages?: number[]; // Pages to exclude from this region
	color?: string; // Default per type if not provided
	visible?: boolean; // Default true
};

/**
 * Input for updating a region
 */
export type UpdateRegionInput = {
	id: string;
	name?: string;
	regionType?: RegionType;
	bbox?: BoundingBox;
	pageConfigMode?: PageConfigMode;
	pageNumber?: number;
	pageRange?: string;
	everyOther?: boolean;
	startPage?: number;
	endPage?: number;
	exceptPages?: number[];
	color?: string;
	visible?: boolean;
};

/**
 * Default colors for region types
 */
export const DEFAULT_REGION_COLORS: Record<RegionType, string> = {
	exclude: "#FCA5A5", // Red
	page_number: "#C4B5FD", // Purple
};

/**
 * Region-derived page numbers for a specific page
 * Represents a page number that was extracted from a page_number region's bounding box
 */
export type RegionDerivedPageNumber = {
	documentPage: number;
	canonicalPage: string;
	regionId: string;
	regionName: string;
};
