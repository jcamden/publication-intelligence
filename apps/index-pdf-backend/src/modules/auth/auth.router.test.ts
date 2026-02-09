import "../../test/setup";
import { describe, expect, it } from "vitest";
import { appRouter } from "../../routers/index";
import { createTestUser } from "../../test/factories";
import { createMockContext } from "../../test/mocks";

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

		it("should create a new user successfully", async () => {
			const caller = appRouter.createCaller(createMockContext());

			const result = await caller.auth.signUp({
				email: "newuser@example.com",
				password: "password123",
			});

			expect(result.user.email).toBe("newuser@example.com");
			expect(result.token).toBeTruthy();
		});

		it("should reject duplicate email addresses", async () => {
			const caller = appRouter.createCaller(createMockContext());

			await caller.auth.signUp({
				email: "duplicate@example.com",
				password: "password123",
			});

			await expect(
				caller.auth.signUp({
					email: "duplicate@example.com",
					password: "password456",
				}),
			).rejects.toThrow("User already exists");
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

		it("should login existing user successfully", async () => {
			const caller = appRouter.createCaller(createMockContext());

			await caller.auth.signUp({
				email: "logintest@example.com",
				password: "password123",
			});

			const result = await caller.auth.signIn({
				email: "logintest@example.com",
				password: "password123",
			});

			expect(result.user.email).toBe("logintest@example.com");
			expect(result.token).toBeTruthy();
		});

		it("should reject invalid credentials", async () => {
			const caller = appRouter.createCaller(createMockContext());

			await caller.auth.signUp({
				email: "validuser@example.com",
				password: "password123",
			});

			await expect(
				caller.auth.signIn({
					email: "validuser@example.com",
					password: "wrongpassword",
				}),
			).rejects.toThrow("Invalid email or password");
		});

		it("should reject non-existent users", async () => {
			const caller = appRouter.createCaller(createMockContext());

			await expect(
				caller.auth.signIn({
					email: "nonexistent@example.com",
					password: "password123",
				}),
			).rejects.toThrow("Invalid email or password");
		});
	});

	describe("me", () => {
		it("should require authentication", async () => {
			const caller = appRouter.createCaller(createMockContext());

			await expect(caller.auth.me()).rejects.toThrow("Not authenticated");
		});

		it("should return user when authenticated", async () => {
			// Need real user in DB for middleware check
			const testUser = await createTestUser();

			const caller = appRouter.createCaller(
				createMockContext({
					user: {
						id: testUser.userId,
						email: testUser.email,
						name: testUser.name,
					},
				}),
			);

			const result = await caller.auth.me();
			expect(result.id).toBe(testUser.userId);
			expect(result.email).toBe(testUser.email);
		});
	});

	describe("signOut", () => {
		it("should require authentication", async () => {
			const caller = appRouter.createCaller(createMockContext());

			await expect(caller.auth.signOut()).rejects.toThrow("Not authenticated");
		});

		it("should succeed when authenticated", async () => {
			// Need real user in DB for middleware check
			const testUser = await createTestUser();

			const caller = appRouter.createCaller(
				createMockContext({
					user: {
						id: testUser.userId,
						email: testUser.email,
						name: testUser.name,
					},
				}),
			);

			const result = await caller.auth.signOut();
			expect(result.message).toBe("Signed out successfully");
		});
	});
});
