import { defaultInteractionTestMeta } from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn, userEvent, within } from "storybook/test";
import { SidebarPanel } from "../../sidebar-panel";
import {
	clickClosePanelButton,
	closeButtonIsVisible,
	closePanelButtonHasAccessibleName,
	contentIsVisible,
	noButtonsInDocument,
	noHeadingsInDocument,
	panelHasClassName,
} from "../helpers/steps";
import { SIDEBAR_PANEL_TEST_IDS } from "../shared";

const meta: Meta<typeof SidebarPanel> = {
	...defaultInteractionTestMeta,
	title: "Components/SidebarPanel/tests/Interaction Tests",
	component: SidebarPanel,
	parameters: {
		layout: "centered",
	},
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
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);
		const user = userEvent.setup();
		await clickClosePanelButton({ canvas, user, step });
		await closePanelButtonHasAccessibleName({ canvas, step });
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
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);
		await contentIsVisible({ canvas, step });
		await noHeadingsInDocument({ canvas, step });
		await noButtonsInDocument({ canvas, step });
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
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);
		await panelHasClassName({
			canvas,
			className: "custom-test-class",
			step,
		});
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
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);
		await closeButtonIsVisible({ canvas, step });
		await noHeadingsInDocument({ canvas, step });
	},
};
