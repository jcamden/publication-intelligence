import type { Meta, StoryObj } from "@storybook/react";
import { useRef, useState } from "react";
import { PdfAnnotationPopover } from "../pdf-annotation-popover";

export default {
	title: "Components/PDF/PdfAnnotationPopover",
	component: PdfAnnotationPopover,
	parameters: {
		layout: "fullscreen",
	},
} satisfies Meta<typeof PdfAnnotationPopover>;

type Story = StoryObj<typeof PdfAnnotationPopover>;

/**
 * Interactive example showing popover positioned next to an anchor element
 */
export const Default: Story = {
	render: () => {
		const anchorRef = useRef<HTMLDivElement>(null);
		const [isOpen, setIsOpen] = useState(false);

		return (
			<div className="p-8">
				<div className="mb-4">
					<button
						type="button"
						onClick={() => setIsOpen(!isOpen)}
						className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
					>
						{isOpen ? "Close" : "Open"} Popover
					</button>
				</div>

				<div
					ref={anchorRef}
					className="inline-block rounded bg-yellow-200 px-4 py-2 dark:bg-yellow-700"
				>
					Anchor Element - Popover positions next to this
				</div>

				<PdfAnnotationPopover
					anchorElement={anchorRef.current}
					isOpen={isOpen}
					onCancel={() => setIsOpen(false)}
				>
					<div className="space-y-3">
						<h3 className="text-lg font-semibold">Popover Content</h3>
						<p className="text-sm text-neutral-600 dark:text-neutral-300">
							This popover automatically positions itself next to the anchor
							element with smart bounds checking.
						</p>
						<div className="flex gap-2">
							<button
								type="button"
								onClick={() => setIsOpen(false)}
								className="rounded bg-neutral-200 px-3 py-1 text-sm hover:bg-neutral-300 dark:bg-neutral-700 dark:hover:bg-neutral-600"
							>
								Cancel
							</button>
							<button
								type="button"
								onClick={() => setIsOpen(false)}
								className="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
							>
								Confirm
							</button>
						</div>
					</div>
				</PdfAnnotationPopover>
			</div>
		);
	},
};

/**
 * Shows popover positioning when anchor is near viewport edges
 */
export const EdgePositioning: Story = {
	render: () => {
		const topLeftRef = useRef<HTMLButtonElement>(null);
		const topRightRef = useRef<HTMLButtonElement>(null);
		const bottomRightRef = useRef<HTMLButtonElement>(null);
		const [activePopover, setActivePopover] = useState<string | null>(null);

		return (
			<div className="relative h-screen p-4">
				{/* Top left */}
				<div className="absolute left-4 top-4">
					<button
						ref={topLeftRef}
						type="button"
						onClick={() =>
							setActivePopover(activePopover === "tl" ? null : "tl")
						}
						className="rounded bg-blue-600 px-3 py-2 text-white hover:bg-blue-700"
					>
						Top Left
					</button>
					<PdfAnnotationPopover
						anchorElement={topLeftRef.current}
						isOpen={activePopover === "tl"}
						onCancel={() => setActivePopover(null)}
					>
						<p className="text-sm">Popover near top-left edge</p>
					</PdfAnnotationPopover>
				</div>

				{/* Top right */}
				<div className="absolute right-4 top-4">
					<button
						ref={topRightRef}
						type="button"
						onClick={() =>
							setActivePopover(activePopover === "tr" ? null : "tr")
						}
						className="rounded bg-blue-600 px-3 py-2 text-white hover:bg-blue-700"
					>
						Top Right
					</button>
					<PdfAnnotationPopover
						anchorElement={topRightRef.current}
						isOpen={activePopover === "tr"}
						onCancel={() => setActivePopover(null)}
					>
						<p className="text-sm">Popover near top-right edge (flips left)</p>
					</PdfAnnotationPopover>
				</div>

				{/* Bottom right */}
				<div className="absolute bottom-4 right-4">
					<button
						ref={bottomRightRef}
						type="button"
						onClick={() =>
							setActivePopover(activePopover === "br" ? null : "br")
						}
						className="rounded bg-blue-600 px-3 py-2 text-white hover:bg-blue-700"
					>
						Bottom Right
					</button>
					<PdfAnnotationPopover
						anchorElement={bottomRightRef.current}
						isOpen={activePopover === "br"}
						onCancel={() => setActivePopover(null)}
					>
						<p className="text-sm">
							Popover near bottom-right (adjusts position)
						</p>
					</PdfAnnotationPopover>
				</div>
			</div>
		);
	},
};
