import {
	defaultGlobals,
	visualRegressionTestConfig,
} from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/react";
import { DeleteProjectDialog } from "../../delete-project-dialog";

export default {
	title: "Projects/DeleteProjectDialog/tests/Visual Regression Tests",
	component: DeleteProjectDialog,
	tags: ["visual-regression"],
	parameters: {
		...visualRegressionTestConfig,
		layout: "centered",
	},
} satisfies Meta<typeof DeleteProjectDialog>;

export const DefaultLight: StoryObj<typeof DeleteProjectDialog> = {
	args: {
		projectId: "project-123",
		onOpenChange: () => {},
		onSuccess: () => {},
	},
	globals: {
		...defaultGlobals,
		theme: "light",
		viewport: { value: "mobile1" },
	},
};

export const DefaultDark: StoryObj<typeof DeleteProjectDialog> = {
	args: {
		projectId: "project-456",
		onOpenChange: () => {},
		onSuccess: () => {},
	},
	parameters: {
		backgrounds: { default: "dark" },
	},
	globals: {
		...defaultGlobals,
		theme: "dark",
		viewport: { value: "mobile1" },
	},
};
