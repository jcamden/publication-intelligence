import { defaultInteractionTestMeta } from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/react";
import { userEvent, within } from "@storybook/test";
import { EditProjectModal } from "../../edit-project-modal";
import {
	blurByPressingTab,
	clearAndFillProjectDir,
	clearAndFillProjectTitle,
	clickDeleteProjectButton,
	deleteConfirmationDialogIsVisible,
	deleteConfirmationInputIsRequired,
	pauseForDebouncedProjectDirUpdate,
	projectDataIsLoaded,
	projectDirAlreadyInUseErrorIsNotVisible,
	projectDirAlreadyInUseErrorIsVisible,
	projectTitleAlreadyExistsErrorIsNotVisible,
	projectTitleAlreadyExistsErrorIsVisible,
	projectTitleInputHasValue,
	waitForEditProjectModal,
} from "../helpers/steps";

export default {
	...defaultInteractionTestMeta,
	title: "Projects/EditProjectModal/tests/Interaction Tests",
	component: EditProjectModal,
	parameters: {
		...defaultInteractionTestMeta.parameters,
		layout: "centered",
	},
} satisfies Meta<typeof EditProjectModal>;

export const DeleteButtonOpensConfirmation: StoryObj<typeof EditProjectModal> =
	{
		args: {
			open: true,
			onOpenChange: () => {},
			onSuccess: () => {},
			projectId: "project-123",
			existingProjects: [],
		},
		play: async ({ step }) => {
			const user = userEvent.setup();
			const body = within(document.body);

			await waitForEditProjectModal({ body, step });
			await projectDataIsLoaded({ body, step });
			await clickDeleteProjectButton({ body, user, step });
			await deleteConfirmationDialogIsVisible({ body, step });
			await deleteConfirmationInputIsRequired({ body, step });
		},
	};

export const ShowsErrorWhenTitleMatchesOtherProject: StoryObj<
	typeof EditProjectModal
> = {
	args: {
		open: true,
		onOpenChange: () => {},
		onSuccess: () => {},
		projectId: "project-123",
		existingProjects: [
			{ project_dir: "test-project", title: "Test Project Title" },
			{ project_dir: "another-project", title: "Another Project" },
		],
	},
	play: async ({ step }) => {
		const user = userEvent.setup();
		const body = within(document.body);

		await waitForEditProjectModal({ body, step });
		await projectDataIsLoaded({ body, step });
		// Intent: set title to match another project.
		await clearAndFillProjectTitle({
			body,
			user,
			title: "Another Project",
			step,
		});
		await blurByPressingTab({ user, step });
		await projectTitleAlreadyExistsErrorIsVisible({ body, step });
	},
};

export const ShowsErrorWhenProjectDirMatchesOtherProject: StoryObj<
	typeof EditProjectModal
> = {
	args: {
		open: true,
		onOpenChange: () => {},
		onSuccess: () => {},
		projectId: "project-123",
		existingProjects: [
			{ project_dir: "test-project", title: "Test Project Title" },
			{ project_dir: "another-project", title: "Another Project" },
		],
	},
	play: async ({ step }) => {
		const user = userEvent.setup();
		const body = within(document.body);

		await waitForEditProjectModal({ body, step });
		await projectDataIsLoaded({ body, step });
		// Intent: set project directory to match another project.
		await clearAndFillProjectDir({
			body,
			user,
			projectDir: "another-project",
			step,
		});
		await blurByPressingTab({ user, step });
		await projectDirAlreadyInUseErrorIsVisible({ body, step });
	},
};

export const AllowsKeepingSameTitle: StoryObj<typeof EditProjectModal> = {
	args: {
		open: true,
		onOpenChange: () => {},
		onSuccess: () => {},
		projectId: "project-123",
		existingProjects: [
			{ project_dir: "test-project", title: "Test Project Title" },
			{ project_dir: "another-project", title: "Another Project" },
		],
	},
	play: async ({ step }) => {
		const user = userEvent.setup();
		const body = within(document.body);

		await waitForEditProjectModal({ body, step });
		await projectDataIsLoaded({ body, step });
		await projectTitleInputHasValue({
			body,
			expectedTitle: "Test Project Title",
			step,
		});
		await blurByPressingTab({ user, step });
		await projectTitleAlreadyExistsErrorIsNotVisible({ body, step });
	},
};

export const AllowsKeepingSameProjectDir: StoryObj<typeof EditProjectModal> = {
	args: {
		open: true,
		onOpenChange: () => {},
		onSuccess: () => {},
		projectId: "project-123",
		existingProjects: [
			{ project_dir: "test-project", title: "Test Project Title" },
			{ project_dir: "another-project", title: "Another Project" },
		],
	},
	play: async ({ step }) => {
		const user = userEvent.setup();
		const body = within(document.body);

		await waitForEditProjectModal({ body, step });
		await projectDataIsLoaded({ body, step });
		// Intent: change title (which updates project_dir), then revert project_dir.
		await clearAndFillProjectTitle({
			body,
			user,
			title: "Updated Title",
			step,
		});
		await pauseForDebouncedProjectDirUpdate({ step });
		await clearAndFillProjectDir({
			body,
			user,
			projectDir: "test-project",
			step,
		});
		await blurByPressingTab({ user, step });
		await projectDirAlreadyInUseErrorIsNotVisible({ body, step });
	},
};
