import {
	defaultGlobals,
	visualRegressionTestConfig,
} from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/react";
import { ProjectList } from "../../project-list";

export default {
	title: "Projects/ProjectList/tests/Visual Regression Tests",
	component: ProjectList,
	tags: ["visual-regression"],
	parameters: {
		...visualRegressionTestConfig,
		layout: "padded",
	},
} satisfies Meta<typeof ProjectList>;

const mockProjects = [
	{
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
	},
	{
		id: "project-2",
		title: "NIV Study Bible",
		description: null,
		project_dir: "niv-study-bible",
		source_document: {
			id: "doc-2",
			title: "Study Bible",
			file_name: "niv-study-bible.pdf",
			file_size: 52428800,
			page_count: 2048,
			storage_key: "storage-key-2",
		},
	},
	{
		id: "project-3",
		title: "Systematic Theology",
		description: "Complete systematic theology in multiple volumes",
		project_dir: "systematic-theology",
		source_document: {
			id: "doc-3",
			title: "Systematic Theology",
			file_name: "systematic-theology.pdf",
			file_size: 157286400,
			page_count: 3500,
			storage_key: "storage-key-3",
		},
	},
];

export const DefaultLight: StoryObj<typeof ProjectList> = {
	args: {
		projects: mockProjects,
		isLoading: false,
		onDeleteClick: () => {},
	},
	globals: {
		...defaultGlobals,
		theme: "light",
	},
};

export const DefaultDark: StoryObj<typeof ProjectList> = {
	args: {
		projects: mockProjects,
		isLoading: false,
		onDeleteClick: () => {},
	},
	parameters: {
		backgrounds: { default: "dark" },
	},
	globals: {
		...defaultGlobals,
		theme: "dark",
	},
};

export const EmptyStateLight: StoryObj<typeof ProjectList> = {
	args: {
		projects: [],
		isLoading: false,
		onDeleteClick: () => {},
		onCreateClick: () => {},
	},
	globals: {
		...defaultGlobals,
		theme: "light",
	},
};

export const EmptyStateDark: StoryObj<typeof ProjectList> = {
	args: {
		projects: [],
		isLoading: false,
		onDeleteClick: () => {},
		onCreateClick: () => {},
	},
	parameters: {
		backgrounds: { default: "dark" },
	},
	globals: {
		...defaultGlobals,
		theme: "dark",
	},
};

export const LoadingStateLight: StoryObj<typeof ProjectList> = {
	args: {
		projects: [],
		isLoading: true,
		onDeleteClick: () => {},
	},
	globals: {
		...defaultGlobals,
		theme: "light",
	},
};

export const MobileLight: StoryObj<typeof ProjectList> = {
	args: {
		projects: mockProjects,
		isLoading: false,
		onDeleteClick: () => {},
	},
	globals: {
		...defaultGlobals,
		theme: "light",
		viewport: { value: "mobile1" },
	},
};

export const TabletLight: StoryObj<typeof ProjectList> = {
	args: {
		projects: mockProjects,
		isLoading: false,
		onDeleteClick: () => {},
	},
	globals: {
		...defaultGlobals,
		theme: "light",
		viewport: { value: "tablet" },
	},
};
