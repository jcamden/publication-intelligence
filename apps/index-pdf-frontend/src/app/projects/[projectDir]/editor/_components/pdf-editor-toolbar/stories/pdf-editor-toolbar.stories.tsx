import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { PdfEditorToolbar } from "../pdf-editor-toolbar";
import { defaultArgs } from "./shared";

const meta = {
	title: "Projects/[ProjectDir]/Editor/PdfEditorToolbar",
	component: PdfEditorToolbar,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
} satisfies Meta<typeof PdfEditorToolbar>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default toolbar with no active tool
 */
export const Default: Story = {
	args: defaultArgs,
	render: (args) => {
		const [page, setPage] = useState(args.currentPage);
		const [zoom, setZoom] = useState(args.zoom);
		const [activeAction, setActiveAction] = useState(args.activeAction);
		const [selectedType, setSelectedType] = useState(args.selectedType);

		return (
			<PdfEditorToolbar
				{...args}
				currentPage={page}
				zoom={zoom}
				onPageChange={({ page }) => setPage(page)}
				onZoomChange={({ zoom }) => setZoom(zoom)}
				activeAction={activeAction}
				selectedType={selectedType}
				onSelectText={() =>
					setActiveAction({ type: "select-text", indexType: "subject" })
				}
				onDrawRegion={() =>
					setActiveAction({ type: "draw-region", indexType: "subject" })
				}
				onTypeChange={(type) => setSelectedType(type)}
			/>
		);
	},
};

/**
 * Select Text tool active with Subject type
 */
export const SelectTextActive: Story = {
	args: {
		...defaultArgs,
		activeAction: { type: "select-text", indexType: "subject" },
		selectedType: "subject",
	},
	render: (args) => {
		const [page, setPage] = useState(args.currentPage);
		const [zoom, setZoom] = useState(args.zoom);
		const [activeAction, setActiveAction] = useState(args.activeAction);
		const [selectedType, setSelectedType] = useState(args.selectedType);

		return (
			<PdfEditorToolbar
				{...args}
				currentPage={page}
				zoom={zoom}
				onPageChange={({ page }) => setPage(page)}
				onZoomChange={({ zoom }) => setZoom(zoom)}
				activeAction={activeAction}
				selectedType={selectedType}
				onSelectText={() =>
					setActiveAction({ type: "select-text", indexType: "subject" })
				}
				onDrawRegion={() =>
					setActiveAction({ type: "draw-region", indexType: "subject" })
				}
				onTypeChange={(type) => setSelectedType(type)}
			/>
		);
	},
};

/**
 * Draw Region tool active with Page Number type (region-only type)
 */
export const DrawRegionActivePageNumber: Story = {
	args: {
		...defaultArgs,
		activeAction: { type: "draw-region", indexType: null },
		selectedType: "page_number",
	},
	render: (args) => {
		const [page, setPage] = useState(args.currentPage);
		const [zoom, setZoom] = useState(args.zoom);
		const [activeAction, setActiveAction] = useState(args.activeAction);
		const [selectedType, setSelectedType] = useState(args.selectedType);

		return (
			<PdfEditorToolbar
				{...args}
				currentPage={page}
				zoom={zoom}
				onPageChange={({ page }) => setPage(page)}
				onZoomChange={({ zoom }) => setZoom(zoom)}
				activeAction={activeAction}
				selectedType={selectedType}
				onSelectText={() =>
					setActiveAction({ type: "select-text", indexType: "subject" })
				}
				onDrawRegion={() =>
					setActiveAction({ type: "draw-region", indexType: null })
				}
				onTypeChange={(type) => setSelectedType(type)}
			/>
		);
	},
};

/**
 * Draw Region tool active with Exclude type (region-only type)
 */
export const DrawRegionActiveExclude: Story = {
	args: {
		...defaultArgs,
		activeAction: { type: "draw-region", indexType: null },
		selectedType: "exclude",
	},
	render: (args) => {
		const [page, setPage] = useState(args.currentPage);
		const [zoom, setZoom] = useState(args.zoom);
		const [activeAction, setActiveAction] = useState(args.activeAction);
		const [selectedType, setSelectedType] = useState(args.selectedType);

		return (
			<PdfEditorToolbar
				{...args}
				currentPage={page}
				zoom={zoom}
				onPageChange={({ page }) => setPage(page)}
				onZoomChange={({ zoom }) => setZoom(zoom)}
				activeAction={activeAction}
				selectedType={selectedType}
				onSelectText={() =>
					setActiveAction({ type: "select-text", indexType: "subject" })
				}
				onDrawRegion={() =>
					setActiveAction({ type: "draw-region", indexType: null })
				}
				onTypeChange={(type) => setSelectedType(type)}
			/>
		);
	},
};

/**
 * Draw Region tool active with Author type (index type)
 */
export const DrawRegionActiveAuthor: Story = {
	args: {
		...defaultArgs,
		activeAction: { type: "draw-region", indexType: "author" },
		selectedType: "author",
	},
	render: (args) => {
		const [page, setPage] = useState(args.currentPage);
		const [zoom, setZoom] = useState(args.zoom);
		const [activeAction, setActiveAction] = useState(args.activeAction);
		const [selectedType, setSelectedType] = useState(args.selectedType);

		return (
			<PdfEditorToolbar
				{...args}
				currentPage={page}
				zoom={zoom}
				onPageChange={({ page }) => setPage(page)}
				onZoomChange={({ zoom }) => setZoom(zoom)}
				activeAction={activeAction}
				selectedType={selectedType}
				onSelectText={() =>
					setActiveAction({ type: "select-text", indexType: "author" })
				}
				onDrawRegion={() =>
					setActiveAction({ type: "draw-region", indexType: "author" })
				}
				onTypeChange={(type) => setSelectedType(type)}
			/>
		);
	},
};
