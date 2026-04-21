import type { StorybookCanvas } from "@pubint/yaboujee/_stories";
import { within } from "@storybook/test";

export const windowTopBarSelectors = {
	allButtons: (canvas: StorybookCanvas) => canvas.getAllByRole("button"),
	closeButton: (canvas: StorybookCanvas) => canvas.getByLabelText("Close"),
	maximizeButton: (canvas: StorybookCanvas) =>
		canvas.getByLabelText("Maximize"),
	restoreButton: (canvas: StorybookCanvas) => canvas.getByLabelText("Restore"),
	sidebarCollapsedRegion: (canvas: StorybookCanvas) =>
		canvas.getByTestId("sidebar-collapsed"),
	sidebarVisibleRegion: (canvas: StorybookCanvas) =>
		canvas.getByTestId("sidebar-visible"),
	unpopButton: (canvas: StorybookCanvas) =>
		canvas.getByLabelText("Return to sidebar"),
};

export const windowTopBarWithinSelectors = {
	closeInSidebarCollapsed: (canvas: StorybookCanvas) =>
		within(windowTopBarSelectors.sidebarCollapsedRegion(canvas)).getByLabelText(
			"Close",
		),
	unpopInSidebarVisible: (canvas: StorybookCanvas) =>
		within(windowTopBarSelectors.sidebarVisibleRegion(canvas)).getByLabelText(
			"Return to sidebar",
		),
};
