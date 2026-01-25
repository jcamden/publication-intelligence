import type { Document } from "@pubint/core";

export const generateEmbedding = async ({
	text,
}: {
	text: string;
}): Promise<number[]> => {
	throw new Error("Not implemented: generateEmbedding");
};

export const indexDocument = async ({
	document,
}: {
	document: Document;
}): Promise<void> => {
	throw new Error("Not implemented: indexDocument");
};

export const searchDocuments = async ({
	query,
}: {
	query: string;
}): Promise<Document[]> => {
	throw new Error("Not implemented: searchDocuments");
};
