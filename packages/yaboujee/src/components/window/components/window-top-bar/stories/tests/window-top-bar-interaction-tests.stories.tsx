import type { Meta, StoryObj } from "@storybook/react";
import { fn, userEvent, within } from "@storybook/test";
import { WindowTopBar } from "../../window-top-bar";
import {
	clickCloseButton,
	clickMaximizeButton,
	clickRestoreButton,
	clickUnpopButton,
	closeButtonIsVisible,
	maximizeButtonIsVisible,
	restoreButtonIsVisible,
	twoToolbarButtonsAreVisible,
	unpopButtonIsVisible,
	unpopVisibleAndCloseVisibleByRegion,
} from "../helpers/steps";
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
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);
		const user = userEvent.setup();
		await clickMaximizeButton({ canvas, user, step });
		await maximizeButtonIsVisible({ canvas, step });
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
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);
		const user = userEvent.setup();
		await restoreButtonIsVisible({ canvas, step });
		await clickRestoreButton({ canvas, user, step });
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
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);
		const user = userEvent.setup();
		await clickCloseButton({ canvas, user, step });
		await closeButtonIsVisible({ canvas, step });
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
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);
		const user = userEvent.setup();
		await clickUnpopButton({ canvas, user, step });
		await unpopButtonIsVisible({ canvas, step });
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
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);
		await unpopVisibleAndCloseVisibleByRegion({ canvas, step });
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
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);
		await twoToolbarButtonsAreVisible({ canvas, step });
	},
};
