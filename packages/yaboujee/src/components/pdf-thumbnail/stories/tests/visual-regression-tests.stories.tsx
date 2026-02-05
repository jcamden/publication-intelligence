import { defaultGlobals, defaultVrtMeta } from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/react";
import { createMockPdfFile } from "../../../pdf/test-helpers/mock-factories";
import { PdfThumbnail } from "../../pdf-thumbnail";

export default {
	...defaultVrtMeta,
	title: "Components/PdfThumbnail/tests/Visual Regression Tests",
	component: PdfThumbnail,
	parameters: {
		...defaultVrtMeta.parameters,
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
