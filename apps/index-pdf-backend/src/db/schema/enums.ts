import { pgEnum } from "drizzle-orm/pg-core";

// Context types for text extraction configuration
export const contextTypeEnum = pgEnum("context_type", [
	"ignore",
	"page_number",
]);

// Page configuration application modes
export const pageConfigModeEnum = pgEnum("page_config_mode", [
	"this_page",
	"all_pages",
	"page_range",
	"custom",
]);

// Source document processing status
export const sourceDocumentStatusEnum = pgEnum("source_document_status", [
	"uploaded",
	"processing",
	"processed",
	"failed",
]);

// Index entry workflow status
export const indexEntryStatusEnum = pgEnum("index_entry_status", [
	"suggested",
	"active",
	"deprecated",
	"merged",
]);

// LLM run execution status
export const llmRunStatusEnum = pgEnum("llm_run_status", [
	"pending",
	"running",
	"completed",
	"failed",
]);

// Entity types for event logging
export const entityTypeEnum = pgEnum("entity_type", [
	"IndexEntry",
	"IndexMention",
	"SourceDocument",
	"DocumentPage",
	"LLMRun",
	"ExportedIndex",
	"Project",
]);

// Index relation types (cross-references)
export const relationTypeEnum = pgEnum("relation_type", [
	"see",
	"see_also",
	"broader",
	"narrower",
	"related",
]);

// Index variant types (synonyms, abbreviations, etc.)
export const variantTypeEnum = pgEnum("variant_type", [
	"alias",
	"synonym",
	"abbreviation",
	"deprecated",
	"editorial",
]);

// Mention range types
export const mentionRangeTypeEnum = pgEnum("mention_range_type", [
	"single_page",
	"page_range",
	"passim",
]);

// Mention types
export const mentionTypeEnum = pgEnum("mention_type", ["text", "region"]);

// Export formats
export const exportFormatEnum = pgEnum("export_format", [
	"book_index",
	"json",
	"xml",
]);

// Index type addons (fixed catalog)
export const indexTypeEnum = pgEnum("index_type", [
	"subject",
	"author", // pretty much like subject
	"scripture",
	// Then expand to technical manuals
	// "locality", // like subject
	// "errorCode", // like subject
	// "partNumber", // like subject
	// "legalTableOfAuthorities",
	// "statutory",
	// "taxonomy",
	// "formula",
	// "CAS Registry",
	// "incipit", // music and poetry
]);
