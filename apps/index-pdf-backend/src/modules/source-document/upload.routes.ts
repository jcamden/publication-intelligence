import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { createAuthenticatedClient } from "../../db/client";
import { localFileStorage } from "../../infrastructure/storage";
import { verifyGelToken } from "../auth/verify-token";
import * as sourceDocumentService from "./sourceDocument.service";
import { UploadSourceDocumentSchema } from "./sourceDocument.types";

// ============================================================================
// Fastify HTTP Routes - File Upload
// ============================================================================
// File uploads use multipart/form-data (not tRPC)
// tRPC doesn't handle large file uploads well

type UploadRouteParams = {
	projectId: string;
};

export const registerUploadRoutes = async (
	server: FastifyInstance,
): Promise<void> => {
	server.post<{ Params: UploadRouteParams }>(
		"/projects/:projectId/source-documents/upload",
		{
			schema: {
				params: {
					type: "object",
					required: ["projectId"],
					properties: {
						projectId: { type: "string", format: "uuid" },
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

				const verification = await verifyGelToken({
					authToken,
					requestId: request.id,
				});

				if (!verification.valid || !verification.user) {
					return reply.code(401).send({ error: "Invalid token" });
				}

				const data = await request.file();

				if (!data) {
					return reply.code(400).send({ error: "No file uploaded" });
				}

				const buffer = await data.toBuffer();
				const { projectId } = request.params as UploadRouteParams;

				// Extract title from multipart fields
				const titleField = data.fields.title;
				const title =
					typeof titleField === "object" && "value" in titleField
						? (titleField.value as string)
						: undefined;

				const validationResult = UploadSourceDocumentSchema.safeParse({
					projectId,
					title,
				});

				if (!validationResult.success) {
					return reply.code(400).send({
						error: "Invalid input",
						details: validationResult.error.issues,
					});
				}

				const gelClient = createAuthenticatedClient({ authToken });

				const document = await sourceDocumentService.uploadSourceDocument({
					gelClient,
					storageService: localFileStorage,
					projectId,
					file: {
						buffer,
						filename: data.filename,
						mimeType: data.mimetype,
					},
					title,
					userId: verification.user.id,
					requestId: request.id,
				});

				return reply.code(201).send(document);
			} catch (error) {
				request.log.error(error);
				return reply.code(500).send({
					error:
						error instanceof Error
							? error.message
							: "Failed to upload document",
				});
			}
		},
	);
};
