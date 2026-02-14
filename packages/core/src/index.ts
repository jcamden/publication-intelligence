export type Document = {
	id: string;
	title: string;
	content: string;
	metadata?: Record<string, unknown>;
};

export type DocumentPage = {
	pageNumber: number;
	content: string;
	metadata?: Record<string, unknown>;
};

export const createDocument = ({
	id,
	title,
	content,
	metadata,
}: Document): Document => ({
	id,
	title,
	content,
	metadata,
});

export * from "./bbox-conversion";
export * from "./canonical-page.computation";
export * from "./canonical-page.types";
export * from "./canonical-page.utils";
export * from "./logger.types";
export * from "./region.types";
export * from "./region.utils";
export * from "./text-atom.types";
export * from "./validation";
