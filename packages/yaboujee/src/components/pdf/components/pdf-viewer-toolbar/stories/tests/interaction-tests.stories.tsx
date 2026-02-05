import { defaultInteractionTestMeta } from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within } from "@storybook/test";
import { useState } from "react";
import { PdfViewerToolbar } from "../../pdf-viewer-toolbar";
import { defaultArgs } from "../shared";

const meta: Meta<typeof PdfViewerToolbar> = {
	...defaultInteractionTestMeta,
	title: "Components/PDF/PdfViewerToolbar/tests/Interaction Tests",
	component: PdfViewerToolbar,
	parameters: {
		layout: "centered",
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Test page navigation buttons
 */
export const PageNavigation: Story = {
	args: defaultArgs,
	render: () => {
		const [page, setPage] = useState(5);
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
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// Get the wrapper elements that are actually clickable (parent of the inner Button with pointer-events-none)
		const prevButtonInner = canvas.getByLabelText("Previous page");
		const nextButtonInner = canvas.getByLabelText("Next page");
		const prevButton = prevButtonInner.parentElement;
		const nextButton = nextButtonInner.parentElement;
		if (!prevButton || !nextButton) throw new Error("Button parents not found");
		const pageInput = canvas.getByLabelText("Current page");

		// Test next button
		await userEvent.click(nextButton);
		await expect(pageInput).toHaveValue(6);

		// Test prev button
		await userEvent.click(prevButton);
		await expect(pageInput).toHaveValue(5);
	},
};

/**
 * Test direct page input with blur
 */
export const DirectPageInput: Story = {
	args: defaultArgs,
	render: () => {
		const [page, setPage] = useState(5);
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
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		const pageInput = canvas.getByLabelText("Current page");

		// Clear and type new value
		await userEvent.clear(pageInput);
		await userEvent.type(pageInput, "8");

		// Value should be in input but not committed yet
		await expect(pageInput).toHaveValue(8);

		// Blur to commit
		await userEvent.tab();

		// Value should persist after blur
		await expect(pageInput).toHaveValue(8);
	},
};

/**
 * Test page input with Enter key
 */
export const PageInputWithEnter: Story = {
	args: defaultArgs,
	render: () => {
		const [page, setPage] = useState(5);
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
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		const pageInput = canvas.getByLabelText("Current page");

		// Clear and type new value
		await userEvent.clear(pageInput);
		await userEvent.type(pageInput, "3{Enter}");

		// Value should be committed
		await expect(pageInput).toHaveValue(3);
	},
};

/**
 * Test invalid page input resets
 */
export const InvalidPageInput: Story = {
	args: defaultArgs,
	render: () => {
		const [page, setPage] = useState(5);
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
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		const pageInput = canvas.getByLabelText("Current page");

		// Try to enter invalid value (out of range)
		await userEvent.clear(pageInput);
		await userEvent.type(pageInput, "99");

		// Blur to trigger validation
		await userEvent.tab();

		// Should reset to current page (5)
		await expect(pageInput).toHaveValue(5);
	},
};

/**
 * Test zoom controls
 */
export const ZoomControls: Story = {
	args: defaultArgs,
	render: () => {
		const [page, setPage] = useState(5);
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
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// Get the wrapper elements that are actually clickable (parent of the inner Button with pointer-events-none)
		const zoomInButtonInner = canvas.getByLabelText("Zoom in");
		const zoomOutButtonInner = canvas.getByLabelText("Zoom out");
		const zoomInButton = zoomInButtonInner.parentElement;
		const zoomOutButton = zoomOutButtonInner.parentElement;
		if (!zoomInButton || !zoomOutButton)
			throw new Error("Button parents not found");
		const zoomInput = canvas.getByLabelText("Zoom percentage");

		// Test zoom in
		await userEvent.click(zoomInButton);
		await expect(zoomInput).toHaveValue(150);

		// Test zoom out
		await userEvent.click(zoomOutButton);
		await expect(zoomInput).toHaveValue(125);
	},
};

/**
 * Test direct zoom input
 */
export const DirectZoomInput: Story = {
	args: defaultArgs,
	render: () => {
		const [page, setPage] = useState(5);
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
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		const zoomInput = canvas.getByLabelText("Zoom percentage");

		// Clear and type new zoom value
		await userEvent.clear(zoomInput);
		await userEvent.type(zoomInput, "200{Enter}");

		// Value should be committed
		await expect(zoomInput).toHaveValue(200);
	},
};

/**
 * Test invalid zoom input resets
 */
export const InvalidZoomInput: Story = {
	args: defaultArgs,
	render: () => {
		const [page, setPage] = useState(5);
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
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		const zoomInput = canvas.getByLabelText("Zoom percentage");

		// Try to enter invalid value (out of range)
		await userEvent.clear(zoomInput);
		await userEvent.type(zoomInput, "500");

		// Blur to trigger validation
		await userEvent.tab();

		// Should reset to current zoom (125%)
		await expect(zoomInput).toHaveValue(125);
	},
};

/**
 * Test boundary conditions
 */
export const BoundaryConditions: Story = {
	args: {
		...defaultArgs,
		currentPage: 1,
		zoom: 0.5,
	},
	render: () => {
		const [page, setPage] = useState(1);
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
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		const prevButton = canvas.getByLabelText("Previous page");
		const zoomOutButton = canvas.getByLabelText("Zoom out");

		// Test that buttons are disabled at boundaries
		await expect(prevButton).toBeDisabled();
		await expect(zoomOutButton).toBeDisabled();
	},
};
