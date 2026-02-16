// Re-export backend types
// Backend package is available as devDependency for type inference
export type {
	CreateCrossReferenceInput,
	CreateIndexEntryInput,
	CreateIndexMentionInput,
	CrossReference,
	DeleteCrossReferenceInput,
	DeleteIndexEntryInput,
	DeleteIndexMentionInput,
	IndexEntry,
	IndexEntryListItem,
	IndexMatcher,
	IndexMention,
	IndexMentionListItem,
	TransferMatchersInput,
	TransferMentionsInput,
	UpdateIndexEntryInput,
	UpdateIndexMentionInput,
} from "@pubint/index-pdf-backend";
