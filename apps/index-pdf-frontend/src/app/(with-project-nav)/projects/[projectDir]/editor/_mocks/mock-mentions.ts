import type { Mention } from "../_components/editor/editor";

/**
 * Standard mock mentions for testing
 * Used across multiple story files for consistency
 */
export const mockMentions: Mention[] = [
	{
		id: "m1",
		pageNumber: 1,
		text: "Philosophy reference",
		bboxes: [{ x: 100, y: 100, width: 200, height: 20 }],
		entryId: "entry-subject-1", // Philosophy
		entryLabel: "Philosophy",
		indexType: "subject",
		type: "text",
		createdAt: new Date(),
	},
	{
		id: "m2",
		pageNumber: 1,
		text: "Kant reference",
		bboxes: [{ x: 100, y: 150, width: 200, height: 20 }],
		entryId: "entry-subject-3", // Kant
		entryLabel: "Kant, Immanuel",
		indexType: "subject",
		type: "text",
		createdAt: new Date(),
	},
	{
		id: "m3",
		pageNumber: 2,
		text: "Another Kant reference",
		bboxes: [{ x: 100, y: 100, width: 200, height: 20 }],
		entryId: "entry-subject-3", // Kant
		entryLabel: "Kant, Immanuel",
		indexType: "subject",
		type: "text",
		createdAt: new Date(),
	},
];
