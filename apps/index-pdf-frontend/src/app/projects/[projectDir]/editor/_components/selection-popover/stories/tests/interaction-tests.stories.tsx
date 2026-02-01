import { interactionTestConfig } from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/react";
import { expect, fn, userEvent, within } from "@storybook/test";
import { SelectionPopover } from "../../selection-popover";
import { SelectionPopoverWrapper } from "../shared";

const meta: Meta<typeof SelectionPopover> = {
	title:
		"Projects/[ProjectDir]/Editor/SelectionPopover/tests/Interaction Tests",
	component: SelectionPopover,
	parameters: {
		...interactionTestConfig,
		layout: "centered",
	},
	tags: ["test:interaction"],
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Test create mention button click
 */
export const CreateMentionClick: Story = {
	render: () => {
		const handleCreate = fn();
		return (
			<SelectionPopoverWrapper
				selectedText="Test selection"
				isCreating={false}
				onCreateMention={handleCreate}
				onCancel={fn()}
			/>
		);
	},
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);

		await step("Click create mention button", async () => {
			const createButton = canvas.getByRole("button", {
				name: /create mention/i,
			});
			await expect(createButton).toBeVisible();
			await expect(createButton).toBeEnabled();
			await userEvent.click(createButton);
		});
	},
};

/**
 * Test cancel button click
 */
export const CancelClick: Story = {
	render: () => {
		const handleCancel = fn();
		return (
			<SelectionPopoverWrapper
				selectedText="Test selection"
				isCreating={false}
				onCreateMention={fn()}
				onCancel={handleCancel}
			/>
		);
	},
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);

		await step("Click cancel button", async () => {
			const cancelButton = canvas.getByRole("button", { name: /cancel/i });
			await expect(cancelButton).toBeVisible();
			await expect(cancelButton).toBeEnabled();
			await userEvent.click(cancelButton);
		});
	},
};

/**
 * Test disabled state during creation
 */
export const DisabledDuringCreation: Story = {
	render: () => {
		return (
			<SelectionPopoverWrapper
				selectedText="Test selection"
				isCreating={true}
				onCreateMention={fn()}
				onCancel={fn()}
			/>
		);
	},
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);

		await step("Verify buttons are disabled during creation", async () => {
			const createButton = canvas.getByRole("button", { name: /creating/i });
			const cancelButton = canvas.getByRole("button", { name: /cancel/i });

			await expect(createButton).toBeDisabled();
			await expect(cancelButton).toBeDisabled();
		});
	},
};

/**
 * Test text truncation display
 */
export const TextTruncation: Story = {
	render: () => {
		const longText =
			"This is a very long text selection that should be truncated to sixty characters and show an ellipsis";
		return (
			<SelectionPopoverWrapper
				selectedText={longText}
				isCreating={false}
				onCreateMention={fn()}
				onCancel={fn()}
			/>
		);
	},
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);

		await step("Verify text is truncated with ellipsis", async () => {
			// Query for the popover's text preview which includes quotes
			const textPreview = canvas.getByText(
				/"This is a very long text selection that should be truncated \.\.\./,
			);
			await expect(textPreview).toBeVisible();
		});
	},
};
