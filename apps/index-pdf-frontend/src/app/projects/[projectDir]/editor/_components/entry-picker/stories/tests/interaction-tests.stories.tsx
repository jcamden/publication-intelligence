import { defaultInteractionTestMeta } from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/react";
import { expect, fn, userEvent, waitFor, within } from "@storybook/test";
import { useState } from "react";
import { flushSync } from "react-dom";
import {
	TestDecorator,
	TrpcDecorator,
} from "@/app/_common/_test-utils/storybook-utils";
import { mockSubjectEntries } from "../../../../_mocks/index-entries";
import { EntryPicker } from "../../entry-picker";

const meta = {
	...defaultInteractionTestMeta,
	title: "Projects/[ProjectDir]/Editor/EntryPicker/tests/Interaction Tests",
	component: EntryPicker,
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
} satisfies Meta<typeof EntryPicker>;

export default meta;
type Story = StoryObj<typeof meta>;

const InteractiveWrapper = ({
	showCreateOption = false,
}: {
	showCreateOption?: boolean;
}) => {
	const [value, setValue] = useState<string | null>(null);
	const [createLabel, setCreateLabel] = useState<string>("");
	const [createParentId, setCreateParentId] = useState<string | null>(null);

	return (
		<div>
			<EntryPicker
				entries={mockSubjectEntries}
				value={value}
				onValueChange={setValue}
				placeholder="Select entry..."
				showCreateOption={showCreateOption}
				onCreateEntry={({ label, parentId }) => {
					flushSync(() => {
						setCreateLabel(label);
						setCreateParentId(parentId);
					});
				}}
			/>
			<div data-testid="result" style={{ marginTop: "20px" }}>
				{value && <div>Selected: {value}</div>}
				{createLabel && (
					<div>
						Create requested: {createLabel} (parent: {createParentId || "none"})
					</div>
				)}
			</div>
		</div>
	);
};

export const ShowCreateButtonWhenNoResults: Story = {
	args: {
		entries: mockSubjectEntries,
		value: null,
		onValueChange: fn(),
		showCreateOption: true,
		onCreateEntry: fn(),
	},
	render: () => <InteractiveWrapper showCreateOption={true} />,
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);
		const body = within(document.body);

		await step("Search for non-existent entry", async () => {
			const input = canvas.getByRole("combobox");
			await userEvent.click(input);
			await new Promise((resolve) => setTimeout(resolve, 300));
			await userEvent.type(input, "Nonexistent Entry", { delay: 50 });
			await new Promise((resolve) => setTimeout(resolve, 500));
		});

		await step("Verify 'Create new entry' button appears", async () => {
			await waitFor(
				async () => {
					const createButton = body.getByRole("button", {
						name: /Create new entry: "Nonexistent Entry"/i,
					});
					await expect(createButton).toBeInTheDocument();
				},
				{ timeout: 3000 },
			);
		});
	},
};

export const CreateTopLevelEntry: Story = {
	args: {
		entries: mockSubjectEntries,
		value: null,
		onValueChange: fn(),
		showCreateOption: true,
		onCreateEntry: fn(),
	},
	render: () => <InteractiveWrapper showCreateOption={true} />,
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);
		const body = within(document.body);

		await step("Search for non-existent top-level entry", async () => {
			const input = canvas.getByRole("combobox");
			await userEvent.click(input);
			await new Promise((resolve) => setTimeout(resolve, 300));
			await userEvent.type(input, "New Topic", { delay: 50 });
			await new Promise((resolve) => setTimeout(resolve, 500));
		});

		await step("Click 'Create new entry' button", async () => {
			const createButton = body.getByRole("button", {
				name: /Create new entry: "New Topic"/i,
			});
			// Use native click to bypass userEvent's pointer event simulation
			(createButton as HTMLElement).click();
			await new Promise((resolve) => setTimeout(resolve, 500));
		});

		await step(
			"Verify create callback was called with correct params",
			async () => {
				const result = canvas.getByTestId("result");
				await waitFor(
					() => {
						expect(result).toHaveTextContent(/Create requested: New Topic/);
						expect(result).toHaveTextContent(/parent: none/);
					},
					{ timeout: 5000 },
				);
			},
		);
	},
};

export const CreateNestedEntry: Story = {
	args: {
		entries: mockSubjectEntries,
		value: null,
		onValueChange: fn(),
		showCreateOption: true,
		onCreateEntry: fn(),
	},
	render: () => <InteractiveWrapper showCreateOption={true} />,
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);
		const body = within(document.body);

		await step("Navigate into Philosophy > ", async () => {
			const input = canvas.getByRole("combobox");
			await userEvent.click(input);
			await new Promise((resolve) => setTimeout(resolve, 300));
			await userEvent.type(input, "Philosophy > ", { delay: 50 });
			await new Promise((resolve) => setTimeout(resolve, 500));
		});

		await step("Search for non-existent nested entry", async () => {
			const input = canvas.getByRole("combobox");
			await userEvent.type(input, "Phenomenology", { delay: 50 });
			await new Promise((resolve) => setTimeout(resolve, 500));
		});

		await step("Verify 'Create new entry' button appears", async () => {
			await waitFor(
				async () => {
					const createButton = body.getByRole("button", {
						name: /Create new entry: "Phenomenology"/i,
					});
					await expect(createButton).toBeInTheDocument();
				},
				{ timeout: 3000 },
			);
		});

		await step("Click 'Create new entry' button", async () => {
			const createButton = body.getByRole("button", {
				name: /Create new entry: "Phenomenology"/i,
			});
			// Use native click to bypass userEvent's pointer event simulation
			(createButton as HTMLElement).click();
			await new Promise((resolve) => setTimeout(resolve, 500));
		});

		await step("Verify create callback includes parent ID", async () => {
			const result = canvas.getByTestId("result");
			await waitFor(
				() => {
					expect(result).toHaveTextContent(/Create requested: Phenomenology/);
					// Should have Philosophy's ID as parent (not "none")
					expect(result).not.toHaveTextContent(/parent: none/);
				},
				{ timeout: 5000 },
			);
		});
	},
};

export const NoCreateButtonWhenDisabled: Story = {
	args: {
		entries: mockSubjectEntries,
		value: null,
		onValueChange: fn(),
		showCreateOption: false,
		onCreateEntry: undefined,
	},
	render: () => <InteractiveWrapper showCreateOption={false} />,
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);
		const body = within(document.body);

		await step("Search for non-existent entry", async () => {
			const input = canvas.getByRole("combobox");
			await userEvent.click(input);
			await new Promise((resolve) => setTimeout(resolve, 300));
			await userEvent.type(input, "Nonexistent", { delay: 50 });
			await new Promise((resolve) => setTimeout(resolve, 500));
		});

		await step("Verify only empty state message appears", async () => {
			await waitFor(
				async () => {
					const emptyMessage = body.getByText(/No entries found/i);
					await expect(emptyMessage).toBeInTheDocument();
				},
				{ timeout: 3000 },
			);

			// Should NOT have a create button
			const createButton = body.queryByRole("button", {
				name: /Create new entry/i,
			});
			expect(createButton).not.toBeInTheDocument();
		});
	},
};
