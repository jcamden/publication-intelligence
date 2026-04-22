import type { StorybookCanvas } from "@pubint/yaboujee/_stories";

export const entryTreeSelectors = {
	emptyMessage: (canvas: StorybookCanvas) => canvas.getByText("No entries yet"),
	toggleChevronButton: (canvas: StorybookCanvas) => {
		const expandButtons = canvas.getAllByRole("button");
		// Entry nodes are collapsed by default, so expect a chevron-right.
		// When expanded, they show a chevron-down.
		const chevronButton = expandButtons.find((btn: HTMLElement) => {
			return (
				btn.querySelector("svg.lucide-chevron-right") ||
				btn.querySelector("svg.lucide-chevron-down")
			);
		});
		if (!chevronButton) {
			throw new Error("Expand chevron button not found");
		}
		return chevronButton;
	},
	philosophyEntry: (canvas: StorybookCanvas) => canvas.getByText("Philosophy"),
};
