import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { PdfFileUpload } from "../pdf-file-upload";

const meta = {
	title: "Components/PdfFileUpload",
	component: PdfFileUpload,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
} satisfies Meta<typeof PdfFileUpload>;

export default meta;

export const Default: StoryObj<typeof PdfFileUpload> = {
	render: () => {
		const [selectedFile, setSelectedFile] = useState<File | undefined>();

		return (
			<div className="w-[400px]">
				<PdfFileUpload
					onFileSelect={setSelectedFile}
					onClear={() => setSelectedFile(undefined)}
					selectedFile={selectedFile}
				/>
			</div>
		);
	},
};

export const WithSelectedFile: StoryObj<typeof PdfFileUpload> = {
	render: () => {
		const mockFile = new File(["test content"], "sample-document.pdf", {
			type: "application/pdf",
		});
		const [selectedFile, setSelectedFile] = useState<File | undefined>(
			mockFile,
		);

		return (
			<div className="w-[400px]">
				<PdfFileUpload
					onFileSelect={setSelectedFile}
					onClear={() => setSelectedFile(undefined)}
					selectedFile={selectedFile}
				/>
			</div>
		);
	},
};

export const WithError: StoryObj<typeof PdfFileUpload> = {
	render: () => {
		const [selectedFile, setSelectedFile] = useState<File | undefined>();

		return (
			<div className="w-[400px]">
				<PdfFileUpload
					onFileSelect={setSelectedFile}
					onClear={() => setSelectedFile(undefined)}
					selectedFile={selectedFile}
					error="Only PDF files are allowed. Please select a valid PDF document."
				/>
			</div>
		);
	},
};

export const Disabled: StoryObj<typeof PdfFileUpload> = {
	render: () => {
		const mockFile = new File(["test content"], "document.pdf", {
			type: "application/pdf",
		});
		const [selectedFile, setSelectedFile] = useState<File | undefined>(
			mockFile,
		);

		return (
			<div className="w-[400px]">
				<PdfFileUpload
					onFileSelect={setSelectedFile}
					onClear={() => setSelectedFile(undefined)}
					selectedFile={selectedFile}
					disabled
				/>
			</div>
		);
	},
};
