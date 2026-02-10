"use client";

type BoundingBox = {
	x: number;
	y: number;
	width: number;
	height: number;
};

type Context = {
	id: string;
	contextType: "ignore" | "page_number";
	bbox: BoundingBox;
	color: string;
	visible: boolean;
	pageConfigMode: "this_page" | "all_pages" | "page_range" | "custom";
	pageNumber?: number;
	pageRange?: string;
	everyOther: boolean;
	startPage?: number;
};

type ContextLayerProps = {
	pageNumber: number;
	contexts: Context[];
	pageWidth: number;
	pageHeight: number;
	scale?: number;
	onContextClick?: (context: Context) => void;
};

/**
 * Context Layer - Renders context regions on PDF pages
 *
 * Contexts are semi-transparent rectangles with dashed borders
 * that mark regions for ignore or page number extraction.
 */
export const ContextLayer = ({
	pageNumber: _pageNumber,
	contexts,
	pageWidth,
	pageHeight,
	scale = 1,
	onContextClick,
}: ContextLayerProps) => {
	// Filter to only visible contexts
	const visibleContexts = contexts.filter((c) => c.visible);

	return (
		<div
			className="absolute inset-0 pointer-events-none"
			style={{
				width: `${pageWidth * scale}px`,
				height: `${pageHeight * scale}px`,
			}}
		>
			{visibleContexts.map((context) => {
				const { bbox, color, id } = context;

				return (
					<button
						key={id}
						type="button"
						className="absolute pointer-events-auto cursor-pointer transition-opacity hover:opacity-60 group"
						style={{
							left: `${bbox.x * scale}px`,
							top: `${bbox.y * scale}px`,
							width: `${bbox.width * scale}px`,
							height: `${bbox.height * scale}px`,
							backgroundColor: `${color}33`, // 20% opacity (33 in hex)
							border: `2px dashed ${color}`,
							borderRadius: "2px",
						}}
						onClick={() => onContextClick?.(context)}
					>
						{/* Tooltip on hover */}
						<div className="absolute bottom-full left-0 mb-2 hidden group-hover:block z-10 pointer-events-none">
							<div className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded px-2 py-1 whitespace-nowrap shadow-lg">
								{context.contextType === "ignore" ? "Ignore" : "Page Number"} •{" "}
								Click to edit
							</div>
						</div>
					</button>
				);
			})}
		</div>
	);
};
