/**
 * Core types for IndexMentions and PDF highlighting
 */

export type BoundingBox = {
	x: number;
	y: number;
	width: number;
	height: number;
	rotation?: number;
};

export type RangeType = "exact" | "approximate" | "generated";

/**
 * IndexMention as stored in Gel schema
 */
export type IndexMention = {
	id: string;
	document_id: string;
	entry_id: string;
	page_number: number;
	page_number_end?: number;
	text_span: string;
	start_offset?: number;
	end_offset?: number;
	bboxes: BoundingBox[];
	range_type: RangeType;
	mention_type: "text" | "region";
	suggested_by_llm?: boolean;
	deleted_at?: string | null;
	created_at: string;
	updated_at: string;
};

/**
 * Lightweight mention for viewer display
 */
export type ViewerMention = {
	id: string;
	page_number: number;
	text_span: string;
	bboxes: BoundingBox[];
	entryLabel: string;
	range_type?: RangeType;
	type: "text" | "region";
};

/**
 * Draft mention from user selection (before save)
 */
export type DraftMention = {
	page_number: number;
	text_span: string;
	bboxes: BoundingBox[];
	type: "text" | "region";
	/**
	 * Optional anchor data for reconciling with canonical text later.
	 * Can store: normalized text, nearby atom IDs, confidence metadata, etc.
	 */
	anchor?: {
		normalizedText: string;
		pageIndex: number;
		approximateOffset?: number;
		confidence?: "high" | "medium" | "low";
	};
};

/**
 * Coordinate system metadata for round-tripping between viewer and canonical storage
 */
export type CoordinateMetadata = {
	pageWidth: number;
	pageHeight: number;
	scale: number;
	rotation: number;
};
