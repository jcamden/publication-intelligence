import { randomUUID } from "node:crypto";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { logEvent } from "../logger";

declare module "fastify" {
	interface FastifyRequest {
		requestId: string;
	}
}

export const registerRequestId = async (server: FastifyInstance) => {
	server.addHook(
		"onRequest",
		async (req: FastifyRequest, _reply: FastifyReply) => {
			req.requestId = randomUUID();

			logEvent({
				event: "http.request_started",
				context: {
					requestId: req.requestId,
					metadata: {
						method: req.method,
						url: req.url,
						userAgent: req.headers["user-agent"],
					},
				},
			});
		},
	);

	server.addHook(
		"onResponse",
		async (req: FastifyRequest, reply: FastifyReply) => {
			logEvent({
				event: "http.request_completed",
				context: {
					requestId: req.requestId,
					metadata: {
						method: req.method,
						url: req.url,
						statusCode: reply.statusCode,
						responseTime: reply.elapsedTime,
					},
				},
			});
		},
	);
};
