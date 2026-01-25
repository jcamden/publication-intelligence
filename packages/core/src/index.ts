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
