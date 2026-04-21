import { defaultInteractionTestMeta } from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/react";
import { within } from "@storybook/test";
import { ProjectForm } from "../../project-form";
import {
	autoPopulatesProjectDir,
	descriptionIsOptional,
	editModeAllowsSameProjectDirAsOriginal,
	editModeAllowsSameTitleAsOriginal,
	editModeBlocksDuplicateProjectDirFromOtherProject,
	editModeBlocksDuplicateTitleFromOtherProject,
	editModeCanModifyTitle,
	editModePrePopulatesFields,
	editModeProjectDirIsEditable,
	editModeShowsPdfThumbnail,
	editModeSubmitButtonAlwaysEnabled,
	manualProjectDirStopsAutoPopulation,
	showsDuplicateProjectDirError,
	showsDuplicateTitleError,
	showsInvalidProjectDirError,
	submitButtonDisabledWithoutFile,
} from "../helpers/steps";

export default {
	...defaultInteractionTestMeta,
	title: "Projects/ProjectForm/tests/Interaction Tests",
	component: ProjectForm,
	parameters: {
		...defaultInteractionTestMeta.parameters,
		layout: "padded",
	},
} satisfies Meta<typeof ProjectForm>;

export const SubmitButtonDisabledWithoutFile: StoryObj<typeof ProjectForm> = {
	args: {
		onSuccess: () => {},
		onCancel: () => {},
		existingProjects: [],
	},
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);
		await submitButtonDisabledWithoutFile({ canvas, step });
	},
};

export const AutoPopulatesProjectDir: StoryObj<typeof ProjectForm> = {
	args: {
		onSuccess: () => {},
		onCancel: () => {},
		existingProjects: [],
	},
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);
		await autoPopulatesProjectDir({ canvas, step });
	},
};

export const ManualProjectDirStopsAutoPopulation: StoryObj<typeof ProjectForm> =
	{
		args: {
			onSuccess: () => {},
			onCancel: () => {},
			existingProjects: [],
		},
		play: async ({ canvasElement, step }) => {
			const canvas = within(canvasElement);
			await manualProjectDirStopsAutoPopulation({ canvas, step });
		},
	};

export const ShowsDuplicateProjectDirError: StoryObj<typeof ProjectForm> = {
	args: {
		onSuccess: () => {},
		onCancel: () => {},
		existingProjects: [
			{ project_dir: "existing-project", title: "Existing Project" },
		],
	},
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);
		await showsDuplicateProjectDirError({ canvas, step });
	},
};

export const ShowsDuplicateTitleError: StoryObj<typeof ProjectForm> = {
	args: {
		onSuccess: () => {},
		onCancel: () => {},
		existingProjects: [{ project_dir: "test-proj", title: "Test Project" }],
	},
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);
		await showsDuplicateTitleError({ canvas, step });
	},
};

export const ShowsInvalidProjectDirError: StoryObj<typeof ProjectForm> = {
	args: {
		onSuccess: () => {},
		onCancel: () => {},
		existingProjects: [],
	},
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);
		await showsInvalidProjectDirError({ canvas, step });
	},
};

export const DescriptionIsOptional: StoryObj<typeof ProjectForm> = {
	args: {
		onSuccess: () => {},
		onCancel: () => {},
		existingProjects: [],
	},
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);
		await descriptionIsOptional({ canvas, step });
	},
};

export const EditModePrePopulatesFields: StoryObj<typeof ProjectForm> = {
	args: {
		mode: "edit",
		projectId: "project-123",
		initialData: {
			title: "Existing Project Title",
			description: "Existing description",
			project_dir: "existing-project",
			selectedIndexTypes: ["subject", "author"],
			sourceDocument: {
				id: "doc-1",
				title: "Document Title",
				file_name: "existing-document.pdf",
				file_size: 1024000,
				page_count: 250,
			},
		},
		onSuccess: () => {},
		onCancel: () => {},
		existingProjects: [],
	},
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);
		await editModePrePopulatesFields({ canvas, step });
	},
};

export const EditModeShowsPdfThumbnail: StoryObj<typeof ProjectForm> = {
	args: {
		mode: "edit",
		projectId: "project-123",
		initialData: {
			title: "Test Project",
			description: null,
			project_dir: "test-project",
			selectedIndexTypes: ["subject"],
			sourceDocument: {
				id: "doc-1",
				title: "Test Document",
				file_name: "test-document.pdf",
				file_size: 2048000,
				page_count: 100,
			},
		},
		onSuccess: () => {},
		onCancel: () => {},
		existingProjects: [],
	},
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);
		await editModeShowsPdfThumbnail({ canvas, step });
	},
};

export const EditModeProjectDirIsEditable: StoryObj<typeof ProjectForm> = {
	args: {
		mode: "edit",
		projectId: "project-123",
		initialData: {
			title: "Test Project",
			description: null,
			project_dir: "test-project",
			selectedIndexTypes: ["subject"],
			sourceDocument: null,
		},
		onSuccess: () => {},
		onCancel: () => {},
		existingProjects: [],
	},
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);
		await editModeProjectDirIsEditable({ canvas, step });
	},
};

export const EditModeSubmitButtonAlwaysEnabled: StoryObj<typeof ProjectForm> = {
	args: {
		mode: "edit",
		projectId: "project-123",
		initialData: {
			title: "Test Project",
			description: null,
			project_dir: "test-project",
			selectedIndexTypes: ["subject"],
			sourceDocument: null,
		},
		onSuccess: () => {},
		onCancel: () => {},
		existingProjects: [],
	},
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);
		await editModeSubmitButtonAlwaysEnabled({ canvas, step });
	},
};

export const EditModeCanModifyTitle: StoryObj<typeof ProjectForm> = {
	args: {
		mode: "edit",
		projectId: "project-123",
		initialData: {
			title: "Original Title",
			description: null,
			project_dir: "test-project",
			selectedIndexTypes: ["subject"],
			sourceDocument: null,
		},
		onSuccess: () => {},
		onCancel: () => {},
		existingProjects: [],
	},
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);
		await editModeCanModifyTitle({ canvas, step });
	},
};

export const EditModeAllowsSameTitleAsOriginal: StoryObj<typeof ProjectForm> = {
	args: {
		mode: "edit",
		projectId: "project-123",
		initialData: {
			title: "Original Title",
			description: null,
			project_dir: "test-project",
			selectedIndexTypes: ["subject"],
			sourceDocument: null,
		},
		onSuccess: () => {},
		onCancel: () => {},
		existingProjects: [
			{ project_dir: "test-project", title: "Original Title" },
		],
	},
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);
		await editModeAllowsSameTitleAsOriginal({ canvas, step });
	},
};

export const EditModeBlocksDuplicateTitleFromOtherProject: StoryObj<
	typeof ProjectForm
> = {
	args: {
		mode: "edit",
		projectId: "project-123",
		initialData: {
			title: "My Project",
			description: null,
			project_dir: "my-project",
			selectedIndexTypes: ["subject"],
			sourceDocument: null,
		},
		onSuccess: () => {},
		onCancel: () => {},
		existingProjects: [
			{ project_dir: "my-project", title: "My Project" },
			{ project_dir: "other-project", title: "Other Project" },
		],
	},
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);
		await editModeBlocksDuplicateTitleFromOtherProject({ canvas, step });
	},
};

export const EditModeAllowsSameProjectDirAsOriginal: StoryObj<
	typeof ProjectForm
> = {
	args: {
		mode: "edit",
		projectId: "project-123",
		initialData: {
			title: "Test Project",
			description: null,
			project_dir: "test-project",
			selectedIndexTypes: ["subject"],
			sourceDocument: null,
		},
		onSuccess: () => {},
		onCancel: () => {},
		existingProjects: [{ project_dir: "test-project", title: "Test Project" }],
	},
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);
		await editModeAllowsSameProjectDirAsOriginal({ canvas, step });
	},
};

export const EditModeBlocksDuplicateProjectDirFromOtherProject: StoryObj<
	typeof ProjectForm
> = {
	args: {
		mode: "edit",
		projectId: "project-123",
		initialData: {
			title: "My Project",
			description: null,
			project_dir: "my-project",
			selectedIndexTypes: ["subject"],
			sourceDocument: null,
		},
		onSuccess: () => {},
		onCancel: () => {},
		existingProjects: [
			{ project_dir: "my-project", title: "My Project" },
			{ project_dir: "other-project", title: "Other Project" },
		],
	},
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);
		await editModeBlocksDuplicateProjectDirFromOtherProject({ canvas, step });
	},
};
