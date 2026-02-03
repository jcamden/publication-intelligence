import type { IndexEntry, MentionDraft } from "../mention-creation-popover";

export const mockDraft: MentionDraft = {
	pageNumber: 1,
	text: "This is a selected text that will be turned into a mention. It might be quite long and needs to be truncated in the UI.",
	bboxes: [{ x: 100, y: 200, width: 300, height: 40 }],
	type: "text",
};

export const mockRegionDraft: MentionDraft = {
	pageNumber: 1,
	text: "",
	bboxes: [{ x: 100, y: 200, width: 300, height: 200 }],
	type: "region",
};

export const mockIndexEntries: IndexEntry[] = [
	{ id: "1", label: "Kant, Immanuel", parentId: null },
	{ id: "2", label: "Critique of Pure Reason", parentId: "1" },
	{ id: "3", label: "Categorical Imperative", parentId: "1" },
	{ id: "4", label: "Philosophy", parentId: null },
	{ id: "5", label: "Metaphysics", parentId: "4" },
	{ id: "6", label: "Epistemology", parentId: "4" },
	{ id: "7", label: "Ethics", parentId: "4" },
	{ id: "8", label: "Aristotle", parentId: null },
	{ id: "9", label: "Nicomachean Ethics", parentId: "8" },
	{ id: "10", label: "Plato", parentId: null },
	{ id: "11", label: "The Republic", parentId: "10" },
	{ id: "12", label: "Theory of Forms", parentId: "10" },
];
