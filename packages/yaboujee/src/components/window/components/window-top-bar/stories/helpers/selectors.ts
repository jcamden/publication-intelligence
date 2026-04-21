import type { StorybookCanvas } from "@pubint/yaboujee/_stories";
import { within } from "@storybook/test";

export const windowTopBarSelectors = {
	maximizeButton: (canvas: StorybookCanvas) =>
		canvas.getByLabelText("Maximize"),

	restoreButton: (canvas: StorybookCanvas) => canvas.getByLabelText("Restore"),

	closeButton: (canvas: StorybookCanvas) => canvas.getByLabelText("Close"),

	unpopButton: (canvas: StorybookCanvas) =>
		canvas.getByLabelText("Return to sidebar"),

	sidebarVisibleRegion: (canvas: StorybookCanvas) =>
		canvas.getByTestId("sidebar-visible"),

	sidebarCollapsedRegion: (canvas: StorybookCanvas) =>
		canvas.getByTestId("sidebar-collapsed"),

	allButtons: (canvas: StorybookCanvas) => canvas.getAllByRole("button"),
};

export const windowTopBarWithinSelectors = {
	unpopInSidebarVisible: (canvas: StorybookCanvas) =>
		within(windowTopBarSelectors.sidebarVisibleRegion(canvas)).getByLabelText(
			"Return to sidebar",
		),

	closeInSidebarCollapsed: (canvas: StorybookCanvas) =>
		within(windowTopBarSelectors.sidebarCollapsedRegion(canvas)).getByLabelText(
			"Close",
		),
};
