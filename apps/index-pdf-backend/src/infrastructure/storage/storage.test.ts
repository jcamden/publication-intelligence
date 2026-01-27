import { describe, expect, it } from "vitest";
import { localFileStorage } from "./local-file-storage";

// ============================================================================
// Storage Service Tests
// ============================================================================

describe("LocalFileStorage", () => {
	it("should save and retrieve files", async () => {
		const testBuffer = Buffer.from("test file content");

		const { storageKey, sizeBytes } = await localFileStorage.saveFile({
			buffer: testBuffer,
			originalFilename: "test-doc.pdf",
			mimeType: "application/pdf",
		});

		expect(storageKey).toBeDefined();
		expect(storageKey).toMatch(/\.pdf$/);
		expect(sizeBytes).toBe(testBuffer.length);

		const file = await localFileStorage.getFile({ storageKey });
		expect(file).not.toBeNull();
		expect(file?.buffer.toString()).toBe("test file content");
		expect(file?.mimeType).toBe("application/pdf");
		expect(file?.sizeBytes).toBe(testBuffer.length);

		await localFileStorage.deleteFile({ storageKey });
	});

	it("should check file existence", async () => {
		const testBuffer = Buffer.from("existence check");

		const { storageKey } = await localFileStorage.saveFile({
			buffer: testBuffer,
			originalFilename: "exists.pdf",
			mimeType: "application/pdf",
		});

		const exists = await localFileStorage.exists({ storageKey });
		expect(exists).toBe(true);

		await localFileStorage.deleteFile({ storageKey });

		const existsAfterDelete = await localFileStorage.exists({ storageKey });
		expect(existsAfterDelete).toBe(false);
	});

	it("should return null for non-existent files", async () => {
		const fakeKey = "00000000-0000-0000-0000-000000000000.pdf";

		const file = await localFileStorage.getFile({ storageKey: fakeKey });
		expect(file).toBeNull();
	});

	it("should preserve file extension in storage key", async () => {
		const testBuffer = Buffer.from("extension test");

		const { storageKey } = await localFileStorage.saveFile({
			buffer: testBuffer,
			originalFilename: "document.pdf",
			mimeType: "application/pdf",
		});

		expect(storageKey).toMatch(/\.pdf$/);

		await localFileStorage.deleteFile({ storageKey });
	});

	it("should handle files without extension", async () => {
		const testBuffer = Buffer.from("no extension");

		const { storageKey } = await localFileStorage.saveFile({
			buffer: testBuffer,
			originalFilename: "noextension",
			mimeType: "application/pdf",
		});

		expect(storageKey).toMatch(/\.pdf$/);

		await localFileStorage.deleteFile({ storageKey });
	});

	it("should not throw when deleting non-existent file", async () => {
		const fakeKey = "00000000-0000-0000-0000-000000000000.pdf";

		await expect(
			localFileStorage.deleteFile({ storageKey: fakeKey }),
		).resolves.not.toThrow();
	});
});
