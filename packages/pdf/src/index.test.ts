import { describe, it, expect } from "vitest";
import { extractPdfText, extractPdfPages } from "./index";

describe("extractPdfText", () => {
	it("should throw not implemented error", async () => {
		const buffer = Buffer.from("test pdf content");

		await expect(extractPdfText({ buffer })).rejects.toThrow(
			"Not implemented: extractPdfText",
		);
	});
});

describe("extractPdfPages", () => {
	it("should throw not implemented error", async () => {
		const buffer = Buffer.from("test pdf content");

		await expect(extractPdfPages({ buffer })).rejects.toThrow(
			"Not implemented: extractPdfPages",
		);
	});
});
