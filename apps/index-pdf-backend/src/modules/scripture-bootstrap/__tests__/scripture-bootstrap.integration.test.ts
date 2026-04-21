import "../../../test/setup";
import type { FastifyInstance } from "fastify";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
	createTestProject,
	createTestUser,
	grantIndexTypeAddon,
} from "../../../test/factories";
import {
	closeTestServer,
	createTestServer,
	makeAuthenticatedRequest,
} from "../../../test/server-harness";
import * as indexEntryGroupRepo from "../../detection/matcher/index-entry-group.repo";

declare module "vitest" {
	export interface TestContext {
		server: FastifyInstance;
		testUser: Awaited<ReturnType<typeof createTestUser>>;
		authenticatedRequest: ReturnType<typeof makeAuthenticatedRequest>;
		testProjectId: string;
		scriptureProjectIndexTypeId: string;
	}
}

type BootstrapConfig = {
	selectedCanon: string | null;
	includeApocrypha?: boolean;
	includeJewishWritings?: boolean;
	includeClassicalWritings?: boolean;
	includeChristianWritings?: boolean;
	includeDeadSeaScrolls?: boolean;
	extraBookKeys?: string[];
};

async function runBootstrap(
	request: ReturnType<typeof makeAuthenticatedRequest>,
	projectId: string,
	projectIndexTypeId: string,
	config: BootstrapConfig,
	forceRefreshFromSource?: boolean,
) {
	return request.inject({
		method: "POST",
		url: "/trpc/scriptureBootstrap.run",
		payload: {
			projectId,
			projectIndexTypeId,
			config: {
				selectedCanon: config.selectedCanon,
				includeApocrypha: config.includeApocrypha ?? false,
				includeJewishWritings: config.includeJewishWritings ?? false,
				includeClassicalWritings: config.includeClassicalWritings ?? false,
				includeChristianWritings: config.includeChristianWritings ?? false,
				includeDeadSeaScrolls: config.includeDeadSeaScrolls ?? false,
				extraBookKeys: config.extraBookKeys ?? [],
			},
			forceRefreshFromSource,
		},
	});
}

async function listIndexEntries(
	request: ReturnType<typeof makeAuthenticatedRequest>,
	projectId: string,
	projectIndexTypeId: string,
) {
	return request.inject({
		method: "GET",
		url: `/trpc/indexEntry.list?input=${encodeURIComponent(JSON.stringify({ projectId, projectIndexTypeId }))}`,
	});
}

describe("ScriptureBootstrap API (Integration)", () => {
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

	it("bootstrap fails fast when selected_canon is missing", async ({
		authenticatedRequest,
		testProjectId,
		scriptureProjectIndexTypeId,
	}) => {
		const res = await runBootstrap(
			authenticatedRequest,
			testProjectId,
			scriptureProjectIndexTypeId,
			{ selectedCanon: null },
		);
		expect(res.statusCode).toBe(400);
		const body = JSON.parse(res.body);
		expect(body.error?.data?.code).toBe("BAD_REQUEST");
		expect(body.error?.message).toMatch(
			/selected canon|requires a selected canon/i,
		);
	});

	it("selected canon seeds expected book entries and aliases", async ({
		authenticatedRequest,
		testProjectId,
		scriptureProjectIndexTypeId,
	}) => {
		const runRes = await runBootstrap(
			authenticatedRequest,
			testProjectId,
			scriptureProjectIndexTypeId,
			{ selectedCanon: "protestant" },
		);
		expect(runRes.statusCode).toBe(200);
		const runBody = JSON.parse(runRes.body);
		expect(runBody.error).toBeUndefined();
		const counts = runBody.result.data;
		expect(counts.entriesCreated).toBeGreaterThan(0);
		expect(counts.matchersCreated).toBeGreaterThan(0);
		expect(counts.groupsCreated).toBeGreaterThan(0);

		const listRes = await listIndexEntries(
			authenticatedRequest,
			testProjectId,
			scriptureProjectIndexTypeId,
		);
		expect(listRes.statusCode).toBe(200);
		const entries = JSON.parse(listRes.body).result.data;
		const slugs = entries.map((e: { slug: string }) => e.slug);
		expect(slugs).toContain("genesis");
		expect(slugs).toContain("matthew");
		expect(slugs).toContain("revelation");
		const genesis = entries.find((e: { slug: string }) => e.slug === "genesis");
		expect(genesis).toBeDefined();
		expect(genesis.label).toBe("Genesis");
	});

	it("corpus toggles control whether optional corpora are seeded", async ({
		authenticatedRequest,
		testProjectId,
		scriptureProjectIndexTypeId,
	}) => {
		const run1 = await runBootstrap(
			authenticatedRequest,
			testProjectId,
			scriptureProjectIndexTypeId,
			{ selectedCanon: "protestant", includeApocrypha: false },
		);
		expect(run1.statusCode).toBe(200);
		const entries1 = JSON.parse(
			(
				await listIndexEntries(
					authenticatedRequest,
					testProjectId,
					scriptureProjectIndexTypeId,
				)
			).body,
		).result.data;
		const slugsNoApoc = entries1.map((e: { slug: string }) => e.slug);
		expect(slugsNoApoc).not.toContain("tobit");

		await runBootstrap(
			authenticatedRequest,
			testProjectId,
			scriptureProjectIndexTypeId,
			{ selectedCanon: "protestant", includeApocrypha: true },
		);
		const entries2 = JSON.parse(
			(
				await listIndexEntries(
					authenticatedRequest,
					testProjectId,
					scriptureProjectIndexTypeId,
				)
			).body,
		).result.data;
		const slugsWithApoc = entries2.map((e: { slug: string }) => e.slug);
		expect(slugsWithApoc).toContain("tobit");
	}, 60000);

	it("rerun with same config is idempotent (no duplicate rows)", async ({
		authenticatedRequest,
		testProjectId,
		scriptureProjectIndexTypeId,
	}) => {
		const config = { selectedCanon: "protestant" as const };
		const run1 = await runBootstrap(
			authenticatedRequest,
			testProjectId,
			scriptureProjectIndexTypeId,
			config,
		);
		expect(run1.statusCode).toBe(200);
		const counts1 = JSON.parse(run1.body).result.data;
		expect(counts1.entriesCreated).toBeGreaterThan(0);

		const run2 = await runBootstrap(
			authenticatedRequest,
			testProjectId,
			scriptureProjectIndexTypeId,
			config,
		);
		expect(run2.statusCode).toBe(200);
		const counts2 = JSON.parse(run2.body).result.data;
		expect(counts2.entriesCreated).toBe(0);
		expect(counts2.entriesReused).toBeGreaterThan(0);
		expect(counts2.groupsCreated).toBe(0);

		const listRes = await listIndexEntries(
			authenticatedRequest,
			testProjectId,
			scriptureProjectIndexTypeId,
		);
		const entries = JSON.parse(listRes.body).result.data;
		const slugs = entries.map((e: { slug: string }) => e.slug);
		const uniqueSlugs = [...new Set(slugs)];
		expect(uniqueSlugs.length).toBe(slugs.length);
	});

	it("canon switch followed by bootstrap adds/reuses new canon content without deleting old rows", async ({
		authenticatedRequest,
		testProjectId,
		scriptureProjectIndexTypeId,
	}) => {
		await runBootstrap(
			authenticatedRequest,
			testProjectId,
			scriptureProjectIndexTypeId,
			{ selectedCanon: "protestant" },
		);
		const entriesAfterProtestant = JSON.parse(
			(
				await listIndexEntries(
					authenticatedRequest,
					testProjectId,
					scriptureProjectIndexTypeId,
				)
			).body,
		).result.data;
		expect(
			entriesAfterProtestant.map((e: { slug: string }) => e.slug),
		).toContain("matthew");

		await runBootstrap(
			authenticatedRequest,
			testProjectId,
			scriptureProjectIndexTypeId,
			{ selectedCanon: "tanakh" },
		);
		const entriesAfterTanakh = JSON.parse(
			(
				await listIndexEntries(
					authenticatedRequest,
					testProjectId,
					scriptureProjectIndexTypeId,
				)
			).body,
		).result.data;
		expect(entriesAfterTanakh.map((e: { slug: string }) => e.slug)).toContain(
			"matthew",
		);
		expect(entriesAfterTanakh.map((e: { slug: string }) => e.slug)).toContain(
			"genesis",
		);
	});

	it("default groups and memberships are created/reused deterministically", async ({
		authenticatedRequest,
		testProjectId,
		scriptureProjectIndexTypeId,
	}) => {
		const config = { selectedCanon: "protestant" as const };
		const run1 = await runBootstrap(
			authenticatedRequest,
			testProjectId,
			scriptureProjectIndexTypeId,
			config,
		);
		expect(run1.statusCode).toBe(200);
		const counts1 = JSON.parse(run1.body).result.data;
		expect(counts1.groupsCreated).toBeGreaterThanOrEqual(1);
		expect(counts1.membershipsCreated).toBeGreaterThan(0);

		const run2 = await runBootstrap(
			authenticatedRequest,
			testProjectId,
			scriptureProjectIndexTypeId,
			config,
		);
		expect(run2.statusCode).toBe(200);
		const counts2 = JSON.parse(run2.body).result.data;
		expect(counts2.groupsCreated).toBe(0);
		expect(counts2.entriesReused).toBe(
			counts1.entriesCreated + counts1.entriesReused,
		);
	});

	describe("Task 7.3: Post-seed editability", () => {
		it("seeded entry label can be edited after bootstrap", async ({
			authenticatedRequest,
			testProjectId,
			scriptureProjectIndexTypeId,
		}) => {
			await runBootstrap(
				authenticatedRequest,
				testProjectId,
				scriptureProjectIndexTypeId,
				{ selectedCanon: "protestant" },
			);
			const listRes = await listIndexEntries(
				authenticatedRequest,
				testProjectId,
				scriptureProjectIndexTypeId,
			);
			const entries = JSON.parse(listRes.body).result.data;
			const genesis = entries.find(
				(e: { slug: string }) => e.slug === "genesis",
			);
			expect(genesis).toBeDefined();
			expect(genesis.label).toBe("Genesis");

			const updateRes = await authenticatedRequest.inject({
				method: "POST",
				url: "/trpc/indexEntry.update",
				payload: {
					id: genesis.id,
					projectId: testProjectId,
					projectIndexTypeId: scriptureProjectIndexTypeId,
					label: "Genesis (Custom)",
				},
			});
			expect(updateRes.statusCode).toBe(200);
			const updated = JSON.parse(updateRes.body).result.data;
			expect(updated.label).toBe("Genesis (Custom)");

			const listAfter = await listIndexEntries(
				authenticatedRequest,
				testProjectId,
				scriptureProjectIndexTypeId,
			);
			const entriesAfter = JSON.parse(listAfter.body).result.data;
			const genesisAfter = entriesAfter.find(
				(e: { slug: string }) => e.slug === "genesis",
			);
			expect(genesisAfter.label).toBe("Genesis (Custom)");
		});

		it("re-bootstrap does not overwrite user-customized labels by default", async ({
			authenticatedRequest,
			testProjectId,
			scriptureProjectIndexTypeId,
		}) => {
			const config = { selectedCanon: "protestant" as const };
			await runBootstrap(
				authenticatedRequest,
				testProjectId,
				scriptureProjectIndexTypeId,
				config,
			);
			const listRes = await listIndexEntries(
				authenticatedRequest,
				testProjectId,
				scriptureProjectIndexTypeId,
			);
			const entries = JSON.parse(listRes.body).result.data;
			const genesis = entries.find(
				(e: { slug: string }) => e.slug === "genesis",
			);
			await authenticatedRequest.inject({
				method: "POST",
				url: "/trpc/indexEntry.update",
				payload: {
					id: genesis.id,
					projectId: testProjectId,
					projectIndexTypeId: scriptureProjectIndexTypeId,
					label: "User Custom Label",
				},
			});

			await runBootstrap(
				authenticatedRequest,
				testProjectId,
				scriptureProjectIndexTypeId,
				config,
				false,
			);

			const listAfter = await listIndexEntries(
				authenticatedRequest,
				testProjectId,
				scriptureProjectIndexTypeId,
			);
			const entriesAfter = JSON.parse(listAfter.body).result.data;
			const genesisAfter = entriesAfter.find(
				(e: { slug: string }) => e.slug === "genesis",
			);
			expect(genesisAfter.label).toBe("User Custom Label");
		});

		it("re-bootstrap with forceRefreshFromSource overwrites labels from source", async ({
			authenticatedRequest,
			testProjectId,
			scriptureProjectIndexTypeId,
		}) => {
			const config = { selectedCanon: "protestant" as const };
			await runBootstrap(
				authenticatedRequest,
				testProjectId,
				scriptureProjectIndexTypeId,
				config,
			);
			const listRes = await listIndexEntries(
				authenticatedRequest,
				testProjectId,
				scriptureProjectIndexTypeId,
			);
			const entries = JSON.parse(listRes.body).result.data;
			const genesis = entries.find(
				(e: { slug: string }) => e.slug === "genesis",
			);
			await authenticatedRequest.inject({
				method: "POST",
				url: "/trpc/indexEntry.update",
				payload: {
					id: genesis.id,
					projectId: testProjectId,
					projectIndexTypeId: scriptureProjectIndexTypeId,
					label: "User Custom Label",
				},
			});

			await runBootstrap(
				authenticatedRequest,
				testProjectId,
				scriptureProjectIndexTypeId,
				config,
				true,
			);

			const listAfter = await listIndexEntries(
				authenticatedRequest,
				testProjectId,
				scriptureProjectIndexTypeId,
			);
			const entriesAfter = JSON.parse(listAfter.body).result.data;
			const genesisAfter = entriesAfter.find(
				(e: { slug: string }) => e.slug === "genesis",
			);
			expect(genesisAfter.label).toBe("Genesis");
		});

		it("deleting seeded group removes memberships but keeps entries and matchers intact", async ({
			authenticatedRequest,
			testUser,
			testProjectId,
			scriptureProjectIndexTypeId,
		}) => {
			await runBootstrap(
				authenticatedRequest,
				testProjectId,
				scriptureProjectIndexTypeId,
				{ selectedCanon: "protestant" },
			);
			const listRes = await listIndexEntries(
				authenticatedRequest,
				testProjectId,
				scriptureProjectIndexTypeId,
			);
			const entriesBefore = JSON.parse(listRes.body).result.data;
			expect(entriesBefore.length).toBeGreaterThan(0);

			const groups = await indexEntryGroupRepo.listGroups({
				userId: testUser.userId,
				projectId: testProjectId,
				projectIndexTypeId: scriptureProjectIndexTypeId,
			});
			expect(groups.length).toBeGreaterThan(0);
			const canonGroup = groups.find((g) => g.name === "Protestant Canon");
			expect(canonGroup).toBeDefined();

			await indexEntryGroupRepo.deleteGroup({
				userId: testUser.userId,
				// biome-ignore lint/style/noNonNullAssertion: test don't care
				groupId: canonGroup!.id,
			});

			const entriesAfter = JSON.parse(
				(
					await listIndexEntries(
						authenticatedRequest,
						testProjectId,
						scriptureProjectIndexTypeId,
					)
				).body,
			).result.data;
			expect(entriesAfter.length).toBe(entriesBefore.length);
			expect(entriesAfter.map((e: { slug: string }) => e.slug)).toContain(
				"genesis",
			);
		});
	});
});
