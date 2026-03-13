export type CrossReference = {
	id: string;
	toEntryId: string | null;
	arbitraryValue: string | null;
	relationType: "see" | "see_also" | "qv";
	toEntry?: {
		id: string;
		label: string;
	} | null;
};

export type IndexEntry = {
	id: string;
	indexType: "subject" | "author" | "scripture";
	label: string; // "Kant, Immanuel"
	parentId: string | null; // For hierarchy within same index type
	/** Group ID when entry is a root member of a group (root entries only). */
	groupId?: string | null;
	/** Position within group (for custom sort). */
	groupPosition?: number | null;
	status?: string; // "suggested" | "approved" | etc
	projectId?: string; // Optional project ID for mutations
	projectIndexTypeId?: string; // Optional for backend operations
	metadata?: {
		matchers?: string[]; // ["Kant, I.", "Emmanuel Kant"]
		sortKey?: string; // For alphabetization
	};
	crossReferences?: CrossReference[]; // Cross references from this entry
};
