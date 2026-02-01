import {
	defaultGlobals,
	visualRegressionTestConfig,
} from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/react";
import { ProjectCard } from "../../project-card";

export default {
	title: "Projects/ProjectCard/tests/Visual Regression Tests",
	component: ProjectCard,
	tags: ["visual-regression"],
	parameters: {
		...visualRegressionTestConfig,
		layout: "centered",
	},
	decorators: [
		(Story) => (
			<div className="w-[350px]">
				<Story />
			</div>
		),
	],
} satisfies Meta<typeof ProjectCard>;

const mockProject = {
	id: "project-1",
	title: "Word Biblical Commentary: Daniel",
	description: "A comprehensive theological and exegetical analysis",
	project_dir: "wbc-daniel",
	source_document: {
		id: "doc-1",
		title: "Daniel Commentary",
		file_name: "wbc-daniel.pdf",
		file_size: 15728640,
		page_count: 456,
		storage_key: "storage-key-1",
	},
};

export const DefaultLight: StoryObj<typeof ProjectCard> = {
	args: {
		project: mockProject,
		onDelete: () => {},
	},
	globals: {
		...defaultGlobals,
		theme: "light",
	},
};

export const DefaultDark: StoryObj<typeof ProjectCard> = {
	args: {
		project: mockProject,
		onDelete: () => {},
	},
	parameters: {
		backgrounds: { default: "dark" },
	},
	globals: {
		...defaultGlobals,
		theme: "dark",
	},
};

export const HoverStateLight: StoryObj<typeof ProjectCard> = {
	args: {
		project: mockProject,
		onDelete: () => {},
	},
	globals: {
		...defaultGlobals,
		theme: "light",
	},
	parameters: {
		pseudo: {
			hover: true,
		},
	},
	play: async () => {
		await new Promise((resolve) => setTimeout(resolve, 300));
	},
};

export const HoverStateDark: StoryObj<typeof ProjectCard> = {
	args: {
		project: mockProject,
		onDelete: () => {},
	},
	parameters: {
		backgrounds: { default: "dark" },
		pseudo: {
			hover: true,
		},
	},
	globals: {
		...defaultGlobals,
		theme: "dark",
	},
	play: async () => {
		await new Promise((resolve) => setTimeout(resolve, 300));
	},
};
