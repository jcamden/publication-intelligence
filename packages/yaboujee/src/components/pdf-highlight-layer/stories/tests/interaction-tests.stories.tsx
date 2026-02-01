import { interactionTestConfig } from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/react";
import { expect, fn, userEvent, within } from "@storybook/test";
import type { PdfHighlight } from "../../../../types";
import { PdfHighlightLayer } from "../../pdf-highlight-layer";

const meta: Meta<typeof PdfHighlightLayer> = {
	title: "Components/PDF/PdfHighlightLayer/tests/Interaction Tests",
	component: PdfHighlightLayer,
	parameters: {
		...interactionTestConfig,
		layout: "centered",
	},
	tags: ["test:interaction"],
};

export default meta;
type Story = StoryObj<typeof meta>;

const mockHighlights: PdfHighlight[] = [
	{
		id: "highlight-1",
		pageNumber: 1,
		bbox: { x: 50, y: 100, width: 200, height: 20 },
		label: "AI Concepts",
		text: "artificial intelligence",
	},
	{
		id: "highlight-2",
		pageNumber: 1,
		bbox: { x: 50, y: 200, width: 180, height: 20 },
		label: "ML Techniques",
		text: "machine learning",
	},
];

/**
 * Test highlight click handler
 */
export const HighlightClick: Story = {
	render: () => {
		const handleClick = fn();
		return (
			<div
				style={{
					position: "relative",
					width: "600px",
					height: "400px",
					border: "1px solid #ccc",
				}}
			>
				<PdfHighlightLayer
					pageNumber={1}
					highlights={mockHighlights}
					pageWidth={600}
					pageHeight={400}
					scale={1}
					onHighlightClick={handleClick}
				/>
			</div>
		);
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const highlights = canvas.getAllByRole("button");

		await expect(highlights).toHaveLength(2);
		await userEvent.click(highlights[0]);
	},
};

/**
 * Test page filtering
 */
export const PageFiltering: Story = {
	render: () => {
		const multiPageHighlights: PdfHighlight[] = [
			...mockHighlights,
			{
				id: "highlight-3",
				pageNumber: 2,
				bbox: { x: 100, y: 150, width: 190, height: 20 },
				label: "Deep Learning",
				text: "neural networks",
			},
		];

		return (
			<div
				style={{
					position: "relative",
					width: "600px",
					height: "400px",
					border: "1px solid #ccc",
				}}
			>
				<PdfHighlightLayer
					pageNumber={1}
					highlights={multiPageHighlights}
					pageWidth={600}
					pageHeight={400}
					scale={1}
					onHighlightClick={fn()}
				/>
			</div>
		);
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const highlights = canvas.getAllByRole("button");

		await expect(highlights).toHaveLength(2);
	},
};
