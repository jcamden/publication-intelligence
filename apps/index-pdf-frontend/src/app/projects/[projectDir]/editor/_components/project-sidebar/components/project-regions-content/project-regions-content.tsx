"use client";

import {
	detectPageNumberConflicts,
	getPageConfigSummary,
	type Region,
} from "@pubint/core";
import { Button } from "@pubint/yabasic/components/ui/button";
import { OklchColorPicker } from "@pubint/yabasic/components/ui/oklch-color-picker";
import { StyledButton } from "@pubint/yaboujee";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import {
	Edit,
	Eye,
	EyeOff,
	SquareDashedMousePointer,
	Trash2,
} from "lucide-react";
import { useMemo } from "react";
import { trpc } from "@/app/_common/_utils/trpc";
import {
	currentPageAtom,
	pdfUrlAtom,
	regionTypeColorConfigAtom,
	totalPagesAtom,
} from "@/app/projects/[projectDir]/editor/_atoms/editor-atoms";
import { useProjectContext } from "@/app/projects/[projectDir]/editor/_context/project-context";
import { useRegionDerivedPageNumbers } from "@/app/projects/[projectDir]/editor/_hooks/use-region-derived-page-numbers";

type ProjectRegionsContentProps = {
	activeAction?: { type: string | null; indexType: string | null };
	onDrawRegion?: () => void;
	onEditRegion?: (regionId: string) => void;
};

export const ProjectRegionsContent = ({
	activeAction,
	onDrawRegion,
	onEditRegion,
}: ProjectRegionsContentProps) => {
	const { projectId } = useProjectContext();
	const utils = trpc.useUtils();
	const setCurrentPage = useSetAtom(currentPageAtom);
	const totalPages = useAtomValue(totalPagesAtom);
	const pdfUrl = useAtomValue(pdfUrlAtom);
	const [regionTypeColorConfig, setRegionTypeColorConfig] = useAtom(
		regionTypeColorConfigAtom,
	);

	// Fetch regions for this project
	const {
		data: regions = [],
		isLoading,
		error,
	} = trpc.region.list.useQuery(
		{ projectId: projectId || "" },
		{ enabled: !!projectId },
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

	// Detect conflicts client-side
	// Only flag conflicts when multiple regions have detected text on the same page
	const conflictsData = useMemo(() => {
		if (!totalPages || regions.length === 0) {
			return [];
		}

		// Convert to CoreRegion type for the utility function
		const coreRegions: Region[] = regions.map((reg) => ({
			...reg,
			createdAt: new Date(reg.createdAt),
		}));

		return detectPageNumberConflicts({
			regions: coreRegions,
			maxPage: totalPages,
			regionDerivedPageNumbers,
		});
	}, [regions, totalPages, regionDerivedPageNumbers]);

	// Build a map of regionId -> conflicting pages
	const conflictsByRegion = useMemo(() => {
		const map = new Map<
			string,
			Array<{ pageNumber: number; conflictsWith: string[] }>
		>();

		for (const conflict of conflictsData) {
			for (const reg of conflict.regions) {
				if (!map.has(reg.id)) {
					map.set(reg.id, []);
				}
				const otherRegionNames = conflict.regions
					.filter((r) => r.id !== reg.id)
					.map((r) => r.name);
				map.get(reg.id)?.push({
					pageNumber: conflict.pageNumber,
					conflictsWith: otherRegionNames,
				});
			}
		}

		return map;
	}, [conflictsData]);

	const deleteRegion = trpc.region.delete.useMutation({
		onSuccess: () => {
			// Invalidate both project and page region queries
			utils.region.list.invalidate({ projectId: projectId || "" });
			utils.region.getForPage.invalidate();
		},
	});

	const toggleVisibility = trpc.region.update.useMutation({
		onSuccess: () => {
			// Invalidate both project and page region queries
			utils.region.list.invalidate({ projectId: projectId || "" });
			utils.region.getForPage.invalidate();
		},
	});

	const handleDelete = async ({ regionId }: { regionId: string }) => {
		if (!confirm("Are you sure you want to delete this region?")) {
			return;
		}

		await deleteRegion.mutateAsync({ id: regionId });
	};

	const handleToggleVisibility = async ({
		regionId,
		visible,
	}: {
		regionId: string;
		visible: boolean;
	}) => {
		await toggleVisibility.mutateAsync({ id: regionId, visible: !visible });
	};

	const getRegionTypeLabel = (type: "exclude" | "page_number") => {
		return type === "exclude" ? "Exclude" : "Page Number";
	};

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
				Error loading regions: {error.message}
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

	const isDrawRegionActive = activeAction?.type === "draw-region";

	return (
		<div className="flex flex-col h-full">
			{/* Header */}
			<div className="p-3 border-b border-gray-200 dark:border-gray-700">
				<StyledButton
					icon={SquareDashedMousePointer}
					label="Draw Region"
					isActive={isDrawRegionActive}
					onClick={() => {
						if (onDrawRegion) {
							onDrawRegion();
						}
					}}
				/>
			</div>

			{/* Color configuration */}
			<div className="p-3 border-b border-gray-200 dark:border-gray-700 space-y-2">
				<div className="flex items-center justify-between gap-3">
					<span className="text-sm font-medium text-gray-700 dark:text-gray-300">
						Exclude Color
					</span>
					<OklchColorPicker
						value={regionTypeColorConfig.exclude}
						onChange={(color) => {
							setRegionTypeColorConfig((prev) => ({
								...prev,
								exclude: color,
							}));
						}}
						label="Exclude region color"
					/>
				</div>
				<div className="flex items-center justify-between gap-3">
					<span className="text-sm font-medium text-gray-700 dark:text-gray-300">
						Page Number Color
					</span>
					<OklchColorPicker
						value={regionTypeColorConfig.page_number}
						onChange={(color) => {
							setRegionTypeColorConfig((prev) => ({
								...prev,
								page_number: color,
							}));
						}}
						label="Page number region color"
					/>
				</div>
			</div>

			{/* Region list */}
			<div className="flex-1 overflow-y-auto">
				{regions.length === 0 ? (
					<div className="p-4 text-sm text-center text-gray-500 dark:text-gray-400">
						No regions yet. Create one to mark regions for ignore or page
						numbers.
					</div>
				) : (
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
											<div className="text-xs text-gray-500 dark:text-gray-500 mb-1">
												{getPageConfigSummary({ region })}
											</div>

											{/* Conflicts Display */}
											{region.regionType === "page_number" &&
												regionNumbersLoading && (
													<div className="mt-1.5 text-xs text-gray-500 dark:text-gray-400 italic">
														Checking for conflicts...
													</div>
												)}
											{region.regionType === "page_number" &&
												!regionNumbersLoading &&
												conflictsByRegion.has(region.id) && (
													<div className="mt-1.5 text-xs">
														<span className="text-gray-600 dark:text-gray-400">
															Conflicts:{" "}
														</span>
														{conflictsByRegion
															.get(region.id)
															?.slice(0, 20)
															.map((conflict, index) => (
																<span key={conflict.pageNumber}>
																	{index > 0 && (
																		<span className="text-gray-500 dark:text-gray-400">
																			,{" "}
																		</span>
																	)}
																	<button
																		type="button"
																		onClick={() =>
																			setCurrentPage(conflict.pageNumber)
																		}
																		className="text-red-600 dark:text-red-400 hover:underline cursor-pointer font-medium"
																		title={`Conflicts with: ${conflict.conflictsWith.join(", ")}`}
																	>
																		{conflict.pageNumber}
																	</button>
																</span>
															))}
														{(conflictsByRegion.get(region.id)?.length || 0) >
															20 && (
															<span className="text-gray-500 dark:text-gray-400">
																, ...
															</span>
														)}
													</div>
												)}
										</div>

										{/* Actions */}
										<div className="flex gap-1">
											<Button
												variant="ghost"
												size="sm"
												onClick={() =>
													handleToggleVisibility({
														regionId: region.id,
														visible: region.visible,
													})
												}
												title={region.visible ? "Hide region" : "Show region"}
											>
												{region.visible ? (
													<Eye className="w-3 h-3" />
												) : (
													<EyeOff className="w-3 h-3" />
												)}
											</Button>
											<Button
												variant="ghost"
												size="sm"
												onClick={() => {
													if (onEditRegion) {
														onEditRegion(region.id);
													}
												}}
												title="Edit region"
											>
												<Edit className="w-3 h-3" />
											</Button>
											<Button
												variant="ghost"
												size="sm"
												onClick={() => handleDelete({ regionId: region.id })}
												title="Delete region"
											>
												<Trash2 className="w-3 h-3" />
											</Button>
										</div>
									</div>
								</div>
							);
						})}
					</div>
				)}
			</div>
		</div>
	);
};
