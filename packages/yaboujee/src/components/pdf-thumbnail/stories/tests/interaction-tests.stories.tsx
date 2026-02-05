import { defaultInteractionTestMeta } from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/react";
import { expect, within } from "@storybook/test";
import { createMockPdfFile } from "../../../pdf/test-helpers/mock-factories";
import { PdfThumbnail } from "../../pdf-thumbnail";

export default {
	...defaultInteractionTestMeta,
	title: "Components/PdfThumbnail/tests/Interaction Tests",
	component: PdfThumbnail,
	parameters: {
		...defaultInteractionTestMeta.parameters,
	},
} satisfies Meta<typeof PdfThumbnail>;

export const RendersWithFile: StoryObj<typeof PdfThumbnail> = {
	render: () => {
		const mockFile = createMockPdfFile("test-document.pdf");

		return (
			<div className="w-[200px]" data-testid="thumbnail-container">
				<PdfThumbnail source={mockFile} alt="Test PDF Document" />
			</div>
		);
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const container = canvas.getByTestId("thumbnail-container");

		await expect(container).toBeInTheDocument();
	},
};

export const RendersWithBlobUrl: StoryObj<typeof PdfThumbnail> = {
	render: () => {
		const mockFile = createMockPdfFile("blob-source.pdf");
		const blobUrl = URL.createObjectURL(mockFile);

		return (
			<div className="w-[200px]" data-testid="blob-thumbnail">
				<PdfThumbnail source={blobUrl} alt="PDF from Blob URL" />
			</div>
		);
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const container = canvas.getByTestId("blob-thumbnail");

		await expect(container).toBeInTheDocument();
	},
};
