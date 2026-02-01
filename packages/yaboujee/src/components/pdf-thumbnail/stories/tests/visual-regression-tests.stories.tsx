import {
	defaultGlobals,
	visualRegressionTestConfig,
} from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/react";
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
	title: "Components/PdfThumbnail/tests/Visual Regression Tests",
	component: PdfThumbnail,
	tags: ["visual-regression"],
	parameters: {
		...visualRegressionTestConfig,
		layout: "centered",
	},
} satisfies Meta<typeof PdfThumbnail>;

export const Default: StoryObj<typeof PdfThumbnail> = {
	globals: {
		...defaultGlobals,
	},
	render: () => {
		const mockFile = createMockPdfFile("sample-document.pdf");

		return (
			<div className="w-[200px]">
				<PdfThumbnail source={mockFile} alt="Sample PDF Document" />
			</div>
		);
	},
};

export const DefaultDark: StoryObj<typeof PdfThumbnail> = {
	globals: {
		...defaultGlobals,
		theme: "dark",
	},
	render: () => {
		const mockFile = createMockPdfFile("sample-document.pdf");

		return (
			<div className="w-[200px]">
				<PdfThumbnail source={mockFile} alt="Sample PDF Document" />
			</div>
		);
	},
};
