import type { StorybookCanvas } from "@pubint/yaboujee/_stories";

export const draggableSidebarSelectors = {
	expandedCount: (canvas: StorybookCanvas) =>
		canvas.getByTestId("expanded-count"),

	pagesSectionTrigger: (canvas: StorybookCanvas) =>
		canvas.getByRole("button", { name: /pages/i }),

	popOutButtons: (canvas: StorybookCanvas) =>
		canvas.getAllByLabelText("Pop out to window"),

	accordionTriggerFromLabelText: (canvas: StorybookCanvas, label: string) => {
		const text = canvas.getByText(label);
		const button = text.closest("button");
		if (!button) {
			throw new Error(`Accordion trigger not found for label: ${label}`);
		}
		return button as HTMLElement;
	},
};
