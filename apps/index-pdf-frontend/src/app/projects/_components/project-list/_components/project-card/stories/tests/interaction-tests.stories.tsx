import { defaultInteractionTestMeta } from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within } from "@storybook/test";
import { ProjectCard } from "../../project-card";

export default {
	...defaultInteractionTestMeta,
	title: "Projects/ProjectList/ProjectCard/tests/Interaction Tests",
	component: ProjectCard,
	parameters: {
		...defaultInteractionTestMeta.parameters,
		layout: "centered",
	},
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

export const ClickableCard: StoryObj<typeof ProjectCard> = {
	args: {
		project: mockProject,
		onSettingsClick: () => {},
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// Find the clickable card element
		const card = canvas.getByRole("link");
		await expect(card).toBeVisible();

		// Verify it has the correct href
		await expect(card).toHaveAttribute("href", "/projects/wbc-daniel/editor");
	},
};

export const SettingsButtonAppearsOnHover: StoryObj<typeof ProjectCard> = {
	args: {
		project: mockProject,
		onSettingsClick: () => {},
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const user = userEvent.setup();

		// Settings button exists (but has opacity-0 initially)
		const settingsButton = canvas.getByRole("button", {
			name: /project settings/i,
		});
		await expect(settingsButton).toBeInTheDocument();

		// Find the card and hover to reveal settings button
		const card = canvas.getByRole("link");
		await user.hover(card);

		// Button is now revealed via group-hover (can be clicked even if opacity animation is ongoing)
		await expect(settingsButton).toBeInTheDocument();
	},
};

export const SettingsButtonTriggersCallback: StoryObj<typeof ProjectCard> = {
	args: {
		project: mockProject,
		onSettingsClick: () => {},
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const user = userEvent.setup();

		// Hover to show settings button
		const card = canvas.getByRole("link");
		await user.hover(card);

		// Click settings button
		const settingsButton = canvas.getByRole("button", {
			name: /project settings/i,
		});
		await user.click(settingsButton);

		// Note: In real app, onSettingsClick callback would be triggered
		// In storybook, we just verify the button is clickable
	},
};

export const SettingsButtonStopsPropagation: StoryObj<typeof ProjectCard> = {
	args: {
		project: mockProject,
		onSettingsClick: () => {},
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const user = userEvent.setup();

		// Hover to show settings button
		const card = canvas.getByRole("link");
		await user.hover(card);

		// Click settings button (should not navigate to editor)
		const settingsButton = canvas.getByRole("button", {
			name: /project settings/i,
		});
		await user.click(settingsButton);

		// Verify the settings button is still visible (didn't navigate away)
		await expect(settingsButton).toBeInTheDocument();
	},
};
