/**
 * Mock API for IndexMentions
 *
 * This provides an in-memory store with clean boundaries.
 * Easy to swap out for tRPC later - just change the imports in components.
 *
 * TODO: Replace with real tRPC procedures:
 * - mentions.list({ documentId })
 * - mentions.create({ documentId, entryId, draft })
 * - mentions.update({ id, updates })
 * - mentions.delete({ id })
 */

import type {
	DraftMention,
	IndexMention,
	ViewerMention,
} from "@/types/mentions";

// In-memory store (will be replaced by Gel DB via tRPC)
const mockMentions: IndexMention[] = [
	{
		id: "mention-1",
		document_id: "doc-1",
		entry_id: "entry-1",
		page_number: 1,
		text_span: "machine learning algorithms",
		start_offset: 150,
		end_offset: 177,
		bbox: {
			x: 100,
			y: 200,
			width: 180,
			height: 20,
		},
		range_type: "exact",
		suggested_by_llm: false,
		deleted_at: null,
		created_at: new Date().toISOString(),
		updated_at: new Date().toISOString(),
	},
	{
		id: "mention-2",
		document_id: "doc-1",
		entry_id: "entry-2",
		page_number: 1,
		text_span: "neural networks",
		start_offset: 450,
		end_offset: 465,
		bbox: {
			x: 150,
			y: 350,
			width: 120,
			height: 18,
		},
		range_type: "exact",
		suggested_by_llm: false,
		deleted_at: null,
		created_at: new Date().toISOString(),
		updated_at: new Date().toISOString(),
	},
	{
		id: "mention-3",
		document_id: "doc-1",
		entry_id: "entry-1",
		page_number: 2,
		text_span: "deep learning frameworks",
		start_offset: 80,
		end_offset: 104,
		bbox: {
			x: 120,
			y: 150,
			width: 160,
			height: 20,
		},
		range_type: "approximate",
		suggested_by_llm: true,
		deleted_at: null,
		created_at: new Date().toISOString(),
		updated_at: new Date().toISOString(),
	},
];

// Mock entry labels for display
const mockEntryLabels: Record<string, string> = {
	"entry-1": "AI Concepts",
	"entry-2": "Technical Terms",
	"entry-3": "Authors",
};

/**
 * Convert full IndexMention to lightweight ViewerMention
 */
const toViewerMention = (mention: IndexMention): ViewerMention => {
	return {
		id: mention.id,
		page_number: mention.page_number,
		text_span: mention.text_span,
		bbox: mention.bbox,
		entryLabel: mockEntryLabels[mention.entry_id] || "Unknown Entry",
		range_type: mention.range_type,
	};
};

/**
 * List all mentions for a document
 */
export const listMentions = async ({
	documentId,
}: {
	documentId: string;
}): Promise<ViewerMention[]> => {
	// Simulate network delay
	await new Promise((resolve) => setTimeout(resolve, 100));

	const filtered = mockMentions.filter(
		(m) => m.document_id === documentId && !m.deleted_at,
	);

	return filtered.map(toViewerMention);
};

/**
 * Create a new mention from user selection
 */
export const createMention = async ({
	documentId,
	entryId,
	draft,
}: {
	documentId: string;
	entryId: string;
	draft: DraftMention;
}): Promise<IndexMention> => {
	// Simulate network delay
	await new Promise((resolve) => setTimeout(resolve, 300));

	// Use first bbox (MVP limitation: single bbox per mention)
	const bbox = draft.bboxes[0];
	if (!bbox) {
		throw new Error("Draft mention must have at least one bounding box");
	}

	const newMention: IndexMention = {
		id: `mention-${Date.now()}`,
		document_id: documentId,
		entry_id: entryId,
		page_number: draft.page_number,
		text_span: draft.text_span,
		bbox,
		range_type: "exact",
		suggested_by_llm: false,
		deleted_at: null,
		created_at: new Date().toISOString(),
		updated_at: new Date().toISOString(),
	};

	mockMentions.push(newMention);
	return newMention;
};

/**
 * Delete a mention (soft delete)
 */
export const deleteMention = async ({ id }: { id: string }): Promise<void> => {
	await new Promise((resolve) => setTimeout(resolve, 100));

	const mention = mockMentions.find((m) => m.id === id);
	if (mention) {
		mention.deleted_at = new Date().toISOString();
	}
};

/**
 * Update a mention (for future editing features)
 */
export const updateMention = async ({
	id,
	updates,
}: {
	id: string;
	updates: Partial<IndexMention>;
}): Promise<IndexMention> => {
	await new Promise((resolve) => setTimeout(resolve, 200));

	const mention = mockMentions.find((m) => m.id === id);
	if (!mention) {
		throw new Error(`Mention ${id} not found`);
	}

	Object.assign(mention, updates, {
		updated_at: new Date().toISOString(),
	});

	return mention;
};
