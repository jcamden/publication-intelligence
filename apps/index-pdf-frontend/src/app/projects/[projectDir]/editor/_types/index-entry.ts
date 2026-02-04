export type IndexEntry = {
	id: string;
	indexType: string; // 'subject' | 'author' | 'scripture' | 'context'
	label: string; // "Kant, Immanuel"
	parentId: string | null; // For hierarchy within same index type
	metadata?: {
		aliases?: string[]; // ["Kant, I.", "Emmanuel Kant"]
		sortKey?: string; // For alphabetization
	};
};
