import { describe, expect, it } from "vitest";
import {
	computeFileHash,
	isPdfBuffer,
	isPdfMimeType,
	validatePdfFile,
} from "./index";

describe("isPdfMimeType", () => {
	it("accepts application/pdf", () => {
		expect(isPdfMimeType({ mimeType: "application/pdf" })).toBe(true);
	});

	it("rejects other types", () => {
		expect(isPdfMimeType({ mimeType: "text/plain" })).toBe(false);
	});
});

describe("isPdfBuffer", () => {
	it("detects %PDF magic bytes", () => {
		const buffer = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31]);
		expect(isPdfBuffer({ buffer })).toBe(true);
	});

	it("rejects short buffers", () => {
		expect(isPdfBuffer({ buffer: Buffer.from([0x25, 0x50, 0x44]) })).toBe(
			false,
		);
	});
});

describe("validatePdfFile", () => {
	it("returns valid for a correct PDF buffer and MIME type", () => {
		const buffer = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31]);
		expect(validatePdfFile({ buffer, mimeType: "application/pdf" })).toEqual({
			valid: true,
		});
	});

	it("returns invalid when MIME type is wrong", () => {
		const buffer = Buffer.from([0x25, 0x50, 0x44, 0x46]);
		const result = validatePdfFile({ buffer, mimeType: "text/plain" });
		expect(result.valid).toBe(false);
		expect(result.reason).toContain("MIME");
	});
});

describe("computeFileHash", () => {
	it("returns a 64-char hex sha256", () => {
		const hash = computeFileHash({ buffer: Buffer.from("hello") });
		expect(hash).toMatch(/^[a-f0-9]{64}$/);
	});
});
