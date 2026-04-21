import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { callOpenRouter } from "./index";

describe("callOpenRouter", () => {
	const prevKey = process.env.OPENROUTER_API_KEY;

	beforeEach(() => {
		delete process.env.OPENROUTER_API_KEY;
	});

	afterEach(() => {
		if (prevKey !== undefined) {
			process.env.OPENROUTER_API_KEY = prevKey;
		} else {
			delete process.env.OPENROUTER_API_KEY;
		}
	});

	it("throws when no API key is configured", async () => {
		await expect(
			callOpenRouter({
				model: "test/model",
				messages: [{ role: "user", content: "hi" }],
			}),
		).rejects.toThrow(/OpenRouter API key is required/i);
	});

	it("uses OPENROUTER_API_KEY from the environment when apiKey is omitted", async () => {
		process.env.OPENROUTER_API_KEY = "invalid-key-for-test";

		const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
			ok: false,
			status: 401,
			text: async () => "unauthorized",
		} as Response);

		await expect(
			callOpenRouter({
				model: "test/model",
				messages: [{ role: "user", content: "hi" }],
			}),
		).rejects.toThrow(/OpenRouter API error \(401\)/);

		expect(fetchSpy).toHaveBeenCalledWith(
			"https://openrouter.ai/api/v1/chat/completions",
			expect.objectContaining({ method: "POST" }),
		);

		fetchSpy.mockRestore();
	});
});
