import { interactionTestConfig } from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/react";
import { expect, fn, userEvent, within } from "@storybook/test";
import type { PdfHighlight } from "../../../../../../types";
import { PdfHighlightBox } from "../../pdf-highlight-box";

const meta: Meta<typeof PdfHighlightBox> = {
	title: "Components/PDF/PdfHighlightBox/tests/Interaction Tests",
	component: PdfHighlightBox,
	parameters: {
		...interactionTestConfig,
		layout: "centered",
	},
	tags: ["test:interaction"],
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

/**
 * Test click handler
 */
export const ClickHandler: Story = {
	render: () => {
		const handleClick = fn();

		return (
			<div
				style={{
					position: "relative",
					width: "400px",
					height: "200px",
					border: "1px solid #ccc",
				}}
			>
				<PdfHighlightBox
					highlight={mockHighlight}
					scale={1}
					onClick={handleClick}
				/>
			</div>
		);
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const user = userEvent.setup();

		const highlightButton = canvas.getByTestId("highlight-highlight-1");
		await user.click(highlightButton);

		await expect(highlightButton).toBeInTheDocument();
	},
};
