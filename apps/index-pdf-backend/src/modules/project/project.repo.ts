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
	// Use raw EdgeQL for inserts that need global current_user
	// edgeql-js doesn't properly support custom globals yet
	const project = await gelClient.querySingle<Project>(
		`
		SELECT (
			INSERT Project {
				title := <str>$title,
				description := <optional str>$description,
				project_dir := <str>$projectDir,
				workspace := (SELECT Workspace FILTER .id = <optional uuid>$workspaceId),
				owner := global current_user,
				collaborators := {}
			}
		) {
			id,
			title,
			description,
			project_dir,
			workspace: { id },
			owner: { id, email },
			collaborators: { id, email },
			created_at,
			updated_at,
			deleted_at,
			has_document,
			entry_count,
			is_deleted
		}
	`,
		{
			title: input.title,
			description: input.description ?? null,
			projectDir: input.project_dir,
			workspaceId: input.workspace ?? null,
		},
	);

	if (!project) {
		throw new Error("Failed to create project");
	}

	return project;
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
		project_dir: true,
		entry_count: true,
		created_at: true,
		updated_at: true,
		source_document: {
			id: true,
			title: true,
			file_name: true,
			file_size: true,
			page_count: true,
			storage_key: true,
			status: true,
		},
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
	// Use raw EdgeQL to ensure access policies are respected
	const project = await gelClient.querySingle<Project | null>(
		`
		SELECT Project {
			id,
			title,
			description,
			project_dir,
			workspace: { id },
			owner: { id, email },
			collaborators: { id, email },
			created_at,
			updated_at,
			deleted_at,
			has_document,
			entry_count,
			is_deleted
		}
		FILTER .id = <uuid>$projectId AND NOT EXISTS .deleted_at
	`,
		{ projectId },
	);

	return project;
};

export const getProjectByDir = async ({
	gelClient,
	projectDir,
}: {
	gelClient: Client;
	projectDir: string;
}): Promise<Project | null> => {
	// Use raw EdgeQL to ensure access policies are respected
	const project = await gelClient.querySingle<Project | null>(
		`
		SELECT Project {
			id,
			title,
			description,
			project_dir,
			workspace: { id },
			owner: { id, email },
			collaborators: { id, email },
			created_at,
			updated_at,
			deleted_at,
			has_document,
			entry_count,
			is_deleted
		}
		FILTER .project_dir = <str>$projectDir AND NOT EXISTS .deleted_at
	`,
		{ projectDir },
	);

	return project;
};

export const updateProject = async ({
	gelClient,
	projectId,
	input,
}: {
	gelClient: Client;
	projectId: string;
	input: UpdateProjectInput;
}): Promise<Project | null> => {
	// Build dynamic EdgeQL for conditional updates
	const setFields: string[] = ["updated_at := datetime_current()"];
	const params: Record<string, unknown> = { projectId };

	if (input.title !== undefined) {
		setFields.push("title := <str>$title");
		params.title = input.title;
	}

	if (input.description !== undefined) {
		setFields.push(
			input.description === null
				? "description := <str>{}"
				: "description := <str>$description",
		);
		if (input.description !== null) {
			params.description = input.description;
		}
	}

	if (input.workspace !== undefined) {
		if (input.workspace === null) {
			setFields.push("workspace := <Workspace>{}");
		} else {
			setFields.push(
				"workspace := (SELECT Workspace FILTER .id = <uuid>$workspaceId)",
			);
			params.workspaceId = input.workspace;
		}
	}

	const project = await gelClient.querySingle<Project>(
		`
		SELECT (
			UPDATE Project
			FILTER .id = <uuid>$projectId AND NOT EXISTS .deleted_at
			SET {
				${setFields.join(",\n\t\t\t\t")}
			}
		) {
			id,
			title,
			description,
			project_dir,
			workspace: { id },
			owner: { id, email },
			collaborators: { id, email },
			created_at,
			updated_at,
			deleted_at,
			has_document,
			entry_count,
			is_deleted
		}
	`,
		params,
	);

	// Return null if update failed (access policy violation or doesn't exist)
	// Service layer will use requireFound() to throw proper NOT_FOUND error
	return project;
};

export const softDeleteProject = async ({
	gelClient,
	projectId,
}: {
	gelClient: Client;
	projectId: string;
}): Promise<{ id: string; deleted_at: Date } | null> => {
	const result = await gelClient.querySingle<{
		id: string;
		deleted_at: Date;
	}>(
		`
		SELECT (
			UPDATE Project
			FILTER .id = <uuid>$projectId AND NOT EXISTS .deleted_at
			SET {
				deleted_at := datetime_current()
			}
		) {
			id,
			deleted_at
		}
	`,
		{ projectId },
	);

	// Return null if delete failed (access policy violation, doesn't exist, or already deleted)
	// Service layer will use requireFound() to throw proper NOT_FOUND error
	return result;
};
