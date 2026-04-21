import type { StorybookCanvas, StoryStep } from "@pubint/yaboujee/_stories";
import { expect, userEvent, waitFor } from "@storybook/test";
import { pageMatcherRunControlsSelectors } from "./selectors";

export const waitForGroupsLoaded = async ({
	canvas,
	step,
}: {
	canvas: StorybookCanvas;
	step: StoryStep;
}) => {
	await step("Wait for groups to load", async () => {
		await waitFor(
			() => {
				const groupA = pageMatcherRunControlsSelectors.groupA(canvas);
				expect(groupA).toBeInTheDocument();
			},
			{ timeout: 3000 },
		);
	});
};

export const withGroupsShowsRunButtonAndGroupList = async ({
	canvas,
	step,
}: {
	canvas: StorybookCanvas;
	step: StoryStep;
}) => {
	await waitForGroupsLoaded({ canvas, step });

	await step("Verify run button and group list", async () => {
		const runButton = pageMatcherRunControlsSelectors.runMatcherButton(canvas);
		await expect(runButton).toBeInTheDocument();
		await expect(
			pageMatcherRunControlsSelectors.groupAText(canvas),
		).toBeInTheDocument();
		await expect(
			pageMatcherRunControlsSelectors.groupB(canvas),
		).toBeInTheDocument();
	});
};

export const runAllAndGroupSelectMutuallyExclusive = async ({
	canvas,
	step,
}: {
	canvas: StorybookCanvas;
	step: StoryStep;
}) => {
	await waitForGroupsLoaded({ canvas, step });

	await step("Check Run all groups", async () => {
		const runAllCheckbox =
			pageMatcherRunControlsSelectors.runAllGroupsCheckbox(canvas);
		await userEvent.click(runAllCheckbox);
		await expect(runAllCheckbox).toBeChecked();
	});

	await step(
		"Verify group checkboxes are disabled when run-all is on",
		async () => {
			const groupACheckbox = pageMatcherRunControlsSelectors.groupA(canvas);
			await expect(groupACheckbox).toBeDisabled();
		},
	);
};

export const submitWithRunAllCallsRunMatcher = async ({
	canvas,
	step,
}: {
	canvas: StorybookCanvas;
	step: StoryStep;
}) => {
	await step("Wait for groups and enable run-all", async () => {
		await waitFor(
			() => {
				expect(
					pageMatcherRunControlsSelectors.groupA(canvas),
				).toBeInTheDocument();
			},
			{ timeout: 3000 },
		);
		const runAllCheckbox =
			pageMatcherRunControlsSelectors.runAllGroupsCheckbox(canvas);
		await userEvent.click(runAllCheckbox);
	});

	await step("Click run matcher detection", async () => {
		await userEvent.click(
			pageMatcherRunControlsSelectors.runMatcherButton(canvas),
		);
	});

	await step("Button shows loading then settles", async () => {
		const runButton =
			pageMatcherRunControlsSelectors.runButtonBusyOrIdle(canvas);
		await waitFor(
			() => {
				expect(runButton).not.toHaveAttribute("aria-busy", "true");
			},
			{ timeout: 2000 },
		);
	});
};

export const noGroupsShowsRunAllMatchersButton = async ({
	canvas,
	step,
}: {
	canvas: StorybookCanvas;
	step: StoryStep;
}) => {
	await step("Wait for no-groups state to load", async () => {
		await waitFor(
			() => {
				expect(
					pageMatcherRunControlsSelectors.runAllMatchersCopy(canvas),
				).toBeInTheDocument();
			},
			{ timeout: 3000 },
		);
	});

	await step(
		"Verify Run matcher detection (all matchers) button is visible",
		async () => {
			const runButton =
				pageMatcherRunControlsSelectors.runAllMatchersButton(canvas);
			await expect(runButton).toBeInTheDocument();
		},
	);
};
