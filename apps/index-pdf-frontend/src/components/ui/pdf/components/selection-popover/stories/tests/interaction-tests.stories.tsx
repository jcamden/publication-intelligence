import { interactionTestConfig } from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/react";
import { expect, fn, userEvent, within } from "@storybook/test";
import { SelectionPopover } from "../../selection-popover";

const meta: Meta<typeof SelectionPopover> = {
	title: "Components/PDF/PdfEditor/SelectionPopover/tests/Interaction Tests",
	component: SelectionPopover,
	parameters: {
		...interactionTestConfig,
		layout: "fullscreen",
	},
	tags: ["test:interaction"],
};

export default meta;
type Story = StoryObj<typeof meta>;

const createAnchorEl = () => {
	const el = document.createElement("div");
	el.style.position = "absolute";
	el.style.top = "100px";
	el.style.left = "200px";
	el.style.width = "100px";
	el.style.height = "20px";
	return el;
};

/**
 * Test create mention button click
 */
export const CreateMentionClick: Story = {
	render: () => {
		const handleCreate = fn();
		return (
			<SelectionPopover
				anchorEl={createAnchorEl()}
				selectedText="Test selection"
				onCreateMention={handleCreate}
				onCancel={fn()}
				isCreating={false}
			/>
		);
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const createButton = canvas.getByRole("button", {
			name: /create mention/i,
		});

		await expect(createButton).toBeVisible();
		await expect(createButton).toBeEnabled();
		await userEvent.click(createButton);
	},
};

/**
 * Test cancel button click
 */
export const CancelClick: Story = {
	render: () => {
		const handleCancel = fn();
		return (
			<SelectionPopover
				anchorEl={createAnchorEl()}
				selectedText="Test selection"
				onCreateMention={fn()}
				onCancel={handleCancel}
				isCreating={false}
			/>
		);
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const cancelButton = canvas.getByRole("button", { name: /cancel/i });

		await expect(cancelButton).toBeVisible();
		await expect(cancelButton).toBeEnabled();
		await userEvent.click(cancelButton);
	},
};

/**
 * Test disabled state during creation
 */
export const DisabledDuringCreation: Story = {
	render: () => {
		return (
			<SelectionPopover
				anchorEl={createAnchorEl()}
				selectedText="Test selection"
				onCreateMention={fn()}
				onCancel={fn()}
				isCreating={true}
			/>
		);
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		const createButton = canvas.getByRole("button", { name: /creating/i });
		const cancelButton = canvas.getByRole("button", { name: /cancel/i });

		await expect(createButton).toBeDisabled();
		await expect(cancelButton).toBeDisabled();
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
			<SelectionPopover
				anchorEl={createAnchorEl()}
				selectedText={longText}
				onCreateMention={fn()}
				onCancel={fn()}
				isCreating={false}
			/>
		);
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const textPreview = canvas.getByText(/\.\.\./);

		await expect(textPreview).toBeVisible();
	},
};
