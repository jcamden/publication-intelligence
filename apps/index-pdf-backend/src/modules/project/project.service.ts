import { requireFound } from "../../lib/errors";
import { logEvent } from "../../logger";
import { insertEvent } from "../event/event.repo";
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

	logEvent({
		event: "project.created",
		context: {
			requestId,
			userId,
			metadata: {
				projectId: project.id,
				title: project.title,
			},
		},
	});

	await insertEvent({
		type: "project.created",
		projectId: project.id,
		userId,
		entityType: "Project",
		entityId: project.id,
		metadata: {
			title: project.title,
		},
		requestId,
	});

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

	logEvent({
		event: "project.updated",
		context: {
			requestId,
			userId,
			metadata: {
				projectId: updated.id,
				changes: input,
			},
		},
	});

	await insertEvent({
		type: "project.updated",
		projectId: updated.id,
		userId,
		entityType: "Project",
		entityId: updated.id,
		metadata: {
			changes: input,
		},
		requestId,
	});

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

	logEvent({
		event: "project.deleted",
		context: {
			requestId,
			userId,
			metadata: {
				projectId: deleted.id,
				deleted_at: deleted.deleted_at,
			},
		},
	});

	await insertEvent({
		type: "project.deleted",
		projectId: deleted.id,
		userId,
		entityType: "Project",
		entityId: deleted.id,
		requestId,
	});
};
