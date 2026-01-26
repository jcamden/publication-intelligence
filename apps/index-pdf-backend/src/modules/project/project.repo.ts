import e from "@gel";
import type { Client } from "gel";
import type {
	CreateProjectInput,
	Project,
	ProjectListItem,
	UpdateProjectInput,
} from "./project.types";

// ============================================================================
// Repository Layer - edgeql-js queries
// ============================================================================

export const createProject = async ({
	gelClient,
	input,
}: {
	gelClient: Client;
	input: CreateProjectInput;
}): Promise<Project> => {
	const query = e.insert(e.Project, {
		title: input.title,
		description: input.description ?? null,
		workspace: input.workspace
			? e.assert_single(
					e.select(e.Workspace, (w) => ({
						filter: e.op(w.id, "=", e.uuid(input.workspace as string)),
					})),
				)
			: null,
		owner: e.global.current_user,
		collaborators: e.cast(e.User, e.set()),
	});

	const project = await query.run(gelClient);

	if (!project) {
		throw new Error("Failed to create project");
	}

	return project as Project;
};

export const listProjectsForUser = async ({
	gelClient,
}: {
	gelClient: Client;
}): Promise<ProjectListItem[]> => {
	const query = e.select(e.Project, (project) => ({
		id: true,
		title: true,
		description: true,
		document_count: true,
		entry_count: true,
		created_at: true,
		updated_at: true,
		filter: e.op("not", e.op("exists", project.deleted_at)),
		order_by: {
			expression: project.created_at,
			direction: e.DESC,
		},
	}));

	const projects = await query.run(gelClient);

	return projects as ProjectListItem[];
};

export const getProjectById = async ({
	gelClient,
	projectId,
}: {
	gelClient: Client;
	projectId: string;
}): Promise<Project | null> => {
	const query = e.select(e.Project, (project) => ({
		id: true,
		title: true,
		description: true,
		workspace: { id: true },
		owner: { id: true, email: true },
		collaborators: { id: true, email: true },
		created_at: true,
		updated_at: true,
		deleted_at: true,
		document_count: true,
		entry_count: true,
		is_deleted: true,
		filter: e.op(
			e.op(project.id, "=", e.uuid(projectId)),
			"and",
			e.op("not", e.op("exists", project.deleted_at)),
		),
	}));

	const result = await query.run(gelClient);

	return result[0] ?? null;
};

export const updateProject = async ({
	gelClient,
	projectId,
	input,
}: {
	gelClient: Client;
	projectId: string;
	input: UpdateProjectInput;
}): Promise<Project> => {
	const updateFields: Record<string, unknown> = {
		updated_at: e.datetime_current(),
	};

	if (input.title !== undefined) {
		updateFields.title = input.title;
	}

	if (input.description !== undefined) {
		updateFields.description = input.description;
	}

	if (input.workspace !== undefined) {
		updateFields.workspace = input.workspace
			? e.assert_single(
					e.select(e.Workspace, (w) => ({
						filter: e.op(w.id, "=", e.uuid(input.workspace as string)),
					})),
				)
			: null;
	}

	const query = e.update(e.Project, (project) => ({
		filter: e.op(
			e.op(project.id, "=", e.uuid(projectId)),
			"and",
			e.op("not", e.op("exists", project.deleted_at)),
		),
		set: updateFields,
	}));

	const result = await query.run(gelClient);

	if (!result || result.length === 0) {
		throw new Error("Project not found or update failed");
	}

	return result[0] as Project;
};

export const softDeleteProject = async ({
	gelClient,
	projectId,
}: {
	gelClient: Client;
	projectId: string;
}): Promise<{ id: string; deleted_at: Date }> => {
	const query = e.update(e.Project, (project) => ({
		filter: e.op(
			e.op(project.id, "=", e.uuid(projectId)),
			"and",
			e.op("not", e.op("exists", project.deleted_at)),
		),
		set: {
			deleted_at: e.datetime_current(),
		},
	}));

	const result = await query.run(gelClient);

	if (!result || result.length === 0) {
		throw new Error("Project not found or already deleted");
	}

	return result[0] as { id: string; deleted_at: Date };
};

export const insertEvent = async ({
	gelClient,
	projectId,
	entityType,
	entityId,
	action,
	metadata,
}: {
	gelClient: Client;
	projectId: string;
	entityType: string;
	entityId: string;
	action: string;
	metadata?: Record<string, unknown>;
}): Promise<void> => {
	const query = e.insert(e.Event, {
		project: e.assert_single(
			e.select(e.Project, (p) => ({
				filter: e.op(p.id, "=", e.uuid(projectId)),
			})),
		),
		actor: e.global.current_user,
		entity_type: e.cast(e.EntityType, entityType),
		entity_id: e.uuid(entityId),
		action,
		metadata: metadata ? e.json(JSON.stringify(metadata)) : null,
	});

	await query.run(gelClient);
};
