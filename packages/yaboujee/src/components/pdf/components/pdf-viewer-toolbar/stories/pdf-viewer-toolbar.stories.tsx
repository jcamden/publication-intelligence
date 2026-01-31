import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { PdfViewerToolbar } from "../pdf-viewer-toolbar";
import { defaultArgs } from "./shared";

const meta = {
	title: "Components/PDF/PdfViewerToolbar",
	component: PdfViewerToolbar,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
} satisfies Meta<typeof PdfViewerToolbar>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default toolbar with interactive controls
 */
export const Default: Story = {
	args: defaultArgs,
	render: () => {
		const [page, setPage] = useState(1);
		const [zoom, setZoom] = useState(1.25);

		return (
			<PdfViewerToolbar
				currentPage={page}
				totalPages={10}
				zoom={zoom}
				onPageChange={({ page }) => setPage(page)}
				onZoomChange={({ zoom }) => setZoom(zoom)}
			/>
		);
	},
};

/**
 * First page (prev button disabled)
 */
export const FirstPage: Story = {
	args: defaultArgs,
	render: () => {
		const [page, setPage] = useState(1);
		const [zoom, setZoom] = useState(1.25);

		return (
			<PdfViewerToolbar
				currentPage={page}
				totalPages={10}
				zoom={zoom}
				onPageChange={({ page }) => setPage(page)}
				onZoomChange={({ zoom }) => setZoom(zoom)}
			/>
		);
	},
};

/**
 * Last page (next button disabled)
 */
export const LastPage: Story = {
	args: defaultArgs,
	render: () => {
		const [page, setPage] = useState(10);
		const [zoom, setZoom] = useState(1.25);

		return (
			<PdfViewerToolbar
				currentPage={page}
				totalPages={10}
				zoom={zoom}
				onPageChange={({ page }) => setPage(page)}
				onZoomChange={({ zoom }) => setZoom(zoom)}
			/>
		);
	},
};

/**
 * Minimum zoom (zoom out button disabled)
 */
export const MinimumZoom: Story = {
	args: defaultArgs,
	render: () => {
		const [page, setPage] = useState(5);
		const [zoom, setZoom] = useState(0.5);

		return (
			<PdfViewerToolbar
				currentPage={page}
				totalPages={10}
				zoom={zoom}
				onPageChange={({ page }) => setPage(page)}
				onZoomChange={({ zoom }) => setZoom(zoom)}
			/>
		);
	},
};

/**
 * Maximum zoom (zoom in button disabled)
 */
export const MaximumZoom: Story = {
	args: defaultArgs,
	render: () => {
		const [page, setPage] = useState(5);
		const [zoom, setZoom] = useState(3);

		return (
			<PdfViewerToolbar
				currentPage={page}
				totalPages={10}
				zoom={zoom}
				onPageChange={({ page }) => setPage(page)}
				onZoomChange={({ zoom }) => setZoom(zoom)}
			/>
		);
	},
};
