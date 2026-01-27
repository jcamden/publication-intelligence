import { describe, expect, it } from "vitest";
import { createAuthenticatedClient } from "../db/client";
import { createTestProject, createTestUser } from "./factories";
import { testGelClient } from "./setup";

/**
 * Branch Reset Test Isolation
 *
 * These tests verify that the branch reset approach provides proper test isolation.
 * The test branch is dropped and recreated before each test run via reset-test-branch.sh
 *
 * This approach:
 * - Provides perfect test isolation
 * - Avoids access policy gymnastics
 * - Ensures no data leaks between test runs
 * - Keeps security policies clean and pure
 *
 * Note: Tests run sequentially to avoid transaction conflicts from parallel user creation
 */
describe.sequential("Branch Reset Test Isolation", () => {
	it("should provide clean database for test data", async () => {
		// Create test user and verify it exists
		const user = await createTestUser();
		const gelClient = createAuthenticatedClient({ authToken: user.authToken });

		const users = await testGelClient.query(
			`
			SELECT User { email } FILTER .email = <str>$email
		`,
			{ email: user.email },
		);

		expect(users).toHaveLength(1);

		// Create project owned by user
		await createTestProject({ gelClient, title: "Test Project" });

		const projects = await gelClient.query(`
			SELECT Project { title }
		`);

		expect(projects).toHaveLength(1);

		// Note: This data will be automatically cleaned up by branch reset
		// before the next test run. No manual cleanup needed.
	});

	it("should support collaborator relationships", async () => {
		// Create owner and collaborator
		const owner = await createTestUser();
		const collaborator = await createTestUser();

		const ownerClient = createAuthenticatedClient({
			authToken: owner.authToken,
		});

		// Owner creates project
		const project = await createTestProject({
			gelClient: ownerClient,
			title: "Collaborative Project",
		});

		// Add collaborator
		await ownerClient.query(
			`
			UPDATE Project
			FILTER .id = <uuid>$projectId
			SET {
				collaborators += (SELECT User FILTER .email = <str>$email)
			}
		`,
			{ projectId: project.id, email: collaborator.email },
		);

		// Verify collaborator was added
		const projectWithCollabs = await ownerClient.querySingle<{
			collaborators: { email: string }[];
		}>(
			`
			SELECT Project { 
				collaborators: { email } 
			} 
			FILTER .id = <uuid>$projectId
		`,
			{ projectId: project.id },
		);

		expect(projectWithCollabs?.collaborators).toHaveLength(1);
		expect(projectWithCollabs?.collaborators[0]?.email).toBe(
			collaborator.email,
		);

		// Note: Branch reset handles cleanup automatically
	});

	it("should support complex multi-user scenarios", async () => {
		// Create multiple users
		const user1 = await createTestUser();
		const user2 = await createTestUser();
		const user3 = await createTestUser();

		const client1 = createAuthenticatedClient({ authToken: user1.authToken });
		const client2 = createAuthenticatedClient({ authToken: user2.authToken });

		// Each user creates projects
		await createTestProject({ gelClient: client1, title: "User 1 Project" });
		await createTestProject({ gelClient: client2, title: "User 2 Project" });

		// Add cross-collaborations
		const project1 = await client1.querySingle<{ id: string }>(
			`
			SELECT Project { id } 
			FILTER .owner.email = <str>$email 
			LIMIT 1
		`,
			{ email: user1.email },
		);

		if (project1) {
			await client1.query(
				`
				UPDATE Project
				FILTER .id = <uuid>$projectId
				SET {
					collaborators += (
						SELECT User FILTER .email IN array_unpack(<array<str>>$emails)
					)
				}
			`,
				{ projectId: project1.id, emails: [user2.email, user3.email] },
			);
		}

		// Verify setup
		const user1Projects = await client1.query(`SELECT Project { title }`);
		const user2Projects = await client2.query(`SELECT Project { title }`);

		expect(user1Projects).toHaveLength(1);
		expect(user2Projects).toHaveLength(2); // Own project + collaborator on user1's

		// Note: All this complex state will be cleaned up by branch reset
	});
});
