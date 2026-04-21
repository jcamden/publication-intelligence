import { defaultInteractionTestMeta } from "@pubint/storybook-config";
import { pressTab } from "@pubint/yaboujee/_stories";
import type { Meta, StoryObj } from "@storybook/react";
import { userEvent, within } from "@storybook/test";
import { CreateProjectModal } from "../../create-project-modal";
import {
	blurProjectDirInput,
	expectCreateProjectSubmitDisabled,
	expectProjectDirAlreadyExistsError,
	expectTitleAlreadyExistsError,
	fillProjectDirInput,
	fillProjectTitleInput,
	setProjectTitleAtomically,
	waitForCreateProjectModal,
	waitForProjectDirSlug,
} from "../helpers/steps";

export default {
	...defaultInteractionTestMeta,
	title: "Projects/CreateProjectModal/tests/Interaction Tests",
	component: CreateProjectModal,
	parameters: {
		...defaultInteractionTestMeta.parameters,
		layout: "centered",
	},
} satisfies Meta<typeof CreateProjectModal>;

export const ShowsErrorWhenProjectDirAlreadyExists: StoryObj<
	typeof CreateProjectModal
> = {
	args: {
		open: true,
		onOpenChange: () => {},
		onSuccess: () => {},
		existingProjects: [
			{ project_dir: "existing-project", title: "Existing Project" },
		],
	},
	play: async ({ step }) => {
		const user = userEvent.setup({ delay: 20 });
		const body = within(document.body);

		await waitForCreateProjectModal({ body, step });
		await expectCreateProjectSubmitDisabled({ body, step });
		// Intent: enter a project directory that already exists.
		await fillProjectDirInput({
			body,
			user,
			projectDir: "existing-project",
			step,
		});
		await blurProjectDirInput({ body, step });
		await expectProjectDirAlreadyExistsError({ body, step });
	},
};

export const ShowsErrorWhenTitleAlreadyExists: StoryObj<
	typeof CreateProjectModal
> = {
	args: {
		open: true,
		onOpenChange: () => {},
		onSuccess: () => {},
		existingProjects: [{ project_dir: "test-project", title: "Test Project" }],
	},
	play: async ({ step }) => {
		const user = userEvent.setup({ delay: 20 });
		const body = within(document.body);

		await waitForCreateProjectModal({ body, step });
		// Intent: enter a title that already exists (case-insensitive).
		await fillProjectTitleInput({ body, user, title: "test project", step });
		await pressTab({ user, step });
		await expectTitleAlreadyExistsError({ body, step });
	},
};

export const AutoPopulatesProjectDir: StoryObj<typeof CreateProjectModal> = {
	args: {
		open: true,
		onOpenChange: () => {},
		onSuccess: () => {},
		existingProjects: [],
	},
	play: async ({ step }) => {
		// No per-keystroke delay: a 500ms title debounce can otherwise fire mid-typing
		// (e.g. while only "W" is in the field) and leave project_dir stuck at "w".
		const user = userEvent.setup();

		// Modal renders in portal - query from document.body
		const body = within(document.body);

		const fullTitle = "Word Biblical Commentary: Daniel";

		await waitForCreateProjectModal({ body, step });
		await setProjectTitleAtomically({ body, user, title: fullTitle, step });
		await waitForProjectDirSlug({
			body,
			expectedSlug: "word-biblical-commentary-daniel",
			step,
		});
	},
};
