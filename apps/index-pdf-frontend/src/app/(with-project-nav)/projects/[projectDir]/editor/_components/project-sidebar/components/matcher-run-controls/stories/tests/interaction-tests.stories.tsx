import { defaultInteractionTestMeta } from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { within } from "storybook/test";
import { MatcherRunControls } from "../../matcher-run-controls";
import {
	invalidSelectionShowsInlineError,
	noGroupsClickRunAllMatchersCallsRunMatcher,
	noGroupsShowsRunAllMatchersButton,
	runAllAndGroupSelectMutuallyExclusive,
	submitWithRunAllCallsRunMatcher,
	withGroupsShowsRunButtonAndGroupList,
} from "../helpers/steps";

const meta: Meta<typeof MatcherRunControls> = {
	...defaultInteractionTestMeta,
	title:
		"Projects/[ProjectDir]/Editor/ProjectSidebar/MatcherRunControls/tests/Interaction Tests",
	component: MatcherRunControls,
	parameters: {
		layout: "centered",
	},
	args: {
		projectId: "mock-project-id",
		projectIndexTypeId: "mock-pit-subject-id",
		indexType: "subject",
		emptyStateMessage:
			"Create groups and matchers in this index, then run detection.",
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

export const NoGroupsShowsRunAllMatchersButton: Story = {
	args: {
		projectId: "empty-groups-project",
		projectIndexTypeId: "mock-pit-subject-id",
		indexType: "subject",
		emptyStateMessage:
			"Create groups and matchers in this index, then run detection.",
	},
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);
		await noGroupsShowsRunAllMatchersButton({ canvas, step });
	},
};

export const NoGroupsClickRunAllMatchersCallsRunMatcher: Story = {
	args: {
		projectId: "empty-groups-project",
		projectIndexTypeId: "mock-pit-subject-id",
		indexType: "subject",
		emptyStateMessage:
			"Create groups and matchers in this index, then run detection.",
	},
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);
		await noGroupsClickRunAllMatchersCallsRunMatcher({ canvas, step });
	},
};

export const WithGroupsShowsRunButtonAndGroupList: Story = {
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);
		await withGroupsShowsRunButtonAndGroupList({ canvas, step });
	},
};

export const RunAllAndGroupSelectMutuallyExclusive: Story = {
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);
		await runAllAndGroupSelectMutuallyExclusive({ canvas, step });
	},
};

export const InvalidSelectionShowsInlineError: Story = {
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);
		await invalidSelectionShowsInlineError({ canvas, step });
	},
};

export const SubmitWithRunAllCallsRunMatcher: Story = {
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);
		await submitWithRunAllCallsRunMatcher({ canvas, step });
	},
};
