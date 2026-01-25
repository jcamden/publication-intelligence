import { describe, expect, it } from "vitest";
import type { Document } from "./index";
import { createDocument } from "./index";

describe("createDocument", () => {
	it("should create a document with required fields", () => {
		const input: Document = {
			id: "test-id",
			title: "Test Title",
			content: "Test content",
		};

		const result = createDocument(input);

		expect(result).toEqual({
			id: "test-id",
			title: "Test Title",
			content: "Test content",
			metadata: undefined,
		});
	});

	it("should create a document with metadata", () => {
		const input: Document = {
			id: "test-id",
			title: "Test Title",
			content: "Test content",
			metadata: { author: "John Doe", year: 2026 },
		};

		const result = createDocument(input);

		expect(result).toEqual({
			id: "test-id",
			title: "Test Title",
			content: "Test content",
			metadata: { author: "John Doe", year: 2026 },
		});
	});

	it("should preserve all provided properties", () => {
		const input: Document = {
			id: "123",
			title: "Document",
			content: "Content",
			metadata: { key: "value" },
		};

		const result = createDocument(input);

		expect(result.id).toBe("123");
		expect(result.title).toBe("Document");
		expect(result.content).toBe("Content");
		expect(result.metadata).toEqual({ key: "value" });
	});
});
