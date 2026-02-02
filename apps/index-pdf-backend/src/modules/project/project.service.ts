import type { Client } from "gel";
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
	gelClient,
	input,
	userId,
	requestId,
}: {
	gelClient: Client;
	input: CreateProjectInput;
	userId: string;
	requestId: string;
}): Promise<Project> => {
	const project = await projectRepo.createProject({ gelClient, input });

	logEvent({
		event: "project.created",
		context: {
			requestId,
			userId,
			metadata: {
				projectId: project.id,
				title: project.title,
				hasWorkspace: !!project.workspace,
			},
		},
	});

	await insertEvent({
		gelClient,
		projectId: project.id,
		entityType: "Project",
		entityId: project.id,
		action: "created",
		metadata: {
			title: project.title,
		},
	});

	return project;
};

export const listProjectsForUser = async ({
	gelClient,
	userId,
	requestId,
}: {
	gelClient: Client;
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

	return projectRepo.listProjectsForUser({ gelClient });
};

export const getProjectById = async ({
	gelClient,
	projectId,
	userId,
	requestId,
}: {
	gelClient: Client;
	projectId: string;
	userId: string;
	requestId: string;
}): Promise<Project> => {
	const project = await projectRepo.getProjectById({ gelClient, projectId });

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
	gelClient,
	projectDir,
	userId,
	requestId,
}: {
	gelClient: Client;
	projectDir: string;
	userId: string;
	requestId: string;
}): Promise<ProjectListItem> => {
	const project = await projectRepo.getProjectByDir({ gelClient, projectDir });

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
	gelClient,
	projectId,
	input,
	userId,
	requestId,
}: {
	gelClient: Client;
	projectId: string;
	input: UpdateProjectInput;
	userId: string;
	requestId: string;
}): Promise<Project> => {
	const project = await projectRepo.updateProject({
		gelClient,
		projectId,
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
		gelClient,
		projectId: updated.id,
		entityType: "Project",
		entityId: updated.id,
		action: "updated",
		metadata: {
			changes: input,
		},
	});

	return updated;
};

export const deleteProject = async ({
	gelClient,
	projectId,
	userId,
	requestId,
}: {
	gelClient: Client;
	projectId: string;
	userId: string;
	requestId: string;
}): Promise<void> => {
	const result = await projectRepo.softDeleteProject({ gelClient, projectId });

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
		gelClient,
		projectId: deleted.id,
		entityType: "Project",
		entityId: deleted.id,
		action: "deleted",
	});
};
