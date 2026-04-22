import { defaultInteractionTestMeta } from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { userEvent } from "storybook/test";
import { DeleteProjectDialog } from "../../delete-project-dialog";
import {
	alertDialogIsInDocument,
	clearAndTypeCorrectProjectName,
	deleteButtonIsEnabled,
	typeWrongConfirmationAndDeleteDisabled,
	waitForProjectLoadDelay,
} from "../helpers/steps";

export default {
	...defaultInteractionTestMeta,
	title: "Projects/DeleteProjectDialog/tests/Interaction Tests",
	component: DeleteProjectDialog,
	parameters: {
		...defaultInteractionTestMeta.parameters,
		layout: "centered",
	},
} satisfies Meta<typeof DeleteProjectDialog>;

export const DeleteButtonEnabledAfterConfirmation: StoryObj<
	typeof DeleteProjectDialog
> = {
	args: {
		projectId: "project-confirm",
		onOpenChange: () => {},
		onSuccess: () => {},
	},
	play: async ({ step }) => {
		const user = userEvent.setup();

		await alertDialogIsInDocument({ step });

		await waitForProjectLoadDelay({ step });

		await typeWrongConfirmationAndDeleteDisabled({ user, step });

		await clearAndTypeCorrectProjectName({
			user,
			projectTitle: "Test Project Title",
			step,
		});

		await deleteButtonIsEnabled({ step });
	},
};
