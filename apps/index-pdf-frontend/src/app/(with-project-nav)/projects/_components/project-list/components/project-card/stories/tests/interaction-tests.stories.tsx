import { defaultInteractionTestMeta } from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/react";
import { userEvent, within } from "@storybook/test";
import { ProjectCard } from "../../project-card";
import {
	cardLinkVisibleWithHref,
	hoverCardAndClickSettings,
	settingsButtonInDocumentAfterHoverCard,
	settingsButtonStillInDocument,
} from "../helpers/steps";

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
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);
		await cardLinkVisibleWithHref({
			canvas,
			expectedHref: "/projects/wbc-daniel/editor",
			step,
		});
	},
};

export const SettingsButtonAppearsOnHover: StoryObj<typeof ProjectCard> = {
	args: {
		project: mockProject,
		onSettingsClick: () => {},
	},
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);
		const user = userEvent.setup();
		await settingsButtonInDocumentAfterHoverCard({ canvas, user, step });
	},
};

export const SettingsButtonTriggersCallback: StoryObj<typeof ProjectCard> = {
	args: {
		project: mockProject,
		onSettingsClick: () => {},
	},
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);
		const user = userEvent.setup();
		await hoverCardAndClickSettings({ canvas, user, step });
	},
};

export const SettingsButtonStopsPropagation: StoryObj<typeof ProjectCard> = {
	args: {
		project: mockProject,
		onSettingsClick: () => {},
	},
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);
		const user = userEvent.setup();
		await hoverCardAndClickSettings({ canvas, user, step });
		await settingsButtonStillInDocument({ canvas, step });
	},
};
