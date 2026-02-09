import "../../test/setup";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { appRouter } from "../../routers/index";
import { createTestUser } from "../../test/factories";
import { createMockContext } from "../../test/mocks";
import * as userService from "./user.service";

describe("user router", () => {
	describe("deleteAccount", () => {
		beforeEach(() => {
			vi.clearAllMocks();
		});

		it("should require authentication", async () => {
			const caller = appRouter.createCaller(createMockContext());

			await expect(caller.user.deleteAccount()).rejects.toThrow(
				"Not authenticated",
			);
		});

		it("should succeed when authenticated", async () => {
			// Need real user in DB for middleware check
			const testUser = await createTestUser();

			// Mock the service layer to avoid real database calls
			vi.spyOn(userService, "deleteUser").mockResolvedValue(undefined);

			const caller = appRouter.createCaller(
				createMockContext({
					user: {
						id: testUser.userId,
						email: testUser.email,
						name: testUser.name,
					},
				}),
			);

			const result = await caller.user.deleteAccount();
			expect(result.success).toBe(true);
			expect(result.message).toBe("Account deleted successfully");

			// Verify the service was called with correct params
			expect(userService.deleteUser).toHaveBeenCalledWith(
				expect.objectContaining({
					userId: testUser.userId,
				}),
			);
		});
	});
});
