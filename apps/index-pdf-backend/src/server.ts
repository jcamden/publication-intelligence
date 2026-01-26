import cors from "@fastify/cors";
import { fastifyTRPCPlugin } from "@trpc/server/adapters/fastify";
import Fastify, { type FastifyRequest } from "fastify";
import { verifyGelToken } from "./auth/verify-token";
import { appRouter } from "./routers/index";

const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;
const HOST = process.env.HOST ?? "0.0.0.0";

export const createServer = () => {
	const server = Fastify({
		logger: {
			level: process.env.LOG_LEVEL ?? "info",
		},
		routerOptions: {
			maxParamLength: 5000,
		},
	});

	return server;
};

export const startServer = async () => {
	const server = createServer();

	await server.register(cors, {
		origin: [
			"http://localhost:3000",
			"http://localhost:3001",
			"http://localhost:6006", // Storybook
		],
		credentials: true,
	});

	await server.register(fastifyTRPCPlugin, {
		prefix: "/trpc",
		trpcOptions: {
			router: appRouter,
			createContext: async ({ req }: { req: FastifyRequest }) => {
				const authHeader = req.headers.authorization;
				const authToken = authHeader?.startsWith("Bearer ")
					? authHeader.slice(7)
					: undefined;

				if (authToken) {
					const verification = await verifyGelToken({ authToken });
					if (verification.valid && verification.user) {
						return {
							authToken,
							user: verification.user,
						};
					}
				}

				return {
					authToken: undefined,
					user: undefined,
				};
			},
		},
	});

	server.get("/health", async () => ({
		status: "ok",
		timestamp: new Date().toISOString(),
	}));

	await server.listen({ port: PORT, host: HOST });

	console.log(`🚀 Fastify + tRPC server listening on http://${HOST}:${PORT}`);
	console.log(`🗄️  Connected to Gel database`);
	console.log(`📍 tRPC endpoint: http://${HOST}:${PORT}/trpc`);

	return server;
};
