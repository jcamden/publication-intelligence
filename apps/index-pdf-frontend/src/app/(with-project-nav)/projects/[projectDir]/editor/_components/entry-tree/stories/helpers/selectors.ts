import type { StorybookCanvas } from "@pubint/yaboujee/_stories";

export const entryTreeSelectors = {
	emptyMessage: (canvas: StorybookCanvas) => canvas.getByText("No entries yet"),
	expandChevronButton: (canvas: StorybookCanvas) => {
		const expandButtons = canvas.getAllByRole("button");
		const chevronButton = expandButtons.find((btn: HTMLElement) =>
			btn.querySelector("svg.lucide-chevron-down"),
		);
		if (!chevronButton) {
			throw new Error("Expand chevron button not found");
		}
		return chevronButton;
	},
	philosophyEntry: (canvas: StorybookCanvas) => canvas.getByText("Philosophy"),
};
