import { interactionTestConfig } from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/react";
import { expect, fn, userEvent, within } from "@storybook/test";
import { Image, Table, Type } from "lucide-react";
import { useState } from "react";
import { DraggableToggleButtonGroup } from "../../draggable-toggle-button-group";

const meta: Meta<typeof DraggableToggleButtonGroup> = {
	title:
		"Components/PDF/PdfEditor/DraggableToggleButtonGroup/tests/Interaction Tests",
	component: DraggableToggleButtonGroup,
	parameters: {
		...interactionTestConfig,
		layout: "centered",
	},
	tags: ["test:interaction"],
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Test button click handlers
 */
export const ButtonClick: Story = {
	render: () => {
		const [activeId, setActiveId] = useState("text");

		const buttons = [
			{
				name: "text",
				icon: Type,
				tooltip: "Text",
				isActive: activeId === "text",
				onClick: () => setActiveId("text"),
			},
			{
				name: "image",
				icon: Image,
				tooltip: "Images",
				isActive: activeId === "image",
				onClick: () => setActiveId("image"),
			},
			{
				name: "table",
				icon: Table,
				tooltip: "Tables",
				isActive: activeId === "table",
				onClick: () => setActiveId("table"),
			},
		];

		return (
			<div>
				<DraggableToggleButtonGroup
					buttons={buttons}
					onReorder={fn()}
					excludeFromDrag={[]}
				/>
				<div data-testid="active-id">{activeId}</div>
			</div>
		);
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const activeIdDisplay = canvas.getByTestId("active-id");

		await expect(activeIdDisplay).toHaveTextContent("text");

		const imageButton = canvas.getByLabelText("Images");
		await userEvent.click(imageButton);

		await expect(activeIdDisplay).toHaveTextContent("image");
	},
};

/**
 * Test reorder callback
 */
export const ReorderCallback: Story = {
	render: () => {
		const [lastReorder, setLastReorder] = useState<string>("");

		const buttons = [
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
		];

		return (
			<div>
				<DraggableToggleButtonGroup
					buttons={buttons}
					onReorder={({ fromIndex, toIndex }) =>
						setLastReorder(`${fromIndex}->${toIndex}`)
					}
					excludeFromDrag={[]}
				/>
				<div data-testid="reorder-info">{lastReorder || "no reorder yet"}</div>
			</div>
		);
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const reorderInfo = canvas.getByTestId("reorder-info");

		await expect(reorderInfo).toHaveTextContent("no reorder yet");
	},
};

/**
 * Test excluded items cannot be dragged
 */
export const ExcludedItemsNonDraggable: Story = {
	render: () => {
		const buttons = [
			{
				name: "text",
				icon: Type,
				tooltip: "Text (fixed)",
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
		];

		return (
			<DraggableToggleButtonGroup
				buttons={buttons}
				onReorder={fn()}
				excludeFromDrag={["text"]}
			/>
		);
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const textButton = canvas.getByLabelText("Text (fixed)");

		await expect(textButton).toBeVisible();
	},
};

/**
 * Test keyboard navigation between buttons
 */
export const KeyboardNavigation: Story = {
	render: () => {
		const buttons = [
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
		];

		return (
			<DraggableToggleButtonGroup
				buttons={buttons}
				onReorder={fn()}
				excludeFromDrag={[]}
			/>
		);
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const textButton = canvas.getByLabelText("Text");
		const imageButton = canvas.getByLabelText("Images");

		textButton.focus();
		await expect(textButton).toHaveFocus();

		await userEvent.tab();
		await expect(imageButton).toHaveFocus();
	},
};
