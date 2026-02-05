import { beforeEach, describe, expect, it, vi } from "vitest";
import { appRouter } from "../../routers/index";
import { createMockContext, createMockUser } from "../../test/mocks";
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
			const mockUser = createMockUser();

			// Mock the service layer to avoid real database calls
			vi.spyOn(userService, "deleteUserWithIdentity").mockResolvedValue(
				undefined,
			);

			const caller = appRouter.createCaller(
				createMockContext({
					user: mockUser,
				}),
			);

			const result = await caller.user.deleteAccount();
			expect(result.success).toBe(true);
			expect(result.message).toBe("Account deleted successfully");

			// Verify the service was called with correct params
			expect(userService.deleteUserWithIdentity).toHaveBeenCalledWith(
				expect.objectContaining({
					userId: mockUser.id,
				}),
			);
		});
	});
});
