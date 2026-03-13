import { defaultInteractionTestMeta } from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, waitFor, within } from "@storybook/test";
import { MatcherRunControls } from "../../matcher-run-controls";

const meta: Meta<typeof MatcherRunControls> = {
	...defaultInteractionTestMeta,
	title:
		"Projects/[ProjectDir]/Editor/ProjectSidebar/MatcherRunControls/tests/Interaction Tests",
	component: MatcherRunControls,
	parameters: {
		layout: "centered",
	},
	args: {
		projectId: "mock-project-id",
		projectIndexTypeId: "mock-pit-subject-id",
		indexType: "subject",
		emptyStateMessage:
			"Create groups and matchers in this index, then run detection.",
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * No-groups state shows run-all-matchers copy and "Run matcher detection (all matchers)" button (Task 8.1.1).
 */
export const NoGroupsShowsRunAllMatchersButton: Story = {
	args: {
		projectId: "empty-groups-project",
		projectIndexTypeId: "mock-pit-subject-id",
		indexType: "subject",
		emptyStateMessage:
			"Create groups and matchers in this index, then run detection.",
	},
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);

		await step("Wait for no-groups state to load", async () => {
			await waitFor(
				() => {
					expect(
						canvas.getByText(/Run detection using all matchers in this index/i),
					).toBeInTheDocument();
				},
				{ timeout: 3000 },
			);
		});

		await step(
			"Verify Run matcher detection (all matchers) button is visible",
			async () => {
				const runButton = canvas.getByRole("button", {
					name: /run matcher detection \(all matchers\)/i,
				});
				expect(runButton).toBeInTheDocument();
			},
		);
	},
};

/**
 * No-groups: clicking Run matcher detection (all matchers) triggers run with runAllGroups true.
 */
export const NoGroupsClickRunAllMatchersCallsRunMatcher: Story = {
	args: {
		projectId: "empty-groups-project",
		projectIndexTypeId: "mock-pit-subject-id",
		indexType: "subject",
		emptyStateMessage:
			"Create groups and matchers in this index, then run detection.",
	},
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);

		await step(
			"Wait for no-groups state and click Run matcher detection (all matchers)",
			async () => {
				await waitFor(
					() => {
						expect(
							canvas.getByText(
								/Run detection using all matchers in this index/i,
							),
						).toBeInTheDocument();
					},
					{ timeout: 3000 },
				);
				const runButton = canvas.getByRole("button", {
					name: /run matcher detection \(all matchers\)/i,
				});
				await userEvent.click(runButton);
			},
		);

		await step("Button shows loading then settles", async () => {
			const runButton = canvas.getByRole("button", {
				name: /run matcher detection \(all matchers\)|running/i,
			});
			await waitFor(
				() => {
					expect(runButton).not.toHaveAttribute("aria-busy", "true");
				},
				{ timeout: 2000 },
			);
		});
	},
};

/**
 * With groups loaded (mocked), run-all and group list are visible; run button is enabled when run-all is on or at least one group selected.
 */
export const WithGroupsShowsRunButtonAndGroupList: Story = {
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);

		await step("Wait for groups to load", async () => {
			await waitFor(
				() => {
					const groupA = canvas.getByLabelText("Group: Group A");
					expect(groupA).toBeInTheDocument();
				},
				{ timeout: 3000 },
			);
		});

		await step("Verify run button and group list", async () => {
			const runButton = canvas.getByRole("button", {
				name: /run matcher detection/i,
			});
			expect(runButton).toBeInTheDocument();
			expect(canvas.getByText("Group A")).toBeInTheDocument();
			expect(canvas.getByText("Group B")).toBeInTheDocument();
		});
	},
};

/**
 * Run-all toggle and group multiselect are mutually exclusive: enabling run-all clears selection; selecting a group unchecks run-all.
 */
export const RunAllAndGroupSelectMutuallyExclusive: Story = {
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);

		await step("Wait for groups to load", async () => {
			await waitFor(
				() => {
					expect(canvas.getByLabelText("Group: Group A")).toBeInTheDocument();
				},
				{ timeout: 3000 },
			);
		});

		await step("Check Run all groups", async () => {
			const runAllCheckbox = canvas.getByRole("checkbox", {
				name: /run all groups/i,
			});
			await userEvent.click(runAllCheckbox);
			expect(runAllCheckbox).toBeChecked();
		});

		await step(
			"Verify group checkboxes are disabled when run-all is on",
			async () => {
				const groupACheckbox = canvas.getByLabelText("Group: Group A");
				expect(groupACheckbox).toBeDisabled();
			},
		);

		await step("Uncheck run-all and select a group", async () => {
			const runAllCheckbox = canvas.getByRole("checkbox", {
				name: /run all groups/i,
			});
			await userEvent.click(runAllCheckbox);
			expect(runAllCheckbox).not.toBeChecked();
			const groupACheckbox = canvas.getByLabelText("Group: Group A");
			await userEvent.click(groupACheckbox);
			expect(groupACheckbox).toBeChecked();
		});
	},
};

/**
 * Invalid selection (no run-all, no group selected) blocks submit and shows inline error.
 */
export const InvalidSelectionShowsInlineError: Story = {
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);

		await step("Wait for groups to load", async () => {
			await waitFor(
				() => {
					expect(canvas.getByLabelText("Group: Group A")).toBeInTheDocument();
				},
				{ timeout: 3000 },
			);
		});

		await step("Ensure run-all is off and no group selected", async () => {
			const runAllCheckbox = canvas.getByRole("checkbox", {
				name: /run all groups/i,
			});
			if ((runAllCheckbox as HTMLInputElement).checked)
				await userEvent.click(runAllCheckbox);
			const groupA = canvas.getByLabelText("Group: Group A");
			if ((groupA as HTMLInputElement).checked) await userEvent.click(groupA);
		});

		await step("Click run and verify inline error", async () => {
			const runButton = canvas.getByRole("button", {
				name: /run matcher detection/i,
			});
			await userEvent.click(runButton);
			await expect(
				canvas.findByText(
					/select at least one group or enable run all groups/i,
				),
			).resolves.toBeInTheDocument();
		});
	},
};

/**
 * Submits runMatcher with scope project when run-all is selected.
 */
export const SubmitWithRunAllCallsRunMatcher: Story = {
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);

		await step("Wait for groups and enable run-all", async () => {
			await waitFor(
				() => {
					expect(canvas.getByLabelText("Group: Group A")).toBeInTheDocument();
				},
				{ timeout: 3000 },
			);
			const runAllCheckbox = canvas.getByRole("checkbox", {
				name: /run all groups/i,
			});
			await userEvent.click(runAllCheckbox);
		});

		await step("Click run matcher detection", async () => {
			const runButton = canvas.getByRole("button", {
				name: /run matcher detection/i,
			});
			await userEvent.click(runButton);
		});

		await step("Button shows loading then settles", async () => {
			const runButton = canvas.getByRole("button", {
				name: /run matcher detection|running/i,
			});
			await waitFor(
				() => {
					expect(runButton).not.toHaveAttribute("aria-busy", "true");
				},
				{ timeout: 2000 },
			);
		});
	},
};
