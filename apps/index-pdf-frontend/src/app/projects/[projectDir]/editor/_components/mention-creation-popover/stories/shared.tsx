import type { MentionDraft } from "../mention-creation-popover";

export const mockDraft: MentionDraft = {
	documentId: "mock-document-id",
	pageNumber: 1,
	text: "Kant, Immanuel", // Exact match for autocomplete testing
	bboxes: [{ x: 100, y: 200, width: 300, height: 40 }],
	type: "text",
};

export const mockDraftPartialMatch: MentionDraft = {
	documentId: "mock-document-id",
	pageNumber: 1,
	text: "Some selected text", // Partial match for manual selection tests
	bboxes: [{ x: 100, y: 200, width: 300, height: 40 }],
	type: "text",
};

export const mockDraftNoMatch: MentionDraft = {
	documentId: "mock-document-id",
	pageNumber: 1,
	text: "Some other text", // No exact match, for create new entry tests
	bboxes: [{ x: 100, y: 200, width: 300, height: 40 }],
	type: "text",
};

export const mockRegionDraft: MentionDraft = {
	documentId: "mock-document-id",
	pageNumber: 1,
	text: "",
	bboxes: [{ x: 100, y: 200, width: 300, height: 200 }],
	type: "region",
};
