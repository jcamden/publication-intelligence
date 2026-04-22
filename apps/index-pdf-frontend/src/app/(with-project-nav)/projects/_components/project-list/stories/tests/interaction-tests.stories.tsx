import { defaultInteractionTestMeta } from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { userEvent, within } from "storybook/test";
import { ProjectList } from "../../project-list";
import {
	cardLinkCountAndFirstHref,
	emptyStateAndCreateButtonVisible,
	hoverFirstCardAndClickFirstSettings,
	loadingSkeletonCardsExist,
	threeMockProjectTitlesAreVisible,
} from "../helpers/steps";

export default {
	...defaultInteractionTestMeta,
	title: "Projects/ProjectList/tests/Interaction Tests",
	component: ProjectList,
	parameters: {
		...defaultInteractionTestMeta.parameters,
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

export const DisplaysProjects: StoryObj<typeof ProjectList> = {
	args: {
		projects: mockProjects,
		isLoading: false,
		onSettingsClick: () => {},
	},
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);
		await threeMockProjectTitlesAreVisible({ canvas, step });
	},
};

export const ShowsLoadingState: StoryObj<typeof ProjectList> = {
	args: {
		projects: [],
		isLoading: true,
		onSettingsClick: () => {},
	},
	play: async ({ canvasElement, step }) => {
		await loadingSkeletonCardsExist({ canvasElement, step });
	},
};

export const ShowsEmptyState: StoryObj<typeof ProjectList> = {
	args: {
		projects: [],
		isLoading: false,
		onSettingsClick: () => {},
		onCreateClick: () => {},
	},
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);
		await emptyStateAndCreateButtonVisible({ canvas, step });
	},
};

export const SettingsButtonsWork: StoryObj<typeof ProjectList> = {
	args: {
		projects: mockProjects,
		isLoading: false,
		onSettingsClick: () => {},
	},
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);
		const user = userEvent.setup();
		await hoverFirstCardAndClickFirstSettings({ canvas, user, step });
	},
};

export const ProjectCardsAreClickable: StoryObj<typeof ProjectList> = {
	args: {
		projects: mockProjects,
		isLoading: false,
		onSettingsClick: () => {},
	},
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);
		await cardLinkCountAndFirstHref({
			canvas,
			expectedCount: mockProjects.length,
			firstHref: "/projects/wbc-daniel/editor",
			step,
		});
	},
};
