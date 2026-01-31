import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { FileText, Image, Table, Type } from "lucide-react";
import { DraggableToggleButtonGroup } from "../draggable-toggle-button-group";

const meta: Meta<typeof DraggableToggleButtonGroup> = {
	title: "Components/PDF/PdfEditor/DraggableToggleButtonGroup",
	component: DraggableToggleButtonGroup,
	tags: ["autodocs"],
	parameters: {
		layout: "centered",
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

const defaultButtons = [
	{
		name: "text",
		icon: Type,
		tooltip: "Text",
		isActive: true,
		onClick: fn(),
	},
	{
		name: "image",
		icon: Image,
		tooltip: "Images",
		isActive: false,
		onClick: fn(),
	},
	{
		name: "table",
		icon: Table,
		tooltip: "Tables",
		isActive: false,
		onClick: fn(),
	},
	{
		name: "file",
		icon: FileText,
		tooltip: "Files",
		isActive: false,
		onClick: fn(),
	},
];

export const Default: Story = {
	args: {
		buttons: defaultButtons,
		onReorder: fn(),
		excludeFromDrag: [],
	},
};

export const WithExcludedItems: Story = {
	args: {
		buttons: defaultButtons,
		onReorder: fn(),
		excludeFromDrag: ["text"],
	},
};

export const TwoButtons: Story = {
	args: {
		buttons: defaultButtons.slice(0, 2),
		onReorder: fn(),
		excludeFromDrag: [],
	},
};

export const ManyButtons: Story = {
	args: {
		buttons: [
			...defaultButtons,
			{
				name: "extra1",
				icon: FileText,
				tooltip: "Extra 1",
				isActive: false,
				onClick: fn(),
			},
			{
				name: "extra2",
				icon: FileText,
				tooltip: "Extra 2",
				isActive: false,
				onClick: fn(),
			},
		],
		onReorder: fn(),
		excludeFromDrag: [],
	},
};
