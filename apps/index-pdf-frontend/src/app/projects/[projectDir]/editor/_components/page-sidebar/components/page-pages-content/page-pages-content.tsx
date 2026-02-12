"use client";

import {
	computeCanonicalPages,
	detectNumeralType,
	getCanonicalPageForPage,
} from "@pubint/core";
import { Button } from "@pubint/yabasic/components/ui/button";
import { Input } from "@pubint/yabasic/components/ui/input";
import { useAtomValue } from "jotai";
import { Edit, EyeOff, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { trpc } from "@/app/_common/_utils/trpc";
import {
	currentPageAtom,
	pdfUrlAtom,
	totalPagesAtom,
} from "@/app/projects/[projectDir]/editor/_atoms/editor-atoms";
import { CanonicalPageRuleModal } from "@/app/projects/[projectDir]/editor/_components/canonical-page-rule-modal";
import { useProjectContext } from "@/app/projects/[projectDir]/editor/_context/project-context";
import { useRegionDerivedPageNumbers } from "@/app/projects/[projectDir]/editor/_hooks/use-region-derived-page-numbers";

export const PagePagesContent = () => {
	const { projectId } = useProjectContext();
	const utils = trpc.useUtils();
	const currentPage = useAtomValue(currentPageAtom);
	const totalPages = useAtomValue(totalPagesAtom);
	const pdfUrl = useAtomValue(pdfUrlAtom);

	const [quickCreateValue, setQuickCreateValue] = useState("");
	const [ruleModalOpen, setRuleModalOpen] = useState(false);
	const [editingRuleId, setEditingRuleId] = useState<string | undefined>();

	// Fetch regions
	const { data: regions = [] } = trpc.region.list.useQuery(
		{ projectId: projectId || "" },
		{ enabled: !!projectId },
	);

	// Fetch rules
	const { data: rules = [] } = trpc.canonicalPageRule.list.useQuery(
		{ projectId: projectId || "" },
		{ enabled: !!projectId },
	);

	// Delete rule mutation
	const deleteRule = trpc.canonicalPageRule.delete.useMutation({
		onSuccess: () => {
			utils.canonicalPageRule.list.invalidate({ projectId: projectId || "" });
		},
	});

	// Create rule mutation (for quick create)
	const createRule = trpc.canonicalPageRule.create.useMutation({
		onSuccess: () => {
			utils.canonicalPageRule.list.invalidate({ projectId: projectId || "" });
			setQuickCreateValue("");
		},
	});

	// Extract region-derived page numbers from PDF
	const { regionDerivedPageNumbers } = useRegionDerivedPageNumbers({
		regions,
		pdfUrl: pdfUrl || undefined,
		totalPages,
		enabled: totalPages > 0 && !!pdfUrl,
		projectId: projectId || undefined,
	});

	// Compute canonical pages
	const canonicalPagesMap = useMemo(() => {
		if (!totalPages || !projectId) return new Map();

		return computeCanonicalPages({
			documentPageCount: totalPages,
			regions: regions.map((reg) => ({
				...reg,
				createdAt: new Date(reg.createdAt),
			})),
			rules: rules.map((rule) => ({
				...rule,
				createdAt: rule.createdAt,
				updatedAt: rule.updatedAt,
			})),
			regionDerivedPageNumbers,
		});
	}, [totalPages, regions, rules, regionDerivedPageNumbers, projectId]);

	// Get info for current page
	const pageInfo = useMemo(() => {
		return getCanonicalPageForPage({
			documentPage: currentPage,
			canonicalPagesMap,
		});
	}, [currentPage, canonicalPagesMap]);

	// Find rule for current page
	const currentPageRule = useMemo(() => {
		return rules.find(
			(rule) =>
				currentPage >= rule.documentPageStart &&
				currentPage <= rule.documentPageEnd,
		);
	}, [rules, currentPage]);

	// Find region-derived for current page
	const regionDerived = useMemo(() => {
		return regionDerivedPageNumbers.find(
			(derived) => derived.documentPage === currentPage,
		);
	}, [regionDerivedPageNumbers, currentPage]);

	const handleQuickCreate = async () => {
		if (!quickCreateValue.trim() || !projectId) return;

		const numeralType = detectNumeralType({ page: quickCreateValue.trim() });

		await createRule.mutateAsync({
			projectId,
			ruleType: "positive",
			documentPageStart: currentPage,
			documentPageEnd: currentPage,
			numeralType: numeralType === "arbitrary" ? "arbitrary" : numeralType,
			...(numeralType === "arbitrary"
				? { arbitrarySequence: [quickCreateValue.trim()] }
				: { startingCanonicalPage: quickCreateValue.trim() }),
		});
	};

	const handleDelete = async () => {
		if (!currentPageRule) return;
		if (!confirm("Are you sure you want to delete this rule?")) return;
		await deleteRule.mutateAsync({ id: currentPageRule.id });
	};

	const handleEdit = () => {
		if (!currentPageRule) return;
		setEditingRuleId(currentPageRule.id);
		setRuleModalOpen(true);
	};

	const handleIgnorePage = async () => {
		if (!projectId) return;
		await createRule.mutateAsync({
			projectId,
			ruleType: "negative",
			documentPageStart: currentPage,
			documentPageEnd: currentPage,
			numeralType: "arabic",
		});
	};

	const hasConflicts = canonicalPagesMap.size === 0 && totalPages > 0;

	if (hasConflicts) {
		return (
			<div className="p-4">
				<div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md">
					<p className="text-sm text-red-900 dark:text-red-100 font-semibold mb-1">
						⚠️ Region Conflicts
					</p>
					<p className="text-xs text-red-800 dark:text-red-200">
						Resolve region conflicts in the Regions section before canonical
						pages can be displayed.
					</p>
				</div>
			</div>
		);
	}

	const colorClasses = {
		red: "text-red-600 dark:text-red-400",
		blue: "text-blue-600 dark:text-blue-400",
		green: "text-green-600 dark:text-green-400",
		gray: "text-gray-500 dark:text-gray-400",
	};

	return (
		<div className="p-4 space-y-4">
			{/* Document Page Number */}
			<div>
				<p className="text-xs text-muted-foreground mb-1">Document page</p>
				<p className="text-lg font-semibold">{currentPage}</p>
			</div>

			{/* Region-Derived Page Number */}
			{regionDerived && (
				<div>
					<p className="text-xs text-muted-foreground mb-1">Region-derived</p>
					<p
						className={`text-lg font-semibold ${
							currentPageRule ? "line-through opacity-50" : ""
						} ${colorClasses.blue}`}
					>
						{regionDerived.canonicalPage} 🔵
					</p>
					<p className="text-xs text-muted-foreground mt-1">
						from "{regionDerived.regionName}"
					</p>
					{currentPageRule && (
						<p className="text-xs text-muted-foreground mt-1 italic">
							(overridden by user rule)
						</p>
					)}
				</div>
			)}

			{/* User-Defined Rule */}
			{currentPageRule && (
				<div>
					<p className="text-xs text-muted-foreground mb-1">
						User-defined rule
					</p>
					{currentPageRule.ruleType === "negative" ? (
						<p className={`text-lg font-semibold ${colorClasses.gray}`}>
							Ignored ⚪
						</p>
					) : (
						<p className={`text-lg font-semibold ${colorClasses.green}`}>
							{pageInfo?.canonicalPage} 🟢
						</p>
					)}
					<p className="text-xs text-muted-foreground mt-1">
						from "Rule: {currentPageRule.documentPageStart}-
						{currentPageRule.documentPageEnd}
						{currentPageRule.label && ` (${currentPageRule.label})`}"
					</p>
					<div className="flex gap-2 mt-2">
						<Button variant="outline" size="xs" onClick={handleEdit}>
							<Edit className="w-3 h-3 mr-1" />
							Edit
						</Button>
						<Button
							variant="outline"
							size="xs"
							onClick={handleDelete}
							className="text-destructive hover:text-destructive"
						>
							<Trash2 className="w-3 h-3 mr-1" />
							Delete
						</Button>
					</div>
				</div>
			)}

			{/* Quick Rule Creation */}
			{!currentPageRule && (
				<div className="space-y-3">
					<div>
						<p className="text-xs text-muted-foreground mb-2">
							Index as canonical page
						</p>
						<div className="flex gap-2">
							<Input
								value={quickCreateValue}
								onChange={(e) => setQuickCreateValue(e.target.value)}
								placeholder="e.g., 23, v, 10a"
								className="flex-1"
								onKeyDown={(e) => {
									if (e.key === "Enter") {
										handleQuickCreate();
									}
								}}
							/>
							<Button
								onClick={handleQuickCreate}
								size="sm"
								disabled={!quickCreateValue.trim() || createRule.isPending}
							>
								Create
							</Button>
						</div>
						<p className="text-xs text-muted-foreground mt-1">
							Creates a rule for this page only
						</p>
					</div>

					<div>
						<Button
							onClick={handleIgnorePage}
							variant="outline"
							size="sm"
							disabled={createRule.isPending}
							className="w-full"
						>
							<EyeOff className="w-3 h-3 mr-1" />
							Ignore this page
						</Button>
						<p className="text-xs text-muted-foreground mt-1">
							Excludes this page from canonical numbering
						</p>
					</div>
				</div>
			)}

			{/* Final Canonical Page */}
			<div className="border-t pt-4">
				<p className="text-xs text-muted-foreground mb-1">Canonical page</p>
				{pageInfo ? (
					pageInfo.source === "rule-negative" ? (
						<p className={`text-xl font-bold ${colorClasses.gray}`}>
							(not indexed)
						</p>
					) : (
						<p className={`text-xl font-bold ${colorClasses[pageInfo.color]}`}>
							{pageInfo.canonicalPage}
						</p>
					)
				) : (
					<p className="text-xl font-bold text-muted-foreground">—</p>
				)}
			</div>

			{/* Rule Modal */}
			<CanonicalPageRuleModal
				open={ruleModalOpen}
				onClose={() => {
					setRuleModalOpen(false);
					setEditingRuleId(undefined);
				}}
				projectId={projectId || ""}
				documentPageCount={totalPages}
				ruleId={editingRuleId}
			/>
		</div>
	);
};
