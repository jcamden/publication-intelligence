import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, waitFor, within } from "@storybook/test";
import { useEffect, useRef, useState } from "react";
import { PdfAnnotationPopover } from "../../pdf-annotation-popover";

export default {
	title: "Components/PDF/PdfAnnotationPopover/tests/Interaction Tests",
	component: PdfAnnotationPopover,
	tags: ["interaction-test"],
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

		await step("Wait for popover to be visible", async () => {
			await waitFor(
				async () => {
					const popover = canvas.getByText("Popover content");
					await expect(popover).toBeInTheDocument();
				},
				{ timeout: 2000 },
			);
		});

		await step("Press Escape key", async () => {
			await userEvent.keyboard("{Escape}");
		});

		await step("Verify popover closed", async () => {
			await waitFor(
				async () => {
					const result = canvas.getByTestId("result");
					await expect(result).toHaveTextContent("Cancelled");
				},
				{ timeout: 2000 },
			);
		});
	},
};

/**
 * Tests that clicking cancel button closes the popover
 */
export const CancelButtonClosesPopover: Story = {
	render: () => <InteractiveWrapper />,
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);

		await step("Wait for popover to be visible", async () => {
			await waitFor(
				async () => {
					const popover = canvas.getByText("Popover content");
					await expect(popover).toBeInTheDocument();
				},
				{ timeout: 2000 },
			);
		});

		await step("Click cancel button", async () => {
			const cancelButton = canvas.getByRole("button", { name: "Cancel" });
			await userEvent.click(cancelButton);
		});

		await step("Verify popover closed", async () => {
			await waitFor(
				async () => {
					const result = canvas.getByTestId("result");
					await expect(result).toHaveTextContent("Cancelled");
				},
				{ timeout: 2000 },
			);
		});
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

		await step("Wait for popover to be visible", async () => {
			await waitFor(
				async () => {
					const popover = canvas.getByTestId("popover-content");
					await expect(popover).toBeInTheDocument();
				},
				{ timeout: 2000 },
			);
		});

		await step("Verify popover is positioned near anchor", async () => {
			const anchor = canvas.getByTestId("anchor");
			const popoverContent = canvas.getByTestId("popover-content");

			// Get the popover container (parent of popover-content)
			const popover = popoverContent.closest(".fixed");

			if (!popover) {
				throw new Error("Popover container not found");
			}

			const anchorRect = anchor.getBoundingClientRect();
			const popoverRect = popover.getBoundingClientRect();

			// Popover should be positioned to the right of anchor (with 10px gap)
			// or to the left if there's not enough space
			const isToTheRight = popoverRect.left >= anchorRect.right;
			const isToTheLeft = popoverRect.right <= anchorRect.left;

			await expect(isToTheRight || isToTheLeft).toBe(true);
		});
	},
};
