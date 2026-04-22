import { defaultInteractionTestMeta } from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn, within } from "storybook/test";
import { PdfEditorToolbar } from "../../pdf-editor-toolbar";
import {
	clickDrawRegionAndExpectCall,
	clickSelectTextAndExpectCall,
	expectRegionTypesDisabledWhenSelectTextActive,
	expectSelectTextVisuallyDisabled,
	openTypeDropdownAndSelectSubject,
} from "../helpers/steps";

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

const baseArgs = {
	currentPage: 5,
	totalPages: 10,
	zoom: 1.25,
	onPageChange: fn(),
	onZoomChange: fn(),
	pdfVisible: true,
	onPdfVisibilityToggle: fn(),
	showPdfToggle: true,
	activeAction: { type: null, indexType: null },
	onSelectText: fn(),
	onDrawRegion: fn(),
	onHighlightInteraction: fn(),
	onTypeChange: fn(),
	enabledIndexTypes: ["subject", "author", "scripture"] as string[],
};

export const SelectTextButton: Story = {
	args: {
		...baseArgs,
		selectedType: "subject",
	},
	play: async ({ canvasElement, step, args }) => {
		const canvas = within(canvasElement);
		await clickSelectTextAndExpectCall({
			canvas,
			step,
			onSelectText: args.onSelectText as ReturnType<typeof fn>,
		});
	},
};

export const DrawRegionButton: Story = {
	args: {
		...baseArgs,
		selectedType: "page_number",
	},
	play: async ({ canvasElement, step, args }) => {
		const canvas = within(canvasElement);
		await clickDrawRegionAndExpectCall({
			canvas,
			step,
			onDrawRegion: args.onDrawRegion as ReturnType<typeof fn>,
		});
	},
};

export const TypeDropdownInteraction: Story = {
	args: {
		...baseArgs,
		selectedType: "page_number",
	},
	play: async ({ canvasElement, step, args }) => {
		const canvas = within(canvasElement);
		await openTypeDropdownAndSelectSubject({
			canvas,
			step,
			onTypeChange: args.onTypeChange as ReturnType<typeof fn>,
		});
	},
};

export const SelectTextDisabledWithRegionType: Story = {
	args: {
		...baseArgs,
		selectedType: "page_number",
	},
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);
		await expectSelectTextVisuallyDisabled({ canvas, step });
	},
};

export const RegionTypesDisabledWithSelectTextActive: Story = {
	args: {
		...baseArgs,
		activeAction: { type: "select-text", indexType: "subject" },
		selectedType: "subject",
	},
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);
		await expectRegionTypesDisabledWhenSelectTextActive({ canvas, step });
	},
};
