import { describe, expect, it } from "vitest";
import {
	documentPageId,
	resolvePageIdToDocumentPageNumber,
} from "../page-id.utils";

describe("documentPageId", () => {
	it("returns deterministic UUID for document and page number", () => {
		const id1 = documentPageId("doc-123", 1);
		const id2 = documentPageId("doc-123", 1);
		expect(id1).toBe(id2);
		expect(id1).toMatch(
			/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
		);
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
});

describe("resolvePageIdToDocumentPageNumber", () => {
	it("resolves pageId to 1-based page number", () => {
		const documentId = "doc-456";
		const pageId = documentPageId(documentId, 3);
		const resolved = resolvePageIdToDocumentPageNumber(documentId, pageId, 10);
		expect(resolved).toBe(3);
	});

	it("returns null when pageId does not match any page in range", () => {
		const documentId = "doc-456";
		const pageId = "00000000-0000-0000-0000-000000000000";
		const resolved = resolvePageIdToDocumentPageNumber(documentId, pageId, 5);
		expect(resolved).toBeNull();
	});

	it("returns null when page number would be out of range", () => {
		const documentId = "doc-456";
		const pageId = documentPageId(documentId, 7);
		const resolved = resolvePageIdToDocumentPageNumber(documentId, pageId, 5);
		expect(resolved).toBeNull();
	});

	it("resolves first and last page correctly", () => {
		const documentId = "doc-789";
		expect(
			resolvePageIdToDocumentPageNumber(
				documentId,
				documentPageId(documentId, 1),
				10,
			),
		).toBe(1);
		expect(
			resolvePageIdToDocumentPageNumber(
				documentId,
				documentPageId(documentId, 10),
				10,
			),
		).toBe(10);
	});
});
