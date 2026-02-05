import { describe, expect, it } from "vitest";
import { appRouter } from "../../routers/index";
import { createMockContext, createMockUser } from "../../test/mocks";

describe("auth router", () => {
	describe("signUp", () => {
		it("should validate email format", async () => {
			const caller = appRouter.createCaller(createMockContext());

			await expect(
				caller.auth.signUp({
					email: "invalid-email",
					password: "password123",
				}),
			).rejects.toThrow();
		});

		it("should validate password length", async () => {
			const caller = appRouter.createCaller(createMockContext());

			await expect(
				caller.auth.signUp({
					email: "test@example.com",
					password: "short",
				}),
			).rejects.toThrow();
		});
	});

	describe("signIn", () => {
		it("should validate email format", async () => {
			const caller = appRouter.createCaller(createMockContext());

			await expect(
				caller.auth.signIn({
					email: "invalid-email",
					password: "password123",
				}),
			).rejects.toThrow();
		});
	});

	describe("me", () => {
		it("should require authentication", async () => {
			const caller = appRouter.createCaller(createMockContext());

			await expect(caller.auth.me()).rejects.toThrow("Not authenticated");
		});

		it("should return user when authenticated", async () => {
			const mockUser = createMockUser({ id: "test-id" });

			const caller = appRouter.createCaller(
				createMockContext({
					user: mockUser,
				}),
			);

			const result = await caller.auth.me();
			expect(result).toEqual(mockUser);
		});
	});

	describe("signOut", () => {
		it("should require authentication", async () => {
			const caller = appRouter.createCaller(createMockContext());

			await expect(caller.auth.signOut()).rejects.toThrow("Not authenticated");
		});

		it("should succeed when authenticated", async () => {
			const caller = appRouter.createCaller(
				createMockContext({
					user: createMockUser({ id: "test-id" }),
				}),
			);

			const result = await caller.auth.signOut();
			expect(result.message).toBe("Signed out successfully");
		});
	});
});
