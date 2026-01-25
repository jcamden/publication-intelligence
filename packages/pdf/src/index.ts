import type { DocumentPage } from "@pubint/core";

export const extractPdfText = async ({
	buffer: _buffer,
}: {
	buffer: Buffer;
}): Promise<string> => {
	throw new Error("Not implemented: extractPdfText");
};

export const extractPdfPages = async ({
	buffer: _buffer,
}: {
	buffer: Buffer;
}): Promise<DocumentPage[]> => {
	throw new Error("Not implemented: extractPdfPages");
};
