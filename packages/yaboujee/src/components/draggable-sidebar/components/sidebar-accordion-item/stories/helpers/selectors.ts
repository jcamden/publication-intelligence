import type { StorybookCanvas } from "@pubint/yaboujee/_stories";

export const sidebarAccordionItemSelectors = {
	popOutButton: (canvas: StorybookCanvas) =>
		canvas.getByLabelText("Pop out to window"),

	expandedCount: (canvas: StorybookCanvas) =>
		canvas.getByTestId("expanded-count"),

	sectionTrigger: (canvas: StorybookCanvas) =>
		canvas.getByRole("button", { name: /test section/i }),

	dragHandle: (canvas: StorybookCanvas) =>
		canvas.getByLabelText("Drag to reorder"),

	expandedState: (canvas: StorybookCanvas) =>
		canvas.getByTestId("expanded-state"),
};
