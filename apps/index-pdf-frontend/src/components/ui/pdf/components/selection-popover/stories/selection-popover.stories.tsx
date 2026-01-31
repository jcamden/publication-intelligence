import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { SelectionPopover } from "../selection-popover";

const meta: Meta<typeof SelectionPopover> = {
	title: "Components/PDF/PdfEditor/SelectionPopover",
	component: SelectionPopover,
	tags: ["autodocs"],
	parameters: {
		layout: "fullscreen",
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		anchorEl: (() => {
			const el = document.createElement("div");
			el.style.position = "absolute";
			el.style.top = "100px";
			el.style.left = "200px";
			el.style.width = "100px";
			el.style.height = "20px";
			return el;
		})(),
		selectedText: "The quick brown fox jumps over the lazy dog",
		onCreateMention: fn(),
		onCancel: fn(),
		isCreating: false,
	},
};

export const LongText: Story = {
	args: {
		anchorEl: (() => {
			const el = document.createElement("div");
			el.style.position = "absolute";
			el.style.top = "150px";
			el.style.left = "300px";
			el.style.width = "200px";
			el.style.height = "20px";
			return el;
		})(),
		selectedText:
			"This is a very long text selection that will be truncated to show only the first sixty characters and then add an ellipsis",
		onCreateMention: fn(),
		onCancel: fn(),
		isCreating: false,
	},
};

export const Creating: Story = {
	args: {
		anchorEl: (() => {
			const el = document.createElement("div");
			el.style.position = "absolute";
			el.style.top = "200px";
			el.style.left = "250px";
			el.style.width = "100px";
			el.style.height = "20px";
			return el;
		})(),
		selectedText: "Selected text",
		onCreateMention: fn(),
		onCancel: fn(),
		isCreating: true,
	},
};
