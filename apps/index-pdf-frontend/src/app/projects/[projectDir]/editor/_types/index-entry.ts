export type IndexEntry = {
	id: string;
	indexType: "subject" | "author" | "scripture";
	label: string; // "Kant, Immanuel"
	parentId: string | null; // For hierarchy within same index type
	status?: string; // "suggested" | "approved" | etc
	projectId?: string; // Optional project ID for mutations
	projectIndexTypeId?: string; // Optional for backend operations
	metadata?: {
		aliases?: string[]; // ["Kant, I.", "Emmanuel Kant"]
		sortKey?: string; // For alphabetization
	};
};
