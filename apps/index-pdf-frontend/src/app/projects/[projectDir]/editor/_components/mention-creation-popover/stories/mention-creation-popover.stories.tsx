import type { Meta, StoryObj } from "@storybook/react";
import { TestDecorator } from "@/app/_common/_test-utils/storybook-utils";
import { mockSubjectEntries } from "../../../_mocks/index-entries";
import type { MentionDraft } from "../mention-creation-popover";
import { MentionCreationPopover } from "../mention-creation-popover";

const meta = {
	title:
		"Projects/[ProjectDir]/Editor/MentionCreationPopover/Documentation Stories",
	component: MentionCreationPopover,
	parameters: {
		layout: "padded",
	},
	decorators: [TestDecorator],
} satisfies Meta<typeof MentionCreationPopover>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockDraft: MentionDraft = {
	documentId: "mock-document-id",
	pageNumber: 1,
	text: "This is a selected text that will be turned into a mention. It might be quite long and needs to be truncated in the UI.",
	bboxes: [{ x: 100, y: 200, width: 300, height: 40 }],
	type: "text",
};

const mockRegionDraft: MentionDraft = {
	documentId: "mock-document-id",
	pageNumber: 1,
	text: "",
	bboxes: [{ x: 100, y: 200, width: 300, height: 200 }],
	type: "region",
};

export const Default: Story = {
	args: {
		draft: mockDraft,
		indexType: "subject",
		entries: mockSubjectEntries,
		mentions: [],
		onAttach: ({ entryId, entryLabel }) => {
			console.log("Attached mention:", { entryId, entryLabel });
		},
		onCancel: () => {
			console.log("Cancelled mention creation");
		},
	},
};

export const NoEntries: Story = {
	args: {
		...Default.args,
	},
};

export const RegionDraft: Story = {
	args: {
		...Default.args,
		draft: mockRegionDraft,
	},
};
