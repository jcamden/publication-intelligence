import { TRPCError } from "@trpc/server";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { localFileStorage } from "../../infrastructure/storage";
import { requireFound } from "../../lib/errors";
import { logEvent } from "../../logger";
import { verifyToken } from "../auth/auth.service";
import * as sourceDocumentRepo from "./sourceDocument.repo";

// ============================================================================
// Fastify HTTP Routes - File Download
// ============================================================================
// Serves PDF files with authentication and access control

type DownloadRouteParams = {
	documentId: string;
};

export const registerDownloadRoutes = async (
	server: FastifyInstance,
): Promise<void> => {
	server.get<{ Params: DownloadRouteParams }>(
		"/source-documents/:documentId/file",
		{
			schema: {
				params: {
					type: "object",
					required: ["documentId"],
					properties: {
						documentId: { type: "string", format: "uuid" },
					},
				},
			},
		},
		async (request: FastifyRequest, reply: FastifyReply) => {
			try {
				const authHeader = request.headers.authorization;
				const authToken = authHeader?.startsWith("Bearer ")
					? authHeader.slice(7)
					: undefined;

				if (!authToken) {
					return reply.code(401).send({ error: "Unauthorized" });
				}

				let userId: string;
				try {
					const payload = verifyToken({ token: authToken });
					userId = payload.sub;
				} catch (_error) {
					return reply.code(401).send({ error: "Invalid token" });
				}

				const { documentId } = request.params as DownloadRouteParams;

				const document = await sourceDocumentRepo.getSourceDocumentById({
					documentId,
					userId,
				});

				const foundDocument = requireFound(document);

				const fileResult = await localFileStorage.getFile({
					storageKey: foundDocument.storage_key,
				});

				if (!fileResult) {
					logEvent({
						event: "source_document.file_not_found",
						context: {
							requestId: request.id,
							userId,
							metadata: {
								documentId,
								storage_key: foundDocument.storage_key,
							},
						},
					});
					return reply.code(404).send({ error: "File not found in storage" });
				}

				logEvent({
					event: "source_document.file_downloaded",
					context: {
						requestId: request.id,
						userId,
						metadata: {
							documentId,
							file_name: foundDocument.file_name,
							size_bytes: fileResult.sizeBytes,
						},
					},
				});

				return reply
					.code(200)
					.header("Content-Type", fileResult.mimeType)
					.header(
						"Content-Disposition",
						`inline; filename="${foundDocument.file_name}"`,
					)
					.header("Content-Length", fileResult.sizeBytes)
					.send(fileResult.buffer);
			} catch (error) {
				// Handle TRPCError (from requireFound) properly in Fastify route
				if (error instanceof TRPCError && error.code === "NOT_FOUND") {
					return reply.code(404).send({ error: "Document not found" });
				}

				request.log.error(error);
				return reply.code(500).send({
					error:
						error instanceof Error
							? error.message
							: "Failed to download document",
				});
			}
		},
	);
};
