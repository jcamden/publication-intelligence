import "../../test/setup";
import type { FastifyInstance } from "fastify";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
	createTestProject,
	createTestUser,
	grantIndexTypeAddon,
} from "../../test/factories";
import {
	closeTestServer,
	createTestServer,
	makeAuthenticatedRequest,
} from "../../test/server-harness";

declare module "vitest" {
	export interface TestContext {
		server: FastifyInstance;
		testUser: Awaited<ReturnType<typeof createTestUser>>;
		authenticatedRequest: ReturnType<typeof makeAuthenticatedRequest>;
		testProjectId: string;
		scriptureProjectIndexTypeId: string;
	}
}

describe("ScriptureIndexConfig API (Integration)", () => {
	beforeEach(async (context) => {
		context.server = await createTestServer();
		context.testUser = await createTestUser();
		context.authenticatedRequest = makeAuthenticatedRequest({
			server: context.server,
			authToken: context.testUser.authToken,
		});

		const project = await createTestProject({
			userId: context.testUser.userId,
		});
		context.testProjectId = project.id;

		await grantIndexTypeAddon({
			userId: context.testUser.userId,
			indexType: "scripture",
		});

		// Enable scripture index type and capture project index type id
		const enableRes = await context.authenticatedRequest.inject({
			method: "POST",
			url: "/trpc/projectHighlightConfig.enable",
			payload: {
				projectId: context.testProjectId,
				highlightType: "scripture",
				colorHue: 160,
			},
		});
		expect(enableRes.statusCode).toBe(200);
		const enableBody = JSON.parse(enableRes.body);
		context.scriptureProjectIndexTypeId = enableBody.result.data.id;
	});

	afterEach(async (context) => {
		await closeTestServer(context.server);
	});

	describe("scriptureIndexConfig.get", () => {
		it("returns null when no config exists", async ({
			authenticatedRequest,
			testProjectId,
			scriptureProjectIndexTypeId,
		}) => {
			const response = await authenticatedRequest.inject({
				method: "GET",
				url: `/trpc/scriptureIndexConfig.get?input=${encodeURIComponent(JSON.stringify({ projectId: testProjectId, projectIndexTypeId: scriptureProjectIndexTypeId }))}`,
			});

			expect(response.statusCode).toBe(200);
			const body = JSON.parse(response.body);
			expect(body.result.data).toBeNull();
		});

		it("returns config after upsert", async ({
			authenticatedRequest,
			testProjectId,
			scriptureProjectIndexTypeId,
		}) => {
			await authenticatedRequest.inject({
				method: "POST",
				url: "/trpc/scriptureIndexConfig.upsert",
				payload: {
					projectId: testProjectId,
					projectIndexTypeId: scriptureProjectIndexTypeId,
					selectedCanon: "protestant",
					includeApocrypha: false,
					includeJewishWritings: false,
					includeClassicalWritings: false,
					includeChristianWritings: false,
					includeDeadSeaScrolls: false,
					extraBookKeys: [],
				},
			});

			const response = await authenticatedRequest.inject({
				method: "GET",
				url: `/trpc/scriptureIndexConfig.get?input=${encodeURIComponent(JSON.stringify({ projectId: testProjectId, projectIndexTypeId: scriptureProjectIndexTypeId }))}`,
			});

			expect(response.statusCode).toBe(200);
			const body = JSON.parse(response.body);
			expect(body.result.data).not.toBeNull();
			expect(body.result.data.selectedCanon).toBe("protestant");
			expect(body.result.data.includeApocrypha).toBe(false);
			expect(body.result.data.extraBookKeys).toEqual([]);
		});
	});

	describe("scriptureIndexConfig.upsert", () => {
		it("creates then updates single config row per project/index type", async ({
			authenticatedRequest,
			testProjectId,
			scriptureProjectIndexTypeId,
		}) => {
			const payload = {
				projectId: testProjectId,
				projectIndexTypeId: scriptureProjectIndexTypeId,
				selectedCanon: "protestant" as const,
				includeApocrypha: false,
				includeJewishWritings: false,
				includeClassicalWritings: false,
				includeChristianWritings: false,
				includeDeadSeaScrolls: false,
				extraBookKeys: [] as string[],
			};

			const createRes = await authenticatedRequest.inject({
				method: "POST",
				url: "/trpc/scriptureIndexConfig.upsert",
				payload,
			});
			expect(createRes.statusCode).toBe(200);
			const createBody = JSON.parse(createRes.body);
			expect(createBody.result.data.selectedCanon).toBe("protestant");
			const configId = createBody.result.data.id;

			// Update: canon switch replaces previous (no multi-canon)
			const updateRes = await authenticatedRequest.inject({
				method: "POST",
				url: "/trpc/scriptureIndexConfig.upsert",
				payload: {
					...payload,
					selectedCanon: "tanakh",
					includeApocrypha: true,
				},
			});
			expect(updateRes.statusCode).toBe(200);
			const updateBody = JSON.parse(updateRes.body);
			expect(updateBody.result.data.id).toBe(configId);
			expect(updateBody.result.data.selectedCanon).toBe("tanakh");
			expect(updateBody.result.data.includeApocrypha).toBe(true);
		});

		it("rejects invalid canon id", async ({
			authenticatedRequest,
			testProjectId,
			scriptureProjectIndexTypeId,
		}) => {
			const response = await authenticatedRequest.inject({
				method: "POST",
				url: "/trpc/scriptureIndexConfig.upsert",
				payload: {
					projectId: testProjectId,
					projectIndexTypeId: scriptureProjectIndexTypeId,
					selectedCanon: "invalid_canon",
					includeApocrypha: false,
					includeJewishWritings: false,
					includeClassicalWritings: false,
					includeChristianWritings: false,
					includeDeadSeaScrolls: false,
					extraBookKeys: [],
				},
			});

			expect(response.statusCode).toBe(400);
			const body = JSON.parse(response.body);
			// Invalid canon is rejected at input validation (Zod) boundary
			expect(body.error).toBeDefined();
			const errMessage = String(body.error?.message ?? "");
			expect(
				errMessage.includes("selectedCanon") ||
					errMessage.includes("Invalid option") ||
					body.error?.data?.code === "BAD_REQUEST",
			).toBe(true);
		});

		it("corpus flags and extra_book_keys persist and reload correctly", async ({
			authenticatedRequest,
			testProjectId,
			scriptureProjectIndexTypeId,
		}) => {
			const payload = {
				projectId: testProjectId,
				projectIndexTypeId: scriptureProjectIndexTypeId,
				selectedCanon: "eastern_orthodox" as const,
				includeApocrypha: true,
				includeJewishWritings: true,
				includeClassicalWritings: false,
				includeChristianWritings: true,
				includeDeadSeaScrolls: false,
				extraBookKeys: ["psalm151", "prayerofmanasseh"],
			};

			const upsertRes = await authenticatedRequest.inject({
				method: "POST",
				url: "/trpc/scriptureIndexConfig.upsert",
				payload,
			});
			expect(upsertRes.statusCode).toBe(200);

			const getRes = await authenticatedRequest.inject({
				method: "GET",
				url: `/trpc/scriptureIndexConfig.get?input=${encodeURIComponent(JSON.stringify({ projectId: testProjectId, projectIndexTypeId: scriptureProjectIndexTypeId }))}`,
			});
			expect(getRes.statusCode).toBe(200);
			const getBody = JSON.parse(getRes.body);
			expect(getBody.result.data.selectedCanon).toBe("eastern_orthodox");
			expect(getBody.result.data.includeApocrypha).toBe(true);
			expect(getBody.result.data.includeJewishWritings).toBe(true);
			expect(getBody.result.data.includeChristianWritings).toBe(true);
			expect(getBody.result.data.includeDeadSeaScrolls).toBe(false);
			expect(getBody.result.data.extraBookKeys).toEqual([
				"psalm151",
				"prayerofmanasseh",
			]);
		});

		it("rejects non-scripture index type", async ({
			authenticatedRequest,
			testProjectId,
		}) => {
			// Test user already has subject from createTestUser; enable subject index type
			const enableRes = await authenticatedRequest.inject({
				method: "POST",
				url: "/trpc/projectHighlightConfig.enable",
				payload: {
					projectId: testProjectId,
					highlightType: "subject",
					colorHue: 85,
				},
			});
			expect(enableRes.statusCode).toBe(200);
			const listRes = await authenticatedRequest.inject({
				method: "GET",
				url: `/trpc/projectHighlightConfig.list?input=${encodeURIComponent(JSON.stringify({ projectId: testProjectId }))}`,
			});
			const list = JSON.parse(listRes.body).result.data;
			const subjectPitId = list.find(
				(p: { highlightType: string }) => p.highlightType === "subject",
			)?.id;
			expect(subjectPitId).toBeDefined();

			const response = await authenticatedRequest.inject({
				method: "POST",
				url: "/trpc/scriptureIndexConfig.upsert",
				payload: {
					projectId: testProjectId,
					projectIndexTypeId: subjectPitId,
					selectedCanon: "protestant",
					includeApocrypha: false,
					includeJewishWritings: false,
					includeClassicalWritings: false,
					includeChristianWritings: false,
					includeDeadSeaScrolls: false,
					extraBookKeys: [],
				},
			});

			expect(response.statusCode).toBe(400);
			const body = JSON.parse(response.body);
			expect(body.error?.data?.code).toBe("BAD_REQUEST");
			expect(body.error?.message).toMatch(/scripture-type index/);
		});
	});
});
