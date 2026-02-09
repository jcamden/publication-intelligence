import { defaultGlobals, defaultVrtMeta } from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import type { PdfHighlight } from "../../../../../../types";
import { PdfHighlightBox } from "../../pdf-highlight-box";

const meta: Meta<typeof PdfHighlightBox> = {
	...defaultVrtMeta,
	title: "Components/PDF/PdfHighlightBox/tests/Visual Regression Tests",
	component: PdfHighlightBox,
	parameters: {
		...defaultVrtMeta.parameters,
		layout: "centered",
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

const mockHighlight: PdfHighlight = {
	id: "highlight-1",
	pageNumber: 1,
	bboxes: [{ x: 50, y: 50, width: 200, height: 30 }],
	label: "Example Highlight",
	text: "This is highlighted text",
};

const renderContainer = (children: React.ReactNode) => (
	<div
		style={{
			position: "relative",
			width: "400px",
			height: "150px",
			border: "1px solid #ccc",
			background: "#f5f5f5",
		}}
	>
		{children}
	</div>
);

/**
 * Basic appearance in light mode
 */
export const BasicLight: Story = {
	globals: {
		...defaultGlobals,
		viewport: { value: "mobile1", isRotated: true },
	},
	render: () =>
		renderContainer(
			<PdfHighlightBox highlight={mockHighlight} scale={1} onClick={fn()} />,
		),
};

/**
 * Basic appearance in dark mode
 */
export const BasicDark: Story = {
	globals: {
		...defaultGlobals,
		viewport: { value: "mobile1", isRotated: true },
		theme: "dark",
	},
	render: () => (
		<div
			style={{
				position: "relative",
				width: "400px",
				height: "150px",
				border: "1px solid #ccc",
				background: "#1a1a1a",
			}}
		>
			<PdfHighlightBox highlight={mockHighlight} scale={1} onClick={fn()} />
		</div>
	),
};

/**
 * Hover state in light mode
 */
export const HoverLight: Story = {
	globals: {
		...defaultGlobals,
		viewport: { value: "mobile1", isRotated: true },
	},
	parameters: {
		pseudo: {
			hover: ['[data-testid="highlight-highlight-1"]'],
		},
	},
	render: () =>
		renderContainer(
			<PdfHighlightBox highlight={mockHighlight} scale={1} onClick={fn()} />,
		),
	play: async () => {
		// Wait for pseudo-state CSS transitions to complete before VRT snapshot
		await new Promise((resolve) => setTimeout(resolve, 300));
	},
};

/**
 * Hover state in dark mode
 */
export const HoverDark: Story = {
	globals: {
		...defaultGlobals,
		viewport: { value: "mobile1", isRotated: true },
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
				width: "400px",
				height: "150px",
				border: "1px solid #ccc",
				background: "#1a1a1a",
			}}
		>
			<PdfHighlightBox highlight={mockHighlight} scale={1} onClick={fn()} />
		</div>
	),
	play: async () => {
		// Wait for pseudo-state CSS transitions to complete before VRT snapshot
		await new Promise((resolve) => setTimeout(resolve, 300));
	},
};

/**
 * Rotated highlight
 */
export const Rotated: Story = {
	globals: {
		...defaultGlobals,
		viewport: { value: "mobile1", isRotated: true },
	},
	render: () => {
		const rotatedHighlight: PdfHighlight = {
			...mockHighlight,
			bboxes: [{ ...mockHighlight.bboxes[0], rotation: 15 }],
		};

		return renderContainer(
			<PdfHighlightBox highlight={rotatedHighlight} scale={1} onClick={fn()} />,
		);
	},
};

/**
 * Scaled highlight (2x)
 */
export const Scaled: Story = {
	globals: {
		...defaultGlobals,
		viewport: { value: "mobile2", isRotated: true },
	},
	render: () => (
		<div
			style={{
				position: "relative",
				width: "600px",
				height: "250px",
				border: "1px solid #ccc",
				background: "#f5f5f5",
			}}
		>
			<PdfHighlightBox highlight={mockHighlight} scale={2} onClick={fn()} />
		</div>
	),
};

/**
 * Two index types - Subject + Scripture (blue/green stripes)
 */
export const TwoTypes: Story = {
	globals: {
		...defaultGlobals,
		viewport: { value: "mobile1", isRotated: true },
	},
	render: () => {
		const highlight: PdfHighlight = {
			...mockHighlight,
			metadata: {
				hues: [230, 160], // subject (blue), scripture (green)
			},
		};
		return renderContainer(
			<PdfHighlightBox highlight={highlight} scale={1} onClick={fn()} />,
		);
	},
};

/**
 * Three index types - Subject + Author + Scripture (blue/purple/green stripes)
 */
export const ThreeTypes: Story = {
	globals: {
		...defaultGlobals,
	},
	render: () => {
		const highlight: PdfHighlight = {
			...mockHighlight,
			metadata: {
				hues: [230, 270, 160], // subject (blue), author (purple), scripture (green)
			},
		};
		return renderContainer(
			<PdfHighlightBox highlight={highlight} scale={1} onClick={fn()} />,
		);
	},
};

/**
 * Three types hover state (blue/purple/green stripes with hover)
 */
export const ThreeTypesHover: Story = {
	globals: {
		...defaultGlobals,
	},
	parameters: {
		pseudo: {
			hover: ['[data-testid="highlight-highlight-1"]'],
		},
	},
	render: () => {
		const highlight: PdfHighlight = {
			...mockHighlight,
			metadata: {
				hues: [230, 270, 160], // subject (blue), author (purple), scripture (green)
			},
		};
		return renderContainer(
			<PdfHighlightBox highlight={highlight} scale={1} onClick={fn()} />,
		);
	},
	play: async () => {
		await new Promise((resolve) => setTimeout(resolve, 300));
	},
};
