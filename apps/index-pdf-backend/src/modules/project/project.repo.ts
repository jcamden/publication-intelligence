import { and, count, desc, eq, isNull, sql } from "drizzle-orm";
import { withUserContext } from "../../db/client";
import {
	indexEntries,
	projects,
	sourceDocuments,
	users,
} from "../../db/schema";
import type {
	CreateProjectInput,
	Project,
	ProjectListItem,
	UpdateProjectInput,
} from "./project.types";

// ============================================================================
// Repository Layer - Drizzle ORM queries
// ============================================================================

export const createProject = async ({
	userId,
	input,
}: {
	userId: string;
	input: CreateProjectInput;
}): Promise<Project> => {
	return await withUserContext({
		userId,
		fn: async (tx) => {
			// Insert the project
			const [newProject] = await tx
				.insert(projects)
				.values({
					title: input.title,
					description: input.description ?? null,
					projectDir: input.project_dir,
					ownerId: userId,
				})
				.returning();

			if (!newProject) {
				throw new Error("Failed to create project");
			}

			// Fetch the complete project with owner (in same transaction)
			const result = await tx
				.select({
					id: projects.id,
					title: projects.title,
					description: projects.description,
					project_dir: projects.projectDir,
					created_at: projects.createdAt,
					updated_at: projects.updatedAt,
					deleted_at: projects.deletedAt,
					owner: {
						id: users.id,
						email: users.email,
					},
				})
				.from(projects)
				.innerJoin(users, eq(projects.ownerId, users.id))
				.where(eq(projects.id, newProject.id))
				.limit(1);

			if (result.length === 0) {
				throw new Error("Failed to fetch created project");
			}

			const project = result[0];

			// Get entry count (will be 0 for new project)
			const [entryCountResult] = await tx
				.select({ count: count() })
				.from(indexEntries)
				.where(
					and(
						eq(indexEntries.projectId, newProject.id),
						isNull(indexEntries.deletedAt),
					),
				);

			return {
				id: project.id,
				title: project.title,
				description: project.description,
				project_dir: project.project_dir,
				owner: project.owner,
				created_at: project.created_at,
				updated_at: project.updated_at,
				deleted_at: project.deleted_at,
				has_document: false,
				entry_count: entryCountResult.count,
				is_deleted: false,
			};
		},
	});
};

export const listProjectsForUser = async ({
	userId,
}: {
	userId: string;
}): Promise<ProjectListItem[]> => {
	return await withUserContext({
		userId,
		fn: async (tx) => {
			// Query projects with source_document joined
			// RLS policies automatically filter to user's owned projects
			const result = await tx
				.select({
					id: projects.id,
					title: projects.title,
					description: projects.description,
					project_dir: projects.projectDir,
					entry_count: sql<number>`(
				SELECT COUNT(*)::int 
				FROM ${indexEntries} 
				WHERE ${indexEntries.projectId} = ${projects.id}
					AND ${indexEntries.deletedAt} IS NULL
			)`,
					created_at: projects.createdAt,
					updated_at: projects.updatedAt,
					source_document: {
						id: sourceDocuments.id,
						title: sourceDocuments.title,
						file_name: sourceDocuments.fileName,
						file_size: sourceDocuments.fileSize,
						page_count: sourceDocuments.pageCount,
						storage_key: sourceDocuments.storageKey,
						status: sourceDocuments.status,
					},
				})
				.from(projects)
				.leftJoin(
					sourceDocuments,
					and(
						eq(sourceDocuments.projectId, projects.id),
						isNull(sourceDocuments.deletedAt),
					),
				)
				.where(isNull(projects.deletedAt))
				.orderBy(desc(projects.createdAt));

			return result.map((row: (typeof result)[number]) => ({
				id: row.id,
				title: row.title,
				description: row.description,
				project_dir: row.project_dir,
				entry_count: row.entry_count,
				created_at: row.created_at,
				updated_at: row.updated_at,
				source_document: row.source_document?.id ? row.source_document : null,
			}));
		},
	});
};

export const getProjectById = async ({
	projectId,
	userId,
}: {
	projectId: string;
	userId: string;
}): Promise<Project | null> => {
	return await withUserContext({
		userId,
		fn: async (tx) => {
			// Query project with owner
			// RLS policies automatically filter to user's owned projects
			const result = await tx
				.select({
					id: projects.id,
					title: projects.title,
					description: projects.description,
					project_dir: projects.projectDir,
					created_at: projects.createdAt,
					updated_at: projects.updatedAt,
					deleted_at: projects.deletedAt,
					owner: {
						id: users.id,
						email: users.email,
					},
				})
				.from(projects)
				.innerJoin(users, eq(projects.ownerId, users.id))
				.where(and(eq(projects.id, projectId), isNull(projects.deletedAt)))
				.limit(1);

			if (result.length === 0) {
				return null;
			}

			const project = result[0];

			// Check if has_document
			const [hasDocResult] = await tx
				.select({ count: count() })
				.from(sourceDocuments)
				.where(
					and(
						eq(sourceDocuments.projectId, projectId),
						isNull(sourceDocuments.deletedAt),
					),
				);

			// Get entry count
			const [entryCountResult] = await tx
				.select({ count: count() })
				.from(indexEntries)
				.where(
					and(
						eq(indexEntries.projectId, projectId),
						isNull(indexEntries.deletedAt),
					),
				);

			return {
				id: project.id,
				title: project.title,
				description: project.description,
				project_dir: project.project_dir,
				owner: project.owner,
				created_at: project.created_at,
				updated_at: project.updated_at,
				deleted_at: project.deleted_at,
				has_document: hasDocResult.count > 0,
				entry_count: entryCountResult.count,
				is_deleted: project.deleted_at !== null,
			};
		},
	});
};

export const getProjectByDir = async ({
	projectDir,
	userId,
}: {
	projectDir: string;
	userId: string;
}): Promise<ProjectListItem | null> => {
	return await withUserContext({
		userId,
		fn: async (tx) => {
			// Query project with source_document
			// RLS policies automatically filter to user's owned projects
			const result = await tx
				.select({
					id: projects.id,
					title: projects.title,
					description: projects.description,
					project_dir: projects.projectDir,
					entry_count: sql<number>`(
				SELECT COUNT(*)::int 
				FROM ${indexEntries} 
				WHERE ${indexEntries.projectId} = ${projects.id}
					AND ${indexEntries.deletedAt} IS NULL
			)`,
					created_at: projects.createdAt,
					updated_at: projects.updatedAt,
					owner_id: projects.ownerId,
					source_document: {
						id: sourceDocuments.id,
						title: sourceDocuments.title,
						file_name: sourceDocuments.fileName,
						file_size: sourceDocuments.fileSize,
						page_count: sourceDocuments.pageCount,
						storage_key: sourceDocuments.storageKey,
						status: sourceDocuments.status,
					},
				})
				.from(projects)
				.leftJoin(
					sourceDocuments,
					and(
						eq(sourceDocuments.projectId, projects.id),
						isNull(sourceDocuments.deletedAt),
					),
				)
				.where(
					and(eq(projects.projectDir, projectDir), isNull(projects.deletedAt)),
				)
				.orderBy(desc(projects.createdAt))
				.limit(1);

			if (result.length === 0) {
				return null;
			}

			const project = result[0];

			return {
				id: project.id,
				title: project.title,
				description: project.description,
				project_dir: project.project_dir,
				entry_count: project.entry_count,
				created_at: project.created_at,
				updated_at: project.updated_at,
				source_document: project.source_document?.id
					? project.source_document
					: null,
			};
		},
	});
};

export const updateProject = async ({
	projectId,
	userId,
	input,
}: {
	projectId: string;
	userId: string;
	input: UpdateProjectInput;
}): Promise<Project | null> => {
	return await withUserContext({
		userId,
		fn: async (tx) => {
			// Build update values
			const updateValues: Partial<typeof projects.$inferInsert> = {
				updatedAt: new Date(),
			};

			if (input.title !== undefined) {
				updateValues.title = input.title;
			}

			if (input.description !== undefined) {
				updateValues.description = input.description;
			}

			// Perform update (RLS policies enforce authorization)
			const result = await tx
				.update(projects)
				.set(updateValues)
				.where(and(eq(projects.id, projectId), isNull(projects.deletedAt)))
				.returning({ id: projects.id });

			// Return null if update failed (RLS denied access or doesn't exist)
			if (result.length === 0) {
				return null;
			}

			// Fetch the complete updated project (inline to avoid nested transaction)
			const projectResult = await tx
				.select({
					id: projects.id,
					title: projects.title,
					description: projects.description,
					project_dir: projects.projectDir,
					created_at: projects.createdAt,
					updated_at: projects.updatedAt,
					deleted_at: projects.deletedAt,
					owner: {
						id: users.id,
						email: users.email,
					},
				})
				.from(projects)
				.innerJoin(users, eq(projects.ownerId, users.id))
				.where(and(eq(projects.id, projectId), isNull(projects.deletedAt)))
				.limit(1);

			if (projectResult.length === 0) {
				return null;
			}

			const project = projectResult[0];

			// Get has_document count
			const [hasDocResult] = await tx
				.select({ count: count() })
				.from(sourceDocuments)
				.where(
					and(
						eq(sourceDocuments.projectId, projectId),
						isNull(sourceDocuments.deletedAt),
					),
				);

			// Get entry count
			const [entryCountResult] = await tx
				.select({ count: count() })
				.from(indexEntries)
				.where(
					and(
						eq(indexEntries.projectId, projectId),
						isNull(indexEntries.deletedAt),
					),
				);

			return {
				id: project.id,
				title: project.title,
				description: project.description,
				project_dir: project.project_dir,
				owner: project.owner,
				created_at: project.created_at,
				updated_at: project.updated_at,
				deleted_at: project.deleted_at,
				has_document: hasDocResult.count > 0,
				entry_count: entryCountResult.count,
				is_deleted: project.deleted_at !== null,
			};
		},
	});
};

export const softDeleteProject = async ({
	projectId,
	userId,
}: {
	projectId: string;
	userId: string;
}): Promise<{ id: string; deleted_at: Date } | null> => {
	return await withUserContext({
		userId,
		fn: async (tx) => {
			// Perform soft delete (RLS enforces owner-only access)
			const result = await tx
				.update(projects)
				.set({
					deletedAt: new Date(),
				})
				.where(and(eq(projects.id, projectId), isNull(projects.deletedAt)))
				.returning({
					id: projects.id,
					deleted_at: projects.deletedAt,
				});

			// Return null if delete failed (RLS denied access, doesn't exist, or already deleted)
			if (result.length === 0) {
				return null;
			}

			if (!result[0].deleted_at) {
				throw new Error("Soft delete failed: deleted_at is null");
			}

			return {
				id: result[0].id,
				deleted_at: result[0].deleted_at,
			};
		},
	});
};
