import { emitEvent } from "../../event-bus/emit-event";
import { requireFound } from "../../lib/errors";
import { logEvent } from "../../logger";
import * as projectRepo from "./project.repo";
import type {
	CreateProjectInput,
	Project,
	ProjectListItem,
	UpdateProjectInput,
} from "./project.types";

// ============================================================================
// Service Layer - Domain logic and orchestration
// ============================================================================

export const createProject = async ({
	input,
	userId,
	requestId,
}: {
	input: CreateProjectInput;
	userId: string;
	requestId: string;
}): Promise<Project> => {
	const project = await projectRepo.createProject({ userId, input });

	await emitEvent(
		{
			type: "project.created",
			entityType: "Project",
			entityId: project.id,
			metadata: {
				title: project.title,
			},
		},
		{ userId, projectId: project.id, requestId },
	);

	return project;
};

export const listProjectsForUser = async ({
	userId,
	requestId,
}: {
	userId: string;
	requestId: string;
}): Promise<ProjectListItem[]> => {
	logEvent({
		event: "project.list_requested",
		context: {
			requestId,
			userId,
		},
	});

	return projectRepo.listProjectsForUser({ userId });
};

export const getProjectById = async ({
	projectId,
	userId,
	requestId,
}: {
	projectId: string;
	userId: string;
	requestId: string;
}): Promise<Project> => {
	const project = await projectRepo.getProjectById({ projectId, userId });

	// Security principle: Don't reveal whether project exists if user can't access it
	// Both "doesn't exist" and "forbidden" return 404 (via requireFound)
	const found = requireFound(project);

	logEvent({
		event: "project.retrieved",
		context: {
			requestId,
			userId,
			metadata: { projectId: found.id },
		},
	});

	return found;
};

export const getProjectByDir = async ({
	projectDir,
	userId,
	requestId,
}: {
	projectDir: string;
	userId: string;
	requestId: string;
}): Promise<ProjectListItem> => {
	const project = await projectRepo.getProjectByDir({ projectDir, userId });

	// Security principle: Don't reveal whether project exists if user can't access it
	// Both "doesn't exist" and "forbidden" return 404 (via requireFound)
	const found = requireFound(project);

	logEvent({
		event: "project.retrieved",
		context: {
			requestId,
			userId,
			metadata: { projectId: found.id, projectDir: found.project_dir },
		},
	});

	return found;
};

export const updateProject = async ({
	projectId,
	input,
	userId,
	requestId,
}: {
	projectId: string;
	input: UpdateProjectInput;
	userId: string;
	requestId: string;
}): Promise<Project> => {
	const project = await projectRepo.updateProject({
		projectId,
		userId,
		input,
	});

	// Throw NOT_FOUND if project doesn't exist or user lacks access
	const updated = requireFound(project);

	await emitEvent(
		{
			type: "project.updated",
			entityType: "Project",
			entityId: updated.id,
			metadata: {
				changes: input,
			},
		},
		{ userId, projectId: updated.id, requestId },
	);

	return updated;
};

export const deleteProject = async ({
	projectId,
	userId,
	requestId,
}: {
	projectId: string;
	userId: string;
	requestId: string;
}): Promise<void> => {
	const result = await projectRepo.softDeleteProject({ projectId, userId });

	// Throw NOT_FOUND if project doesn't exist, already deleted, or user lacks access
	const deleted = requireFound(result);

	await emitEvent(
		{
			type: "project.deleted",
			entityType: "Project",
			entityId: deleted.id,
			metadata: {
				deleted_at: deleted.deleted_at,
			},
		},
		{ userId, projectId: deleted.id, requestId },
	);
};
