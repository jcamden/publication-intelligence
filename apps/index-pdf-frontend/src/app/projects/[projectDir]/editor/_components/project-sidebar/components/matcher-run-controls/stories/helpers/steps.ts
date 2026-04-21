import type { StorybookCanvas, StoryStep } from "@pubint/yaboujee/_stories";
import { expect, userEvent, waitFor } from "@storybook/test";
import { matcherRunControlsSelectors } from "./selectors";

const waitForGroupsLoaded = async ({
	canvas,
	step,
}: {
	canvas: StorybookCanvas;
	step: StoryStep;
}) => {
	await step("Wait for groups to load", async () => {
		await waitFor(
			() => {
				const groupA = matcherRunControlsSelectors.groupA(canvas);
				expect(groupA).toBeInTheDocument();
			},
			{ timeout: 3000 },
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
					matcherRunControlsSelectors.runAllMatchersCopy(canvas),
				).toBeInTheDocument();
			},
			{ timeout: 3000 },
		);
	});

	await step(
		"Verify Run matcher detection (all matchers) button is visible",
		async () => {
			const runButton =
				matcherRunControlsSelectors.runAllMatchersButton(canvas);
			await expect(runButton).toBeInTheDocument();
		},
	);
};

export const noGroupsClickRunAllMatchersCallsRunMatcher = async ({
	canvas,
	step,
}: {
	canvas: StorybookCanvas;
	step: StoryStep;
}) => {
	await step(
		"Wait for no-groups state and click Run matcher detection (all matchers)",
		async () => {
			await waitFor(
				() => {
					expect(
						matcherRunControlsSelectors.runAllMatchersCopy(canvas),
					).toBeInTheDocument();
				},
				{ timeout: 3000 },
			);
			const runButton =
				matcherRunControlsSelectors.runAllMatchersButton(canvas);
			await userEvent.click(runButton);
		},
	);

	await step("Button shows loading then settles", async () => {
		const runButton =
			matcherRunControlsSelectors.runAllMatchersButtonBusyOrIdle(canvas);
		await waitFor(
			() => {
				expect(runButton).not.toHaveAttribute("aria-busy", "true");
			},
			{ timeout: 2000 },
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
		const runButton = matcherRunControlsSelectors.runMatcherButton(canvas);
		await expect(runButton).toBeInTheDocument();
		await expect(
			matcherRunControlsSelectors.groupAText(canvas),
		).toBeInTheDocument();
		await expect(
			matcherRunControlsSelectors.groupB(canvas),
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
			matcherRunControlsSelectors.runAllGroupsCheckbox(canvas);
		await userEvent.click(runAllCheckbox);
		await expect(runAllCheckbox).toBeChecked();
	});

	await step(
		"Verify group checkboxes are disabled when run-all is on",
		async () => {
			const groupACheckbox = matcherRunControlsSelectors.groupA(canvas);
			await expect(groupACheckbox).toBeDisabled();
		},
	);

	await step("Uncheck run-all and select a group", async () => {
		const runAllCheckbox =
			matcherRunControlsSelectors.runAllGroupsCheckbox(canvas);
		await userEvent.click(runAllCheckbox);
		await expect(runAllCheckbox).not.toBeChecked();
		const groupACheckbox = matcherRunControlsSelectors.groupA(canvas);
		await userEvent.click(groupACheckbox);
		await expect(groupACheckbox).toBeChecked();
	});
};

export const invalidSelectionShowsInlineError = async ({
	canvas,
	step,
}: {
	canvas: StorybookCanvas;
	step: StoryStep;
}) => {
	await waitForGroupsLoaded({ canvas, step });

	await step("Ensure run-all is off and no group selected", async () => {
		const runAllCheckbox =
			matcherRunControlsSelectors.runAllGroupsCheckbox(canvas);
		if ((runAllCheckbox as HTMLInputElement).checked)
			await userEvent.click(runAllCheckbox);
		const groupA = matcherRunControlsSelectors.groupA(canvas);
		if ((groupA as HTMLInputElement).checked) await userEvent.click(groupA);
	});

	await step("Click run and verify inline error", async () => {
		await userEvent.click(matcherRunControlsSelectors.runMatcherButton(canvas));
		await expect(
			canvas.findByText(/select at least one group or enable run all groups/i),
		).resolves.toBeInTheDocument();
	});
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
				expect(matcherRunControlsSelectors.groupA(canvas)).toBeInTheDocument();
			},
			{ timeout: 3000 },
		);
		const runAllCheckbox =
			matcherRunControlsSelectors.runAllGroupsCheckbox(canvas);
		await userEvent.click(runAllCheckbox);
	});

	await step("Click run matcher detection", async () => {
		await userEvent.click(matcherRunControlsSelectors.runMatcherButton(canvas));
	});

	await step("Button shows loading then settles", async () => {
		const runButton = matcherRunControlsSelectors.runButtonBusyOrIdle(canvas);
		await waitFor(
			() => {
				expect(runButton).not.toHaveAttribute("aria-busy", "true");
			},
			{ timeout: 2000 },
		);
	});
};
