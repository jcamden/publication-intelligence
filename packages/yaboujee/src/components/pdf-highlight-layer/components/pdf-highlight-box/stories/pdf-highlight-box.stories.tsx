import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import type { PdfHighlight } from "../../../../../types";
import { PdfHighlightBox } from "../pdf-highlight-box";

const meta: Meta<typeof PdfHighlightBox> = {
	title: "Components/PDF/PdfHighlightBox",
	component: PdfHighlightBox,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

const mockHighlight: PdfHighlight = {
	id: "highlight-1",
	pageNumber: 1,
	bbox: { x: 50, y: 50, width: 200, height: 30 },
	label: "Example Highlight",
	text: "This is highlighted text",
};

/**
 * Basic highlight box
 */
export const Default: Story = {
	render: () => (
		<div
			style={{
				position: "relative",
				width: "400px",
				height: "200px",
				border: "1px solid #ccc",
				background: "#f5f5f5",
			}}
		>
			<PdfHighlightBox highlight={mockHighlight} scale={1} onClick={fn()} />
		</div>
	),
};

/**
 * Scaled highlight (2x)
 */
export const Scaled: Story = {
	render: () => (
		<div
			style={{
				position: "relative",
				width: "600px",
				height: "300px",
				border: "1px solid #ccc",
				background: "#f5f5f5",
			}}
		>
			<PdfHighlightBox highlight={mockHighlight} scale={2} onClick={fn()} />
		</div>
	),
};

/**
 * Rotated highlight (15 degrees)
 */
export const Rotated: Story = {
	render: () => {
		const rotatedHighlight: PdfHighlight = {
			...mockHighlight,
			bbox: { ...mockHighlight.bbox, rotation: 15 },
		};

		return (
			<div
				style={{
					position: "relative",
					width: "400px",
					height: "200px",
					border: "1px solid #ccc",
					background: "#f5f5f5",
				}}
			>
				<PdfHighlightBox
					highlight={rotatedHighlight}
					scale={1}
					onClick={fn()}
				/>
			</div>
		);
	},
};

/**
 * Multiple highlights showing overlap
 */
export const MultipleHighlights: Story = {
	render: () => {
		const highlights: PdfHighlight[] = [
			{
				id: "highlight-1",
				pageNumber: 1,
				bbox: { x: 50, y: 50, width: 150, height: 30 },
				label: "First",
				text: "First highlight",
			},
			{
				id: "highlight-2",
				pageNumber: 1,
				bbox: { x: 100, y: 70, width: 180, height: 30 },
				label: "Second",
				text: "Second highlight",
			},
			{
				id: "highlight-3",
				pageNumber: 1,
				bbox: { x: 50, y: 120, width: 200, height: 30 },
				label: "Third",
				text: "Third highlight",
			},
		];

		return (
			<div
				style={{
					position: "relative",
					width: "400px",
					height: "200px",
					border: "1px solid #ccc",
					background: "#f5f5f5",
				}}
			>
				{highlights.map((highlight) => (
					<PdfHighlightBox
						key={highlight.id}
						highlight={highlight}
						scale={1}
						onClick={fn()}
					/>
				))}
			</div>
		);
	},
};
