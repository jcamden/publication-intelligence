import { defaultInteractionTestMeta } from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/react";
import { expect, fn, userEvent, waitFor, within } from "@storybook/test";
import { PdfEditorToolbar } from "../../pdf-editor-toolbar";

const meta: Meta<typeof PdfEditorToolbar> = {
	...defaultInteractionTestMeta,
	title:
		"Projects/[ProjectDir]/Editor/PdfEditorToolbar/tests/Interaction Tests",
	component: PdfEditorToolbar,
	parameters: {
		layout: "centered",
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Test Select Text button is clickable
 */
export const SelectTextButton: Story = {
	args: {
		currentPage: 5,
		totalPages: 10,
		zoom: 1.25,
		onPageChange: fn(),
		onZoomChange: fn(),
		pdfVisible: true,
		onPdfVisibilityToggle: fn(),
		showPdfToggle: true,
		activeAction: { type: null, indexType: null },
		selectedType: "subject", // Use index type, not region type
		onSelectText: fn(),
		onDrawRegion: fn(),
		onHighlightInteraction: fn(),
		onTypeChange: fn(),
		enabledIndexTypes: ["subject", "author", "scripture"],
	},
	play: async ({ canvasElement, step, args }) => {
		const canvas = within(canvasElement);
		const onSelectText = args.onSelectText as ReturnType<typeof fn>;

		// Reset mock to ensure clean state
		onSelectText.mockClear();

		await step("Click Select Text button", async () => {
			const selectTextButton = canvas.getByLabelText("Select Text");
			await userEvent.click(selectTextButton);
			await expect(onSelectText).toHaveBeenCalledTimes(1);
		});
	},
};

/**
 * Test Draw Region button is clickable
 */
export const DrawRegionButton: Story = {
	args: {
		currentPage: 5,
		totalPages: 10,
		zoom: 1.25,
		onPageChange: fn(),
		onZoomChange: fn(),
		pdfVisible: true,
		onPdfVisibilityToggle: fn(),
		showPdfToggle: true,
		activeAction: { type: null, indexType: null },
		selectedType: "page_number",
		onSelectText: fn(),
		onDrawRegion: fn(),
		onHighlightInteraction: fn(),
		onTypeChange: fn(),
		enabledIndexTypes: ["subject", "author", "scripture"],
	},
	play: async ({ canvasElement, step, args }) => {
		const canvas = within(canvasElement);
		const onDrawRegion = args.onDrawRegion as ReturnType<typeof fn>;

		// Reset mock to ensure clean state
		onDrawRegion.mockClear();

		await step("Click Draw Region button", async () => {
			const drawRegionButton = canvas.getByLabelText("Draw Region");
			await userEvent.click(drawRegionButton);
			await expect(onDrawRegion).toHaveBeenCalledTimes(1);
		});
	},
};

/**
 * Test type dropdown opens and allows selection
 */
export const TypeDropdownInteraction: Story = {
	args: {
		currentPage: 5,
		totalPages: 10,
		zoom: 1.25,
		onPageChange: fn(),
		onZoomChange: fn(),
		pdfVisible: true,
		onPdfVisibilityToggle: fn(),
		showPdfToggle: true,
		activeAction: { type: null, indexType: null },
		selectedType: "page_number",
		onSelectText: fn(),
		onDrawRegion: fn(),
		onHighlightInteraction: fn(),
		onTypeChange: fn(),
		enabledIndexTypes: ["subject", "author", "scripture"],
	},
	play: async ({ canvasElement, step, args }) => {
		const canvas = within(canvasElement);
		const body = within(document.body);
		const onTypeChange = args.onTypeChange as ReturnType<typeof fn>;

		// Reset mock to ensure clean state
		onTypeChange.mockClear();

		await step("Open type dropdown", async () => {
			const trigger = canvas.getByRole("combobox");
			await userEvent.click(trigger);

			// Wait for dropdown to open
			await waitFor(
				async () => {
					const dropdown = body.queryByRole("option", { name: /subject/i });
					await expect(dropdown).toBeInTheDocument();
				},
				{ timeout: 2000 },
			);
		});

		await step("Select Subject from dropdown", async () => {
			const subjectOption = body.getByRole("option", { name: /subject/i });
			await userEvent.click(subjectOption);
			await expect(onTypeChange).toHaveBeenCalledWith("subject");
		});
	},
};

/**
 * Test Select Text button disabled when region type selected
 */
export const SelectTextDisabledWithRegionType: Story = {
	args: {
		currentPage: 5,
		totalPages: 10,
		zoom: 1.25,
		onPageChange: fn(),
		onZoomChange: fn(),
		pdfVisible: true,
		onPdfVisibilityToggle: fn(),
		showPdfToggle: true,
		activeAction: { type: null, indexType: null },
		selectedType: "page_number", // Region type
		onSelectText: fn(),
		onDrawRegion: fn(),
		onHighlightInteraction: fn(),
		onTypeChange: fn(),
		enabledIndexTypes: ["subject", "author", "scripture"],
	},
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);

		await step("Verify Select Text button is disabled (visually)", async () => {
			const selectTextButton = canvas.getByLabelText("Select Text");
			// Check for opacity class that indicates disabled state
			await expect(selectTextButton).toHaveClass(/opacity-50/);
			await expect(selectTextButton).toHaveClass(/cursor-not-allowed/);
		});
	},
};

/**
 * Test region types disabled in dropdown when Select Text active
 */
export const RegionTypesDisabledWithSelectTextActive: Story = {
	args: {
		currentPage: 5,
		totalPages: 10,
		zoom: 1.25,
		onPageChange: fn(),
		onZoomChange: fn(),
		pdfVisible: true,
		onPdfVisibilityToggle: fn(),
		showPdfToggle: true,
		activeAction: { type: "select-text", indexType: "subject" },
		selectedType: "subject",
		onSelectText: fn(),
		onDrawRegion: fn(),
		onHighlightInteraction: fn(),
		onTypeChange: fn(),
		enabledIndexTypes: ["subject", "author", "scripture"],
	},
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);
		const body = within(document.body);

		await step("Open type dropdown", async () => {
			const trigger = canvas.getByRole("combobox");
			await userEvent.click(trigger);

			// Wait for dropdown to open
			await waitFor(
				async () => {
					const dropdown = body.queryByRole("option", { name: /subject/i });
					await expect(dropdown).toBeInTheDocument();
				},
				{ timeout: 2000 },
			);
		});

		await step("Verify Page Number and Exclude are disabled", async () => {
			const pageNumberOption = body.getByRole("option", {
				name: /page number/i,
			});
			const excludeOption = body.getByRole("option", { name: /exclude/i });

			await expect(pageNumberOption).toHaveAttribute("aria-disabled", "true");
			await expect(excludeOption).toHaveAttribute("aria-disabled", "true");
		});

		await step("Verify Subject is enabled", async () => {
			const subjectOption = body.getByRole("option", { name: /subject/i });
			await expect(subjectOption).not.toHaveAttribute("aria-disabled", "true");
		});
	},
};
