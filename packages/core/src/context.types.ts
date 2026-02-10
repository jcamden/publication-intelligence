/**
 * Context Types - Shared between frontend and backend
 *
 * Contexts define regions on PDF pages for text extraction configuration:
 * - Ignore contexts: Exclude regions from text extraction
 * - Page number contexts: Auto-extract canonical page numbers
 */

export type ContextType = "ignore" | "page_number";

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
 * Context entity from database
 */
export type Context = {
	id: string;
	projectId: string;
	name: string; // User-provided name for the context
	contextType: ContextType;
	pageConfigMode: PageConfigMode;
	pageNumber?: number; // For this_page mode
	pageRange?: string; // For page_range/custom modes (e.g., "1-50" or "1-2,5-6,8")
	everyOther: boolean; // Apply every other page
	startPage?: number; // Starting page for every other
	bbox: BoundingBox; // BoundingBox in PDF user space
	color: string; // Hex color (e.g., "#FCA5A5")
	visible: boolean; // Visibility toggle
	extractedPageNumber?: string; // Extracted page number (for page_number type)
	createdAt: Date;
	updatedAt?: Date;
	deletedAt?: Date;
};

/**
 * Input for creating a new context
 */
export type CreateContextInput = {
	projectId: string;
	name: string;
	contextType: ContextType;
	bbox: BoundingBox;
	pageConfigMode: PageConfigMode;
	pageNumber?: number;
	pageRange?: string;
	everyOther?: boolean;
	startPage?: number;
	color?: string; // Default per type if not provided
	visible?: boolean; // Default true
};

/**
 * Input for updating a context
 */
export type UpdateContextInput = {
	id: string;
	name?: string;
	contextType?: ContextType;
	bbox?: BoundingBox;
	pageConfigMode?: PageConfigMode;
	pageNumber?: number;
	pageRange?: string;
	everyOther?: boolean;
	startPage?: number;
	color?: string;
	visible?: boolean;
	extractedPageNumber?: string;
};

/**
 * Default colors for context types
 */
export const DEFAULT_CONTEXT_COLORS: Record<ContextType, string> = {
	ignore: "#FCA5A5", // Red
	page_number: "#C4B5FD", // Purple
};
