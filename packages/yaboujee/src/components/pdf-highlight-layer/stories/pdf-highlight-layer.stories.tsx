import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import type { PdfHighlight } from "../../../types";
import { PdfHighlightLayer } from "../pdf-highlight-layer";

const meta: Meta<typeof PdfHighlightLayer> = {
	title: "Components/PDF/PdfHighlightLayer",
	component: PdfHighlightLayer,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

const mockHighlights: PdfHighlight[] = [
	{
		id: "highlight-1",
		pageNumber: 1,
		bboxes: [{ x: 50, y: 50, width: 200, height: 20 }],
		label: "AI Concepts",
		text: "artificial intelligence",
	},
	{
		id: "highlight-2",
		pageNumber: 1,
		bboxes: [{ x: 50, y: 100, width: 180, height: 20 }],
		label: "ML Techniques",
		text: "machine learning",
	},
	{
		id: "highlight-3",
		pageNumber: 1,
		bboxes: [{ x: 300, y: 50, width: 150, height: 20 }],
		label: "Deep Learning",
		text: "deep learning",
	},
];

/**
 * Basic usage with multiple highlights
 */
export const Default: Story = {
	render: () => (
		<div
			style={{
				position: "relative",
				width: "600px",
				height: "400px",
				border: "1px solid #ccc",
				background: "#f5f5f5",
			}}
		>
			<PdfHighlightLayer
				pageNumber={1}
				highlights={mockHighlights}
				pageWidth={600}
				pageHeight={400}
				scale={1}
				onHighlightClick={fn()}
			/>
		</div>
	),
};

/**
 * Single highlight
 */
export const SingleHighlight: Story = {
	render: () => (
		<div
			style={{
				position: "relative",
				width: "500px",
				height: "200px",
				border: "1px solid #ccc",
				background: "#f5f5f5",
			}}
		>
			<PdfHighlightLayer
				pageNumber={1}
				highlights={[mockHighlights[0]]}
				pageWidth={500}
				pageHeight={200}
				scale={1}
				onHighlightClick={fn()}
			/>
		</div>
	),
};

/**
 * Scaled layer (1.5x)
 */
export const Scaled: Story = {
	render: () => (
		<div
			style={{
				position: "relative",
				width: "900px",
				height: "600px",
				border: "1px solid #ccc",
				background: "#f5f5f5",
			}}
		>
			<PdfHighlightLayer
				pageNumber={1}
				highlights={mockHighlights}
				pageWidth={600}
				pageHeight={400}
				scale={1.5}
				onHighlightClick={fn()}
			/>
		</div>
	),
};

/**
 * Empty layer (no highlights on this page)
 */
export const Empty: Story = {
	render: () => (
		<div
			style={{
				position: "relative",
				width: "600px",
				height: "400px",
				border: "1px solid #ccc",
				background: "#f5f5f5",
			}}
		>
			<PdfHighlightLayer
				pageNumber={2}
				highlights={mockHighlights}
				pageWidth={600}
				pageHeight={400}
				scale={1}
				onHighlightClick={fn()}
			/>
		</div>
	),
};

/**
 * Overlapping highlights
 */
export const Overlapping: Story = {
	render: () => {
		const overlappingHighlights: PdfHighlight[] = [
			{
				id: "highlight-1",
				pageNumber: 1,
				bboxes: [{ x: 50, y: 50, width: 150, height: 30 }],
				label: "Entry 1",
				text: "first",
			},
			{
				id: "highlight-2",
				pageNumber: 1,
				bboxes: [{ x: 100, y: 60, width: 150, height: 30 }],
				label: "Entry 2",
				text: "overlapping",
			},
		];

		return (
			<div
				style={{
					position: "relative",
					width: "500px",
					height: "200px",
					border: "1px solid #ccc",
					background: "#f5f5f5",
				}}
			>
				<PdfHighlightLayer
					pageNumber={1}
					highlights={overlappingHighlights}
					pageWidth={500}
					pageHeight={200}
					scale={1}
					onHighlightClick={fn()}
				/>
			</div>
		);
	},
};
