import { beforeAll, describe, expect, it } from "vitest";
import { createAuthenticatedClient } from "../../db/client";
import { localFileStorage } from "../../infrastructure/storage";
import { createTestProject, createTestUser } from "../../test/factories";
import * as sourceDocumentService from "./sourceDocument.service";

// ============================================================================
// Domain / Service Layer Tests
// ============================================================================

describe("SourceDocument Service", () => {
	let testUser: Awaited<ReturnType<typeof createTestUser>>;
	let gelClient: ReturnType<typeof createAuthenticatedClient>;

	beforeAll(async () => {
		testUser = await createTestUser();
		gelClient = createAuthenticatedClient({ authToken: testUser.authToken });
	});

	// Note: Cleanup handled by branch reset

	describe("uploadSourceDocument", () => {
		it("should upload a valid PDF document", async () => {
			const project = await createTestProject({
				gelClient,
				title: "Upload Test",
			});

			const pdfBuffer = Buffer.from(
				"%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\nxref\n0 2\ntrailer\n<< /Size 2 /Root 1 0 R >>\nstartxref\n%%EOF",
			);

			const document = await sourceDocumentService.uploadSourceDocument({
				gelClient,
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
				gelClient,
				title: "Filename Test",
			});

			const pdfBuffer = Buffer.from("%PDF-1.4\nminimal pdf");

			const document = await sourceDocumentService.uploadSourceDocument({
				gelClient,
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
				gelClient,
				title: "Validation Test",
			});

			const textBuffer = Buffer.from("Not a PDF file");

			await expect(
				sourceDocumentService.uploadSourceDocument({
					gelClient,
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
				gelClient,
				title: "Magic Bytes Test",
			});

			const fakeBuffer = Buffer.from("Not a real PDF");

			await expect(
				sourceDocumentService.uploadSourceDocument({
					gelClient,
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
				gelClient,
				title: "Hash Test",
			});

			const pdfBuffer = Buffer.from("%PDF-1.4\ntest content");

			const document = await sourceDocumentService.uploadSourceDocument({
				gelClient,
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
				gelClient,
				title: "Event Test",
			});

			const pdfBuffer = Buffer.from("%PDF-1.4\nevent test");

			const document = await sourceDocumentService.uploadSourceDocument({
				gelClient,
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

			const events = await gelClient.query<{
				entity_id: string;
				action: string;
			}>(
				`
				SELECT Event {
					entity_id,
					action
				}
				FILTER .entity_id = <uuid>$documentId
			`,
				{ documentId: document.id },
			);

			expect(events).toHaveLength(1);
			expect(events[0].action).toBe("uploaded");

			await localFileStorage.deleteFile({ storageKey: document.storage_key });
		});

		it("should reject upload to non-existent project", async () => {
			const fakeProjectId = "00000000-0000-0000-0000-000000000000";
			const pdfBuffer = Buffer.from("%PDF-1.4\ntest");

			await expect(
				sourceDocumentService.uploadSourceDocument({
					gelClient,
					storageService: localFileStorage,
					projectId: fakeProjectId,
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
				gelClient,
				title: "List Test",
			});

			const pdfBuffer = Buffer.from("%PDF-1.4\nlist test");

			const doc1 = await sourceDocumentService.uploadSourceDocument({
				gelClient,
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
				gelClient,
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
					gelClient,
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
				gelClient,
				title: "Delete List Test",
			});

			const pdfBuffer = Buffer.from("%PDF-1.4\ndelete test");

			const document = await sourceDocumentService.uploadSourceDocument({
				gelClient,
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
				gelClient,
				documentId: document.id,
				userId: testUser.userId,
				requestId: "test-request",
			});

			const documents =
				await sourceDocumentService.listSourceDocumentsByProject({
					gelClient,
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
				gelClient,
				title: "Get Test",
			});

			const pdfBuffer = Buffer.from("%PDF-1.4\nget test");

			const created = await sourceDocumentService.uploadSourceDocument({
				gelClient,
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
				gelClient,
				documentId: created.id,
				userId: testUser.userId,
				requestId: "test-request",
			});

			expect(retrieved.id).toBe(created.id);
			expect(retrieved.title).toBe("Get By ID Test");

			await localFileStorage.deleteFile({ storageKey: created.storage_key });
		});

		it("should throw NOT_FOUND for non-existent document", async () => {
			const fakeId = "00000000-0000-0000-0000-000000000000";

			await expect(
				sourceDocumentService.getSourceDocumentById({
					gelClient,
					documentId: fakeId,
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
				gelClient,
				title: "Delete Test",
			});

			const pdfBuffer = Buffer.from("%PDF-1.4\ndelete test");

			const document = await sourceDocumentService.uploadSourceDocument({
				gelClient,
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
				gelClient,
				documentId: document.id,
				userId: testUser.userId,
				requestId: "test-request",
			});

			const deleted = await gelClient.querySingle<{
				id: string;
				deleted_at: Date | null;
			}>(
				`
				SELECT SourceDocument {
					id,
					deleted_at
				}
				FILTER .id = <uuid>$id
			`,
				{ id: document.id },
			);

			expect(deleted?.deleted_at).not.toBeNull();

			await localFileStorage.deleteFile({ storageKey: document.storage_key });
		});

		it("should emit event on deletion", async () => {
			const project = await createTestProject({
				gelClient,
				title: "Delete Event Test",
			});

			const pdfBuffer = Buffer.from("%PDF-1.4\ndelete event test");

			const document = await sourceDocumentService.uploadSourceDocument({
				gelClient,
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
				gelClient,
				documentId: document.id,
				userId: testUser.userId,
				requestId: "test-request",
			});

			const events = await gelClient.query<{
				action: string;
			}>(
				`
				SELECT Event {
					action
				}
				FILTER .entity_id = <uuid>$documentId
				ORDER BY .created_at DESC
			`,
				{ documentId: document.id },
			);

			expect(events.some((e) => e.action === "deleted")).toBe(true);

			await localFileStorage.deleteFile({ storageKey: document.storage_key });
		});
	});
});
