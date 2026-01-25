import type { Document, DocumentPage } from "@pubint/core";

export const extractPdfText = async ({
	buffer,
}: {
	buffer: Buffer;
}): Promise<string> => {
	throw new Error("Not implemented: extractPdfText");
};

export const extractPdfPages = async ({
	buffer,
}: {
	buffer: Buffer;
}): Promise<DocumentPage[]> => {
	throw new Error("Not implemented: extractPdfPages");
};
