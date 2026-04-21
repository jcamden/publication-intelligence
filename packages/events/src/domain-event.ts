import { z } from "zod";

/** Matches apps/index-pdf-backend entityTypeEnum */
export const entityTypeSchema = z.enum([
	"IndexEntry",
	"IndexMention",
	"SourceDocument",
	"DocumentPage",
	"LLMRun",
	"ExportedIndex",
	"Project",
]);

export type EntityType = z.infer<typeof entityTypeSchema>;

const meta = z.record(z.string(), z.unknown()).optional();

const withEntity = (entityType: EntityType) =>
	z.object({
		entityType: z.literal(entityType),
		entityId: z.string().min(1),
		metadata: meta,
	});

export const DomainEventSchema = z.discriminatedUnion("type", [
	withEntity("Project").extend({ type: z.literal("project.created") }),
	withEntity("Project").extend({ type: z.literal("project.updated") }),
	withEntity("Project").extend({ type: z.literal("project.deleted") }),
	withEntity("SourceDocument").extend({ type: z.literal("document.uploaded") }),
	withEntity("SourceDocument").extend({ type: z.literal("document.deleted") }),
	withEntity("IndexEntry").extend({ type: z.literal("index_entry.created") }),
	withEntity("IndexEntry").extend({ type: z.literal("index_entry.updated") }),
	withEntity("IndexEntry").extend({
		type: z.literal("index_entry.parent_updated"),
	}),
	withEntity("IndexEntry").extend({ type: z.literal("index_entry.deleted") }),
	withEntity("IndexMention").extend({
		type: z.literal("index_mention.created"),
	}),
	withEntity("IndexMention").extend({
		type: z.literal("index_mention.updated"),
	}),
	withEntity("IndexMention").extend({
		type: z.literal("index_mention.types_updated"),
	}),
	z.object({
		type: z.literal("index_mention.bulk_created"),
		entityType: z.literal("IndexMention"),
		entityId: z.string(),
		metadata: meta,
	}),
	withEntity("IndexMention").extend({
		type: z.literal("index_mention.deleted"),
	}),
	withEntity("IndexEntry").extend({
		type: z.literal("index_mention.bulk_deleted_by_entry"),
	}),
	withEntity("IndexEntry").extend({ type: z.literal("region.created") }),
	withEntity("IndexEntry").extend({
		type: z.literal("highlight_config.enabled"),
	}),
	withEntity("IndexEntry").extend({
		type: z.literal("highlight_config.updated"),
	}),
	withEntity("IndexEntry").extend({
		type: z.literal("highlight_config.disabled"),
	}),
	z.object({
		type: z.literal("scripture_index_config.updated"),
		entityId: z.string().uuid(),
		metadata: meta,
	}),
	z.object({
		type: z.literal("scripture_bootstrap.run_completed"),
		metadata: meta,
	}),
	withEntity("IndexEntry").extend({
		type: z.literal("canonical_page_rule.created"),
	}),
	z.object({
		type: z.literal("user.created"),
		metadata: meta,
	}),
	z.object({
		type: z.literal("user.logged_in"),
		metadata: meta,
	}),
	z.object({
		type: z.literal("user.logged_out"),
		metadata: meta,
	}),
	z.object({
		type: z.literal("auth.failed_login_attempt"),
		metadata: meta,
	}),
]);

export type DomainEvent = z.infer<typeof DomainEventSchema>;

/** All persisted domain event type strings (for lint-style tests). */
export const DOMAIN_EVENT_TYPES = [
	"project.created",
	"project.updated",
	"project.deleted",
	"document.uploaded",
	"document.deleted",
	"index_entry.created",
	"index_entry.updated",
	"index_entry.parent_updated",
	"index_entry.deleted",
	"index_mention.created",
	"index_mention.updated",
	"index_mention.types_updated",
	"index_mention.bulk_created",
	"index_mention.deleted",
	"index_mention.bulk_deleted_by_entry",
	"region.created",
	"highlight_config.enabled",
	"highlight_config.updated",
	"highlight_config.disabled",
	"scripture_index_config.updated",
	"scripture_bootstrap.run_completed",
	"canonical_page_rule.created",
	"user.created",
	"user.logged_in",
	"user.logged_out",
	"auth.failed_login_attempt",
] as const satisfies readonly DomainEvent["type"][];

export type DomainEventType = (typeof DOMAIN_EVENT_TYPES)[number];
