import {
	extractPageNumberFromBbox,
	getApplicablePages,
	type PageConfigMode,
	type Region,
	type RegionDerivedPageNumber,
	type RegionType,
} from "@pubint/core";
import * as pdfjsLib from "pdfjs-dist";
import { useEffect, useMemo, useState } from "react";

type BoundingBox = {
	x: number;
	y: number;
	width: number;
	height: number;
};

type RegionInput = {
	id: string;
	projectId: string;
	name: string;
	regionType: RegionType;
	bbox: BoundingBox;
	pageConfigMode: PageConfigMode;
	pageNumber?: number;
	pageRange?: string;
	everyOther: boolean;
	startPage?: number;
	endPage?: number;
	exceptPages?: number[];
	color: string;
	visible: boolean;
	createdAt: string | Date;
};

type CachedPageNumbers = {
	cacheKey: string;
	results: RegionDerivedPageNumber[];
	timestamp: number;
};

/**
 * Generate a cache key from regions based only on fields that affect extraction
 * Ignores fields like name, color, visible that don't impact the extracted page numbers
 * Note: Uses projectId instead of pdfUrl since blob URLs change on every page load
 */
const generateRegionsCacheKey = ({
	regions,
	projectId,
}: {
	regions: RegionInput[];
	projectId: string;
}): string => {
	const relevantData = regions
		.filter((reg) => reg.regionType === "page_number")
		.sort((a, b) => a.id.localeCompare(b.id))
		.map((reg) => ({
			id: reg.id,
			bbox: reg.bbox,
			pageConfigMode: reg.pageConfigMode,
			pageNumber: reg.pageNumber,
			pageRange: reg.pageRange,
			everyOther: reg.everyOther,
			startPage: reg.startPage,
			endPage: reg.endPage,
			exceptPages: reg.exceptPages?.sort((a, b) => a - b),
		}));

	const dataStr = JSON.stringify({ projectId, regions: relevantData });
	let hash = 0;
	for (let i = 0; i < dataStr.length; i++) {
		const char = dataStr.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash = hash & hash;
	}
	return hash.toString(36);
};

/**
 * Extract text from PDF text layer at a specific bbox location
 */
const extractTextFromBbox = async ({
	page,
	bbox,
}: {
	page: pdfjsLib.PDFPageProxy;
	bbox: BoundingBox;
}): Promise<string> => {
	try {
		const textContent = await page.getTextContent();

		// Filter text items that intersect with the bbox
		const matchingTexts: string[] = [];

		for (const item of textContent.items) {
			// Type guard for TextItem (not TextMarkedContent)
			if (!("transform" in item) || !item.str) continue;

			// Get text item position from transform matrix
			// transform[4] = x position, transform[5] = y position
			const itemX = item.transform[4];
			const itemY = item.transform[5];
			const itemWidth = item.width || 0;
			const itemHeight = item.height || 12; // Default height if not provided

			// Check if text item intersects with bbox
			const intersects =
				itemX < bbox.x + bbox.width &&
				itemX + itemWidth > bbox.x &&
				itemY < bbox.y + bbox.height &&
				itemY + itemHeight > bbox.y;

			if (intersects) {
				matchingTexts.push(item.str);
			}
		}

		return matchingTexts.join(" ").trim();
	} catch {
		return "";
	}
};

/**
 * Hook to extract region-derived page numbers from page_number regions
 * Results are cached in localStorage and reused if regions haven't changed
 */
export const useRegionDerivedPageNumbers = ({
	regions,
	pdfUrl,
	totalPages,
	enabled = true,
	projectId,
}: {
	regions: RegionInput[];
	pdfUrl?: string;
	totalPages: number;
	enabled?: boolean;
	projectId?: string;
}): {
	regionDerivedPageNumbers: RegionDerivedPageNumber[];
	isLoading: boolean;
	error: string | null;
} => {
	const [regionDerivedPageNumbers, setRegionDerivedPageNumbers] = useState<
		RegionDerivedPageNumber[]
	>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Generate cache key from regions
	const cacheKey = useMemo(() => {
		if (!projectId) return null;
		return generateRegionsCacheKey({ regions, projectId });
	}, [regions, projectId]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: `regions` is intentionally omitted because: (1) it's recreated on every render (mapped from tRPC data), (2) region data changes are tracked via `cacheKey`, (3) including it causes infinite loops
	useEffect(() => {
		if (!enabled || !pdfUrl || totalPages === 0 || !projectId) {
			return;
		}

		let isCancelled = false;

		const extractPageNumbers = async () => {
			// Try to load from cache first
			if (cacheKey) {
				try {
					const cacheStorageKey = `region-page-numbers-${projectId}`;
					const cachedStr = localStorage.getItem(cacheStorageKey);
					if (cachedStr) {
						const cached: CachedPageNumbers = JSON.parse(cachedStr);
						if (cached.cacheKey === cacheKey) {
							// Cache hit! Use cached results
							setRegionDerivedPageNumbers(cached.results);
							setIsLoading(false);
							return;
						}
					}
				} catch (err) {
					// Cache read error, continue with extraction
					console.warn("Failed to read region page numbers cache:", err);
				}
			}

			setIsLoading(true);
			setError(null);

			try {
				// Initialize PDF.js worker if needed
				if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
					pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
				}

				// Load PDF document
				const loadingTask = pdfjsLib.getDocument(pdfUrl);
				const pdfDoc = await loadingTask.promise;

				if (isCancelled) return;

				// Filter to only page_number regions
				const pageNumberRegions = regions.filter(
					(reg) => reg.regionType === "page_number",
				);

				const results: RegionDerivedPageNumber[] = [];

				// Extract page numbers for each region
				for (const region of pageNumberRegions) {
					const applicablePages = getApplicablePages({
						region: region as unknown as Region,
						maxPage: totalPages,
					});

					for (const pageNum of applicablePages) {
						if (isCancelled) return;

						try {
							// Get PDF page
							const page = await pdfDoc.getPage(pageNum);

							// Extract text at bbox location
							const extractedText = await extractTextFromBbox({
								page,
								bbox: region.bbox,
							});

							if (extractedText) {
								// Validate and clean the extracted text
								const canonicalPage = extractPageNumberFromBbox({
									textContent: extractedText,
									_bbox: region.bbox,
								});

								if (canonicalPage) {
									results.push({
										documentPage: pageNum,
										canonicalPage,
										regionId: region.id,
										regionName: region.name,
									});
								}
							}
						} catch {
							// Continue with other pages on error
						}
					}
				}

				if (!isCancelled) {
					setRegionDerivedPageNumbers(results);
					setIsLoading(false);

					// Save to cache
					if (cacheKey && projectId) {
						try {
							const cacheStorageKey = `region-page-numbers-${projectId}`;
							const cacheData: CachedPageNumbers = {
								cacheKey,
								results,
								timestamp: Date.now(),
							};
							localStorage.setItem(cacheStorageKey, JSON.stringify(cacheData));
						} catch (err) {
							// Cache write error, not critical
							console.warn("Failed to write region page numbers cache:", err);
						}
					}
				}
			} catch (err) {
				if (!isCancelled) {
					setError(
						err instanceof Error
							? err.message
							: "Failed to extract page numbers",
					);
					setIsLoading(false);
				}
			}
		};

		extractPageNumbers();

		return () => {
			isCancelled = true;
		};
	}, [pdfUrl, totalPages, enabled, cacheKey, projectId]);

	return {
		regionDerivedPageNumbers,
		isLoading,
		error,
	};
};
