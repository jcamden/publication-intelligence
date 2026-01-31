import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import type { ViewerMention } from "@/types/mentions";
import { HighlightLayer } from "../highlight-layer";

const meta: Meta<typeof HighlightLayer> = {
	title: "Components/PDF/PdfEditor/HighlightLayer",
	component: HighlightLayer,
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
			<HighlightLayer
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

export const WithScaling: Story = {
	render: () => (
		<div
			style={{
				position: "relative",
				width: "900px",
				height: "1200px",
				border: "1px solid #ccc",
				background: "#f5f5f5",
			}}
		>
			<HighlightLayer
				pageNumber={1}
				mentions={mockMentions}
				pageWidth={600}
				pageHeight={800}
				scale={1.5}
				onHighlightClick={fn()}
			/>
		</div>
	),
};

export const EmptyPage: Story = {
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
			<HighlightLayer
				pageNumber={1}
				mentions={[]}
				pageWidth={600}
				pageHeight={800}
				scale={1}
				onHighlightClick={fn()}
			/>
		</div>
	),
};

export const PageTwoHighlights: Story = {
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
			<HighlightLayer
				pageNumber={2}
				mentions={mockMentions}
				pageWidth={600}
				pageHeight={800}
				scale={1}
				onHighlightClick={fn()}
			/>
		</div>
	),
};

export const OverlappingHighlights: Story = {
	render: () => {
		const overlappingMentions: ViewerMention[] = [
			{
				id: "mention-1",
				page_number: 1,
				text_span: "first highlight",
				bbox: { x: 100, y: 100, width: 200, height: 30 },
				entryLabel: "Entry 1",
				range_type: "exact",
			},
			{
				id: "mention-2",
				page_number: 1,
				text_span: "overlapping highlight",
				bbox: { x: 150, y: 110, width: 200, height: 30 },
				entryLabel: "Entry 2",
				range_type: "exact",
			},
		];

		return (
			<div
				style={{
					position: "relative",
					width: "600px",
					height: "800px",
					border: "1px solid #ccc",
					background: "#f5f5f5",
				}}
			>
				<HighlightLayer
					pageNumber={1}
					mentions={overlappingMentions}
					pageWidth={600}
					pageHeight={800}
					scale={1}
					onHighlightClick={fn()}
				/>
			</div>
		);
	},
};
