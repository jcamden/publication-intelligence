import "../../test/setup";
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { getTestDb } from "../../db/client";
import { indexMatchers } from "../../db/schema";
import {
	createTestIndexEntry,
	createTestProject,
	createTestProjectIndexType,
	createTestUser,
} from "../../test/factories";
import * as detectionRepo from "./detection.repo";
import { RUN_ALL_MATCHERS_GROUP_ID } from "./detection.repo";
import * as indexEntryGroupRepo from "./index-entry-group.repo";

describe("index-entry-group.repo (Task 6.1)", () => {
	describe("listGroups", () => {
		it("returns empty when no groups exist", async () => {
			const user = await createTestUser();
			const project = await createTestProject({ userId: user.userId });
			const pit = await createTestProjectIndexType({
				projectId: project.id,
				indexType: "scripture",
				userId: user.userId,
			});

			const groups = await indexEntryGroupRepo.listGroups({
				userId: user.userId,
				projectId: project.id,
				projectIndexTypeId: pit.id,
			});
			expect(groups).toEqual([]);
		});

		it("returns created group and excludes soft-deleted by default", async () => {
			const user = await createTestUser();
			const project = await createTestProject({ userId: user.userId });
			const pit = await createTestProjectIndexType({
				projectId: project.id,
				indexType: "scripture",
				userId: user.userId,
			});

			const created = await indexEntryGroupRepo.createGroup({
				userId: user.userId,
				input: {
					projectId: project.id,
					projectIndexTypeId: pit.id,
					name: "Biblical",
					slug: "biblical",
					parserProfileId: "scripture-biblical",
					sortMode: "a_z",
				},
			});

			const groups = await indexEntryGroupRepo.listGroups({
				userId: user.userId,
				projectId: project.id,
				projectIndexTypeId: pit.id,
			});
			expect(groups).toHaveLength(1);
			expect(groups[0].id).toBe(created.id);
			expect(groups[0].name).toBe("Biblical");
			expect(groups[0].parserProfileId).toBe("scripture-biblical");
			expect(groups[0].sortMode).toBe("a_z");

			await indexEntryGroupRepo.deleteGroup({
				userId: user.userId,
				groupId: created.id,
			});

			const afterDelete = await indexEntryGroupRepo.listGroups({
				userId: user.userId,
				projectId: project.id,
				projectIndexTypeId: pit.id,
			});
			expect(afterDelete).toHaveLength(0);
		});
	});

	describe("resolveRunGroupIds", () => {
		it("returns empty when runAllGroups and no groups exist", async () => {
			const user = await createTestUser();
			const project = await createTestProject({ userId: user.userId });
			const pit = await createTestProjectIndexType({
				projectId: project.id,
				indexType: "scripture",
				userId: user.userId,
			});

			const ids = await indexEntryGroupRepo.resolveRunGroupIds({
				userId: user.userId,
				projectId: project.id,
				projectIndexTypeId: pit.id,
				indexEntryGroupIds: null,
				runAllGroups: true,
			});
			expect(ids).toEqual([]);
		});

		it("returns all active group ids when runAllGroups", async () => {
			const user = await createTestUser();
			const project = await createTestProject({ userId: user.userId });
			const pit = await createTestProjectIndexType({
				projectId: project.id,
				indexType: "scripture",
				userId: user.userId,
			});
			const g1 = await indexEntryGroupRepo.createGroup({
				userId: user.userId,
				input: {
					projectId: project.id,
					projectIndexTypeId: pit.id,
					name: "Group A",
					slug: "group-a",
				},
			});
			const g2 = await indexEntryGroupRepo.createGroup({
				userId: user.userId,
				input: {
					projectId: project.id,
					projectIndexTypeId: pit.id,
					name: "Group B",
					slug: "group-b",
				},
			});

			const ids = await indexEntryGroupRepo.resolveRunGroupIds({
				userId: user.userId,
				projectId: project.id,
				projectIndexTypeId: pit.id,
				indexEntryGroupIds: null,
				runAllGroups: true,
			});
			expect(ids).toHaveLength(2);
			expect(ids).toContain(g1.id);
			expect(ids).toContain(g2.id);
			// Order by name: Group A, Group B
			expect(ids[0]).toBe(g1.id);
			expect(ids[1]).toBe(g2.id);
		});

		it("excludes soft-deleted groups from run targeting", async () => {
			const user = await createTestUser();
			const project = await createTestProject({ userId: user.userId });
			const pit = await createTestProjectIndexType({
				projectId: project.id,
				indexType: "scripture",
				userId: user.userId,
			});
			const g = await indexEntryGroupRepo.createGroup({
				userId: user.userId,
				input: {
					projectId: project.id,
					projectIndexTypeId: pit.id,
					name: "To Delete",
					slug: "to-delete",
				},
			});

			await indexEntryGroupRepo.deleteGroup({
				userId: user.userId,
				groupId: g.id,
			});

			const ids = await indexEntryGroupRepo.resolveRunGroupIds({
				userId: user.userId,
				projectId: project.id,
				projectIndexTypeId: pit.id,
				indexEntryGroupIds: null,
				runAllGroups: true,
			});
			expect(ids).toEqual([]);
		});

		it("returns only valid group ids when indexEntryGroupIds provided", async () => {
			const user = await createTestUser();
			const project = await createTestProject({ userId: user.userId });
			const pit = await createTestProjectIndexType({
				projectId: project.id,
				indexType: "scripture",
				userId: user.userId,
			});
			const g = await indexEntryGroupRepo.createGroup({
				userId: user.userId,
				input: {
					projectId: project.id,
					projectIndexTypeId: pit.id,
					name: "Only",
					slug: "only",
				},
			});

			const ids = await indexEntryGroupRepo.resolveRunGroupIds({
				userId: user.userId,
				projectId: project.id,
				projectIndexTypeId: pit.id,
				indexEntryGroupIds: [g.id],
				runAllGroups: null,
			});
			expect(ids).toEqual([g.id]);
		});
	});

	describe("group membership and listMatcherAliasesByGroupIds", () => {
		it("returns deterministic matcher set for group with matchers", async () => {
			const user = await createTestUser();
			const project = await createTestProject({ userId: user.userId });
			const pit = await createTestProjectIndexType({
				projectId: project.id,
				indexType: "scripture",
				userId: user.userId,
			});
			const entry = await createTestIndexEntry({
				projectId: project.id,
				projectIndexTypeId: pit.id,
				label: "Genesis",
				slug: "genesis",
				userId: user.userId,
				matchers: ["genesis", "gen"],
			});

			const db = getTestDb();
			if (!db) throw new Error("No test db");
			const matcherRows = await db
				.select({ id: indexMatchers.id })
				.from(indexMatchers)
				.where(eq(indexMatchers.entryId, entry.id));
			expect(matcherRows.length).toBeGreaterThanOrEqual(1);

			const g = await indexEntryGroupRepo.createGroup({
				userId: user.userId,
				input: {
					projectId: project.id,
					projectIndexTypeId: pit.id,
					name: "Biblical",
					slug: "biblical",
				},
			});
			await indexEntryGroupRepo.addMatcherToGroup({
				userId: user.userId,
				groupId: g.id,
				matcherId: matcherRows[0].id,
			});

			const aliases = await indexEntryGroupRepo.listMatcherAliasesByGroupIds({
				userId: user.userId,
				projectId: project.id,
				projectIndexTypeId: pit.id,
				indexType: "scripture",
				groupIds: [g.id],
			});
			expect(aliases).toHaveLength(1);
			expect(aliases[0].groupId).toBe(g.id);
			expect(aliases[0].matcherId).toBe(matcherRows[0].id);
			expect(aliases[0].entryId).toBe(entry.id);
			expect(["genesis", "gen"]).toContain(aliases[0].alias);
		});

		it("returns matchers from entry-based group (index_entry_group_entries + descendants)", async () => {
			const user = await createTestUser();
			const project = await createTestProject({ userId: user.userId });
			const pit = await createTestProjectIndexType({
				projectId: project.id,
				indexType: "scripture",
				userId: user.userId,
			});
			const parent = await createTestIndexEntry({
				projectId: project.id,
				projectIndexTypeId: pit.id,
				label: "Genesis",
				slug: "genesis",
				userId: user.userId,
				matchers: ["genesis", "gen"],
			});
			const child = await createTestIndexEntry({
				projectId: project.id,
				projectIndexTypeId: pit.id,
				label: "Genesis 1",
				slug: "genesis-1",
				userId: user.userId,
				parentId: parent.id,
				matchers: ["genesis 1", "gen 1"],
			});

			const g = await indexEntryGroupRepo.createGroup({
				userId: user.userId,
				input: {
					projectId: project.id,
					projectIndexTypeId: pit.id,
					name: "Biblical",
					slug: "biblical",
				},
			});
			// Add parent entry to group (no direct matchers on group)
			await indexEntryGroupRepo.addEntryToGroup({
				userId: user.userId,
				groupId: g.id,
				entryId: parent.id,
			});

			const aliases = await indexEntryGroupRepo.listMatcherAliasesByGroupIds({
				userId: user.userId,
				projectId: project.id,
				projectIndexTypeId: pit.id,
				indexType: "scripture",
				groupIds: [g.id],
			});
			// Should include matchers from parent and child (descendants)
			expect(aliases.length).toBeGreaterThanOrEqual(2);
			const aliasTexts = aliases.map((a) => a.alias);
			expect(aliasTexts).toContain("genesis");
			expect(aliasTexts).toContain("genesis 1");
			for (const a of aliases) {
				expect(a.groupId).toBe(g.id);
				expect([parent.id, child.id]).toContain(a.entryId);
			}
		});
	});

	describe("listMatcherAliasesByProjectIndexType (detection.repo, Task 8.1.1)", () => {
		it("returns all matchers for project index type with sentinel groupId", async () => {
			const user = await createTestUser();
			const project = await createTestProject({ userId: user.userId });
			const pit = await createTestProjectIndexType({
				projectId: project.id,
				indexType: "subject",
				userId: user.userId,
			});
			const entry = await createTestIndexEntry({
				projectId: project.id,
				projectIndexTypeId: pit.id,
				label: "Foo",
				slug: "foo",
				userId: user.userId,
				matchers: ["foo", "bar"],
			});
			const aliases = await detectionRepo.listMatcherAliasesByProjectIndexType({
				userId: user.userId,
				projectId: project.id,
				projectIndexTypeId: pit.id,
				indexType: "subject",
			});
			expect(aliases).toHaveLength(2);
			for (const a of aliases) {
				expect(a.groupId).toBe(RUN_ALL_MATCHERS_GROUP_ID);
				expect(a.entryId).toBe(entry.id);
				expect(a.indexType).toBe("subject");
			}
			expect(aliases.map((a) => a.alias).sort()).toEqual(["bar", "foo"]);
		});
	});

	describe("listMatcherAliasesForRun (detection.repo)", () => {
		it("returns empty when no groups and no matchers exist (runAllGroups)", async () => {
			const user = await createTestUser();
			const project = await createTestProject({ userId: user.userId });
			const pit = await createTestProjectIndexType({
				projectId: project.id,
				indexType: "scripture",
				userId: user.userId,
			});
			const aliases = await detectionRepo.listMatcherAliasesForRun({
				userId: user.userId,
				projectId: project.id,
				projectIndexTypeId: pit.id,
				indexType: "scripture",
				indexEntryGroupIds: null,
				runAllGroups: true,
			});
			expect(aliases).toEqual([]);
		});

		it("returns all matchers with sentinel groupId when runAllGroups and no groups but matchers exist (Task 8.1.1)", async () => {
			const user = await createTestUser();
			const project = await createTestProject({ userId: user.userId });
			const pit = await createTestProjectIndexType({
				projectId: project.id,
				indexType: "scripture",
				userId: user.userId,
			});
			const entry = await createTestIndexEntry({
				projectId: project.id,
				projectIndexTypeId: pit.id,
				label: "Genesis",
				slug: "genesis",
				userId: user.userId,
				matchers: ["genesis", "gen"],
			});
			// No groups created
			const aliases = await detectionRepo.listMatcherAliasesForRun({
				userId: user.userId,
				projectId: project.id,
				projectIndexTypeId: pit.id,
				indexType: "scripture",
				indexEntryGroupIds: null,
				runAllGroups: true,
			});
			expect(aliases.length).toBeGreaterThanOrEqual(1);
			for (const a of aliases) {
				expect(a.groupId).toBe(RUN_ALL_MATCHERS_GROUP_ID);
				expect(a.entryId).toBe(entry.id);
				expect(a.indexType).toBe("scripture");
			}
			expect(aliases.map((a) => a.alias).sort()).toEqual(["gen", "genesis"]);
		});
	});

	describe("listGroupsByIds (Task 6.2)", () => {
		it("returns empty when groupIds is empty", async () => {
			const user = await createTestUser();
			const project = await createTestProject({ userId: user.userId });
			const pit = await createTestProjectIndexType({
				projectId: project.id,
				indexType: "scripture",
				userId: user.userId,
			});
			const metas = await indexEntryGroupRepo.listGroupsByIds({
				userId: user.userId,
				projectId: project.id,
				projectIndexTypeId: pit.id,
				groupIds: [],
			});
			expect(metas).toEqual([]);
		});

		it("returns group metadata in deterministic order by name", async () => {
			const user = await createTestUser();
			const project = await createTestProject({ userId: user.userId });
			const pit = await createTestProjectIndexType({
				projectId: project.id,
				indexType: "scripture",
				userId: user.userId,
			});
			const gZ = await indexEntryGroupRepo.createGroup({
				userId: user.userId,
				input: {
					projectId: project.id,
					projectIndexTypeId: pit.id,
					name: "Zebra",
					slug: "zebra",
					parserProfileId: "scripture-biblical",
					sortMode: "canon_book_order",
				},
			});
			const gA = await indexEntryGroupRepo.createGroup({
				userId: user.userId,
				input: {
					projectId: project.id,
					projectIndexTypeId: pit.id,
					name: "Alpha",
					slug: "alpha",
					parserProfileId: null,
					sortMode: "a_z",
				},
			});
			const metas = await indexEntryGroupRepo.listGroupsByIds({
				userId: user.userId,
				projectId: project.id,
				projectIndexTypeId: pit.id,
				groupIds: [gZ.id, gA.id],
			});
			expect(metas).toHaveLength(2);
			// Order by name: Alpha before Zebra
			expect(metas[0].id).toBe(gA.id);
			expect(metas[0].parserProfileId).toBeNull();
			expect(metas[0].sortMode).toBe("a_z");
			expect(metas[1].id).toBe(gZ.id);
			expect(metas[1].parserProfileId).toBe("scripture-biblical");
			expect(metas[1].sortMode).toBe("canon_book_order");
		});

		it("returns only groups that exist and match project+type", async () => {
			const user = await createTestUser();
			const project = await createTestProject({ userId: user.userId });
			const pit = await createTestProjectIndexType({
				projectId: project.id,
				indexType: "scripture",
				userId: user.userId,
			});
			const g = await indexEntryGroupRepo.createGroup({
				userId: user.userId,
				input: {
					projectId: project.id,
					projectIndexTypeId: pit.id,
					name: "Only",
					slug: "only",
					parserProfileId: null,
					sortMode: "a_z",
				},
			});
			const metas = await indexEntryGroupRepo.listGroupsByIds({
				userId: user.userId,
				projectId: project.id,
				projectIndexTypeId: pit.id,
				groupIds: [g.id, "00000000-0000-0000-0000-000000000000"],
			});
			expect(metas).toHaveLength(1);
			expect(metas[0].id).toBe(g.id);
		});
	});

	describe("addEntryToGroup and transfer", () => {
		it("adds entry to group and returns transferredFrom null when entry not in another group", async () => {
			const user = await createTestUser();
			const project = await createTestProject({ userId: user.userId });
			const pit = await createTestProjectIndexType({
				projectId: project.id,
				indexType: "subject",
				userId: user.userId,
			});
			const entry = await createTestIndexEntry({
				projectId: project.id,
				projectIndexTypeId: pit.id,
				label: "Foo",
				slug: "foo",
				userId: user.userId,
			});
			const g = await indexEntryGroupRepo.createGroup({
				userId: user.userId,
				input: {
					projectId: project.id,
					projectIndexTypeId: pit.id,
					name: "Group A",
					slug: "group-a",
				},
			});

			const result = await indexEntryGroupRepo.addEntryToGroup({
				userId: user.userId,
				groupId: g.id,
				entryId: entry.id,
			});
			expect(result.transferredFrom).toBeNull();
		});

		it("transfers entry from old group to new and returns transferredFrom", async () => {
			const user = await createTestUser();
			const project = await createTestProject({ userId: user.userId });
			const pit = await createTestProjectIndexType({
				projectId: project.id,
				indexType: "subject",
				userId: user.userId,
			});
			const entry = await createTestIndexEntry({
				projectId: project.id,
				projectIndexTypeId: pit.id,
				label: "Foo",
				slug: "foo",
				userId: user.userId,
			});
			const g1 = await indexEntryGroupRepo.createGroup({
				userId: user.userId,
				input: {
					projectId: project.id,
					projectIndexTypeId: pit.id,
					name: "Group A",
					slug: "group-a",
				},
			});
			const g2 = await indexEntryGroupRepo.createGroup({
				userId: user.userId,
				input: {
					projectId: project.id,
					projectIndexTypeId: pit.id,
					name: "Group B",
					slug: "group-b",
				},
			});

			await indexEntryGroupRepo.addEntryToGroup({
				userId: user.userId,
				groupId: g1.id,
				entryId: entry.id,
			});

			const result = await indexEntryGroupRepo.addEntryToGroup({
				userId: user.userId,
				groupId: g2.id,
				entryId: entry.id,
			});
			expect(result.transferredFrom).toBe(g1.id);

			const groupWithEntries = await indexEntryGroupRepo.getGroupWithEntries({
				userId: user.userId,
				groupId: g2.id,
			});
			expect(
				groupWithEntries?.entries.some((e) => e.entryId === entry.id),
			).toBe(true);
		});
	});

	describe("removeEntryFromGroup", () => {
		it("removes entry from group", async () => {
			const user = await createTestUser();
			const project = await createTestProject({ userId: user.userId });
			const pit = await createTestProjectIndexType({
				projectId: project.id,
				indexType: "subject",
				userId: user.userId,
			});
			const entry = await createTestIndexEntry({
				projectId: project.id,
				projectIndexTypeId: pit.id,
				label: "Foo",
				slug: "foo",
				userId: user.userId,
			});
			const g = await indexEntryGroupRepo.createGroup({
				userId: user.userId,
				input: {
					projectId: project.id,
					projectIndexTypeId: pit.id,
					name: "Group A",
					slug: "group-a",
				},
			});
			await indexEntryGroupRepo.addEntryToGroup({
				userId: user.userId,
				groupId: g.id,
				entryId: entry.id,
			});

			await indexEntryGroupRepo.removeEntryFromGroup({
				userId: user.userId,
				groupId: g.id,
				entryId: entry.id,
			});

			const groupWithEntries = await indexEntryGroupRepo.getGroupWithEntries({
				userId: user.userId,
				groupId: g.id,
			});
			expect(
				groupWithEntries?.entries.some((e) => e.entryId === entry.id),
			).toBe(false);
		});
	});

	describe("reorderGroupEntries", () => {
		it("updates position for entries in group", async () => {
			const user = await createTestUser();
			const project = await createTestProject({ userId: user.userId });
			const pit = await createTestProjectIndexType({
				projectId: project.id,
				indexType: "subject",
				userId: user.userId,
			});
			const e1 = await createTestIndexEntry({
				projectId: project.id,
				projectIndexTypeId: pit.id,
				label: "Alpha",
				slug: "alpha",
				userId: user.userId,
			});
			const e2 = await createTestIndexEntry({
				projectId: project.id,
				projectIndexTypeId: pit.id,
				label: "Beta",
				slug: "beta",
				userId: user.userId,
			});
			const g = await indexEntryGroupRepo.createGroup({
				userId: user.userId,
				input: {
					projectId: project.id,
					projectIndexTypeId: pit.id,
					name: "Group",
					slug: "group",
					sortMode: "custom",
				},
			});
			await indexEntryGroupRepo.addEntryToGroup({
				userId: user.userId,
				groupId: g.id,
				entryId: e1.id,
				position: 0,
			});
			await indexEntryGroupRepo.addEntryToGroup({
				userId: user.userId,
				groupId: g.id,
				entryId: e2.id,
				position: 1,
			});

			await indexEntryGroupRepo.reorderGroupEntries({
				userId: user.userId,
				groupId: g.id,
				entryIds: [e2.id, e1.id],
			});

			const groupWithEntries = await indexEntryGroupRepo.getGroupWithEntries({
				userId: user.userId,
				groupId: g.id,
			});
			const entries = groupWithEntries?.entries ?? [];
			expect(entries[0].entryId).toBe(e2.id);
			expect(entries[1].entryId).toBe(e1.id);
		});
	});

	describe("reorderGroups", () => {
		it("updates position for groups", async () => {
			const user = await createTestUser();
			const project = await createTestProject({ userId: user.userId });
			const pit = await createTestProjectIndexType({
				projectId: project.id,
				indexType: "subject",
				userId: user.userId,
			});
			const g1 = await indexEntryGroupRepo.createGroup({
				userId: user.userId,
				input: {
					projectId: project.id,
					projectIndexTypeId: pit.id,
					name: "First",
					slug: "first",
				},
			});
			const g2 = await indexEntryGroupRepo.createGroup({
				userId: user.userId,
				input: {
					projectId: project.id,
					projectIndexTypeId: pit.id,
					name: "Second",
					slug: "second",
				},
			});

			await indexEntryGroupRepo.reorderGroups({
				userId: user.userId,
				projectId: project.id,
				projectIndexTypeId: pit.id,
				groupIds: [g2.id, g1.id],
			});

			const groups = await indexEntryGroupRepo.listGroupsWithMeta({
				userId: user.userId,
				projectId: project.id,
				projectIndexTypeId: pit.id,
			});
			expect(groups[0].id).toBe(g2.id);
			expect(groups[1].id).toBe(g1.id);
		});
	});

	describe("mergeGroups", () => {
		it("moves entries and matchers to target, soft-deletes source", async () => {
			const user = await createTestUser();
			const project = await createTestProject({ userId: user.userId });
			const pit = await createTestProjectIndexType({
				projectId: project.id,
				indexType: "scripture",
				userId: user.userId,
			});
			const entry = await createTestIndexEntry({
				projectId: project.id,
				projectIndexTypeId: pit.id,
				label: "Genesis",
				slug: "genesis",
				userId: user.userId,
				matchers: ["genesis"],
			});
			const db = getTestDb();
			if (!db) throw new Error("No test db");
			const matcherRows = await db
				.select({ id: indexMatchers.id })
				.from(indexMatchers)
				.where(eq(indexMatchers.entryId, entry.id));
			const matcherId = matcherRows[0].id;

			const gSource = await indexEntryGroupRepo.createGroup({
				userId: user.userId,
				input: {
					projectId: project.id,
					projectIndexTypeId: pit.id,
					name: "Source",
					slug: "source",
				},
			});
			const gTarget = await indexEntryGroupRepo.createGroup({
				userId: user.userId,
				input: {
					projectId: project.id,
					projectIndexTypeId: pit.id,
					name: "Target",
					slug: "target",
				},
			});
			await indexEntryGroupRepo.addEntryToGroup({
				userId: user.userId,
				groupId: gSource.id,
				entryId: entry.id,
			});
			await indexEntryGroupRepo.addMatcherToGroup({
				userId: user.userId,
				groupId: gSource.id,
				matcherId,
			});

			await indexEntryGroupRepo.mergeGroups({
				userId: user.userId,
				sourceGroupId: gSource.id,
				targetGroupId: gTarget.id,
			});

			const targetWithEntries = await indexEntryGroupRepo.getGroupWithEntries({
				userId: user.userId,
				groupId: gTarget.id,
			});
			expect(
				targetWithEntries?.entries.some((e) => e.entryId === entry.id),
			).toBe(true);

			const groups = await indexEntryGroupRepo.listGroups({
				userId: user.userId,
				projectId: project.id,
				projectIndexTypeId: pit.id,
			});
			expect(groups.some((g) => g.id === gSource.id)).toBe(false);
		});

		it("throws when source and target are the same", async () => {
			const user = await createTestUser();
			const project = await createTestProject({ userId: user.userId });
			const pit = await createTestProjectIndexType({
				projectId: project.id,
				indexType: "subject",
				userId: user.userId,
			});
			const g = await indexEntryGroupRepo.createGroup({
				userId: user.userId,
				input: {
					projectId: project.id,
					projectIndexTypeId: pit.id,
					name: "Only",
					slug: "only",
				},
			});

			await expect(
				indexEntryGroupRepo.mergeGroups({
					userId: user.userId,
					sourceGroupId: g.id,
					targetGroupId: g.id,
				}),
			).rejects.toThrow("Source and target group must be different");
		});
	});
});
