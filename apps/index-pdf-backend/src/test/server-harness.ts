import type { FastifyInstance } from "fastify";
import { createServer, registerPlugins } from "../server";

// ============================================================================
// Test Server Harness
// ============================================================================

export const createTestServer = async (): Promise<FastifyInstance> => {
	const server = createServer();

	// Register all plugins and routes (but don't listen)
	await registerPlugins(server);
	await server.ready();

	return server;
};

export const closeTestServer = async (server: FastifyInstance) => {
	await server.close();
};

// ============================================================================
// Test Request Helpers
// ============================================================================

export const makeAuthenticatedRequest = ({
	server,
	authToken,
}: {
	server: FastifyInstance;
	authToken: string;
}) => {
	return {
		inject: async ({
			method,
			url,
			payload,
		}: {
			method: string;
			url: string;
			payload?: unknown;
		}) => {
			return server.inject({
				method: method as never,
				url,
				headers: {
					authorization: `Bearer ${authToken}`,
					"content-type": "application/json",
				},
				payload: payload as never,
			});
		},
	};
};
