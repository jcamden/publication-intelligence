import type { IndexEntry } from "../_types/index-entry";

// Subject Index Entries (with hierarchy)
export const mockSubjectEntries: IndexEntry[] = [
	// Top-level categories
	{
		id: "entry-subject-1",
		indexType: "subject",
		label: "Philosophy",
		parentId: null,
	},
	{
		id: "entry-subject-2",
		indexType: "subject",
		label: "Science",
		parentId: null,
	},

	// Philosophy children
	{
		id: "entry-subject-3",
		indexType: "subject",
		label: "Kant, Immanuel",
		parentId: "entry-subject-1",
		metadata: {
			matchers: ["Kant, I.", "Emmanuel Kant"],
		},
	},
	{
		id: "entry-subject-4",
		indexType: "subject",
		label: "Hegel, G.W.F.",
		parentId: "entry-subject-1",
		metadata: {
			matchers: ["Hegel", "Georg Wilhelm Friedrich Hegel"],
		},
	},
	{
		id: "entry-subject-5",
		indexType: "subject",
		label: "Ancient Philosophy",
		parentId: "entry-subject-1",
	},

	// Ancient Philosophy children (grandchildren of Philosophy)
	{
		id: "entry-subject-6",
		indexType: "subject",
		label: "Plato",
		parentId: "entry-subject-5",
	},
	{
		id: "entry-subject-7",
		indexType: "subject",
		label: "Aristotle",
		parentId: "entry-subject-5",
	},

	// Science children
	{
		id: "entry-subject-8",
		indexType: "subject",
		label: "Physics",
		parentId: "entry-subject-2",
	},
	{
		id: "entry-subject-9",
		indexType: "subject",
		label: "Biology",
		parentId: "entry-subject-2",
	},
];

// Author Index Entries
export const mockAuthorEntries: IndexEntry[] = [
	// Different hierarchy than Subject index
	{
		id: "entry-author-1",
		indexType: "author",
		label: "German Authors",
		parentId: null,
	},
	{
		id: "entry-author-2",
		indexType: "author",
		label: "Greek Authors",
		parentId: null,
	},

	// German Authors children
	{
		id: "entry-author-3",
		indexType: "author",
		label: "Kant, Immanuel", // Same name as Subject entry, but different hierarchy
		parentId: "entry-author-1",
		metadata: {
			matchers: ["Kant, I."],
		},
	},
	{
		id: "entry-author-4",
		indexType: "author",
		label: "Hegel, G.W.F.",
		parentId: "entry-author-1",
	},

	// Greek Authors children
	{
		id: "entry-author-5",
		indexType: "author",
		label: "Plato",
		parentId: "entry-author-2",
	},
	{
		id: "entry-author-6",
		indexType: "author",
		label: "Aristotle",
		parentId: "entry-author-2",
	},
];

// Scripture Index Entries
export const mockScriptureEntries: IndexEntry[] = [
	{
		id: "entry-scripture-1",
		indexType: "scripture",
		label: "Old Testament",
		parentId: null,
	},
	{
		id: "entry-scripture-2",
		indexType: "scripture",
		label: "New Testament",
		parentId: null,
	},
	{
		id: "entry-scripture-3",
		indexType: "scripture",
		label: "Genesis",
		parentId: "entry-scripture-1",
	},
	{
		id: "entry-scripture-4",
		indexType: "scripture",
		label: "Exodus",
		parentId: "entry-scripture-1",
	},
	{
		id: "entry-scripture-5",
		indexType: "scripture",
		label: "Matthew",
		parentId: "entry-scripture-2",
	},
	{
		id: "entry-scripture-6",
		indexType: "scripture",
		label: "John",
		parentId: "entry-scripture-2",
	},
];

// Combined mock entries
export const mockIndexEntries: IndexEntry[] = [
	...mockSubjectEntries,
	...mockAuthorEntries,
	...mockScriptureEntries,
];
