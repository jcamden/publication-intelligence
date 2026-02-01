export type BoundingBox = {
	x: number;
	y: number;
	width: number;
	height: number;
	rotation?: number;
};

export type PdfHighlight = {
	id: string;
	pageNumber: number;
	bbox: BoundingBox;
	label: string;
	text?: string;
	metadata?: Record<string, unknown>;
};
