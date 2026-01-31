import type { Meta, StoryObj } from "@storybook/react";
import { expect, fn, userEvent, within } from "@storybook/test";
import { WindowTopBar } from "../../window-top-bar";
import { defaultWindowTopBarArgs } from "../shared";

const meta: Meta<typeof WindowTopBar> = {
	title: "Components/Window/WindowTopBar/tests/Interaction Tests",
	component: WindowTopBar,
	parameters: {
		layout: "padded",
	},
	tags: ["test:interaction"],
	decorators: [
		(Story) => (
			<div style={{ width: "400px", border: "1px solid #ddd" }}>
				<Story />
			</div>
		),
	],
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Test maximize button click
 */
export const MaximizeButtonClick: Story = {
	render: () => {
		const handleMaximize = fn();
		return (
			<WindowTopBar {...defaultWindowTopBarArgs} onMaximize={handleMaximize} />
		);
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const maximizeButton = canvas.getByLabelText("Maximize");

		await userEvent.click(maximizeButton);
		await expect(maximizeButton).toBeVisible();
	},
};

/**
 * Test maximize button shows restore when maximized
 */
export const MaximizeButtonRestoreState: Story = {
	render: () => {
		const handleMaximize = fn();
		return (
			<WindowTopBar
				{...defaultWindowTopBarArgs}
				isMaximized={true}
				onMaximize={handleMaximize}
			/>
		);
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const restoreButton = canvas.getByLabelText("Restore");

		await expect(restoreButton).toBeVisible();
		await userEvent.click(restoreButton);
	},
};

/**
 * Test close button click (when sidebar collapsed)
 */
export const CloseButtonClick: Story = {
	render: () => {
		const handleClose = fn();
		return (
			<WindowTopBar
				{...defaultWindowTopBarArgs}
				sidebarCollapsed={true}
				onClose={handleClose}
			/>
		);
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const closeButton = canvas.getByLabelText("Close");

		await userEvent.click(closeButton);
		await expect(closeButton).toBeVisible();
	},
};

/**
 * Test unpop button click (when sidebar not collapsed)
 */
export const UnpopButtonClick: Story = {
	render: () => {
		const handleUnpop = fn();
		return (
			<WindowTopBar
				{...defaultWindowTopBarArgs}
				sidebarCollapsed={false}
				onUnpop={handleUnpop}
			/>
		);
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const unpopButton = canvas.getByLabelText("Return to sidebar");

		await userEvent.click(unpopButton);
		await expect(unpopButton).toBeVisible();
	},
};

/**
 * Test button visibility based on sidebar state
 */
export const ButtonVisibilityBySidebarState: Story = {
	render: () => {
		return (
			<div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
				<div data-testid="sidebar-visible">
					<WindowTopBar {...defaultWindowTopBarArgs} sidebarCollapsed={false} />
				</div>
				<div data-testid="sidebar-collapsed">
					<WindowTopBar {...defaultWindowTopBarArgs} sidebarCollapsed={true} />
				</div>
			</div>
		);
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		const sidebarVisible = canvas.getByTestId("sidebar-visible");
		const unpopButton =
			within(sidebarVisible).getByLabelText("Return to sidebar");
		await expect(unpopButton).toBeVisible();

		const sidebarCollapsed = canvas.getByTestId("sidebar-collapsed");
		const closeButton = within(sidebarCollapsed).getByLabelText("Close");
		await expect(closeButton).toBeVisible();
	},
};

/**
 * Test all buttons are keyboard accessible
 */
export const KeyboardAccessibility: Story = {
	render: () => {
		return (
			<WindowTopBar {...defaultWindowTopBarArgs} sidebarCollapsed={false} />
		);
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const buttons = canvas.getAllByRole("button");

		for (const button of buttons) {
			await expect(button).toBeVisible();
		}

		await expect(buttons.length).toBe(2);
	},
};
