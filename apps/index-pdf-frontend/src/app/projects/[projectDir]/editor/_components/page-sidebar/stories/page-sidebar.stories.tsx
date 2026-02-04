import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { PageSidebar } from "../page-sidebar";

const meta: Meta<typeof PageSidebar> = {
	title: "Projects/[ProjectDir]/Editor/PageSidebar",
	component: PageSidebar,
	tags: ["autodocs"],
	parameters: {
		layout: "fullscreen",
		docs: {
			description: {
				component:
					"Right sidebar showing page-level panels (info, indices, etc.). Note: This component requires Jotai Provider to function.",
			},
		},
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

const mockMentions = [
	{
		id: "1",
		pageNumber: 1,
		text: "This is a sample mention text",
		entryLabel: "Philosophy → Kant",
		entryId: "entry-1",
		indexTypes: ["subject"],
		type: "text" as const,
	},
	{
		id: "2",
		pageNumber: 1,
		text: "Another mention on the same page",
		entryLabel: "Author → Immanuel Kant",
		entryId: "entry-2",
		indexTypes: ["author"],
		type: "text" as const,
	},
];

export const Default: Story = {
	render: () => (
		<div
			style={{
				width: "300px",
				height: "600px",
				border: "1px solid #ccc",
			}}
		>
			<PageSidebar
				activeAction={{ type: null, indexType: null }}
				onSelectText={fn()}
				onDrawRegion={fn()}
				mentions={mockMentions}
				currentPage={1}
				onMentionClick={fn()}
			/>
		</div>
	),
};
