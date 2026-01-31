import {
	defaultGlobals,
	visualRegressionTestConfig,
} from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import type { ViewerMention } from "@/types/mentions";
import { HighlightLayer } from "../../highlight-layer";

const meta: Meta<typeof HighlightLayer> = {
	title:
		"Components/PDF/PdfEditor/HighlightLayer/tests/Visual Regression Tests",
	component: HighlightLayer,
	parameters: {
		...visualRegressionTestConfig,
		layout: "centered",
	},
	tags: ["visual-regression"],
};

export default meta;
type Story = StoryObj<typeof meta>;

const mockMentions: ViewerMention[] = [
	{
		id: "mention-1",
		page_number: 1,
		text_span: "artificial intelligence",
		bbox: { x: 50, y: 50, width: 200, height: 20 },
		entryLabel: "AI Concepts",
		range_type: "exact",
	},
	{
		id: "mention-2",
		page_number: 1,
		text_span: "machine learning",
		bbox: { x: 50, y: 100, width: 180, height: 20 },
		entryLabel: "ML Techniques",
		range_type: "exact",
	},
	{
		id: "mention-3",
		page_number: 1,
		text_span: "deep learning",
		bbox: { x: 300, y: 50, width: 150, height: 20 },
		entryLabel: "Deep Learning",
		range_type: "exact",
	},
];

const renderAllVariants = () => (
	<div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
		<div>
			<div
				style={{ fontSize: "12px", fontWeight: "bold", marginBottom: "8px" }}
			>
				Single Highlight
			</div>
			<div
				style={{
					position: "relative",
					width: "500px",
					height: "150px",
					border: "1px solid #ccc",
					background: "#f5f5f5",
				}}
			>
				<HighlightLayer
					pageNumber={1}
					mentions={[mockMentions[0]]}
					pageWidth={500}
					pageHeight={150}
					scale={1}
					onHighlightClick={fn()}
				/>
			</div>
		</div>

		<div>
			<div
				style={{ fontSize: "12px", fontWeight: "bold", marginBottom: "8px" }}
			>
				Multiple Highlights
			</div>
			<div
				style={{
					position: "relative",
					width: "500px",
					height: "200px",
					border: "1px solid #ccc",
					background: "#f5f5f5",
				}}
			>
				<HighlightLayer
					pageNumber={1}
					mentions={mockMentions}
					pageWidth={500}
					pageHeight={200}
					scale={1}
					onHighlightClick={fn()}
				/>
			</div>
		</div>

		<div>
			<div
				style={{ fontSize: "12px", fontWeight: "bold", marginBottom: "8px" }}
			>
				Scaled (1.5x)
			</div>
			<div
				style={{
					position: "relative",
					width: "750px",
					height: "300px",
					border: "1px solid #ccc",
					background: "#f5f5f5",
				}}
			>
				<HighlightLayer
					pageNumber={1}
					mentions={mockMentions}
					pageWidth={500}
					pageHeight={200}
					scale={1.5}
					onHighlightClick={fn()}
				/>
			</div>
		</div>

		<div>
			<div
				style={{ fontSize: "12px", fontWeight: "bold", marginBottom: "8px" }}
			>
				Overlapping Highlights
			</div>
			<div
				style={{
					position: "relative",
					width: "500px",
					height: "150px",
					border: "1px solid #ccc",
					background: "#f5f5f5",
				}}
			>
				<HighlightLayer
					pageNumber={1}
					mentions={[
						{
							id: "mention-1",
							page_number: 1,
							text_span: "first",
							bbox: { x: 50, y: 50, width: 150, height: 30 },
							entryLabel: "Entry 1",
							range_type: "exact",
						},
						{
							id: "mention-2",
							page_number: 1,
							text_span: "overlapping",
							bbox: { x: 100, y: 60, width: 150, height: 30 },
							entryLabel: "Entry 2",
							range_type: "exact",
						},
					]}
					pageWidth={500}
					pageHeight={150}
					scale={1}
					onHighlightClick={fn()}
				/>
			</div>
		</div>

		<div>
			<div
				style={{ fontSize: "12px", fontWeight: "bold", marginBottom: "8px" }}
			>
				Empty (No Highlights)
			</div>
			<div
				style={{
					position: "relative",
					width: "500px",
					height: "150px",
					border: "1px solid #ccc",
					background: "#f5f5f5",
				}}
			>
				<HighlightLayer
					pageNumber={1}
					mentions={[]}
					pageWidth={500}
					pageHeight={150}
					scale={1}
					onHighlightClick={fn()}
				/>
			</div>
		</div>
	</div>
);

/**
 * All variants in light mode
 */
export const AllVariants: Story = {
	globals: {
		...defaultGlobals,
	},
	render: renderAllVariants,
};

/**
 * All variants in dark mode
 */
export const AllVariantsDark: Story = {
	globals: {
		...defaultGlobals,
		theme: "dark",
	},
	render: renderAllVariants,
};
