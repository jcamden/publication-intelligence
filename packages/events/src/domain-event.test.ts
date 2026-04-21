import { describe, expect, it } from "vitest";
import { DOMAIN_EVENT_TYPES, DomainEventSchema } from "./domain-event";

describe("DomainEventSchema", () => {
	it("uses entity.action with snake_case segments for every persisted type", () => {
		for (const t of DOMAIN_EVENT_TYPES) {
			const [entity, action] = t.split(".");
			expect(entity).toMatch(/^[a-z][a-z0-9_]*$/);
			expect(action).toMatch(/^[a-z][a-z0-9_]*$/);
		}
	});

	it("parses a representative payload per category", () => {
		const samples = [
			{
				type: "project.created" as const,
				entityType: "Project" as const,
				entityId: "00000000-0000-4000-8000-000000000001",
				metadata: { title: "T" },
			},
			{
				type: "document.uploaded" as const,
				entityType: "SourceDocument" as const,
				entityId: "00000000-0000-4000-8000-000000000002",
				metadata: {},
			},
			{
				type: "index_entry.created" as const,
				entityType: "IndexEntry" as const,
				entityId: "00000000-0000-4000-8000-000000000003",
			},
			{
				type: "index_mention.bulk_created" as const,
				entityType: "IndexMention" as const,
				entityId: "",
				metadata: { count: 1 },
			},
			{
				type: "scripture_index_config.updated" as const,
				entityId: "00000000-0000-4000-8000-000000000004",
			},
			{
				type: "scripture_bootstrap.run_completed" as const,
				metadata: { projectIndexTypeId: "x" },
			},
			{
				type: "user.created" as const,
				metadata: { email: "a@b.co", hasName: false },
			},
			{
				type: "auth.failed_login_attempt" as const,
				metadata: { email: "a@b.co", reason: "bad" },
			},
		];
		for (const s of samples) {
			expect(() => DomainEventSchema.parse(s)).not.toThrow();
		}
	});
});
