import { defaultInteractionTestMeta } from "@pubint/storybook-config";
import { Button } from "@pubint/yabasic/components/ui/button";
import type { Meta, StoryObj } from "@storybook/react";
import { fn, userEvent, within } from "@storybook/test";
import { EmptyState } from "../../empty-state";
import {
	actionClickCallbackIsCalledOnce,
	clickActionButton,
} from "../helpers/steps";

const meta = {
	...defaultInteractionTestMeta,
	title: "Components/EmptyState/tests/Interaction Tests",
	component: EmptyState,
	tags: ["interaction-test"],
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ActionButtonClick: Story = {
	render: (args) => {
		const { onActionClick, ...emptyStateProps } = args as typeof args & {
			onActionClick: () => void;
		};
		return (
			<EmptyState
				{...emptyStateProps}
				action={<Button onClick={onActionClick}>Create Project</Button>}
			/>
		);
	},
	args: {
		title: "No projects yet",
		description: "Create your first project to get started.",
		// @ts-expect-error - onActionClick is a test-only prop
		onActionClick: fn(),
	},
	play: async ({ args, canvasElement, step }) => {
		const user = userEvent.setup();
		const canvas = within(canvasElement);
		const { onActionClick } = args as typeof args & {
			onActionClick: ReturnType<typeof fn>;
		};

		// Reset mock to ensure clean state for test run
		onActionClick.mockClear();

		await clickActionButton({ canvas, user, step });
		await actionClickCallbackIsCalledOnce({ onActionClick, step });
	},
};
