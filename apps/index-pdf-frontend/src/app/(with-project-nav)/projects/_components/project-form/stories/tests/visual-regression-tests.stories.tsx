import { defaultGlobals, defaultVrtMeta } from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/react";
import { within } from "@storybook/test";
import { ProjectForm } from "../../project-form";
import {
	vrtFillTitleDescriptionAndWaitForDirectorySlug,
	vrtShowDuplicateTitleAndProjectDirectoryErrors,
} from "../helpers/steps";

export default {
	...defaultVrtMeta,
	title: "Projects/ProjectForm/tests/Visual Regression Tests",
	component: ProjectForm,
	parameters: {
		...defaultVrtMeta.parameters,
		layout: "padded",
	},
} satisfies Meta<typeof ProjectForm>;

export const DefaultLight: StoryObj<typeof ProjectForm> = {
	args: {
		onSuccess: () => {},
		onCancel: () => {},
		existingProjects: [],
	},
	globals: {
		...defaultGlobals,
		theme: "light",
	},
};

export const DefaultDark: StoryObj<typeof ProjectForm> = {
	args: {
		onSuccess: () => {},
		onCancel: () => {},
		existingProjects: [],
	},
	parameters: {
		backgrounds: { default: "dark" },
	},
	globals: {
		...defaultGlobals,
		theme: "dark",
	},
};

export const WithValidationErrorsLight: StoryObj<typeof ProjectForm> = {
	args: {
		onSuccess: () => {},
		onCancel: () => {},
		existingProjects: [
			{ project_dir: "existing-project", title: "Existing Project" },
		],
	},
	globals: {
		...defaultGlobals,
		theme: "light",
	},
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);
		await vrtShowDuplicateTitleAndProjectDirectoryErrors({ canvas, step });
	},
};

export const WithValidationErrorsDark: StoryObj<typeof ProjectForm> = {
	args: {
		onSuccess: () => {},
		onCancel: () => {},
		existingProjects: [
			{ project_dir: "existing-project", title: "Existing Project" },
		],
	},
	parameters: {
		backgrounds: { default: "dark" },
	},
	globals: {
		...defaultGlobals,
		theme: "dark",
	},
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);
		await vrtShowDuplicateTitleAndProjectDirectoryErrors({ canvas, step });
	},
};

export const FilledFormLight: StoryObj<typeof ProjectForm> = {
	args: {
		onSuccess: () => {},
		onCancel: () => {},
		existingProjects: [],
	},
	globals: {
		...defaultGlobals,
		theme: "light",
	},
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);
		await vrtFillTitleDescriptionAndWaitForDirectorySlug({ canvas, step });
	},
};
