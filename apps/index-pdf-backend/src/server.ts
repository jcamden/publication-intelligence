import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import { fastifyTRPCPlugin } from "@trpc/server/adapters/fastify";
import Fastify, { type FastifyInstance, type FastifyRequest } from "fastify";
import { env } from "./env";
import { logger } from "./logger";
import { registerRequestId } from "./middleware/request-id";
import { verifyToken } from "./modules/auth/auth.service";
import { registerDownloadRoutes } from "./modules/source-document/download.routes";
import { registerUploadRoutes } from "./modules/source-document/upload.routes";
import { appRouter } from "./routers/index";

export const createServer = () => {
	const server = Fastify({
		logger: false,
		routerOptions: {
			maxParamLength: 5000,
		},
		disableRequestLogging: true,
	});

	return server;
};

export const registerPlugins = async (server: FastifyInstance) => {
	await registerRequestId(server);

	await server.register(cors, {
		origin: env.CORS_ORIGINS,
		credentials: true,
	});

	await server.register(multipart, {
		limits: {
			fileSize: 100 * 1024 * 1024, // 100MB max file size
		},
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
					try {
						const payload = verifyToken({ token: authToken });
						return {
							authToken,
							user: {
								id: payload.sub,
								email: payload.email,
								name: payload.name,
							},
							requestId: req.requestId,
						};
					} catch (error) {
						// Invalid token - treat as unauthenticated
						logger.warn({
							event: "auth.token_invalid",
							metadata: {
								requestId: req.requestId,
								error: error instanceof Error ? error.message : "Unknown error",
							},
						});
					}
				}

				return {
					authToken: undefined,
					user: undefined,
					requestId: req.requestId,
				};
			},
		},
	});

	await registerUploadRoutes(server);
	await registerDownloadRoutes(server);

	server.get("/health", async () => ({
		status: "ok",
		timestamp: new Date().toISOString(),
	}));

	return server;
};

export const startServer = async () => {
	const server = createServer();
	await registerPlugins(server);

	await server.listen({ port: env.PORT, host: env.HOST });

	logger.info({
		event: "server.started",
		metadata: {
			host: env.HOST,
			port: env.PORT,
			env: env.NODE_ENV,
		},
	});

	return server;
};
