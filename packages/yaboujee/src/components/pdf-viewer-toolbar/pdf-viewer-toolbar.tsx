"use client";

import { Button } from "@pubint/yabasic/components/ui/button";
import { ChevronLeft, ChevronRight, Minus, Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

export type PdfViewerToolbarProps = {
	currentPage: number;
	totalPages: number;
	zoom: number;
	onPageChange: ({ page }: { page: number }) => void;
	onZoomChange: ({ zoom }: { zoom: number }) => void;
	className?: string;
};

/**
 * PDF Viewer Toolbar Component
 *
 * A dock-style toolbar with rounded corners for controlling PDF viewer page navigation and zoom.
 *
 * ## Features
 * - Page navigation with prev/next buttons and direct page input
 * - Zoom controls with increment/decrement and direct input
 * - Dock-style design with rounded corners
 * - Dark mode support
 *
 * ## Usage
 * ```tsx
 * <PdfViewerToolbar
 *   currentPage={1}
 *   totalPages={10}
 *   zoom={1.25}
 *   onPageChange={({ page }) => setPage(page)}
 *   onZoomChange={({ zoom }) => setZoom(zoom)}
 * />
 * ```
 */
export const PdfViewerToolbar = ({
	currentPage,
	totalPages,
	zoom,
	onPageChange,
	onZoomChange,
	className = "",
}: PdfViewerToolbarProps) => {
	// Local state for inputs to allow free typing
	const [pageInputValue, setPageInputValue] = useState(String(currentPage));
	const [zoomInputValue, setZoomInputValue] = useState(
		String(Math.round(zoom * 100)),
	);

	// Sync local state when props change externally
	useEffect(() => {
		setPageInputValue(String(currentPage));
	}, [currentPage]);

	useEffect(() => {
		setZoomInputValue(String(Math.round(zoom * 100)));
	}, [zoom]);

	const handlePrevPage = useCallback(() => {
		if (currentPage > 1) {
			onPageChange({ page: currentPage - 1 });
		}
	}, [currentPage, onPageChange]);

	const handleNextPage = useCallback(() => {
		if (currentPage < totalPages) {
			onPageChange({ page: currentPage + 1 });
		}
	}, [currentPage, totalPages, onPageChange]);

	const handlePageInputChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			setPageInputValue(e.target.value);
		},
		[],
	);

	const handlePageInputBlur = useCallback(() => {
		const value = Number.parseInt(pageInputValue, 10);
		if (!Number.isNaN(value) && value >= 1 && value <= totalPages) {
			onPageChange({ page: value });
		} else {
			// Reset to current page if invalid
			setPageInputValue(String(currentPage));
		}
	}, [pageInputValue, totalPages, currentPage, onPageChange]);

	const handlePageInputKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLInputElement>) => {
			if (e.key === "Enter") {
				e.currentTarget.blur();
			}
		},
		[],
	);

	const handleZoomDecrement = useCallback(() => {
		const newZoom = Math.max(0.5, zoom - 0.25);
		onZoomChange({ zoom: newZoom });
	}, [zoom, onZoomChange]);

	const handleZoomIncrement = useCallback(() => {
		const newZoom = Math.min(3, zoom + 0.25);
		onZoomChange({ zoom: newZoom });
	}, [zoom, onZoomChange]);

	const handleZoomInputChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			setZoomInputValue(e.target.value);
		},
		[],
	);

	const handleZoomInputBlur = useCallback(() => {
		const percentValue = Number.parseInt(zoomInputValue, 10);
		const zoomValue = percentValue / 100;
		if (!Number.isNaN(zoomValue) && zoomValue >= 0.5 && zoomValue <= 3) {
			onZoomChange({ zoom: zoomValue });
		} else {
			// Reset to current zoom if invalid
			setZoomInputValue(String(Math.round(zoom * 100)));
		}
	}, [zoomInputValue, zoom, onZoomChange]);

	const handleZoomInputKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLInputElement>) => {
			if (e.key === "Enter") {
				e.currentTarget.blur();
			}
		},
		[],
	);

	const dockClasses = `
		inline-flex items-center gap-3 
		rounded-full 
		border border-[hsl(var(--color-border))] 
		bg-[hsl(var(--color-background))] 
		px-4 py-2 
		shadow-lg
		${className}
	`.trim();

	const inputClasses = `
		w-12 
		rounded 
		border border-[hsl(var(--color-border))] 
		bg-[hsl(var(--color-background))] 
		px-2 py-1 
		text-center 
		text-sm 
		text-[hsl(var(--color-text))] 
		focus:outline-none 
		focus:ring-2 
		focus:ring-[hsl(var(--color-neutral-500))]
		[appearance:textfield]
		[&::-webkit-outer-spin-button]:appearance-none
		[&::-webkit-inner-spin-button]:appearance-none
	`.trim();

	const separatorClasses = `
		h-6 
		w-px 
		bg-[hsl(var(--color-border))]
	`.trim();

	return (
		<div className={dockClasses}>
			{/* Page Controls */}
			<Button
				onClick={handlePrevPage}
				disabled={currentPage <= 1}
				variant="ghost"
				size="icon-sm"
				aria-label="Previous page"
			>
				<ChevronLeft />
			</Button>
			<div className="flex items-center gap-1.5 text-sm text-[hsl(var(--color-text-muted))]">
				<input
					type="number"
					min="1"
					max={totalPages}
					value={pageInputValue}
					onChange={handlePageInputChange}
					onBlur={handlePageInputBlur}
					onKeyDown={handlePageInputKeyDown}
					className={inputClasses}
					aria-label="Current page"
				/>
				<span>of {totalPages}</span>
			</div>
			<Button
				onClick={handleNextPage}
				disabled={currentPage >= totalPages}
				variant="ghost"
				size="icon-sm"
				aria-label="Next page"
			>
				<ChevronRight />
			</Button>
			{/* Separator */}
			<div className={separatorClasses} />
			{/* Zoom Controls */}
			<Button
				onClick={handleZoomDecrement}
				disabled={zoom <= 0.5}
				variant="ghost"
				size="icon-sm"
				aria-label="Zoom out"
			>
				<Minus />
			</Button>
			<input
				type="number"
				min="50"
				max="300"
				step="25"
				value={zoomInputValue}
				onChange={handleZoomInputChange}
				onBlur={handleZoomInputBlur}
				onKeyDown={handleZoomInputKeyDown}
				className={`${inputClasses} w-14`}
				aria-label="Zoom percentage"
			/>
			%
			<Button
				onClick={handleZoomIncrement}
				disabled={zoom >= 3}
				variant="ghost"
				size="icon-sm"
				aria-label="Zoom in"
			>
				<Plus />
			</Button>
		</div>
	);
};
