import { defaultInteractionTestMeta } from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { within } from "storybook/test";
import {
	TestDecorator,
	TrpcDecorator,
} from "@/app/_common/_test-utils/storybook-utils";
import { mockSubjectEntries } from "../../../../_mocks/mock-index-entries";
import type { MentionDraft } from "../../mention-creation-popover";
import { MentionCreationPopover } from "../../mention-creation-popover";
import {
	cancelWithButton,
	cancelWithEscape,
	createNewEntryFromPicker,
	createRegionMention,
	searchWithNoResults,
	selectExistingEntry,
	selectNestedEntry,
	smartAutocompleteExactMatch,
	tryToSubmitWithoutSelection,
} from "../helpers/steps";
import {
	mockDraft,
	mockDraftNoMatch,
	mockDraftPartialMatch,
	mockDraftTopLevelExactMatch,
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
		await selectExistingEntry({ canvas, step });
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
		await tryToSubmitWithoutSelection({ canvas, step });
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
		await cancelWithButton({ canvas, step });
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
		await cancelWithEscape({ canvas, step });
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
		await searchWithNoResults({ canvas, step });
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
		await selectNestedEntry({ canvas, step });
	},
};

export const SmartAutocompleteExactMatch: Story = {
	args: {
		draft: mockDraftTopLevelExactMatch, // "Science" - top-level exact match (only these are auto-selected)
		indexType: "subject",
		entries: mockSubjectEntries,
		mentions: [],
		projectId: "test-project-id",
		projectIndexTypeId: "test-project-index-type-id",
		onAttach: () => {},
		onCancel: () => {},
	},
	render: () => (
		<InteractiveWrapper
			draft={mockDraftTopLevelExactMatch}
			indexType="subject"
		/>
	),
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);
		await smartAutocompleteExactMatch({ canvas, step });
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
		await createRegionMention({ canvas, step });
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
		await createNewEntryFromPicker({ canvas, step });
	},
};
