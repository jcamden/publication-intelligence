import {
	defaultGlobals,
	visualRegressionTestConfig,
} from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import type { PdfHighlight } from "../../../../types";
import { PdfHighlightLayer } from "../../pdf-highlight-layer";

const meta: Meta<typeof PdfHighlightLayer> = {
	title: "Components/PDF/PdfHighlightLayer/tests/Visual Regression Tests",
	component: PdfHighlightLayer,
	parameters: {
		...visualRegressionTestConfig,
		layout: "centered",
	},
	tags: ["visual-regression"],
};

export default meta;
type Story = StoryObj<typeof meta>;

const mockHighlights: PdfHighlight[] = [
	{
		id: "highlight-1",
		pageNumber: 1,
		bbox: { x: 50, y: 50, width: 200, height: 20 },
		label: "AI Concepts",
		text: "artificial intelligence",
	},
	{
		id: "highlight-2",
		pageNumber: 1,
		bbox: { x: 50, y: 100, width: 180, height: 20 },
		label: "ML Techniques",
		text: "machine learning",
	},
	{
		id: "highlight-3",
		pageNumber: 1,
		bbox: { x: 300, y: 50, width: 150, height: 20 },
		label: "Deep Learning",
		text: "deep learning",
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
				<PdfHighlightLayer
					pageNumber={1}
					highlights={[mockHighlights[0]]}
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
				<PdfHighlightLayer
					pageNumber={1}
					highlights={mockHighlights}
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
				<PdfHighlightLayer
					pageNumber={1}
					highlights={mockHighlights}
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
				<PdfHighlightLayer
					pageNumber={1}
					highlights={[
						{
							id: "highlight-1",
							pageNumber: 1,
							bbox: { x: 50, y: 50, width: 150, height: 30 },
							label: "Entry 1",
							text: "first",
						},
						{
							id: "highlight-2",
							pageNumber: 1,
							bbox: { x: 100, y: 60, width: 150, height: 30 },
							label: "Entry 2",
							text: "overlapping",
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
				<PdfHighlightLayer
					pageNumber={1}
					highlights={[]}
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

/**
 * Hover state on highlight
 */
export const HoverState: Story = {
	globals: {
		...defaultGlobals,
	},
	parameters: {
		pseudo: {
			hover: ['[data-testid="highlight-highlight-1"]'],
		},
	},
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
	play: async () => {
		// Wait for pseudo-state CSS transitions to complete before VRT snapshot
		await new Promise((resolve) => setTimeout(resolve, 300));
	},
};

/**
 * Hover state on highlight in dark mode
 */
export const HoverStateDark: Story = {
	globals: {
		...defaultGlobals,
		theme: "dark",
	},
	parameters: {
		pseudo: {
			hover: ['[data-testid="highlight-highlight-1"]'],
		},
	},
	render: () => (
		<div
			style={{
				position: "relative",
				width: "600px",
				height: "400px",
				border: "1px solid #ccc",
				background: "#1a1a1a",
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
	play: async () => {
		// Wait for pseudo-state CSS transitions to complete before VRT snapshot
		await new Promise((resolve) => setTimeout(resolve, 300));
	},
};
