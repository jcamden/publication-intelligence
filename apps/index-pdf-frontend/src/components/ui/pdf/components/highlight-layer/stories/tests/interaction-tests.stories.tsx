import { interactionTestConfig } from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/react";
import { expect, fn, userEvent, within } from "@storybook/test";
import type { ViewerMention } from "@/types/mentions";
import { HighlightLayer } from "../../highlight-layer";

const meta: Meta<typeof HighlightLayer> = {
	title: "Components/PDF/PdfEditor/HighlightLayer/tests/Interaction Tests",
	component: HighlightLayer,
	parameters: {
		...interactionTestConfig,
		layout: "centered",
	},
	tags: ["test:interaction"],
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
				<HighlightLayer
					pageNumber={1}
					mentions={mockMentions}
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
 * Test highlight accessibility labels
 */
export const HighlightAccessibility: Story = {
	render: () => (
		<div
			style={{
				position: "relative",
				width: "600px",
				height: "400px",
				border: "1px solid #ccc",
			}}
		>
			<HighlightLayer
				pageNumber={1}
				mentions={mockMentions}
				pageWidth={600}
				pageHeight={400}
				scale={1}
				onHighlightClick={fn()}
			/>
		</div>
	),
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		const aiHighlight = canvas.getByLabelText("Highlight: AI Concepts");
		await expect(aiHighlight).toBeVisible();
		await expect(aiHighlight).toHaveAttribute(
			"title",
			"AI Concepts: artificial intelligence",
		);

		const mlHighlight = canvas.getByLabelText("Highlight: ML Techniques");
		await expect(mlHighlight).toBeVisible();
		await expect(mlHighlight).toHaveAttribute(
			"title",
			"ML Techniques: machine learning",
		);
	},
};

/**
 * Test empty page renders nothing
 */
export const EmptyPageRendersNothing: Story = {
	render: () => (
		<div
			style={{
				position: "relative",
				width: "600px",
				height: "400px",
				border: "1px solid #ccc",
			}}
			data-testid="highlight-container"
		>
			<HighlightLayer
				pageNumber={1}
				mentions={[]}
				pageWidth={600}
				pageHeight={400}
				scale={1}
				onHighlightClick={fn()}
			/>
		</div>
	),
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const container = canvas.getByTestId("highlight-container");

		const buttons = within(container).queryAllByRole("button");
		await expect(buttons).toHaveLength(0);
	},
};

/**
 * Test page filtering
 */
export const PageFiltering: Story = {
	render: () => {
		const multiPageMentions: ViewerMention[] = [
			...mockMentions,
			{
				id: "mention-3",
				page_number: 2,
				text_span: "neural networks",
				bbox: { x: 100, y: 150, width: 190, height: 20 },
				entryLabel: "Deep Learning",
				range_type: "exact",
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
				<HighlightLayer
					pageNumber={1}
					mentions={multiPageMentions}
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

/**
 * Test hover behavior
 */
export const HoverBehavior: Story = {
	render: () => (
		<div
			style={{
				position: "relative",
				width: "600px",
				height: "400px",
				border: "1px solid #ccc",
			}}
		>
			<HighlightLayer
				pageNumber={1}
				mentions={mockMentions}
				pageWidth={600}
				pageHeight={400}
				scale={1}
				onHighlightClick={fn()}
			/>
		</div>
	),
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const highlights = canvas.getAllByRole("button");

		await userEvent.hover(highlights[0]);
		await expect(highlights[0]).toBeVisible();
	},
};
