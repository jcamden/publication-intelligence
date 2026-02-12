"use client";

import { getPageConfigSummary } from "@pubint/core";
import { Button } from "@pubint/yabasic/components/ui/button";
import { useAtomValue } from "jotai";
import { AlertTriangle, Eye, EyeOff, X } from "lucide-react";
import { trpc } from "@/app/_common/_utils/trpc";
import {
	pdfUrlAtom,
	totalPagesAtom,
} from "@/app/projects/[projectDir]/editor/_atoms/editor-atoms";
import { useProjectContext } from "@/app/projects/[projectDir]/editor/_context/project-context";
import { useRegionDerivedPageNumbers } from "@/app/projects/[projectDir]/editor/_hooks/use-region-derived-page-numbers";

type PageRegionsContentProps = {
	currentPage: number;
};

export const PageRegionsContent = ({
	currentPage,
}: PageRegionsContentProps) => {
	const { projectId } = useProjectContext();
	const utils = trpc.useUtils();
	const totalPages = useAtomValue(totalPagesAtom);
	const pdfUrl = useAtomValue(pdfUrlAtom);

	// Fetch regions for current page
	const {
		data: regions = [],
		isLoading,
		error,
	} = trpc.region.getForPage.useQuery(
		{ projectId: projectId || "", pageNumber: currentPage },
		{ enabled: !!projectId && currentPage > 0 },
	);

	// Extract region-derived page numbers from PDF
	const {
		regionDerivedPageNumbers,
		isLoading: regionNumbersLoading,
		error: regionNumbersError,
	} = useRegionDerivedPageNumbers({
		regions: regions.map((reg) => ({
			...reg,
			createdAt: new Date(reg.createdAt),
		})),
		pdfUrl: pdfUrl || undefined,
		totalPages,
		enabled: totalPages > 0 && !!pdfUrl,
		projectId: projectId || undefined,
	});

	const updateRegion = trpc.region.update.useMutation({
		onSuccess: () => {
			// Invalidate both project and page region queries
			utils.region.list.invalidate({ projectId: projectId || "" });
			utils.region.getForPage.invalidate();
		},
	});

	const deleteRegion = trpc.region.delete.useMutation({
		onSuccess: () => {
			// Invalidate both project and page region queries
			utils.region.list.invalidate({ projectId: projectId || "" });
			utils.region.getForPage.invalidate();
		},
	});

	const toggleVisibility = async ({
		regionId,
		currentlyVisible,
	}: {
		regionId: string;
		currentlyVisible: boolean;
	}) => {
		await updateRegion.mutateAsync({
			id: regionId,
			visible: !currentlyVisible,
		});
	};

	const removePageFromRegion = async ({
		region,
	}: {
		region: (typeof regions)[0];
	}) => {
		// If this is a "this_page" region, removing the only page means deleting it
		if (region.pageConfigMode === "this_page") {
			const confirmed = window.confirm(
				"Removing the last page from a region will delete it. Are you sure you'd like to proceed?",
			);
			if (!confirmed) return;

			await deleteRegion.mutateAsync({ id: region.id });
		} else {
			// Add current page to exceptPages array
			const currentExceptPages = region.exceptPages || [];
			const updatedExceptPages = [...currentExceptPages, currentPage];

			await updateRegion.mutateAsync({
				id: region.id,
				exceptPages: updatedExceptPages,
			});
		}
	};

	const getRegionTypeLabel = (type: "exclude" | "page_number") => {
		return type === "exclude" ? "Exclude" : "Page Number";
	};

	// Check for page_number conflicts on current page
	// Only flag as conflict if 2+ regions have detected text
	const pageNumberRegions = regions.filter(
		(reg) => reg.regionType === "page_number",
	);

	// Get regions with detected text on the current page
	const regionsWithTextOnCurrentPage = regionDerivedPageNumbers.filter(
		(derived) => derived.documentPage === currentPage,
	);

	// Conflict exists if 2+ regions have detected text on this page
	const hasConflict =
		!regionNumbersLoading && regionsWithTextOnCurrentPage.length > 1;

	if (isLoading) {
		return (
			<div className="p-4 text-sm text-gray-500 dark:text-gray-400">
				Loading regions...
			</div>
		);
	}

	if (error) {
		return (
			<div className="p-4 text-sm text-red-600 dark:text-red-400">
				Error loading regions
			</div>
		);
	}

	if (regionNumbersError) {
		return (
			<div className="p-4 text-sm text-red-600 dark:text-red-400">
				Error extracting page numbers: {regionNumbersError}
			</div>
		);
	}

	if (regions.length === 0) {
		return (
			<div className="p-4 text-sm text-center text-gray-500 dark:text-gray-400">
				No regions on this page
			</div>
		);
	}

	return (
		<div className="space-y-0">
			{/* Loading conflict check */}
			{pageNumberRegions.length > 1 && regionNumbersLoading && (
				<div className="p-3 border-b border-gray-300 bg-gray-50 dark:bg-gray-900 dark:border-gray-700">
					<div className="flex items-start gap-2">
						<div className="flex-1 min-w-0">
							<p className="text-xs text-gray-600 dark:text-gray-400 italic">
								Checking for conflicts...
							</p>
						</div>
					</div>
				</div>
			)}

			{/* Conflict Warning */}
			{hasConflict && (
				<div className="p-3 border-b border-yellow-600 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-800">
					<div className="flex items-start gap-2">
						<AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
						<div className="flex-1 min-w-0">
							<h4 className="text-xs font-semibold text-yellow-900 dark:text-yellow-100 mb-1">
								⚠️ PAGE NUMBER CONFLICT
							</h4>
							<p className="text-xs text-yellow-800 dark:text-yellow-200 mb-2">
								Multiple regions have detected page numbers on this page:
							</p>
							<ul className="text-xs text-yellow-800 dark:text-yellow-200 space-y-1 mb-2">
								{regionsWithTextOnCurrentPage.map((derived) => (
									<li
										key={derived.regionId}
										className="flex items-center gap-1"
									>
										• {derived.regionName} (detected: "{derived.canonicalPage}
										")
									</li>
								))}
							</ul>
							<p className="text-xs text-yellow-800 dark:text-yellow-200">
								Resolve conflict to enable canonical page number indexing.
							</p>
						</div>
					</div>
				</div>
			)}

			{/* Regions List */}
			<div className="divide-y divide-gray-200 dark:divide-gray-700">
				{regions.map((region) => {
					return (
						<div
							key={region.id}
							className="p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
						>
							<div className="flex items-start gap-2">
								{/* Content */}
								<div className="flex-1 min-w-0">
									<div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-0.5">
										{region.name}
									</div>
									<div className="text-xs text-gray-600 dark:text-gray-400 mb-0.5">
										{getRegionTypeLabel(region.regionType)}
									</div>
									<div className="text-xs text-gray-500 dark:text-gray-500 mb-2">
										{getPageConfigSummary({ region })}
									</div>

									{/* Actions */}
									<div className="flex gap-2">
										<Button
											variant="ghost"
											size="sm"
											onClick={() =>
												toggleVisibility({
													regionId: region.id,
													currentlyVisible: region.visible,
												})
											}
											title={region.visible ? "Hide" : "Show"}
										>
											{region.visible ? (
												<Eye className="w-3 h-3 mr-1" />
											) : (
												<EyeOff className="w-3 h-3 mr-1" />
											)}
											{region.visible ? "Hide" : "Show"}
										</Button>
										<Button
											variant="ghost"
											size="sm"
											onClick={() => removePageFromRegion({ region })}
											disabled={
												updateRegion.isPending || deleteRegion.isPending
											}
										>
											<X className="w-3 h-3 mr-1" />
											Remove Page
										</Button>
									</div>
								</div>
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
};
