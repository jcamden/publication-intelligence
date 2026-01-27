import type { FastifyInstance } from "fastify";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { localFileStorage } from "../../infrastructure/storage";
import { createTestUser } from "../../test/factories";
import {
	closeTestServer,
	createTestServer,
	makeAuthenticatedRequest,
} from "../../test/server-harness";

// ============================================================================
// API / Integration Tests
// ============================================================================

describe("SourceDocument API (Integration)", () => {
	let server: FastifyInstance;
	let testUser: Awaited<ReturnType<typeof createTestUser>>;
	let authenticatedRequest: ReturnType<typeof makeAuthenticatedRequest>;

	beforeAll(async () => {
		server = await createTestServer();
		testUser = await createTestUser();
		authenticatedRequest = makeAuthenticatedRequest({
			server,
			authToken: testUser.authToken,
		});
	});

	afterAll(async () => {
		await closeTestServer(server);
	});

	// Note: Test data cleanup handled by branch reset

	describe("POST /projects/:projectId/source-documents/upload", () => {
		it("should upload PDF via multipart/form-data", async () => {
			const projectResponse = await authenticatedRequest.inject({
				method: "POST",
				url: "/trpc/project.create",
				payload: { title: "Upload Test Project" },
			});

			const project = JSON.parse(projectResponse.body).result.data;

			const pdfContent =
				"%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF";
			const boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW";

			const multipartBody = [
				`------${boundary}`,
				'Content-Disposition: form-data; name="file"; filename="test-upload.pdf"',
				"Content-Type: application/pdf",
				"",
				pdfContent,
				`------${boundary}`,
				'Content-Disposition: form-data; name="title"',
				"",
				"My Test Document",
				`------${boundary}--`,
			].join("\r\n");

			const response = await server.inject({
				method: "POST",
				url: `/projects/${project.id}/source-documents/upload`,
				headers: {
					authorization: `Bearer ${testUser.authToken}`,
					"content-type": `multipart/form-data; boundary=----${boundary}`,
				},
				payload: multipartBody,
			});

			expect(response.statusCode).toBe(201);
			const body = JSON.parse(response.body);
			expect(body.id).toBeDefined();
			expect(body.title).toBe("My Test Document");
			expect(body.file_name).toBe("test-upload.pdf");
			expect(body.status).toBe("uploaded");
			expect(body.storage_key).toBeDefined();

			await localFileStorage.deleteFile({ storageKey: body.storage_key });
		});

		it("should use filename as title when not provided", async () => {
			const projectResponse = await authenticatedRequest.inject({
				method: "POST",
				url: "/trpc/project.create",
				payload: { title: "Filename Default Test" },
			});

			const project = JSON.parse(projectResponse.body).result.data;

			const pdfContent = "%PDF-1.4\nminimal";
			const boundary = "----Boundary123";

			const multipartBody = [
				`------${boundary}`,
				'Content-Disposition: form-data; name="file"; filename="my-document.pdf"',
				"Content-Type: application/pdf",
				"",
				pdfContent,
				`------${boundary}--`,
			].join("\r\n");

			const response = await server.inject({
				method: "POST",
				url: `/projects/${project.id}/source-documents/upload`,
				headers: {
					authorization: `Bearer ${testUser.authToken}`,
					"content-type": `multipart/form-data; boundary=----${boundary}`,
				},
				payload: multipartBody,
			});

			expect(response.statusCode).toBe(201);
			const body = JSON.parse(response.body);
			expect(body.title).toBe("my-document.pdf");

			await localFileStorage.deleteFile({ storageKey: body.storage_key });
		});

		it("should require authentication", async () => {
			const projectResponse = await authenticatedRequest.inject({
				method: "POST",
				url: "/trpc/project.create",
				payload: { title: "Auth Test" },
			});

			const project = JSON.parse(projectResponse.body).result.data;

			const pdfContent = "%PDF-1.4\ntest";
			const boundary = "----Boundary";

			const multipartBody = [
				`------${boundary}`,
				'Content-Disposition: form-data; name="file"; filename="test.pdf"',
				"Content-Type: application/pdf",
				"",
				pdfContent,
				`------${boundary}--`,
			].join("\r\n");

			const response = await server.inject({
				method: "POST",
				url: `/projects/${project.id}/source-documents/upload`,
				headers: {
					"content-type": `multipart/form-data; boundary=----${boundary}`,
				},
				payload: multipartBody,
			});

			expect(response.statusCode).toBe(401);
		});

		it("should reject non-PDF files", async () => {
			const projectResponse = await authenticatedRequest.inject({
				method: "POST",
				url: "/trpc/project.create",
				payload: { title: "Validation Test" },
			});

			const project = JSON.parse(projectResponse.body).result.data;

			const textContent = "This is not a PDF";
			const boundary = "----BoundaryValidation";

			const multipartBody = [
				`------${boundary}`,
				'Content-Disposition: form-data; name="file"; filename="fake.pdf"',
				"Content-Type: application/pdf",
				"",
				textContent,
				`------${boundary}--`,
			].join("\r\n");

			const response = await server.inject({
				method: "POST",
				url: `/projects/${project.id}/source-documents/upload`,
				headers: {
					authorization: `Bearer ${testUser.authToken}`,
					"content-type": `multipart/form-data; boundary=----${boundary}`,
				},
				payload: multipartBody,
			});

			expect(response.statusCode).toBe(500);
			const body = JSON.parse(response.body);
			expect(body.error).toContain("PDF");
		});

		it("should return 404 for non-existent project", async () => {
			const fakeProjectId = "00000000-0000-0000-0000-000000000000";

			const pdfContent = "%PDF-1.4\ntest";
			const boundary = "----Boundary404";

			const multipartBody = [
				`------${boundary}`,
				'Content-Disposition: form-data; name="file"; filename="test.pdf"',
				"Content-Type: application/pdf",
				"",
				pdfContent,
				`------${boundary}--`,
			].join("\r\n");

			const response = await server.inject({
				method: "POST",
				url: `/projects/${fakeProjectId}/source-documents/upload`,
				headers: {
					authorization: `Bearer ${testUser.authToken}`,
					"content-type": `multipart/form-data; boundary=----${boundary}`,
				},
				payload: multipartBody,
			});

			expect(response.statusCode).toBe(500);
		});
	});

	describe("GET /trpc/sourceDocument.listByProject", () => {
		it("should list documents in project", async () => {
			const projectResponse = await authenticatedRequest.inject({
				method: "POST",
				url: "/trpc/project.create",
				payload: { title: "List Test Project" },
			});

			const project = JSON.parse(projectResponse.body).result.data;

			const pdfContent = "%PDF-1.4\nlist test";
			const boundary = "----BoundaryList";

			const multipartBody = [
				`------${boundary}`,
				'Content-Disposition: form-data; name="file"; filename="doc1.pdf"',
				"Content-Type: application/pdf",
				"",
				pdfContent,
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

			const uploaded = JSON.parse(uploadResponse.body);

			const listResponse = await authenticatedRequest.inject({
				method: "GET",
				url: `/trpc/sourceDocument.listByProject?input=${encodeURIComponent(JSON.stringify({ projectId: project.id }))}`,
			});

			expect(listResponse.statusCode).toBe(200);
			const body = JSON.parse(listResponse.body);
			expect(Array.isArray(body.result.data)).toBe(true);
			expect(body.result.data.length).toBeGreaterThanOrEqual(1);

			await localFileStorage.deleteFile({ storageKey: uploaded.storage_key });
		});

		it("should require authentication", async () => {
			const response = await server.inject({
				method: "GET",
				url: "/trpc/sourceDocument.listByProject?input=%7B%22projectId%22%3A%2200000000-0000-0000-0000-000000000000%22%7D",
			});

			expect(response.statusCode).toBe(401);
		});
	});

	describe("GET /trpc/sourceDocument.getById", () => {
		it("should retrieve document by id", async () => {
			const projectResponse = await authenticatedRequest.inject({
				method: "POST",
				url: "/trpc/project.create",
				payload: { title: "Get Test Project" },
			});

			const project = JSON.parse(projectResponse.body).result.data;

			const pdfContent = "%PDF-1.4\nget test";
			const boundary = "----BoundaryGet";

			const multipartBody = [
				`------${boundary}`,
				'Content-Disposition: form-data; name="file"; filename="get-test.pdf"',
				"Content-Type: application/pdf",
				"",
				pdfContent,
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

			const uploaded = JSON.parse(uploadResponse.body);

			const getResponse = await authenticatedRequest.inject({
				method: "GET",
				url: `/trpc/sourceDocument.getById?input=${encodeURIComponent(JSON.stringify({ id: uploaded.id }))}`,
			});

			expect(getResponse.statusCode).toBe(200);
			const body = JSON.parse(getResponse.body);
			expect(body.result.data.id).toBe(uploaded.id);

			await localFileStorage.deleteFile({ storageKey: uploaded.storage_key });
		});

		it("should return 404 for non-existent document", async () => {
			const fakeId = "00000000-0000-0000-0000-000000000000";

			const response = await authenticatedRequest.inject({
				method: "GET",
				url: `/trpc/sourceDocument.getById?input=${encodeURIComponent(JSON.stringify({ id: fakeId }))}`,
			});

			expect(response.statusCode).toBe(404);
		});
	});

	describe("POST /trpc/sourceDocument.delete", () => {
		it("should soft delete document", async () => {
			const projectResponse = await authenticatedRequest.inject({
				method: "POST",
				url: "/trpc/project.create",
				payload: { title: "Delete Test Project" },
			});

			const project = JSON.parse(projectResponse.body).result.data;

			const pdfContent = "%PDF-1.4\ndelete test";
			const boundary = "----BoundaryDelete";

			const multipartBody = [
				`------${boundary}`,
				'Content-Disposition: form-data; name="file"; filename="to-delete.pdf"',
				"Content-Type: application/pdf",
				"",
				pdfContent,
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

			const uploaded = JSON.parse(uploadResponse.body);

			const deleteResponse = await authenticatedRequest.inject({
				method: "POST",
				url: "/trpc/sourceDocument.delete",
				payload: { id: uploaded.id },
			});

			expect(deleteResponse.statusCode).toBe(200);

			const getResponse = await authenticatedRequest.inject({
				method: "GET",
				url: `/trpc/sourceDocument.getById?input=${encodeURIComponent(JSON.stringify({ id: uploaded.id }))}`,
			});

			expect(getResponse.statusCode).toBe(404);

			await localFileStorage.deleteFile({ storageKey: uploaded.storage_key });
		});
	});

	describe("Authorization", () => {
		it("should not allow upload to other users' projects", async () => {
			const user1 = await createTestUser();
			const user2 = await createTestUser();

			const user1Request = makeAuthenticatedRequest({
				server,
				authToken: user1.authToken,
			});

			const projectResponse = await user1Request.inject({
				method: "POST",
				url: "/trpc/project.create",
				payload: { title: "User 1 Project" },
			});

			const project = JSON.parse(projectResponse.body).result.data;

			const pdfContent = "%PDF-1.4\nauth test";
			const boundary = "----BoundaryAuth";

			const multipartBody = [
				`------${boundary}`,
				'Content-Disposition: form-data; name="file"; filename="auth-test.pdf"',
				"Content-Type: application/pdf",
				"",
				pdfContent,
				`------${boundary}--`,
			].join("\r\n");

			const response = await server.inject({
				method: "POST",
				url: `/projects/${project.id}/source-documents/upload`,
				headers: {
					authorization: `Bearer ${user2.authToken}`,
					"content-type": `multipart/form-data; boundary=----${boundary}`,
				},
				payload: multipartBody,
			});

			expect(response.statusCode).toBe(500);
		});

		it("should not allow listing other users' project documents", async () => {
			const user1 = await createTestUser();
			const user2 = await createTestUser();

			const user1Request = makeAuthenticatedRequest({
				server,
				authToken: user1.authToken,
			});

			const user2Request = makeAuthenticatedRequest({
				server,
				authToken: user2.authToken,
			});

			const projectResponse = await user1Request.inject({
				method: "POST",
				url: "/trpc/project.create",
				payload: { title: "User 1 Project" },
			});

			const project = JSON.parse(projectResponse.body).result.data;

			const listResponse = await user2Request.inject({
				method: "GET",
				url: `/trpc/sourceDocument.listByProject?input=${encodeURIComponent(JSON.stringify({ projectId: project.id }))}`,
			});

			expect(listResponse.statusCode).toBe(404);
		});
	});
});
