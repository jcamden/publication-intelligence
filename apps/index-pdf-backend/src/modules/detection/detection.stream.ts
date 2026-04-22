import type { FastifyInstance } from "fastify";
import { verifyToken } from "../auth/auth.service";
import * as detectionRepo from "./detection.repo";
import { detectionEventBus } from "./events";

const SSE_RETRY_MS = 2000;

const writeSse = (res: NodeJS.WritableStream, event: string, data: unknown) => {
	res.write(`event: ${event}\n`);
	res.write(`data: ${JSON.stringify(data)}\n\n`);
};

export const registerDetectionStreamRoutes = async (
	server: FastifyInstance,
) => {
	server.get<{
		Params: { id: string };
		Querystring: { token?: string };
	}>("/api/detection/runs/:id/stream", async (req, reply) => {
		const token = req.query.token;
		if (!token) {
			return reply.code(401).send({ error: "Missing token" });
		}

		let userId: string;
		try {
			const payload = verifyToken({ token });
			userId = payload.sub;
		} catch {
			return reply.code(401).send({ error: "Invalid token" });
		}

		const runId = req.params.id;
		const run = await detectionRepo.getDetectionRun({ userId, runId });
		if (!run) {
			return reply.code(404).send({ error: "Run not found" });
		}

		reply.raw.setHeader("Content-Type", "text/event-stream");
		reply.raw.setHeader("Cache-Control", "no-cache, no-transform");
		reply.raw.setHeader("Connection", "keep-alive");
		reply.raw.setHeader("X-Accel-Buffering", "no");
		reply.raw.flushHeaders();

		reply.raw.write(`retry: ${SSE_RETRY_MS}\n\n`);

		// Replay latest persisted run snapshot once (so reconnects show sane state)
		writeSse(reply.raw, "run.snapshot", {
			runId: run.id,
			status: run.status,
			progressPage: run.progressPage,
			totalPages: run.totalPages,
			phase: run.phase,
			phaseProgress: run.phaseProgress ? Number(run.phaseProgress) : null,
		});

		// Replay in-memory stream state (if we have one) so client can get pagesWithNewMentions
		const latest = detectionEventBus.getLatest(runId);
		if (latest) {
			writeSse(reply.raw, "run.stream_state", latest);
		}

		const unsubscribe = detectionEventBus.subscribe(runId, (event) => {
			writeSse(reply.raw, "run.event", event);
		});

		const keepAlive = setInterval(() => {
			reply.raw.write(": ping\n\n");
		}, 15000);

		req.raw.on("close", () => {
			clearInterval(keepAlive);
			unsubscribe();
		});

		// Fastify will keep the request open as long as we don't return a payload.
		return reply;
	});
};
