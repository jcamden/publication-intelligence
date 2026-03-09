import { describe, expect, it } from "vitest";
import {
	isLlmRunInput,
	isMatcherRunInput,
	RunLlmSchema,
	RunMatcherSchema,
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
