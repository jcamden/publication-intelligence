import type { StorybookCanvas } from "@pubint/yaboujee/_stories";
import { SIDEBAR_PANEL_TEST_IDS } from "../shared";

export const sidebarPanelSelectors = {
	closePanelButton: (canvas: StorybookCanvas) =>
		canvas.getByRole("button", { name: /close panel/i }),

	panel: (
		canvas: StorybookCanvas,
		testId: string = SIDEBAR_PANEL_TEST_IDS.panel,
	) => canvas.getByTestId(testId),

	content: (canvas: StorybookCanvas) =>
		canvas.getByTestId(SIDEBAR_PANEL_TEST_IDS.content),

	allHeadings: (canvas: StorybookCanvas) => canvas.queryAllByRole("heading"),

	allButtons: (canvas: StorybookCanvas) => canvas.queryAllByRole("button"),
};
