import { defaultInteractionTestMeta } from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, waitFor, within } from "@storybook/test";
import { useState } from "react";
import { TestDecorator } from "@/app/_common/_test-utils/storybook-utils";
import type { MentionDraft } from "../../mention-creation-popover";
import { MentionCreationPopover } from "../../mention-creation-popover";
import { mockDraft, mockDraftNoMatch, mockRegionDraft } from "../shared";

const meta = {
	...defaultInteractionTestMeta,
	title:
		"Projects/[ProjectDir]/Editor/MentionCreationPopover/tests/Interaction Tests",
	component: MentionCreationPopover,
	parameters: {
		layout: "padded",
	},
	decorators: [TestDecorator],
} satisfies Meta<typeof MentionCreationPopover>;

export default meta;
type Story = StoryObj<typeof meta>;

const InteractiveWrapper = ({
	draft,
	indexType,
	onAttachCallback,
}: {
	draft: MentionDraft;
	indexType: string;
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
					indexType={indexType}
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
		indexType: "subject",
		onAttach: () => {},
		onCancel: () => {},
	},
	render: () => <InteractiveWrapper draft={mockDraft} indexType="subject" />,
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);

		await step("Click input to ensure focus and open dropdown", async () => {
			const input = canvas.getByPlaceholderText("Search or create...");
			await userEvent.click(input);
			await new Promise((resolve) => setTimeout(resolve, 200));
		});

		await step("Clear input and search for 'Kant'", async () => {
			const input = canvas.getByPlaceholderText("Search or create...");
			await userEvent.clear(input);
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
		draft: mockDraftNoMatch,
		indexType: "subject",
		onAttach: () => {},
		onCancel: () => {},
	},
	render: () => (
		<InteractiveWrapper draft={mockDraftNoMatch} indexType="subject" />
	),
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);

		await step("Click input to open dropdown", async () => {
			const input = canvas.getByPlaceholderText("Search or create...");
			await userEvent.click(input);
			await new Promise((resolve) => setTimeout(resolve, 200));
		});

		await step("Type new entry name", async () => {
			const input = canvas.getByPlaceholderText("Search or create...");
			await userEvent.type(input, "Heidegger", { delay: 50 });
			await new Promise((resolve) => setTimeout(resolve, 500));
		});

		await step("Press Enter to trigger create new entry", async () => {
			await userEvent.keyboard("{Enter}");
			await new Promise((resolve) => setTimeout(resolve, 300));
		});

		await step("Wait for EntryCreationModal to open", async () => {
			const body = within(document.body);
			await waitFor(
				() => {
					const modal = body.getByRole("dialog", { hidden: true });
					expect(modal).toBeInTheDocument();
				},
				{ timeout: 2000 },
			);
		});

		await step("Submit the modal to create entry", async () => {
			const body = within(document.body);
			const createButton = body.getByRole("button", { name: "Create" });
			await userEvent.click(createButton);
			await new Promise((resolve) => setTimeout(resolve, 500));
		});

		await step("Click Attach button", async () => {
			const attachButton = canvas.getByRole("button", { name: "Attach" });
			await userEvent.click(attachButton);
		});

		await step("Verify new entry was attached", async () => {
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
		indexType: "subject",
		onAttach: () => {},
		onCancel: () => {},
	},
	render: () => <InteractiveWrapper draft={mockDraft} indexType="subject" />,
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
		indexType: "subject",
		onAttach: () => {},
		onCancel: () => {},
	},
	render: () => <InteractiveWrapper draft={mockDraft} indexType="subject" />,
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
		indexType: "subject",
		onAttach: () => {},
		onCancel: () => {},
	},
	render: () => <InteractiveWrapper draft={mockDraft} indexType="subject" />,
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);

		await step("Click input to open dropdown", async () => {
			const input = canvas.getByPlaceholderText("Search or create...");
			await userEvent.click(input);
		});

		await step("Search for non-existent entry", async () => {
			const input = canvas.getByPlaceholderText("Search or create...");
			await userEvent.type(input, "Zzzzz");
			await new Promise((resolve) => setTimeout(resolve, 200));
		});

		await step("Verify empty state message", async () => {
			const body = within(document.body);
			await waitFor(async () => {
				const emptyMessage = body.getByText(/No matching entries/);
				await expect(emptyMessage).toBeInTheDocument();
			});
		});
	},
};

export const SelectNestedEntry: Story = {
	args: {
		draft: mockDraft,
		indexType: "subject",
		onAttach: () => {},
		onCancel: () => {},
	},
	render: () => <InteractiveWrapper draft={mockDraft} indexType="subject" />,
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);

		await step("Click input to open dropdown", async () => {
			const input = canvas.getByPlaceholderText("Search or create...");
			await userEvent.click(input);
			await new Promise((resolve) => setTimeout(resolve, 200));
		});

		await step("Clear input and search for 'Aristotle'", async () => {
			const input = canvas.getByPlaceholderText("Search or create...");
			await userEvent.clear(input);
			await userEvent.type(input, "Aristotle", { delay: 50 });
			await new Promise((resolve) => setTimeout(resolve, 500));
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
			const aristotleOption = options.find((opt) =>
				opt.textContent?.includes("Aristotle"),
			);
			await expect(aristotleOption).toBeDefined();
		});

		await step("Select nested entry using keyboard", async () => {
			// ArrowDown is required to highlight the first option before Enter selects it
			// (Base UI Combobox doesn't auto-highlight the first filtered item)
			await userEvent.keyboard("{ArrowDown}");

			// Press Enter to select the highlighted option (Aristotle)
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
					expect(result).toHaveTextContent(/Attached: Aristotle/);
				},
				{ timeout: 2000 },
			);
		});
	},
};

export const SmartAutocompleteExactMatch: Story = {
	args: {
		draft: mockDraft, // "Kant, Immanuel" - exact match in mock data
		indexType: "subject",
		onAttach: () => {},
		onCancel: () => {},
	},
	render: () => <InteractiveWrapper draft={mockDraft} indexType="subject" />,
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);

		await step("Verify exact match auto-populated", async () => {
			await waitFor(
				() => {
					const input = canvas.getByPlaceholderText("Search or create...");
					expect((input as HTMLInputElement).value).toBe("Kant, Immanuel");
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

export const CreateRegionMention: Story = {
	args: {
		draft: mockRegionDraft,
		indexType: "subject",
		onAttach: () => {},
		onCancel: () => {},
	},
	render: () => (
		<InteractiveWrapper draft={mockRegionDraft} indexType="subject" />
	),
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);

		await step("Click region name input to ensure focus", async () => {
			const regionNameInput = canvas.getByLabelText("Region name");
			await userEvent.click(regionNameInput);
			await new Promise((resolve) => setTimeout(resolve, 200));
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
			await new Promise((resolve) => setTimeout(resolve, 200));
			await userEvent.type(entryInput, "Philosophy", { delay: 50 });
			await new Promise((resolve) => setTimeout(resolve, 500));
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
