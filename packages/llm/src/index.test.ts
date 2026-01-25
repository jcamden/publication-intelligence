import { describe, it, expect } from "vitest";
import { generateEmbedding, indexDocument, searchDocuments } from "./index";
import type { Document } from "@pubint/core";

describe("generateEmbedding", () => {
	it("should throw not implemented error", async () => {
		await expect(generateEmbedding({ text: "test" })).rejects.toThrow(
			"Not implemented: generateEmbedding",
		);
	});
});

describe("indexDocument", () => {
	it("should throw not implemented error", async () => {
		const document: Document = {
			id: "test",
			title: "Test",
			content: "Content",
		};

		await expect(indexDocument({ document })).rejects.toThrow(
			"Not implemented: indexDocument",
		);
	});
});

describe("searchDocuments", () => {
	it("should throw not implemented error", async () => {
		await expect(searchDocuments({ query: "test query" })).rejects.toThrow(
			"Not implemented: searchDocuments",
		);
	});
});
