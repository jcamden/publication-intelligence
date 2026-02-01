import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import type { ViewerMention } from "@/app/projects/[projectDir]/editor/_types/mentions";
import { ViewerHighlightLayer } from "../viewer-highlight-layer";

/**
 * ViewerHighlightLayer is an adapter that converts ViewerMention data to PdfHighlight format.
 *
 * For comprehensive component documentation, interactions, and visual regression tests,
 * see the PdfHighlightLayer component in the yaboujee package.
 */
const meta: Meta<typeof ViewerHighlightLayer> = {
	title: "Projects/[ProjectDir]/Editor/ViewerHighlightLayer",
	component: ViewerHighlightLayer,
	tags: ["autodocs"],
	parameters: {
		layout: "centered",
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

const mockMentions: ViewerMention[] = [
	{
		id: "mention-1",
		page_number: 1,
		text_span: "artificial intelligence",
		bbox: { x: 50, y: 100, width: 200, height: 20 },
		entryLabel: "AI Concepts",
		range_type: "exact",
	},
	{
		id: "mention-2",
		page_number: 1,
		text_span: "machine learning",
		bbox: { x: 50, y: 200, width: 180, height: 20 },
		entryLabel: "ML Techniques",
		range_type: "exact",
	},
	{
		id: "mention-3",
		page_number: 2,
		text_span: "neural networks",
		bbox: { x: 100, y: 150, width: 190, height: 20 },
		entryLabel: "Deep Learning",
		range_type: "exact",
	},
];

/**
 * Default story demonstrating the adapter with ViewerMention data.
 * This shows how the adapter converts domain-specific ViewerMentions
 * to the generic PdfHighlight format used by yaboujee components.
 */
export const Default: Story = {
	render: () => (
		<div
			style={{
				position: "relative",
				width: "600px",
				height: "800px",
				border: "1px solid #ccc",
				background: "#f5f5f5",
			}}
		>
			<ViewerHighlightLayer
				pageNumber={1}
				mentions={mockMentions}
				pageWidth={600}
				pageHeight={800}
				scale={1}
				onHighlightClick={fn()}
			/>
		</div>
	),
};
