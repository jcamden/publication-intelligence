import type { Meta, StoryObj } from "@storybook/react";
import { createMockPdfFile } from "../../pdf/test-helpers/mock-factories";
import { PdfThumbnail } from "../pdf-thumbnail";

const meta = {
	title: "Components/PdfThumbnail",
	component: PdfThumbnail,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
} satisfies Meta<typeof PdfThumbnail>;

export default meta;

export const Default: StoryObj<typeof PdfThumbnail> = {
	render: () => {
		const mockFile = createMockPdfFile("sample-document.pdf");

		return (
			<div className="w-[200px]">
				<PdfThumbnail source={mockFile} alt="Sample PDF Document" />
			</div>
		);
	},
};

export const SmallSize: StoryObj<typeof PdfThumbnail> = {
	render: () => {
		const mockFile = createMockPdfFile("small-document.pdf");

		return (
			<div className="w-[150px]">
				<PdfThumbnail source={mockFile} alt="Small PDF Document" />
			</div>
		);
	},
};

export const LargeSize: StoryObj<typeof PdfThumbnail> = {
	render: () => {
		const mockFile = createMockPdfFile("large-document.pdf");

		return (
			<div className="w-[300px]">
				<PdfThumbnail source={mockFile} alt="Large PDF Document" />
			</div>
		);
	},
};

export const InCardLayout: StoryObj<typeof PdfThumbnail> = {
	render: () => {
		const mockFiles = [
			createMockPdfFile("document-1.pdf"),
			createMockPdfFile("document-2.pdf"),
			createMockPdfFile("document-3.pdf"),
		];

		return (
			<div className="grid grid-cols-3 gap-4">
				{mockFiles.map((file) => (
					<div
						key={file.name}
						className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
					>
						<div className="aspect-[1/1.414] bg-muted">
							<PdfThumbnail source={file} alt={file.name} />
						</div>
						<div className="p-3">
							<h3 className="font-medium text-sm truncate">{file.name}</h3>
							<p className="text-xs text-muted-foreground">
								{Math.round(file.size / 1024)} KB
							</p>
						</div>
					</div>
				))}
			</div>
		);
	},
};
