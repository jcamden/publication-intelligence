import type { StorybookCanvas } from "@pubint/yaboujee/_stories";
import { SIDEBAR_PANEL_TEST_IDS } from "../shared";

export const sidebarPanelSelectors = {
	allButtons: (canvas: StorybookCanvas) => canvas.queryAllByRole("button"),
	allHeadings: (canvas: StorybookCanvas) => canvas.queryAllByRole("heading"),
	closePanelButton: (canvas: StorybookCanvas) =>
		canvas.getByRole("button", { name: /close panel/i }),
	content: (canvas: StorybookCanvas) =>
		canvas.getByTestId(SIDEBAR_PANEL_TEST_IDS.content),
	panel: (
		canvas: StorybookCanvas,
		testId: string = SIDEBAR_PANEL_TEST_IDS.panel,
	) => canvas.getByTestId(testId),
};
