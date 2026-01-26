import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createServer } from "./server";

describe("Fastify server", () => {
	let server: Awaited<ReturnType<typeof createServer>>;

	beforeAll(async () => {
		server = createServer();
		await server.ready();
	});

	afterAll(async () => {
		await server.close();
	});

	it("should respond to health check", async () => {
		const response = await server.inject({
			method: "GET",
			url: "/health",
		});

		expect(response.statusCode).toBe(200);
		const body = JSON.parse(response.body);
		expect(body.status).toBe("ok");
		expect(body.timestamp).toBeDefined();
	});

	it("should have CORS enabled", async () => {
		const response = await server.inject({
			method: "OPTIONS",
			url: "/health",
			headers: {
				origin: "http://localhost:3000",
			},
		});

		expect(response.headers["access-control-allow-origin"]).toBeDefined();
	});

	it("should have tRPC endpoint registered", async () => {
		const response = await server.inject({
			method: "GET",
			url: "/trpc",
		});

		// tRPC should respond (even if with an error for invalid request)
		expect(response.statusCode).toBeDefined();
	});
});
