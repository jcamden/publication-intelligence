import { describe, expect, it } from "vitest";
import {
	CreateIndexEntryGroupSchema,
	INDEX_ENTRY_GROUP_SORT_MODES,
	isLlmRunInput,
	isMatcherRunInput,
	RunLlmSchema,
	RunMatcherSchema,
	UpdateIndexEntryGroupSchema,
} from "./detection.types";

// Valid RFC 4122 UUIDs for Zod 4 uuid() validation
const PROJECT_ID = "f47ac10b-58cc-4372-a567-0e02b2c3d479";
const PAGE_ID = "a1b2c3d4-e5f6-4789-a012-3456789abcde";
const GROUP_ID = "b2c3d4e5-f6a7-4890-b123-456789abcdef";

describe("detection run type guards", () => {
	it("isLlmRunInput returns true for LLM run input", () => {
		const input = {
			projectId: PROJECT_ID,
			indexType: "subject",
			model: "openai/gpt-4o",
			promptVersion: "v1",
			settingsHash: "abc",
			totalPages: 10,
		};
		expect(isLlmRunInput(input)).toBe(true);
		expect(isMatcherRunInput(input)).toBe(false);
	});

	it("isMatcherRunInput returns true for matcher run input", () => {
		const input = {
			projectId: PROJECT_ID,
			indexType: "scripture",
			scope: "project" as const,
			runAllGroups: true,
			settingsHash: "def",
			totalPages: 5,
		};
		expect(isMatcherRunInput(input)).toBe(true);
		expect(isLlmRunInput(input)).toBe(false);
	});

	it("isMatcherRunInput returns true for page-scope matcher with pageId", () => {
		const input = {
			projectId: PROJECT_ID,
			indexType: "scripture",
			scope: "page" as const,
			pageId: PAGE_ID,
			indexEntryGroupIds: [GROUP_ID],
			settingsHash: "ghi",
			totalPages: 1,
		};
		expect(isMatcherRunInput(input)).toBe(true);
	});
});

describe("RunMatcherSchema", () => {
	it("accepts valid project-scope run with runAllGroups", () => {
		const result = RunMatcherSchema.safeParse({
			projectId: PROJECT_ID,
			indexType: "scripture",
			scope: "project",
			runAllGroups: true,
		});
		expect(result.success).toBe(true);
	});

	it("accepts valid project-scope run with indexEntryGroupIds", () => {
		const result = RunMatcherSchema.safeParse({
			projectId: PROJECT_ID,
			indexType: "scripture",
			scope: "project",
			indexEntryGroupIds: [GROUP_ID],
		});
		expect(result.success).toBe(true);
	});

	it("accepts valid page-scope run with pageId", () => {
		const result = RunMatcherSchema.safeParse({
			projectId: PROJECT_ID,
			indexType: "scripture",
			scope: "page",
			pageId: PAGE_ID,
			runAllGroups: true,
		});
		expect(result.success).toBe(true);
	});

	it("rejects page scope without pageId", () => {
		const result = RunMatcherSchema.safeParse({
			projectId: PROJECT_ID,
			indexType: "scripture",
			scope: "page",
			runAllGroups: true,
		});
		expect(result.success).toBe(false);
	});

	it("rejects when both indexEntryGroupIds and runAllGroups are set", () => {
		const result = RunMatcherSchema.safeParse({
			projectId: PROJECT_ID,
			indexType: "scripture",
			scope: "project",
			indexEntryGroupIds: [GROUP_ID],
			runAllGroups: true,
		});
		expect(result.success).toBe(false);
	});

	it("rejects when neither indexEntryGroupIds nor runAllGroups is set", () => {
		const result = RunMatcherSchema.safeParse({
			projectId: PROJECT_ID,
			indexType: "scripture",
			scope: "project",
		});
		expect(result.success).toBe(false);
	});
});

describe("RunLlmSchema", () => {
	it("accepts valid LLM run input", () => {
		const result = RunLlmSchema.safeParse({
			projectId: PROJECT_ID,
			indexType: "subject",
			model: "openai/gpt-4o",
		});
		expect(result.success).toBe(true);
	});
});

describe("Index entry group schemas (Task 6.1)", () => {
	const validGroupInput = {
		projectId: PROJECT_ID,
		projectIndexTypeId: "a1b2c3d4-e5f6-4789-a012-3456789abcde",
		name: "Biblical",
		slug: "biblical",
	};

	describe("CreateIndexEntryGroupSchema", () => {
		it("accepts valid input with parser profile scripture-biblical", () => {
			const result = CreateIndexEntryGroupSchema.safeParse({
				...validGroupInput,
				parserProfileId: "scripture-biblical",
				sortMode: "a_z",
			});
			expect(result.success).toBe(true);
		});

		it("accepts valid input with null parser profile (alias-only)", () => {
			const result = CreateIndexEntryGroupSchema.safeParse({
				...validGroupInput,
				parserProfileId: null,
				sortMode: "canon_book_order",
			});
			expect(result.success).toBe(true);
		});

		it("rejects invalid parser profile id", () => {
			const result = CreateIndexEntryGroupSchema.safeParse({
				...validGroupInput,
				parserProfileId: "unknown-profile",
			});
			expect(result.success).toBe(false);
		});

		it("rejects invalid sort mode", () => {
			const result = CreateIndexEntryGroupSchema.safeParse({
				...validGroupInput,
				sortMode: "invalid_sort",
			});
			expect(result.success).toBe(false);
		});

		it("defaults sort mode to a_z", () => {
			const result = CreateIndexEntryGroupSchema.safeParse(validGroupInput);
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.sortMode).toBe("a_z");
			}
		});
	});

	describe("UpdateIndexEntryGroupSchema", () => {
		const validGroupId = "550e8400-e29b-41d4-a716-446655440000";

		it("accepts valid parser profile and sort mode", () => {
			const result = UpdateIndexEntryGroupSchema.safeParse({
				groupId: validGroupId,
				parserProfileId: "scripture-biblical",
				sortMode: "canon_book_order",
			});
			expect(result.success).toBe(true);
		});

		it("accepts custom sort mode", () => {
			const result = UpdateIndexEntryGroupSchema.safeParse({
				groupId: validGroupId,
				sortMode: "custom",
			});
			expect(result.success).toBe(true);
		});

		it("rejects invalid parser profile id", () => {
			const result = UpdateIndexEntryGroupSchema.safeParse({
				groupId: validGroupId,
				parserProfileId: "bad-profile",
			});
			expect(result.success).toBe(false);
		});

		it("rejects invalid sort mode", () => {
			const result = UpdateIndexEntryGroupSchema.safeParse({
				groupId: validGroupId,
				sortMode: "xyz",
			});
			expect(result.success).toBe(false);
		});

		it("rejects missing groupId", () => {
			const result = UpdateIndexEntryGroupSchema.safeParse({
				sortMode: "custom",
			});
			expect(result.success).toBe(false);
		});
	});

	describe("INDEX_ENTRY_GROUP_SORT_MODES", () => {
		it("includes a_z, canon_book_order, and custom", () => {
			expect(INDEX_ENTRY_GROUP_SORT_MODES).toContain("a_z");
			expect(INDEX_ENTRY_GROUP_SORT_MODES).toContain("canon_book_order");
			expect(INDEX_ENTRY_GROUP_SORT_MODES).toContain("custom");
		});
	});
});
