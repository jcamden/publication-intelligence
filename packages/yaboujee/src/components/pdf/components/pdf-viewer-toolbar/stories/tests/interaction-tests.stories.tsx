import { defaultInteractionTestMeta } from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/react";
import { userEvent, within } from "@storybook/test";
import { useState } from "react";
import { PdfViewerToolbar } from "../../pdf-viewer-toolbar";
import {
	boundaryControlsAreDisabled,
	clickNextThenPreviousPage,
	typeInvalidPageBlurResets,
	typeInvalidZoomBlurResets,
	typePageBlurToCommit,
	typePageEnterToCommit,
	typeZoomEnterToCommit,
	zoomInThenOut,
} from "../helpers/steps";
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

/** Page field starts at 5; next/prev change committed page. */
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
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);
		const user = userEvent.setup();
		await clickNextThenPreviousPage({ canvas, user, step });
	},
};

/** Direct page input commits on blur. */
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
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);
		const user = userEvent.setup();
		await typePageBlurToCommit({ canvas, user, value: "8", step });
	},
};

/** Page field commits on Enter. */
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
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);
		const user = userEvent.setup();
		await typePageEnterToCommit({
			canvas,
			user,
			valueWithEnter: "3{Enter}",
			expectedValue: 3,
			step,
		});
	},
};

/** Out-of-range page input resets after blur. */
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
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);
		const user = userEvent.setup();
		await typeInvalidPageBlurResets({
			canvas,
			user,
			invalidValue: "99",
			expectedAfterBlur: 5,
			step,
		});
	},
};

/** Zoom +/- updates percentage display. */
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
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);
		const user = userEvent.setup();
		await zoomInThenOut({ canvas, user, step });
	},
};

/** Zoom field commits on Enter. */
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
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);
		const user = userEvent.setup();
		await typeZoomEnterToCommit({
			canvas,
			user,
			valueWithEnter: "200{Enter}",
			expectedValue: 200,
			step,
		});
	},
};

/** Out-of-range zoom resets after blur. */
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
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);
		const user = userEvent.setup();
		await typeInvalidZoomBlurResets({
			canvas,
			user,
			invalidValue: "500",
			expectedAfterBlur: 125,
			step,
		});
	},
};

/** First page and minimum zoom disable back controls. */
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
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);
		await boundaryControlsAreDisabled({ canvas, step });
	},
};
