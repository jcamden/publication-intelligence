import type { Client } from "gel";
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

	if (!project) {
		logEvent({
			event: "project.not_found",
			context: {
				requestId,
				userId,
				metadata: { projectId },
			},
		});
		throw new Error("Project not found");
	}

	logEvent({
		event: "project.retrieved",
		context: {
			requestId,
			userId,
			metadata: { projectId: project.id },
		},
	});

	return project;
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

	logEvent({
		event: "project.updated",
		context: {
			requestId,
			userId,
			metadata: {
				projectId: project.id,
				changes: input,
			},
		},
	});

	await insertEvent({
		gelClient,
		projectId: project.id,
		entityType: "Project",
		entityId: project.id,
		action: "updated",
		metadata: {
			changes: input,
		},
	});

	return project;
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

	logEvent({
		event: "project.deleted",
		context: {
			requestId,
			userId,
			metadata: {
				projectId: result.id,
				deleted_at: result.deleted_at,
			},
		},
	});

	await insertEvent({
		gelClient,
		projectId: result.id,
		entityType: "Project",
		entityId: result.id,
		action: "deleted",
	});
};
