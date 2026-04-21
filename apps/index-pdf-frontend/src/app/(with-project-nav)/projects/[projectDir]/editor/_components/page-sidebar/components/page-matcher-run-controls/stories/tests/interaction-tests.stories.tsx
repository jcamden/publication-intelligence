import { defaultInteractionTestMeta } from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/react";
import { within } from "@storybook/test";
import { PageMatcherRunControls } from "../../page-matcher-run-controls";
import {
	noGroupsShowsRunAllMatchersButton,
	runAllAndGroupSelectMutuallyExclusive,
	submitWithRunAllCallsRunMatcher,
	withGroupsShowsRunButtonAndGroupList,
} from "../helpers/steps";

const meta: Meta<typeof PageMatcherRunControls> = {
	...defaultInteractionTestMeta,
	title:
		"Projects/[ProjectDir]/Editor/PageSidebar/PageMatcherRunControls/tests/Interaction Tests",
	component: PageMatcherRunControls,
	parameters: {
		layout: "centered",
	},
	args: {
		projectId: "mock-project-id",
		projectIndexTypeId: "mock-pit-subject-id",
		indexType: "subject",
		documentId: "550e8400-e29b-41d4-a716-446655440000",
		pageNumber: 1,
		emptyStateMessage:
			"Create groups and matchers in this index, then run detection.",
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

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

export const SubmitWithRunAllCallsRunMatcher: Story = {
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);
		await submitWithRunAllCallsRunMatcher({ canvas, step });
	},
};

export const NoGroupsShowsRunAllMatchersButton: Story = {
	args: {
		projectId: "empty-groups-project",
		projectIndexTypeId: "mock-pit-subject-id",
		indexType: "subject",
		documentId: "550e8400-e29b-41d4-a716-446655440000",
		pageNumber: 1,
		emptyStateMessage:
			"Create groups and matchers in this index, then run detection.",
	},
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);
		await noGroupsShowsRunAllMatchersButton({ canvas, step });
	},
};
