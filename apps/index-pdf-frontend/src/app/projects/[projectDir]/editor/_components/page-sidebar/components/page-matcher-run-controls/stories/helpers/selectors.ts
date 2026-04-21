import type { StorybookCanvas } from "@pubint/yaboujee/_stories";

export const pageMatcherRunControlsSelectors = {
	groupA: (canvas: StorybookCanvas) => canvas.getByLabelText("Group: Group A"),
	groupB: (canvas: StorybookCanvas) => canvas.getByText("Group B"),
	groupAText: (canvas: StorybookCanvas) => canvas.getByText("Group A"),
	runMatcherButton: (canvas: StorybookCanvas) =>
		canvas.getByRole("button", { name: /run matcher detection/i }),
	runAllGroupsCheckbox: (canvas: StorybookCanvas) =>
		canvas.getByRole("checkbox", { name: /run all groups/i }),
	runAllMatchersCopy: (canvas: StorybookCanvas) =>
		canvas.getByText(/Run detection using all matchers in this index/i),
	runAllMatchersButton: (canvas: StorybookCanvas) =>
		canvas.getByRole("button", {
			name: /run matcher detection \(all matchers\)/i,
		}),
	runButtonBusyOrIdle: (canvas: StorybookCanvas) =>
		canvas.getByRole("button", {
			name: /run matcher detection|running/i,
		}),
};
