import { defaultInteractionTestMeta } from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { flushSync } from "react-dom";
import { fn, within } from "storybook/test";
import {
	TestDecorator,
	TrpcDecorator,
} from "@/app/_common/_test-utils/storybook-utils";
import { mockSubjectEntries } from "../../../../_mocks/mock-index-entries";
import { EntryPicker } from "../../entry-picker";
import {
	createNestedEntry,
	createTopLevelEntry,
	noCreateButtonWhenDisabled,
	showCreateButtonWhenNoResults,
} from "../helpers/steps";

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
		await showCreateButtonWhenNoResults({ canvas, step });
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
		await createTopLevelEntry({ canvas, step });
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
		await createNestedEntry({ canvas, step });
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
		await noCreateButtonWhenDisabled({ canvas, step });
	},
};
