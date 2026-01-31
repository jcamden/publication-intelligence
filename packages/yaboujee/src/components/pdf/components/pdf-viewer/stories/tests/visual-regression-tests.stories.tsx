import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { PdfViewer } from "../../pdf-viewer";
import { defaultArgs } from "../shared";

export default {
	title: "Components/PDF/PdfViewer/tests/Visual Regression Tests",
	component: PdfViewer,
	tags: ["visual-test"],
	parameters: {
		previewTabs: { "storybook/docs/panel": { hidden: true } },
		controls: { exclude: ["url", "scale", "className"] },
		layout: "fullscreen",
		chromatic: {
			delay: 3000,
		},
	},
} satisfies Meta<typeof PdfViewer>;

export const DefaultLight: StoryObj<typeof PdfViewer> = {
	globals: {
		viewport: undefined,
	},
	render: () => {
		const [page, setPage] = useState(1);
		const [_numPages, setNumPages] = useState(0);

		return (
			<PdfViewer
				url={defaultArgs.url}
				scale={defaultArgs.scale}
				currentPage={page}
				onPageChange={({ page }) => setPage(page)}
				onLoadSuccess={({ numPages }) => setNumPages(numPages)}
			/>
		);
	},
	parameters: {
		theme: "light",
	},
};

export const DefaultDark: StoryObj<typeof PdfViewer> = {
	globals: {
		viewport: undefined,
	},
	render: () => {
		const [page, setPage] = useState(1);
		const [_numPages, setNumPages] = useState(0);

		return (
			<PdfViewer
				url={defaultArgs.url}
				scale={defaultArgs.scale}
				currentPage={page}
				onPageChange={({ page }) => setPage(page)}
				onLoadSuccess={({ numPages }) => setNumPages(numPages)}
			/>
		);
	},
	parameters: {
		backgrounds: { default: "dark" },
		theme: "dark",
	},
};
