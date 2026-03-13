import { describe, expect, it } from "vitest";
import { documentPageId } from "./document-page-id";

const UUID_REGEX =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

describe("documentPageId", () => {
	it("returns deterministic UUID for document and page number", () => {
		const id1 = documentPageId("doc-123", 1);
		const id2 = documentPageId("doc-123", 1);
		expect(id1).toBe(id2);
		expect(id1).toMatch(UUID_REGEX);
	});

	it("returns different ids for different pages", () => {
		const id1 = documentPageId("doc-123", 1);
		const id2 = documentPageId("doc-123", 2);
		expect(id1).not.toBe(id2);
	});

	it("returns different ids for different documents", () => {
		const id1 = documentPageId("doc-a", 1);
		const id2 = documentPageId("doc-b", 1);
		expect(id1).not.toBe(id2);
	});

	it("returns consistent value for doc-123 page 1", () => {
		const id = documentPageId("doc-123", 1);
		expect(id).toMatch(UUID_REGEX);
		const id2 = documentPageId("doc-123", 1);
		expect(id).toBe(id2);
	});

	it("returns RFC 4122 compliant UUID (version 4, variant 10xx)", () => {
		// Zod uuid() requires: 3rd group starts with [1-8], 4th group starts with [89abAB]
		const rfc4122Regex =
			/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
		const id = documentPageId("550e8400-e29b-41d4-a716-446655440000", 1);
		expect(id).toMatch(rfc4122Regex);
	});
});
