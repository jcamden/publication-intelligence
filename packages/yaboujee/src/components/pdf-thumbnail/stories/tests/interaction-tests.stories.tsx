import { interactionTestConfig } from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/react";
import { expect, within } from "@storybook/test";
import { PdfThumbnail } from "../../pdf-thumbnail";

const createMockPdfFile = (name = "sample.pdf") => {
	const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
%%EOF`;

	return new File([pdfContent], name, { type: "application/pdf" });
};

export default {
	title: "Components/PdfThumbnail/tests/Interaction Tests",
	component: PdfThumbnail,
	tags: ["interaction-test"],
	parameters: {
		...interactionTestConfig,
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
