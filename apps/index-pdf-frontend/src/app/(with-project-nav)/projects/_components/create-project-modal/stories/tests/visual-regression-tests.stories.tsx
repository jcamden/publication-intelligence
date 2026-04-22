import { defaultGlobals, defaultVrtMeta } from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { userEvent, within } from "storybook/test";
import { CreateProjectModal } from "../../create-project-modal";
import { vrtDuplicateTitleAndDirectoryInCreateModal } from "../helpers/steps";

export default {
	...defaultVrtMeta,
	title: "Projects/CreateProjectModal/tests/Visual Regression Tests",
	component: CreateProjectModal,
	parameters: {
		...defaultVrtMeta.parameters,
		layout: "fullscreen",
	},
} satisfies Meta<typeof CreateProjectModal>;

export const DefaultLight: StoryObj<typeof CreateProjectModal> = {
	args: {
		open: true,
		onOpenChange: () => {},
		onSuccess: () => {},
		existingProjects: [],
	},
	globals: {
		...defaultGlobals,
		theme: "light",
	},
};

export const DefaultDark: StoryObj<typeof CreateProjectModal> = {
	args: {
		open: true,
		onOpenChange: () => {},
		onSuccess: () => {},
		existingProjects: [],
	},

	globals: {
		...defaultGlobals,
		theme: "dark",

		backgrounds: {
			value: "dark",
		},
	},
};

export const WithValidationErrorsLight: StoryObj<typeof CreateProjectModal> = {
	args: {
		open: true,
		onOpenChange: () => {},
		onSuccess: () => {},
		existingProjects: [
			{ project_dir: "existing-project", title: "Existing Project" },
		],
	},
	globals: {
		...defaultGlobals,
		theme: "light",
	},
	play: async ({ step }) => {
		const user = userEvent.setup();
		const body = within(document.body);
		await vrtDuplicateTitleAndDirectoryInCreateModal({ body, user, step });
	},
};

export const WithValidationErrorsDark: StoryObj<typeof CreateProjectModal> = {
	args: {
		open: true,
		onOpenChange: () => {},
		onSuccess: () => {},
		existingProjects: [
			{ project_dir: "existing-project", title: "Existing Project" },
		],
	},

	globals: {
		...defaultGlobals,
		theme: "dark",

		backgrounds: {
			value: "dark",
		},
	},

	play: async ({ step }) => {
		const user = userEvent.setup();
		const body = within(document.body);
		await vrtDuplicateTitleAndDirectoryInCreateModal({ body, user, step });
	},
};
