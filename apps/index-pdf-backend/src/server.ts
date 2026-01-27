import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import { fastifyTRPCPlugin } from "@trpc/server/adapters/fastify";
import Fastify, { type FastifyInstance, type FastifyRequest } from "fastify";
import { logger } from "./logger";
import { registerRequestId } from "./middleware/request-id";
import { verifyGelToken } from "./modules/auth/verify-token";
import { registerUploadRoutes } from "./modules/source-document/upload.routes";
import { appRouter } from "./routers/index";

const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;
const HOST = process.env.HOST ?? "0.0.0.0";
const CORS_ORIGINS = process.env.CORS_ORIGINS
	? process.env.CORS_ORIGINS.split(",").map((origin) => origin.trim())
	: ["http://localhost:3000", "http://localhost:3001", "http://localhost:6006"];

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
		origin: CORS_ORIGINS,
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
					const verification = await verifyGelToken({
						authToken,
						requestId: req.requestId,
					});
					if (verification.valid && verification.user) {
						return {
							authToken,
							user: verification.user,
							requestId: req.requestId,
						};
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

	server.get("/health", async () => ({
		status: "ok",
		timestamp: new Date().toISOString(),
	}));

	return server;
};

export const startServer = async () => {
	const server = createServer();
	await registerPlugins(server);

	await server.listen({ port: PORT, host: HOST });

	logger.info({
		event: "server.started",
		metadata: {
			host: HOST,
			port: PORT,
			env: process.env.NODE_ENV,
		},
	});

	return server;
};
