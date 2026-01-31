import type { Meta, StoryObj } from "@storybook/react";
import { expect, fn, userEvent, within } from "@storybook/test";
import { SidebarPanel } from "../../sidebar-panel";
import { SIDEBAR_PANEL_TEST_IDS } from "../shared";

const meta: Meta<typeof SidebarPanel> = {
	title: "Components/SidebarPanel/tests/Interaction Tests",
	component: SidebarPanel,
	parameters: {
		layout: "centered",
	},
	tags: ["test:interaction"],
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Test close button click
 */
export const CloseButtonClick: Story = {
	render: () => {
		const handleClose = fn();
		return (
			<SidebarPanel
				title="Test Panel"
				onClose={handleClose}
				data-testid={SIDEBAR_PANEL_TEST_IDS.panel}
			>
				<div>Panel content</div>
			</SidebarPanel>
		);
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const closeButton = canvas.getByRole("button", { name: /close panel/i });

		await userEvent.click(closeButton);
		await expect(closeButton).toHaveAccessibleName("Close panel");
	},
};

/**
 * Test no header when no title and no close button
 */
export const NoHeaderWhenEmpty: Story = {
	render: () => {
		return (
			<SidebarPanel data-testid={SIDEBAR_PANEL_TEST_IDS.panel}>
				<div data-testid={SIDEBAR_PANEL_TEST_IDS.content}>Content only</div>
			</SidebarPanel>
		);
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const content = canvas.getByTestId(SIDEBAR_PANEL_TEST_IDS.content);

		await expect(content).toBeVisible();

		const headings = canvas.queryAllByRole("heading");
		await expect(headings.length).toBe(0);

		const buttons = canvas.queryAllByRole("button");
		await expect(buttons.length).toBe(0);
	},
};

/**
 * Test custom className is applied
 */
export const CustomClassNameApplied: Story = {
	render: () => {
		return (
			<SidebarPanel
				className="custom-test-class"
				title="Test"
				data-testid={SIDEBAR_PANEL_TEST_IDS.panel}
			>
				<div>Content</div>
			</SidebarPanel>
		);
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const panel = canvas.getByTestId(SIDEBAR_PANEL_TEST_IDS.panel);

		await expect(panel).toHaveClass("custom-test-class");
	},
};

/**
 * Test panel renders with only close button (no title)
 */
export const OnlyCloseButton: Story = {
	render: () => {
		const handleClose = fn();
		return (
			<SidebarPanel onClose={handleClose}>
				<div>Content without title</div>
			</SidebarPanel>
		);
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const closeButton = canvas.getByRole("button", { name: /close panel/i });

		await expect(closeButton).toBeVisible();

		const headings = canvas.queryAllByRole("heading");
		await expect(headings.length).toBe(0);
	},
};
