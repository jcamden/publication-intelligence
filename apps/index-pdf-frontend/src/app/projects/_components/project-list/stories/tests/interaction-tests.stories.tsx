import { defaultInteractionTestMeta } from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within } from "@storybook/test";
import { ProjectList } from "../../project-list";

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
		onDeleteClick: () => {},
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// Verify all project titles are visible
		await expect(
			canvas.getByText("Word Biblical Commentary: Daniel"),
		).toBeVisible();
		await expect(canvas.getByText("NIV Study Bible")).toBeVisible();
		await expect(canvas.getByText("Systematic Theology")).toBeVisible();
	},
};

export const ShowsLoadingState: StoryObj<typeof ProjectList> = {
	args: {
		projects: [],
		isLoading: true,
		onDeleteClick: () => {},
	},
	play: async ({ canvasElement }) => {
		// Verify loading skeleton cards are present (they have animate-pulse class)
		const skeletonCards = canvasElement.querySelectorAll(".animate-pulse");
		expect(skeletonCards.length).toBeGreaterThan(0);
	},
};

export const ShowsEmptyState: StoryObj<typeof ProjectList> = {
	args: {
		projects: [],
		isLoading: false,
		onDeleteClick: () => {},
		onCreateClick: () => {},
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// Verify empty state message
		const emptyMessage = canvas.getByText(/no projects yet/i);
		await expect(emptyMessage).toBeVisible();

		// Verify create button is present
		const createButton = canvas.getByRole("button", {
			name: /create.*project/i,
		});
		await expect(createButton).toBeVisible();
	},
};

export const DeleteButtonsWork: StoryObj<typeof ProjectList> = {
	args: {
		projects: mockProjects,
		isLoading: false,
		onDeleteClick: () => {},
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const user = userEvent.setup();

		// Delete buttons exist (with opacity-0 initially)
		const deleteButtons = canvas.getAllByRole("button", {
			name: /delete project/i,
		});
		expect(deleteButtons.length).toBeGreaterThan(0);

		// Find first project card and hover to reveal delete button
		const firstCard = canvas.getAllByRole("link")[0];
		await user.hover(firstCard);

		// Click delete button (it's now visible via group-hover)
		await user.click(deleteButtons[0]);
	},
};

export const ProjectCardsAreClickable: StoryObj<typeof ProjectList> = {
	args: {
		projects: mockProjects,
		isLoading: false,
		onDeleteClick: () => {},
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// Verify all cards are links
		const cards = canvas.getAllByRole("link");
		await expect(cards.length).toBe(mockProjects.length);

		// Verify first card has correct href
		await expect(cards[0]).toHaveAttribute(
			"href",
			"/projects/wbc-daniel/editor",
		);
	},
};
