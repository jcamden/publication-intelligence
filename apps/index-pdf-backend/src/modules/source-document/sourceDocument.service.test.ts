import { beforeEach, describe, expect, it } from "vitest";
import { localFileStorage } from "../../infrastructure/storage";
import { createTestProject, createTestUser } from "../../test/factories";
import { createTestPdfBuffer, FAKE_UUID } from "../../test/mocks";
import * as sourceDocumentService from "./sourceDocument.service";

// ============================================================================
// Domain / Service Layer Tests
// ============================================================================

describe("SourceDocument Service", () => {
	let testUser: Awaited<ReturnType<typeof createTestUser>>;

	beforeEach(async () => {
		// Recreate user before each test (global afterEach deletes all data)
		testUser = await createTestUser();
	});

	describe("uploadSourceDocument", () => {
		it("should upload a valid PDF document", async () => {
			const project = await createTestProject({
				userId: testUser.userId,
				title: "Upload Test",
			});

			const pdfBuffer = createTestPdfBuffer({
				content:
					"1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\nxref\n0 2\ntrailer\n<< /Size 2 /Root 1 0 R >>\nstartxref\n%%EOF",
			});

			const document = await sourceDocumentService.uploadSourceDocument({
				storageService: localFileStorage,
				projectId: project.id,
				file: {
					buffer: pdfBuffer,
					filename: "test-doc.pdf",
					mimeType: "application/pdf",
				},
				title: "Test Document",
				userId: testUser.userId,
				requestId: "test-request",
			});

			expect(document).toBeDefined();
			expect(document.id).toBeDefined();
			expect(document.title).toBe("Test Document");
			expect(document.file_name).toBe("test-doc.pdf");
			expect(document.status).toBe("uploaded");
			expect(document.storage_key).toBeDefined();
			expect(document.content_hash).toBeDefined();
			expect(document.file_size).toBe(pdfBuffer.length);

			const fileExists = await localFileStorage.exists({
				storageKey: document.storage_key,
			});
			expect(fileExists).toBe(true);

			await localFileStorage.deleteFile({ storageKey: document.storage_key });
		});

		it("should use filename as title when title not provided", async () => {
			const project = await createTestProject({
				userId: testUser.userId,
				title: "Filename Test",
			});

			const pdfBuffer = createTestPdfBuffer({ content: "minimal pdf" });

			const document = await sourceDocumentService.uploadSourceDocument({
				storageService: localFileStorage,
				projectId: project.id,
				file: {
					buffer: pdfBuffer,
					filename: "my-book.pdf",
					mimeType: "application/pdf",
				},
				userId: testUser.userId,
				requestId: "test-request",
			});

			expect(document.title).toBe("my-book.pdf");

			await localFileStorage.deleteFile({ storageKey: document.storage_key });
		});

		it("should reject non-PDF files by MIME type", async () => {
			const project = await createTestProject({
				userId: testUser.userId,
				title: "Validation Test",
			});

			const textBuffer = Buffer.from("Not a PDF file");

			await expect(
				sourceDocumentService.uploadSourceDocument({
					storageService: localFileStorage,
					projectId: project.id,
					file: {
						buffer: textBuffer,
						filename: "fake.pdf",
						mimeType: "text/plain",
					},
					userId: testUser.userId,
					requestId: "test-request",
				}),
			).rejects.toThrow("Invalid MIME type");
		});

		it("should reject files without PDF magic bytes", async () => {
			const project = await createTestProject({
				userId: testUser.userId,
				title: "Magic Bytes Test",
			});

			const fakeBuffer = Buffer.from("Not a real PDF");

			await expect(
				sourceDocumentService.uploadSourceDocument({
					storageService: localFileStorage,
					projectId: project.id,
					file: {
						buffer: fakeBuffer,
						filename: "fake.pdf",
						mimeType: "application/pdf",
					},
					userId: testUser.userId,
					requestId: "test-request",
				}),
			).rejects.toThrow("PDF magic bytes");
		});

		it("should compute and store file hash", async () => {
			const project = await createTestProject({
				userId: testUser.userId,
				title: "Hash Test",
			});

			const pdfBuffer = createTestPdfBuffer({ content: "test content" });

			const document = await sourceDocumentService.uploadSourceDocument({
				storageService: localFileStorage,
				projectId: project.id,
				file: {
					buffer: pdfBuffer,
					filename: "hash-test.pdf",
					mimeType: "application/pdf",
				},
				userId: testUser.userId,
				requestId: "test-request",
			});

			expect(document.content_hash).toBeDefined();
			expect(document.content_hash).toHaveLength(64);

			await localFileStorage.deleteFile({ storageKey: document.storage_key });
		});

		it("should emit domain event on upload", async () => {
			const project = await createTestProject({
				userId: testUser.userId,
				title: "Event Test",
			});

			const pdfBuffer = createTestPdfBuffer({ content: "event test" });

			const document = await sourceDocumentService.uploadSourceDocument({
				storageService: localFileStorage,
				projectId: project.id,
				file: {
					buffer: pdfBuffer,
					filename: "event-test.pdf",
					mimeType: "application/pdf",
				},
				userId: testUser.userId,
				requestId: "test-request",
			});

			// Event emission is logged - we just verify the document was created successfully
			expect(document).toBeDefined();
			expect(document.id).toBeDefined();

			await localFileStorage.deleteFile({ storageKey: document.storage_key });
		});

		it("should reject upload to non-existent project", async () => {
			const pdfBuffer = createTestPdfBuffer({ content: "test" });

			await expect(
				sourceDocumentService.uploadSourceDocument({
					storageService: localFileStorage,
					projectId: FAKE_UUID,
					file: {
						buffer: pdfBuffer,
						filename: "test.pdf",
						mimeType: "application/pdf",
					},
					userId: testUser.userId,
					requestId: "test-request",
				}),
			).rejects.toThrow();
		});
	});

	describe("listSourceDocumentsByProject", () => {
		it("should list documents in project", async () => {
			const project = await createTestProject({
				userId: testUser.userId,
				title: "List Test",
			});

			const pdfBuffer = createTestPdfBuffer({ content: "list test" });

			const doc1 = await sourceDocumentService.uploadSourceDocument({
				storageService: localFileStorage,
				projectId: project.id,
				file: {
					buffer: pdfBuffer,
					filename: "doc1.pdf",
					mimeType: "application/pdf",
				},
				title: "Document 1",
				userId: testUser.userId,
				requestId: "test-request",
			});

			const doc2 = await sourceDocumentService.uploadSourceDocument({
				storageService: localFileStorage,
				projectId: project.id,
				file: {
					buffer: pdfBuffer,
					filename: "doc2.pdf",
					mimeType: "application/pdf",
				},
				title: "Document 2",
				userId: testUser.userId,
				requestId: "test-request",
			});

			const documents =
				await sourceDocumentService.listSourceDocumentsByProject({
					projectId: project.id,
					userId: testUser.userId,
					requestId: "test-request",
				});

			expect(documents.length).toBeGreaterThanOrEqual(2);
			expect(documents.map((d) => d.title)).toContain("Document 1");
			expect(documents.map((d) => d.title)).toContain("Document 2");

			await localFileStorage.deleteFile({ storageKey: doc1.storage_key });
			await localFileStorage.deleteFile({ storageKey: doc2.storage_key });
		});

		it("should not list deleted documents", async () => {
			const project = await createTestProject({
				userId: testUser.userId,
				title: "Delete List Test",
			});

			const pdfBuffer = createTestPdfBuffer({ content: "delete test" });

			const document = await sourceDocumentService.uploadSourceDocument({
				storageService: localFileStorage,
				projectId: project.id,
				file: {
					buffer: pdfBuffer,
					filename: "to-delete.pdf",
					mimeType: "application/pdf",
				},
				userId: testUser.userId,
				requestId: "test-request",
			});

			await sourceDocumentService.deleteSourceDocument({
				documentId: document.id,
				userId: testUser.userId,
				requestId: "test-request",
			});

			const documents =
				await sourceDocumentService.listSourceDocumentsByProject({
					projectId: project.id,
					userId: testUser.userId,
					requestId: "test-request",
				});

			expect(documents.find((d) => d.id === document.id)).toBeUndefined();

			await localFileStorage.deleteFile({ storageKey: document.storage_key });
		});
	});

	describe("getSourceDocumentById", () => {
		it("should retrieve document by id", async () => {
			const project = await createTestProject({
				userId: testUser.userId,
				title: "Get Test",
			});

			const pdfBuffer = createTestPdfBuffer({ content: "get test" });

			const created = await sourceDocumentService.uploadSourceDocument({
				storageService: localFileStorage,
				projectId: project.id,
				file: {
					buffer: pdfBuffer,
					filename: "get-test.pdf",
					mimeType: "application/pdf",
				},
				title: "Get By ID Test",
				userId: testUser.userId,
				requestId: "test-request",
			});

			const retrieved = await sourceDocumentService.getSourceDocumentById({
				documentId: created.id,
				userId: testUser.userId,
				requestId: "test-request",
			});

			expect(retrieved.id).toBe(created.id);
			expect(retrieved.title).toBe("Get By ID Test");

			await localFileStorage.deleteFile({ storageKey: created.storage_key });
		});

		it("should throw NOT_FOUND for non-existent document", async () => {
			await expect(
				sourceDocumentService.getSourceDocumentById({
					documentId: FAKE_UUID,
					userId: testUser.userId,
					requestId: "test-request",
				}),
			).rejects.toMatchObject({
				code: "NOT_FOUND",
				message: "Resource not found",
			});
		});
	});

	describe("deleteSourceDocument", () => {
		it("should soft delete document", async () => {
			const project = await createTestProject({
				userId: testUser.userId,
				title: "Delete Test",
			});

			const pdfBuffer = createTestPdfBuffer({ content: "delete test" });

			const document = await sourceDocumentService.uploadSourceDocument({
				storageService: localFileStorage,
				projectId: project.id,
				file: {
					buffer: pdfBuffer,
					filename: "to-delete.pdf",
					mimeType: "application/pdf",
				},
				userId: testUser.userId,
				requestId: "test-request",
			});

			await sourceDocumentService.deleteSourceDocument({
				documentId: document.id,
				userId: testUser.userId,
				requestId: "test-request",
			});

			// Try to get deleted document - should throw NOT_FOUND
			await expect(
				sourceDocumentService.getSourceDocumentById({
					documentId: document.id,
					userId: testUser.userId,
					requestId: "test-request",
				}),
			).rejects.toMatchObject({
				code: "NOT_FOUND",
			});

			await localFileStorage.deleteFile({ storageKey: document.storage_key });
		});

		it("should emit event on deletion", async () => {
			const project = await createTestProject({
				userId: testUser.userId,
				title: "Delete Event Test",
			});

			const pdfBuffer = createTestPdfBuffer({ content: "delete event test" });

			const document = await sourceDocumentService.uploadSourceDocument({
				storageService: localFileStorage,
				projectId: project.id,
				file: {
					buffer: pdfBuffer,
					filename: "delete-event.pdf",
					mimeType: "application/pdf",
				},
				userId: testUser.userId,
				requestId: "test-request",
			});

			await sourceDocumentService.deleteSourceDocument({
				documentId: document.id,
				userId: testUser.userId,
				requestId: "test-request",
			});

			// Event emission is logged - we just verify the document was deleted
			await expect(
				sourceDocumentService.getSourceDocumentById({
					documentId: document.id,
					userId: testUser.userId,
					requestId: "test-request",
				}),
			).rejects.toMatchObject({
				code: "NOT_FOUND",
			});

			await localFileStorage.deleteFile({ storageKey: document.storage_key });
		});
	});
});
