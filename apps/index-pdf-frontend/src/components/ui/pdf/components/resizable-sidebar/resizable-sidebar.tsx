"use client";

import { cn } from "@pubint/yabasic/lib/utils";
import type { WritableAtom } from "jotai";
import { useAtom, useAtomValue } from "jotai";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import {
	MIN_PDF_WIDTH,
	MIN_SIDEBAR_WIDTH,
	pageSidebarWidthAtom,
	pdfSectionLastWidthAtom,
	pdfSectionVisibleAtom,
	projectSidebarWidthAtom,
} from "@/atoms/editor-atoms";

type ResizableSidebarProps = {
	side: "left" | "right";
	widthAtom: WritableAtom<number, [number], void>;
	children: ReactNode;
	isCollapsed?: boolean;
};

export const ResizableSidebar = ({
	side,
	widthAtom,
	children,
	isCollapsed = false,
}: ResizableSidebarProps) => {
	const [width, _setWidth] = useAtom(widthAtom);
	const [isDragging, setIsDragging] = useState(false);
	const [shouldTransition, setShouldTransition] = useState(false);
	const [prevCollapsed, setPrevCollapsed] = useState<boolean | null>(null);

	const projectWidth = useAtomValue(projectSidebarWidthAtom);
	const pageWidth = useAtomValue(pageSidebarWidthAtom);
	const [, setProjectWidth] = useAtom(projectSidebarWidthAtom);
	const [, setPageWidth] = useAtom(pageSidebarWidthAtom);
	const [pdfVisible, setPdfVisible] = useAtom(pdfSectionVisibleAtom);
	const [, setPdfLastWidth] = useAtom(pdfSectionLastWidthAtom);

	useEffect(() => {
		if (prevCollapsed !== null && prevCollapsed !== isCollapsed && pdfVisible) {
			setShouldTransition(true);
			const timer = setTimeout(() => {
				setShouldTransition(false);
			}, 350);
			return () => {
				clearTimeout(timer);
			};
		}
	}, [isCollapsed, prevCollapsed, pdfVisible]);

	useEffect(() => {
		setPrevCollapsed(isCollapsed);
	}, [isCollapsed]);

	useEffect(() => {
		if (!isDragging) return;

		const handleMouseMove = (e: MouseEvent) => {
			const viewportWidth = window.innerWidth / 16; // convert px to rem
			const mouseX = e.clientX / 16; // convert px to rem

			if (side === "left") {
				// Project sidebar - dragging right edge
				const newProjectWidth = Math.max(MIN_SIDEBAR_WIDTH, mouseX);
				const otherSidebarWidth = pageWidth;
				const remainingForPdf =
					viewportWidth - newProjectWidth - otherSidebarWidth;

				if (remainingForPdf < MIN_PDF_WIDTH) {
					// PDF would be too small or negative
					if (pdfVisible) {
						// Save current PDF width and hide it
						const currentPdfWidth = viewportWidth - projectWidth - pageWidth;
						setPdfLastWidth(Math.max(MIN_PDF_WIDTH, currentPdfWidth));

						// Calculate relative proportions before hiding PDF
						const totalSidebarWidth = projectWidth + pageWidth;
						const projectRatio = projectWidth / totalSidebarWidth;
						const pageRatio = pageWidth / totalSidebarWidth;

						// Expand sidebars to fill viewport, maintaining proportions
						setProjectWidth(viewportWidth * projectRatio);
						setPageWidth(viewportWidth * pageRatio);
						setPdfVisible(false);
					} else {
						// PDF already hidden, continue dragging within constraints
						const maxProjectWidth = viewportWidth - MIN_SIDEBAR_WIDTH;
						const constrainedProjectWidth = Math.min(
							newProjectWidth,
							maxProjectWidth,
						);
						setProjectWidth(constrainedProjectWidth);

						// Adjust page sidebar
						const newPageWidth = viewportWidth - constrainedProjectWidth;
						setPageWidth(Math.max(MIN_SIDEBAR_WIDTH, newPageWidth));
					}
				} else {
					// PDF still visible
					setProjectWidth(newProjectWidth);
				}
			} else {
				// Page sidebar - dragging left edge
				const newPageWidth = Math.max(
					MIN_SIDEBAR_WIDTH,
					viewportWidth - mouseX,
				);
				const otherSidebarWidth = projectWidth;
				const remainingForPdf =
					viewportWidth - otherSidebarWidth - newPageWidth;

				if (remainingForPdf < MIN_PDF_WIDTH) {
					// PDF would be too small or negative
					if (pdfVisible) {
						// Save current PDF width and hide it
						const currentPdfWidth = viewportWidth - projectWidth - pageWidth;
						setPdfLastWidth(Math.max(MIN_PDF_WIDTH, currentPdfWidth));

						// Calculate relative proportions before hiding PDF
						const totalSidebarWidth = projectWidth + pageWidth;
						const projectRatio = projectWidth / totalSidebarWidth;
						const pageRatio = pageWidth / totalSidebarWidth;

						// Expand sidebars to fill viewport, maintaining proportions
						setProjectWidth(viewportWidth * projectRatio);
						setPageWidth(viewportWidth * pageRatio);
						setPdfVisible(false);
					} else {
						// PDF already hidden, continue dragging within constraints
						const maxPageWidth = viewportWidth - MIN_SIDEBAR_WIDTH;
						const constrainedPageWidth = Math.min(newPageWidth, maxPageWidth);
						setPageWidth(constrainedPageWidth);

						// Adjust project sidebar
						const newProjectWidth = viewportWidth - constrainedPageWidth;
						setProjectWidth(Math.max(MIN_SIDEBAR_WIDTH, newProjectWidth));
					}
				} else {
					// PDF still visible
					setPageWidth(newPageWidth);
				}
			}
		};

		const handleMouseUp = () => {
			setIsDragging(false);
		};

		document.addEventListener("mousemove", handleMouseMove);
		document.addEventListener("mouseup", handleMouseUp);

		return () => {
			document.removeEventListener("mousemove", handleMouseMove);
			document.removeEventListener("mouseup", handleMouseUp);
		};
	}, [
		isDragging,
		side,
		projectWidth,
		pageWidth,
		pdfVisible,
		setProjectWidth,
		setPageWidth,
		setPdfVisible,
		setPdfLastWidth,
	]);

	const handleMouseDown = (e: React.MouseEvent) => {
		e.preventDefault();
		setIsDragging(true);
	};

	const displayWidth = isCollapsed ? 0 : width;

	return (
		<div
			className={cn(
				"relative flex-shrink-0 border-neutral-200 dark:border-neutral-700",
				(isCollapsed || !pdfVisible) && "overflow-hidden",
			)}
			style={{
				width: `${displayWidth}rem`,
				transition:
					shouldTransition && pdfVisible && !isDragging
						? "width 0.3s ease-in-out"
						: "none",
			}}
		>
			{children}

			{!isCollapsed && (
				// biome-ignore lint/a11y/useSemanticElements: div required for absolute positioning and z-index control
				<div
					className={cn(
						"absolute top-0 bottom-0 w-2 cursor-col-resize hover:bg-blue-500/50 transition-colors",
						side === "left" ? "right-0" : "left-0",
						isDragging && "bg-blue-500",
					)}
					style={{ zIndex: 10 }}
					onMouseDown={handleMouseDown}
					role="separator"
					aria-orientation="vertical"
					aria-label={`Resize ${side} sidebar`}
					aria-valuenow={0}
					tabIndex={0}
				/>
			)}
		</div>
	);
};
