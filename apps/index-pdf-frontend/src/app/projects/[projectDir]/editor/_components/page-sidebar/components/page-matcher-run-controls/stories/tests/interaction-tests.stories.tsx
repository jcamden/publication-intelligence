import { defaultInteractionTestMeta } from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, waitFor, within } from "@storybook/test";
import { PageMatcherRunControls } from "../../page-matcher-run-controls";

const meta: Meta<typeof PageMatcherRunControls> = {
	...defaultInteractionTestMeta,
	title:
		"Projects/[ProjectDir]/Editor/PageSidebar/PageMatcherRunControls/tests/Interaction Tests",
	component: PageMatcherRunControls,
	parameters: {
		layout: "centered",
	},
	args: {
		projectId: "mock-project-id",
		projectIndexTypeId: "mock-pit-subject-id",
		indexType: "subject",
		documentId: "550e8400-e29b-41d4-a716-446655440000",
		pageNumber: 1,
		emptyStateMessage:
			"Create groups and matchers in this index, then run detection.",
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * With groups loaded, run-all and group list are visible.
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
 * Run-all toggle and group multiselect are mutually exclusive.
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
	},
};

/**
 * Submits runMatcher with scope=page when run-all is selected.
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

/**
 * No-groups state shows run-all-matchers button.
 */
export const NoGroupsShowsRunAllMatchersButton: Story = {
	args: {
		projectId: "empty-groups-project",
		projectIndexTypeId: "mock-pit-subject-id",
		indexType: "subject",
		documentId: "550e8400-e29b-41d4-a716-446655440000",
		pageNumber: 1,
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
