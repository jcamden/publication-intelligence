import type { StorybookCanvas } from "@pubint/yaboujee/_stories";

export const sidebarAccordionItemSelectors = {
	dragHandle: (canvas: StorybookCanvas) =>
		canvas.getByLabelText("Drag to reorder"),
	expandedCount: (canvas: StorybookCanvas) =>
		canvas.getByTestId("expanded-count"),
	expandedState: (canvas: StorybookCanvas) =>
		canvas.getByTestId("expanded-state"),
	popOutButton: (canvas: StorybookCanvas) =>
		canvas.getByLabelText("Pop out to window"),
	sectionTrigger: (canvas: StorybookCanvas) =>
		canvas.getByRole("button", { name: /test section/i }),
};
