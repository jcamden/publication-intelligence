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
				workspace := (SELECT Workspace FILTER .id = <optional uuid>$workspaceId),
				owner := global current_user,
				collaborators := {}
			}
		) {
			id,
			title,
			description,
			workspace: { id },
			owner: { id, email },
			collaborators: { id, email },
			created_at,
			updated_at,
			deleted_at,
			document_count,
			entry_count,
			is_deleted
		}
	`,
		{
			title: input.title,
			description: input.description ?? null,
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
	// Use raw EdgeQL to ensure access policies are respected
	const project = await gelClient.querySingle<Project | null>(
		`
		SELECT Project {
			id,
			title,
			description,
			workspace: { id },
			owner: { id, email },
			collaborators: { id, email },
			created_at,
			updated_at,
			deleted_at,
			document_count,
			entry_count,
			is_deleted
		}
		FILTER .id = <uuid>$projectId AND NOT EXISTS .deleted_at
	`,
		{ projectId },
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
}): Promise<Project> => {
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
				? "description := <str>{})"
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
			workspace: { id },
			owner: { id, email },
			collaborators: { id, email },
			created_at,
			updated_at,
			deleted_at,
			document_count,
			entry_count,
			is_deleted
		}
	`,
		params,
	);

	if (!project) {
		throw new Error("Project not found or update failed");
	}

	return project;
};

export const softDeleteProject = async ({
	gelClient,
	projectId,
}: {
	gelClient: Client;
	projectId: string;
}): Promise<{ id: string; deleted_at: Date }> => {
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

	if (!result) {
		throw new Error("Project not found or already deleted");
	}

	return result;
};
