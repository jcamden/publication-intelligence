import "../../test/setup";
import type { FastifyInstance } from "fastify";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { localFileStorage } from "../../infrastructure/storage";
import { createTestUser } from "../../test/factories";
import { FAKE_UUID } from "../../test/mocks";
import {
	closeTestServer,
	createTestServer,
	makeAuthenticatedRequest,
} from "../../test/server-harness";

// ============================================================================
// Download Routes Integration Tests
// ============================================================================

// Extend test context to include server and test user
declare module "vitest" {
	export interface TestContext {
		server: FastifyInstance;
		testUser: Awaited<ReturnType<typeof createTestUser>>;
		authenticatedRequest: ReturnType<typeof makeAuthenticatedRequest>;
	}
}

describe("Source Document Download API (Integration)", () => {
	beforeEach(async (context) => {
		// Create server with test-specific database
		context.server = await createTestServer();

		// Create user for authenticated tests
		// Factories will use module-level override (set by setup.ts beforeEach)
		context.testUser = await createTestUser();
		context.authenticatedRequest = makeAuthenticatedRequest({
			server: context.server,
			authToken: context.testUser.authToken,
		});
	});

	afterEach(async (context) => {
		await closeTestServer(context.server);
	});

	describe("GET /source-documents/:documentId/file", () => {
		it("should download PDF with valid authentication", async ({
			authenticatedRequest,
			server,
			testUser,
		}) => {
			const projectResponse = await authenticatedRequest.inject({
				method: "POST",
				url: "/trpc/project.create",
				payload: {
					title: "Download Test Project",
					project_dir: "download-test-project",
				},
			});

			const project = JSON.parse(projectResponse.body).result.data;

			const pdfContent =
				"%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF";
			const boundary = "----DownloadTestBoundary";

			const multipartBody = [
				`------${boundary}`,
				'Content-Disposition: form-data; name="file"; filename="test-download.pdf"',
				"Content-Type: application/pdf",
				"",
				pdfContent,
				`------${boundary}`,
				'Content-Disposition: form-data; name="title"',
				"",
				"Test Download Document",
				`------${boundary}--`,
			].join("\r\n");

			const uploadResponse = await server.inject({
				method: "POST",
				url: `/projects/${project.id}/source-documents/upload`,
				headers: {
					authorization: `Bearer ${testUser.authToken}`,
					"content-type": `multipart/form-data; boundary=----${boundary}`,
				},
				payload: multipartBody,
			});

			expect(uploadResponse.statusCode).toBe(201);
			const uploadedDocument = JSON.parse(uploadResponse.body);

			const downloadResponse = await server.inject({
				method: "GET",
				url: `/source-documents/${uploadedDocument.id}/file`,
				headers: {
					authorization: `Bearer ${testUser.authToken}`,
				},
			});

			expect(downloadResponse.statusCode).toBe(200);
			expect(downloadResponse.headers["content-type"]).toBe("application/pdf");
			expect(downloadResponse.headers["content-disposition"]).toContain(
				"test-download.pdf",
			);
			expect(downloadResponse.headers["content-disposition"]).toContain(
				"inline",
			);
			expect(downloadResponse.headers["content-length"]).toBeDefined();
			expect(downloadResponse.body).toContain("%PDF");

			await localFileStorage.deleteFile({
				storageKey: uploadedDocument.storage_key,
			});
		});

		it("should return 401 when no token provided", async ({
			authenticatedRequest,
			server,
			testUser,
		}) => {
			const projectResponse = await authenticatedRequest.inject({
				method: "POST",
				url: "/trpc/project.create",
				payload: {
					title: "Auth Test Project",
					project_dir: "auth-test-project",
				},
			});

			const project = JSON.parse(projectResponse.body).result.data;

			const pdfContent = "%PDF-1.4\ntest";
			const boundary = "----AuthTestBoundary";

			const multipartBody = [
				`------${boundary}`,
				'Content-Disposition: form-data; name="file"; filename="auth-test.pdf"',
				"Content-Type: application/pdf",
				"",
				pdfContent,
				`------${boundary}`,
				'Content-Disposition: form-data; name="title"',
				"",
				"Auth Test Document",
				`------${boundary}--`,
			].join("\r\n");

			const uploadResponse = await server.inject({
				method: "POST",
				url: `/projects/${project.id}/source-documents/upload`,
				headers: {
					authorization: `Bearer ${testUser.authToken}`,
					"content-type": `multipart/form-data; boundary=----${boundary}`,
				},
				payload: multipartBody,
			});

			const uploadedDocument = JSON.parse(uploadResponse.body);

			const downloadResponse = await server.inject({
				method: "GET",
				url: `/source-documents/${uploadedDocument.id}/file`,
			});

			expect(downloadResponse.statusCode).toBe(401);
			expect(JSON.parse(downloadResponse.body).error).toBe("Unauthorized");

			await localFileStorage.deleteFile({
				storageKey: uploadedDocument.storage_key,
			});
		});

		it("should return 401 when invalid token provided", async ({
			authenticatedRequest,
			server,
			testUser,
		}) => {
			const projectResponse = await authenticatedRequest.inject({
				method: "POST",
				url: "/trpc/project.create",
				payload: {
					title: "Invalid Token Test",
					project_dir: "invalid-token-test",
				},
			});

			const project = JSON.parse(projectResponse.body).result.data;

			const pdfContent = "%PDF-1.4\ntest";
			const boundary = "----InvalidTokenBoundary";

			const multipartBody = [
				`------${boundary}`,
				'Content-Disposition: form-data; name="file"; filename="invalid-token.pdf"',
				"Content-Type: application/pdf",
				"",
				pdfContent,
				`------${boundary}`,
				'Content-Disposition: form-data; name="title"',
				"",
				"Invalid Token Document",
				`------${boundary}--`,
			].join("\r\n");

			const uploadResponse = await server.inject({
				method: "POST",
				url: `/projects/${project.id}/source-documents/upload`,
				headers: {
					authorization: `Bearer ${testUser.authToken}`,
					"content-type": `multipart/form-data; boundary=----${boundary}`,
				},
				payload: multipartBody,
			});

			const uploadedDocument = JSON.parse(uploadResponse.body);

			const downloadResponse = await server.inject({
				method: "GET",
				url: `/source-documents/${uploadedDocument.id}/file`,
				headers: {
					authorization: "Bearer invalid-token-xyz",
				},
			});

			expect(downloadResponse.statusCode).toBe(401);
			expect(JSON.parse(downloadResponse.body).error).toBe("Invalid token");

			await localFileStorage.deleteFile({
				storageKey: uploadedDocument.storage_key,
			});
		});

		it("should return 404 when document does not exist", async ({
			server,
			testUser,
		}) => {
			const fakeDocumentId = FAKE_UUID;

			const downloadResponse = await server.inject({
				method: "GET",
				url: `/source-documents/${fakeDocumentId}/file`,
				headers: {
					authorization: `Bearer ${testUser.authToken}`,
				},
			});

			expect(downloadResponse.statusCode).toBe(404);
		});

		it("should return 404 when file not found in storage", async ({
			authenticatedRequest,
			server,
			testUser,
		}) => {
			const projectResponse = await authenticatedRequest.inject({
				method: "POST",
				url: "/trpc/project.create",
				payload: {
					title: "Missing File Test",
					project_dir: "missing-file-test",
				},
			});

			const project = JSON.parse(projectResponse.body).result.data;

			const pdfContent = "%PDF-1.4\ntest";
			const boundary = "----MissingFileBoundary";

			const multipartBody = [
				`------${boundary}`,
				'Content-Disposition: form-data; name="file"; filename="missing-file.pdf"',
				"Content-Type: application/pdf",
				"",
				pdfContent,
				`------${boundary}`,
				'Content-Disposition: form-data; name="title"',
				"",
				"Missing File Document",
				`------${boundary}--`,
			].join("\r\n");

			const uploadResponse = await server.inject({
				method: "POST",
				url: `/projects/${project.id}/source-documents/upload`,
				headers: {
					authorization: `Bearer ${testUser.authToken}`,
					"content-type": `multipart/form-data; boundary=----${boundary}`,
				},
				payload: multipartBody,
			});

			expect(uploadResponse.statusCode).toBe(201);
			const uploadedDocument = JSON.parse(uploadResponse.body);
			expect(uploadedDocument.storage_key).toBeDefined();

			await localFileStorage.deleteFile({
				storageKey: uploadedDocument.storage_key,
			});

			const downloadResponse = await server.inject({
				method: "GET",
				url: `/source-documents/${uploadedDocument.id}/file`,
				headers: {
					authorization: `Bearer ${testUser.authToken}`,
				},
			});

			expect(downloadResponse.statusCode).toBe(404);
			expect(JSON.parse(downloadResponse.body).error).toBe(
				"File not found in storage",
			);
		});

		it("should emit events for successful download", async ({
			authenticatedRequest,
			server,
			testUser,
		}) => {
			const projectResponse = await authenticatedRequest.inject({
				method: "POST",
				url: "/trpc/project.create",
				payload: {
					title: "Event Test Project",
					project_dir: "event-test-project",
				},
			});

			const project = JSON.parse(projectResponse.body).result.data;

			const pdfContent = "%PDF-1.4\ntest";
			const boundary = "----EventTestBoundary";

			const multipartBody = [
				`------${boundary}`,
				'Content-Disposition: form-data; name="file"; filename="event-test.pdf"',
				"Content-Type: application/pdf",
				"",
				pdfContent,
				`------${boundary}`,
				'Content-Disposition: form-data; name="title"',
				"",
				"Event Test Document",
				`------${boundary}--`,
			].join("\r\n");

			const uploadResponse = await server.inject({
				method: "POST",
				url: `/projects/${project.id}/source-documents/upload`,
				headers: {
					authorization: `Bearer ${testUser.authToken}`,
					"content-type": `multipart/form-data; boundary=----${boundary}`,
				},
				payload: multipartBody,
			});

			const uploadedDocument = JSON.parse(uploadResponse.body);

			const downloadResponse = await server.inject({
				method: "GET",
				url: `/source-documents/${uploadedDocument.id}/file`,
				headers: {
					authorization: `Bearer ${testUser.authToken}`,
				},
			});

			expect(downloadResponse.statusCode).toBe(200);

			await localFileStorage.deleteFile({
				storageKey: uploadedDocument.storage_key,
			});
		});
	});
});
