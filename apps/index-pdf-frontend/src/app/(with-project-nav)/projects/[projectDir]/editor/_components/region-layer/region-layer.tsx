"use client";

type BoundingBox = {
	x: number;
	y: number;
	width: number;
	height: number;
};

type Region = {
	id: string;
	regionType: "exclude" | "page_number";
	bbox: BoundingBox;
	color: string;
	visible: boolean;
	pageConfigMode: "this_page" | "all_pages" | "page_range" | "custom";
	pageNumber?: number;
	pageRange?: string;
	everyOther: boolean;
	startPage?: number;
};

type RegionLayerProps = {
	pageNumber: number;
	regions: Region[];
	pageWidth: number;
	pageHeight: number;
	scale?: number;
	onRegionClick?: (region: Region) => void;
};

/**
 * Region Layer - Renders region areas on PDF pages
 *
 * Regions are semi-transparent rectangles with dashed borders
 * that mark areas for ignore or page number extraction.
 */
export const RegionLayer = ({
	pageNumber: _pageNumber,
	regions,
	pageWidth,
	pageHeight,
	scale = 1,
	onRegionClick,
}: RegionLayerProps) => {
	// Filter to only visible regions
	const visibleRegions = regions.filter((r) => r.visible);

	return (
		<div
			className="absolute inset-0 pointer-events-none"
			style={{
				width: `${pageWidth * scale}px`,
				height: `${pageHeight * scale}px`,
			}}
		>
			{visibleRegions.map((region) => {
				const { bbox, color, id } = region;

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
						onClick={() => onRegionClick?.(region)}
					>
						{/* Tooltip on hover */}
						<div className="absolute bottom-full left-0 mb-2 hidden group-hover:block z-10 pointer-events-none">
							<div className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded px-2 py-1 whitespace-nowrap shadow-lg">
								{region.regionType === "exclude" ? "Exclude" : "Page Number"} •{" "}
								Click to edit
							</div>
						</div>
					</button>
				);
			})}
		</div>
	);
};
