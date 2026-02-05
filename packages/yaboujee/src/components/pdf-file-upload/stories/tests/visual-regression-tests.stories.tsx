import { defaultGlobals, defaultVrtMeta } from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { PdfFileUpload } from "../../pdf-file-upload";

export default {
	...defaultVrtMeta,
	title: "Components/PdfFileUpload/tests/Visual Regression Tests",
	component: PdfFileUpload,
	parameters: {
		...defaultVrtMeta.parameters,
		layout: "centered",
	},
} satisfies Meta<typeof PdfFileUpload>;

export const EmptyState: StoryObj<typeof PdfFileUpload> = {
	globals: {
		...defaultGlobals,
	},
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

export const EmptyStateDark: StoryObj<typeof PdfFileUpload> = {
	globals: {
		...defaultGlobals,
		theme: "dark",
	},
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

export const WithFile: StoryObj<typeof PdfFileUpload> = {
	globals: {
		...defaultGlobals,
	},
	render: () => {
		const mockFile = new File(
			["test content"],
			"word-biblical-commentary-daniel.pdf",
			{
				type: "application/pdf",
			},
		);
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

export const WithFileDark: StoryObj<typeof PdfFileUpload> = {
	globals: {
		...defaultGlobals,
		theme: "dark",
	},
	render: () => {
		const mockFile = new File(
			["test content"],
			"word-biblical-commentary-daniel.pdf",
			{
				type: "application/pdf",
			},
		);
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
	globals: {
		...defaultGlobals,
	},
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

export const DisabledWithFile: StoryObj<typeof PdfFileUpload> = {
	globals: {
		...defaultGlobals,
	},
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
