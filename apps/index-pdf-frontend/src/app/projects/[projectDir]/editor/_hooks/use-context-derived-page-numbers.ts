import {
	type Context,
	type ContextDerivedPageNumber,
	type ContextType,
	extractPageNumberFromBbox,
	getApplicablePages,
	type PageConfigMode,
} from "@pubint/core";
import * as pdfjsLib from "pdfjs-dist";
import { useEffect, useMemo, useState } from "react";

type BoundingBox = {
	x: number;
	y: number;
	width: number;
	height: number;
};

type ContextInput = {
	id: string;
	projectId: string;
	name: string;
	contextType: ContextType;
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
	results: ContextDerivedPageNumber[];
	timestamp: number;
};

/**
 * Generate a cache key from contexts based only on fields that affect extraction
 * Ignores fields like name, color, visible that don't impact the extracted page numbers
 * Note: Uses projectId instead of pdfUrl since blob URLs change on every page load
 */
const generateContextsCacheKey = ({
	contexts,
	projectId,
}: {
	contexts: ContextInput[];
	projectId: string;
}): string => {
	const relevantData = contexts
		.filter((ctx) => ctx.contextType === "page_number")
		.sort((a, b) => a.id.localeCompare(b.id))
		.map((ctx) => ({
			id: ctx.id,
			bbox: ctx.bbox,
			pageConfigMode: ctx.pageConfigMode,
			pageNumber: ctx.pageNumber,
			pageRange: ctx.pageRange,
			everyOther: ctx.everyOther,
			startPage: ctx.startPage,
			endPage: ctx.endPage,
			exceptPages: ctx.exceptPages?.sort((a, b) => a - b),
		}));

	const dataStr = JSON.stringify({ projectId, contexts: relevantData });
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
 * Hook to extract context-derived page numbers from page_number contexts
 * Results are cached in localStorage and reused if contexts haven't changed
 */
export const useContextDerivedPageNumbers = ({
	contexts,
	pdfUrl,
	totalPages,
	enabled = true,
	projectId,
}: {
	contexts: ContextInput[];
	pdfUrl?: string;
	totalPages: number;
	enabled?: boolean;
	projectId?: string;
}): {
	contextDerivedPageNumbers: ContextDerivedPageNumber[];
	isLoading: boolean;
	error: string | null;
} => {
	const [contextDerivedPageNumbers, setContextDerivedPageNumbers] = useState<
		ContextDerivedPageNumber[]
	>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Generate cache key from contexts
	const cacheKey = useMemo(() => {
		if (!projectId) return null;
		return generateContextsCacheKey({ contexts, projectId });
	}, [contexts, projectId]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: `contexts` is intentionally omitted because: (1) it's recreated on every render (mapped from tRPC data), (2) context data changes are tracked via `cacheKey`, (3) including it causes infinite loops
	useEffect(() => {
		if (!enabled || !pdfUrl || totalPages === 0 || !projectId) {
			return;
		}

		let isCancelled = false;

		const extractPageNumbers = async () => {
			// Try to load from cache first
			if (cacheKey) {
				try {
					const cacheStorageKey = `context-page-numbers-${projectId}`;
					const cachedStr = localStorage.getItem(cacheStorageKey);
					if (cachedStr) {
						const cached: CachedPageNumbers = JSON.parse(cachedStr);
						if (cached.cacheKey === cacheKey) {
							// Cache hit! Use cached results
							setContextDerivedPageNumbers(cached.results);
							setIsLoading(false);
							return;
						}
					}
				} catch (err) {
					// Cache read error, continue with extraction
					console.warn("Failed to read context page numbers cache:", err);
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

				// Filter to only page_number contexts
				const pageNumberContexts = contexts.filter(
					(ctx) => ctx.contextType === "page_number",
				);

				const results: ContextDerivedPageNumber[] = [];

				// Extract page numbers for each context
				for (const context of pageNumberContexts) {
					const applicablePages = getApplicablePages({
						context: context as unknown as Context,
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
								bbox: context.bbox,
							});

							if (extractedText) {
								// Validate and clean the extracted text
								const canonicalPage = extractPageNumberFromBbox({
									textContent: extractedText,
									_bbox: context.bbox,
								});

								if (canonicalPage) {
									results.push({
										documentPage: pageNum,
										canonicalPage,
										contextId: context.id,
										contextName: context.name,
									});
								}
							}
						} catch {
							// Continue with other pages on error
						}
					}
				}

				if (!isCancelled) {
					setContextDerivedPageNumbers(results);
					setIsLoading(false);

					// Save to cache
					if (cacheKey && projectId) {
						try {
							const cacheStorageKey = `context-page-numbers-${projectId}`;
							const cacheData: CachedPageNumbers = {
								cacheKey,
								results,
								timestamp: Date.now(),
							};
							localStorage.setItem(cacheStorageKey, JSON.stringify(cacheData));
						} catch (err) {
							// Cache write error, not critical
							console.warn("Failed to write context page numbers cache:", err);
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
		contextDerivedPageNumbers,
		isLoading,
		error,
	};
};
