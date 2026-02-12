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

export * from "./canonical-page.computation";
export * from "./canonical-page.types";
export * from "./canonical-page.utils";
export * from "./context.types";
export * from "./context.utils";
export * from "./logger.types";
export * from "./validation";
