import { defaultInteractionTestMeta } from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, waitFor, within } from "@storybook/test";
import { useState } from "react";
import {
	TestDecorator,
	TrpcDecorator,
} from "@/app/_common/_test-utils/storybook-utils";
import { mockSubjectEntries } from "../../../../_mocks/index-entries";
import type { MentionDraft } from "../../mention-creation-popover";
import { MentionCreationPopover } from "../../mention-creation-popover";
import {
	mockDraft,
	mockDraftNoMatch,
	mockDraftPartialMatch,
	mockRegionDraft,
} from "../shared";

const meta = {
	...defaultInteractionTestMeta,
	title:
		"Projects/[ProjectDir]/Editor/MentionCreationPopover/tests/Interaction Tests",
	component: MentionCreationPopover,
	parameters: {
		layout: "padded",
	},
	decorators: [
		TestDecorator,
		(Story) => (
			<TrpcDecorator>
				<Story />
			</TrpcDecorator>
		),
	],
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
					entries={mockSubjectEntries}
					mentions={[]}
					projectId="test-project-id"
					projectIndexTypeId="test-project-index-type-id"
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
		draft: mockDraftPartialMatch,
		indexType: "subject",
		entries: mockSubjectEntries,
		mentions: [],
		projectId: "test-project-id",
		projectIndexTypeId: "test-project-index-type-id",
		onAttach: () => {},
		onCancel: () => {},
	},
	render: () => (
		<InteractiveWrapper draft={mockDraftPartialMatch} indexType="subject" />
	),
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);

		await step("Search for top-level entry", async () => {
			const input = canvas.getByRole("combobox");
			await userEvent.click(input);

			// Wait for dropdown to open
			await new Promise((resolve) => setTimeout(resolve, 300));

			// Type search term for a top-level entry
			await userEvent.clear(input);
			await userEvent.type(input, "Philo", { delay: 50 });

			// Wait for search to filter results
			await new Promise((resolve) => setTimeout(resolve, 500));
		});

		await step("Select 'Philosophy' using keyboard", async () => {
			// Verify dropdown has options
			await waitFor(
				async () => {
					const options = within(document.body).queryAllByRole("option");
					await expect(options.length).toBeGreaterThan(0);
				},
				{ timeout: 3000 },
			);

			// Press Enter to select the first (and only) filtered option
			await userEvent.keyboard("{Enter}");

			// Wait for selection to complete
			await new Promise((resolve) => setTimeout(resolve, 300));
		});

		await step("Click Attach button", async () => {
			const attachButton = canvas.getByRole("button", { name: "Attach" });
			await userEvent.click(attachButton);
		});

		await step("Verify mention was attached", async () => {
			const result = canvas.getByTestId("result");
			await waitFor(
				() => {
					expect(result).toHaveTextContent(/Attached: Philosophy/);
				},
				{ timeout: 2000 },
			);
		});
	},
};

export const TryToSubmitWithoutSelection: Story = {
	args: {
		draft: mockDraftNoMatch,
		indexType: "subject",
		entries: mockSubjectEntries,
		mentions: [],
		projectId: "test-project-id",
		projectIndexTypeId: "test-project-index-type-id",
		onAttach: () => {},
		onCancel: () => {},
	},
	render: () => (
		<InteractiveWrapper draft={mockDraftNoMatch} indexType="subject" />
	),
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);

		await step("Type non-existent entry name", async () => {
			const input = canvas.getByRole("combobox");
			await userEvent.click(input);
			await new Promise((resolve) => setTimeout(resolve, 300));
			await userEvent.type(input, "Heidegger", { delay: 50 });
			await new Promise((resolve) => setTimeout(resolve, 500));
		});

		await step("Close dropdown by pressing Escape", async () => {
			await userEvent.keyboard("{Escape}");
			await new Promise((resolve) => setTimeout(resolve, 300));
		});

		await step("Try to attach without selecting", async () => {
			const attachButton = canvas.getByRole("button", { name: "Attach" });
			await userEvent.click(attachButton);
			await new Promise((resolve) => setTimeout(resolve, 300));
		});

		await step("Verify validation error appears", async () => {
			await waitFor(
				async () => {
					const errorMessage = canvas.getByText(
						/Please select or create an entry/i,
					);
					await expect(errorMessage).toBeInTheDocument();
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
		entries: mockSubjectEntries,
		mentions: [],
		projectId: "test-project-id",
		projectIndexTypeId: "test-project-index-type-id",
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
		entries: mockSubjectEntries,
		mentions: [],
		projectId: "test-project-id",
		projectIndexTypeId: "test-project-index-type-id",
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
		draft: mockDraftPartialMatch,
		indexType: "subject",
		entries: mockSubjectEntries,
		mentions: [],
		projectId: "test-project-id",
		projectIndexTypeId: "test-project-index-type-id",
		onAttach: () => {},
		onCancel: () => {},
	},
	render: () => (
		<InteractiveWrapper draft={mockDraftPartialMatch} indexType="subject" />
	),
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);

		await step("Search for non-existent entry", async () => {
			const input = canvas.getByPlaceholderText("Select entry...");
			await userEvent.click(input);
			await new Promise((resolve) => setTimeout(resolve, 300));
			await userEvent.clear(input);
			await userEvent.type(input, "Zzzzz");
			await new Promise((resolve) => setTimeout(resolve, 500));
		});

		await step("Verify empty state message", async () => {
			const body = within(document.body);
			await waitFor(async () => {
				const emptyMessage = body.getByText(/No entries found/i);
				await expect(emptyMessage).toBeInTheDocument();
			});
		});
	},
};

export const SelectNestedEntry: Story = {
	args: {
		draft: mockDraftPartialMatch,
		indexType: "subject",
		entries: mockSubjectEntries,
		mentions: [],
		projectId: "test-project-id",
		projectIndexTypeId: "test-project-index-type-id",
		onAttach: () => {},
		onCancel: () => {},
	},
	render: () => (
		<InteractiveWrapper draft={mockDraftPartialMatch} indexType="subject" />
	),
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);
		const body = within(document.body);

		await step("Open dropdown and search for Science", async () => {
			const input = canvas.getByRole("combobox");
			await userEvent.click(input);

			// Wait for dropdown to open
			await new Promise((resolve) => setTimeout(resolve, 300));

			// Search for Science (top-level entry)
			await userEvent.clear(input);
			await userEvent.type(input, "Science", { delay: 50 });

			// Wait for filtering
			await new Promise((resolve) => setTimeout(resolve, 500));
		});

		await step("Select Science entry using native DOM click", async () => {
			// Wait for options to appear
			await waitFor(
				async () => {
					const options = body.queryAllByRole("option");
					await expect(options.length).toBeGreaterThan(0);
				},
				{ timeout: 2000 },
			);

			// Select "Science" using native DOM click
			const options = body.getAllByRole("option");
			const scienceOption = options.find((opt) =>
				opt.textContent?.includes("Science"),
			);
			if (!scienceOption) {
				throw new Error("Science option not found");
			}

			// Force click using native DOM method
			(scienceOption as HTMLElement).click();

			// Give it a moment to register the selection
			await new Promise((resolve) => setTimeout(resolve, 500));
		});

		await step("Click Attach button", async () => {
			const attachButton = canvas.getByRole("button", { name: "Attach" });
			await userEvent.click(attachButton);
		});

		await step("Verify mention was attached", async () => {
			const result = canvas.getByTestId("result");
			await waitFor(
				() => {
					expect(result).toHaveTextContent(/Attached: Science/);
				},
				{ timeout: 3000 },
			);
		});
	},
};

export const SmartAutocompleteExactMatch: Story = {
	args: {
		draft: mockDraft, // "Kant, Immanuel" - exact match in mock data
		indexType: "subject",
		entries: mockSubjectEntries,
		mentions: [],
		projectId: "test-project-id",
		projectIndexTypeId: "test-project-index-type-id",
		onAttach: () => {},
		onCancel: () => {},
	},
	render: () => <InteractiveWrapper draft={mockDraft} indexType="subject" />,
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);

		await step("Verify exact match auto-populated", async () => {
			await waitFor(
				() => {
					const input = canvas.getByRole("combobox");
					// The full hierarchy path should be shown
					const value = (input as HTMLInputElement).value;
					expect(value).toContain("Kant, Immanuel");
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
		entries: mockSubjectEntries,
		mentions: [],
		projectId: "test-project-id",
		projectIndexTypeId: "test-project-index-type-id",
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
			const entryInput = canvas.getByPlaceholderText("Select entry...");
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

export const CreateNewEntryFromPicker: Story = {
	args: {
		draft: mockDraftNoMatch,
		indexType: "subject",
		entries: mockSubjectEntries,
		mentions: [],
		projectId: "test-project-id",
		projectIndexTypeId: "test-project-index-type-id",
		onAttach: () => {},
		onCancel: () => {},
	},
	render: () => (
		<InteractiveWrapper draft={mockDraftNoMatch} indexType="subject" />
	),
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);
		const body = within(document.body);

		await step("Wait for story to be ready", async () => {
			await waitFor(
				() => {
					expect(canvas.getByRole("combobox")).toBeInTheDocument();
				},
				{ timeout: 5000 },
			);
		});

		await step("Search for non-existent entry", async () => {
			const input = canvas.getByRole("combobox");
			await userEvent.click(input);
			await new Promise((resolve) => setTimeout(resolve, 300));
			await userEvent.clear(input);
			await userEvent.type(input, "Heidegger", { delay: 50 });
			await new Promise((resolve) => setTimeout(resolve, 500));
		});

		await step("Verify 'Create new entry' button appears", async () => {
			await waitFor(
				async () => {
					const createButton = body.getByRole("button", {
						name: /Create new entry.*Heidegger/i,
					});
					await expect(createButton).toBeInTheDocument();
				},
				{ timeout: 5000 },
			);
		});

		await step("Click 'Create new entry' button", async () => {
			const createButton = body.getByRole("button", {
				name: /Create new entry.*Heidegger/i,
			});
			// Native click so the button's onPointerDown (preventDefault) doesn't block the click
			(createButton as HTMLElement).click();
			await new Promise((resolve) => setTimeout(resolve, 500));
		});

		await step("Verify EntryCreationModal opens", async () => {
			await waitFor(
				async () => {
					const modal = body.getByRole("dialog", { hidden: true });
					await expect(modal).toBeInTheDocument();
					const modalTitle = body.getByText("Create Index Entry");
					await expect(modalTitle).toBeInTheDocument();
				},
				{ timeout: 3000 },
			);
		});

		await step("Verify label is pre-filled", async () => {
			const labelInput = body.getByLabelText("Label");
			await waitFor(() => {
				expect((labelInput as HTMLInputElement).value).toBe("Heidegger");
			});
		});

		await step("Submit entry creation form", async () => {
			const createButton = body.getByRole("button", { name: /^Create$/i });
			await userEvent.click(createButton);
			await new Promise((resolve) => setTimeout(resolve, 1000));
		});

		await step("Verify new entry is auto-selected", async () => {
			// The modal should close and the entry should be selected in the picker
			await waitFor(
				async () => {
					const input = canvas.getByRole("combobox");
					const value = (input as HTMLInputElement).value;
					await expect(value).toContain("Heidegger");
				},
				{ timeout: 3000 },
			);
		});

		await step("Complete the attachment", async () => {
			const attachButton = canvas.getByRole("button", { name: "Attach" });
			await userEvent.click(attachButton);
		});

		await step("Verify mention was attached with new entry", async () => {
			const result = canvas.getByTestId("result");
			await waitFor(
				() => {
					expect(result).toHaveTextContent(/Attached: Heidegger/);
				},
				{ timeout: 2000 },
			);
		});
	},
};
