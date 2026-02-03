import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, waitFor, within } from "@storybook/test";
import { useState } from "react";
import type { IndexEntry, MentionDraft } from "../../mention-creation-popover";
import { MentionCreationPopover } from "../../mention-creation-popover";
import { mockDraft, mockIndexEntries, mockRegionDraft } from "../shared";

const meta = {
	title:
		"Projects/[ProjectDir]/Editor/MentionCreationPopover/tests/Interaction Tests",
	component: MentionCreationPopover,
	parameters: {
		layout: "padded",
	},
} satisfies Meta<typeof MentionCreationPopover>;

export default meta;
type Story = StoryObj<typeof meta>;

const InteractiveWrapper = ({
	draft,
	existingEntries,
	onAttachCallback,
}: {
	draft: MentionDraft;
	existingEntries: IndexEntry[];
	onAttachCallback?: (
		entryId: string,
		entryLabel: string,
		regionName?: string,
	) => void;
}) => {
	const [result, setResult] = useState<{
		type: "attach" | "cancel" | null;
		entryId?: string;
		entryLabel?: string;
		regionName?: string;
	}>({ type: null });
	const [showPopover, setShowPopover] = useState(true);

	return (
		<div>
			{showPopover && (
				<MentionCreationPopover
					draft={draft}
					existingEntries={existingEntries}
					onAttach={({ entryId, entryLabel, regionName }) => {
						setResult({ type: "attach", entryId, entryLabel, regionName });
						setShowPopover(false);
						onAttachCallback?.(entryId, entryLabel, regionName);
					}}
					onCancel={() => {
						setResult({ type: "cancel" });
						setShowPopover(false);
					}}
				/>
			)}
			<div data-testid="result" style={{ marginTop: "300px" }}>
				{result.type === "attach" && (
					<>
						Attached: {result.entryLabel} ({result.entryId})
						{result.regionName && ` | Region: ${result.regionName}`}
					</>
				)}
				{result.type === "cancel" && "Cancelled"}
			</div>
		</div>
	);
};

export const SelectExistingEntry: Story = {
	args: {
		draft: mockDraft,
		existingEntries: mockIndexEntries,
		onAttach: () => {},
		onCancel: () => {},
	},
	render: () => (
		<InteractiveWrapper draft={mockDraft} existingEntries={mockIndexEntries} />
	),
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);

		await step("Input should be focused on mount", async () => {
			const input = canvas.getByPlaceholderText("Search or create...");
			await waitFor(() => {
				expect(document.activeElement).toBe(input);
			});
		});

		await step("Search for 'Kant'", async () => {
			const input = canvas.getByPlaceholderText("Search or create...");
			await userEvent.type(input, "Kant", { delay: 50 });

			// Wait for dropdown to render
			await new Promise((resolve) => setTimeout(resolve, 300));
		});

		await step("Select 'Kant, Immanuel' using keyboard", async () => {
			// Verify dropdown has the correct filtered option
			await waitFor(
				async () => {
					const options = within(document.body).queryAllByRole("option");
					await expect(options.length).toBeGreaterThan(0);
					const kantOption = options.find((opt) =>
						opt.textContent?.includes("Kant, Immanuel"),
					);
					await expect(kantOption).toBeDefined();
				},
				{ timeout: 3000 },
			);

			// ArrowDown is required to highlight the first option before Enter selects it
			// (Base UI Combobox doesn't auto-highlight the first filtered item)
			await userEvent.keyboard("{ArrowDown}");

			// Press Enter to select the highlighted option
			await userEvent.keyboard("{Enter}");

			// Wait for selection to complete and button text to update
			await waitFor(
				() => {
					const attachButton = canvas.getByRole("button", { name: "Attach" });
					expect(attachButton).toBeInTheDocument();
				},
				{ timeout: 2000 },
			);
		});

		await step("Click Attach button", async () => {
			const attachButton = canvas.getByRole("button", { name: "Attach" });
			await userEvent.click(attachButton);
		});

		await step("Verify mention was attached", async () => {
			const result = canvas.getByTestId("result");
			await waitFor(
				() => {
					expect(result).toHaveTextContent(/Attached: Kant, Immanuel/);
				},
				{ timeout: 2000 },
			);
		});
	},
};

export const CreateNewEntry: Story = {
	args: {
		draft: mockDraft,
		existingEntries: mockIndexEntries,
		onAttach: () => {},
		onCancel: () => {},
	},
	render: () => (
		<InteractiveWrapper draft={mockDraft} existingEntries={mockIndexEntries} />
	),
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);

		await step("Type new entry name", async () => {
			const input = canvas.getByPlaceholderText("Search or create...");
			await userEvent.type(input, "Heidegger", { delay: 50 });

			// Wait for dropdown to show "no results"
			await new Promise((resolve) => setTimeout(resolve, 300));
		});

		await step("Press Enter to close dropdown and submit", async () => {
			// Press Enter - should close dropdown since no matches
			await userEvent.keyboard("{Enter}");

			// Wait for dropdown to close
			await waitFor(
				async () => {
					const input = canvas.getByPlaceholderText("Search or create...");
					await expect(input).toHaveAttribute("aria-expanded", "false");
				},
				{ timeout: 2000 },
			);

			// Wait for submission to process
			await new Promise((resolve) => setTimeout(resolve, 200));
		});

		await step("Verify new entry was created", async () => {
			const result = canvas.getByTestId("result");
			await waitFor(
				() => {
					expect(result).toHaveTextContent("Attached: Heidegger");
				},
				{ timeout: 2000 },
			);
		});
	},
};

export const CancelWithButton: Story = {
	args: {
		draft: mockDraft,
		existingEntries: mockIndexEntries,
		onAttach: () => {},
		onCancel: () => {},
	},
	render: () => (
		<InteractiveWrapper draft={mockDraft} existingEntries={mockIndexEntries} />
	),
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);

		await step("Click cancel button", async () => {
			const cancelButton = canvas.getByRole("button", { name: "Cancel" });
			await userEvent.click(cancelButton);
		});

		await step("Verify cancellation", async () => {
			const result = canvas.getByTestId("result");
			await waitFor(() => {
				expect(result).toHaveTextContent("Cancelled");
			});
		});
	},
};

export const CancelWithEscape: Story = {
	args: {
		draft: mockDraft,
		existingEntries: mockIndexEntries,
		onAttach: () => {},
		onCancel: () => {},
	},
	render: () => (
		<InteractiveWrapper draft={mockDraft} existingEntries={mockIndexEntries} />
	),
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);

		await step("Press Escape key", async () => {
			await userEvent.keyboard("{Escape}");
		});

		await step("Verify cancellation", async () => {
			const result = canvas.getByTestId("result");
			await waitFor(() => {
				expect(result).toHaveTextContent("Cancelled");
			});
		});
	},
};

export const SearchWithNoResults: Story = {
	args: {
		draft: mockDraft,
		existingEntries: mockIndexEntries,
		onAttach: () => {},
		onCancel: () => {},
	},
	render: () => (
		<InteractiveWrapper draft={mockDraft} existingEntries={mockIndexEntries} />
	),
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);

		await step("Search for non-existent entry", async () => {
			const input = canvas.getByPlaceholderText("Search or create...");
			await userEvent.type(input, "Zzzzz");
		});

		await step("Verify empty state message", async () => {
			const body = within(document.body);
			await waitFor(async () => {
				const emptyMessage = body.getByText(
					/Press enter to create entry for "Zzzzz"/,
				);
				await expect(emptyMessage).toBeInTheDocument();
			});
		});
	},
};

export const SelectNestedEntry: Story = {
	args: {
		draft: mockDraft,
		existingEntries: mockIndexEntries,
		onAttach: () => {},
		onCancel: () => {},
	},
	render: () => (
		<InteractiveWrapper draft={mockDraft} existingEntries={mockIndexEntries} />
	),
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);

		await step("Search for 'Critique'", async () => {
			const input = canvas.getByPlaceholderText("Search or create...");
			await userEvent.type(input, "Critique", { delay: 50 });

			// Wait for dropdown to render
			await new Promise((resolve) => setTimeout(resolve, 300));
		});

		await step("Verify nested display format", async () => {
			await waitFor(
				async () => {
					const options = within(document.body).queryAllByRole("option");
					await expect(options.length).toBeGreaterThan(0);
				},
				{ timeout: 3000 },
			);

			const options = within(document.body).getAllByRole("option");
			const critiqueOption = options.find((opt) =>
				opt.textContent?.includes("Critique of Pure Reason"),
			);
			await expect(critiqueOption).toBeDefined();
		});

		await step("Select nested entry using keyboard", async () => {
			// ArrowDown is required to highlight the first option before Enter selects it
			// (Base UI Combobox doesn't auto-highlight the first filtered item)
			await userEvent.keyboard("{ArrowDown}");

			// Press Enter to select the highlighted option (Critique of Pure Reason)
			await userEvent.keyboard("{Enter}");

			// Wait for selection to complete and button text to update
			await waitFor(
				() => {
					const attachButton = canvas.getByRole("button", { name: "Attach" });
					expect(attachButton).toBeInTheDocument();
				},
				{ timeout: 2000 },
			);
		});

		await step("Click Attach button", async () => {
			const attachButton = canvas.getByRole("button", { name: "Attach" });
			await userEvent.click(attachButton);
		});

		await step("Verify mention was attached", async () => {
			const result = canvas.getByTestId("result");
			await waitFor(
				() => {
					expect(result).toHaveTextContent(/Attached: Critique of Pure Reason/);
				},
				{ timeout: 2000 },
			);
		});
	},
};

export const CreateRegionMention: Story = {
	args: {
		draft: mockRegionDraft,
		existingEntries: mockIndexEntries,
		onAttach: () => {},
		onCancel: () => {},
	},
	render: () => (
		<InteractiveWrapper
			draft={mockRegionDraft}
			existingEntries={mockIndexEntries}
		/>
	),
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);

		await step("Region name input should be focused on mount", async () => {
			const regionNameInput = canvas.getByLabelText("Region name");
			await waitFor(() => {
				expect(document.activeElement).toBe(regionNameInput);
			});
		});

		await step("Enter region name", async () => {
			const regionNameInput = canvas.getByLabelText("Region name");
			await userEvent.type(regionNameInput, "Introduction Section", {
				delay: 50,
			});
		});

		await step("Search for entry in combobox", async () => {
			const entryInput = canvas.getByPlaceholderText("Search or create...");
			await userEvent.click(entryInput);
			await userEvent.type(entryInput, "Philosophy", { delay: 50 });

			// Wait for dropdown to render
			await new Promise((resolve) => setTimeout(resolve, 300));
		});

		await step("Select entry using keyboard", async () => {
			// Verify dropdown has options
			await waitFor(
				async () => {
					const options = within(document.body).queryAllByRole("option");
					await expect(options.length).toBeGreaterThan(0);
				},
				{ timeout: 3000 },
			);

			// Select first option
			await userEvent.keyboard("{ArrowDown}");
			await userEvent.keyboard("{Enter}");

			// Wait for selection to complete
			await waitFor(
				() => {
					const attachButton = canvas.getByRole("button", { name: "Attach" });
					expect(attachButton).toBeInTheDocument();
				},
				{ timeout: 2000 },
			);
		});

		await step("Click Attach button", async () => {
			const attachButton = canvas.getByRole("button", { name: "Attach" });
			await userEvent.click(attachButton);
		});

		await step(
			"Verify region mention was attached with region name",
			async () => {
				const result = canvas.getByTestId("result");
				await waitFor(
					() => {
						expect(result).toHaveTextContent(/Attached: Philosophy/);
						expect(result).toHaveTextContent(/Region: Introduction Section/);
					},
					{ timeout: 2000 },
				);
			},
		);
	},
};
