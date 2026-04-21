import { defaultInteractionTestMeta } from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/react";
import { within } from "@storybook/test";
import { useEffect, useRef, useState } from "react";
import { PdfAnnotationPopover } from "../../pdf-annotation-popover";
import {
	clickCancelButton,
	popoverIsPositionedLeftOrRightOfAnchor,
	pressEscapeKey,
	resultShowsText,
	waitForPopoverContentTestIdInDocument,
	waitForPopoverTextVisibleInDocument,
} from "../helpers/steps";

export default {
	...defaultInteractionTestMeta,
	title: "Components/PDF/PdfAnnotationPopover/tests/Interaction Tests",
	component: PdfAnnotationPopover,
	parameters: {
		previewTabs: { "storybook/docs/panel": { hidden: true } },
		layout: "fullscreen",
	},
} satisfies Meta<typeof PdfAnnotationPopover>;

type Story = StoryObj<typeof PdfAnnotationPopover>;

const InteractiveWrapper = ({
	onCancelCallback,
}: {
	onCancelCallback?: () => void;
}) => {
	const anchorRef = useRef<HTMLDivElement>(null);
	const [anchorElement, setAnchorElement] = useState<HTMLElement | null>(null);
	const [isOpen, setIsOpen] = useState(true);
	const [result, setResult] = useState<string>("");

	// Set anchor element after mount
	useEffect(() => {
		setAnchorElement(anchorRef.current);
	}, []);

	const handleCancel = () => {
		setIsOpen(false);
		setResult("Cancelled");
		onCancelCallback?.();
	};

	return (
		<div className="p-8">
			<div
				ref={anchorRef}
				className="inline-block rounded bg-yellow-200 px-4 py-2 dark:bg-yellow-700"
			>
				Anchor Element
			</div>

			<PdfAnnotationPopover
				anchorElement={anchorElement}
				isOpen={isOpen}
				onCancel={handleCancel}
			>
				<div className="space-y-2">
					<p className="text-sm">Popover content</p>
					<button
						type="button"
						onClick={handleCancel}
						className="rounded bg-neutral-200 px-3 py-1 text-sm hover:bg-neutral-300 dark:bg-neutral-700"
					>
						Cancel
					</button>
				</div>
			</PdfAnnotationPopover>

			<div data-testid="result" className="mt-4">
				{result}
			</div>
		</div>
	);
};

/**
 * Tests that escape key closes the popover
 */
export const EscapeKeyClosesPopover: Story = {
	render: () => <InteractiveWrapper />,
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);
		await waitForPopoverTextVisibleInDocument({
			text: "Popover content",
			step,
		});
		await pressEscapeKey({ step });
		await resultShowsText({ canvas, text: "Cancelled", step });
	},
};

/**
 * Tests that clicking cancel button closes the popover
 */
export const CancelButtonClosesPopover: Story = {
	render: () => <InteractiveWrapper />,
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);
		await waitForPopoverTextVisibleInDocument({
			text: "Popover content",
			step,
		});
		await clickCancelButton({ step });
		await resultShowsText({ canvas, text: "Cancelled", step });
	},
};

/**
 * Tests that popover positions itself correctly next to anchor
 */
export const PopoverPositionsCorrectly: Story = {
	render: () => {
		const anchorRef = useRef<HTMLDivElement>(null);
		const [anchorElement, setAnchorElement] = useState<HTMLElement | null>(
			null,
		);
		const [isOpen] = useState(true);

		// Set anchor element after mount
		useEffect(() => {
			setAnchorElement(anchorRef.current);
		}, []);

		return (
			<div className="p-8">
				<div
					ref={anchorRef}
					data-testid="anchor"
					className="inline-block rounded bg-yellow-200 px-4 py-2 dark:bg-yellow-700"
				>
					Anchor Element
				</div>

				<PdfAnnotationPopover
					anchorElement={anchorElement}
					isOpen={isOpen}
					onCancel={() => {}}
				>
					<div data-testid="popover-content" className="space-y-2">
						<p className="text-sm">Popover content</p>
					</div>
				</PdfAnnotationPopover>
			</div>
		);
	},
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);
		await waitForPopoverContentTestIdInDocument({ step });
		await popoverIsPositionedLeftOrRightOfAnchor({ canvas, step });
	},
};
