"use client";

import {
	computeCanonicalPages,
	formatCanonicalPagesWithMetadata,
	getCanonicalPagesStatistics,
} from "@pubint/core";
import { Button } from "@pubint/yabasic/components/ui/button";
import { useAtom, useAtomValue } from "jotai";
import { Edit, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { trpc } from "@/app/_common/_utils/trpc";
import {
	currentPageAtom,
	pdfUrlAtom,
	totalPagesAtom,
} from "@/app/projects/[projectDir]/editor/_atoms/editor-atoms";
import { CanonicalPageRuleModal } from "@/app/projects/[projectDir]/editor/_components/canonical-page-rule-modal";
import { CanonicalPagesDisplay } from "@/app/projects/[projectDir]/editor/_components/canonical-pages-display";
import { useProjectContext } from "@/app/projects/[projectDir]/editor/_context/project-context";
import { useContextDerivedPageNumbers } from "@/app/projects/[projectDir]/editor/_hooks/use-context-derived-page-numbers";

export const ProjectPagesContent = () => {
	const { projectId } = useProjectContext();
	const utils = trpc.useUtils();
	const totalPages = useAtomValue(totalPagesAtom);
	const pdfUrl = useAtomValue(pdfUrlAtom);
	const [, setCurrentPage] = useAtom(currentPageAtom);

	const [ruleModalOpen, setRuleModalOpen] = useState(false);
	const [editingRuleId, setEditingRuleId] = useState<string | undefined>();

	// Fetch contexts for this project
	const { data: contexts = [] } = trpc.context.list.useQuery(
		{ projectId: projectId || "" },
		{ enabled: !!projectId },
	);

	// Fetch canonical page rules
	const { data: rules = [], isLoading: rulesLoading } =
		trpc.canonicalPageRule.list.useQuery(
			{ projectId: projectId || "" },
			{ enabled: !!projectId },
		);

	// Delete rule mutation
	const deleteRule = trpc.canonicalPageRule.delete.useMutation({
		onSuccess: () => {
			utils.canonicalPageRule.list.invalidate({ projectId: projectId || "" });
		},
	});

	// Extract context-derived page numbers from PDF
	const { contextDerivedPageNumbers, isLoading: contextNumbersLoading } =
		useContextDerivedPageNumbers({
			contexts,
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
			contexts: contexts.map((ctx) => ({
				...ctx,
				createdAt: new Date(ctx.createdAt),
			})),
			rules: rules.map((rule) => ({
				...rule,
				createdAt: rule.createdAt,
				updatedAt: rule.updatedAt,
			})),
			contextDerivedPageNumbers,
		});
	}, [totalPages, contexts, rules, contextDerivedPageNumbers, projectId]);

	// Get statistics
	const statistics = useMemo(() => {
		return getCanonicalPagesStatistics({ canonicalPagesMap });
	}, [canonicalPagesMap]);

	// Format segments with metadata for pill display
	const segments = useMemo(() => {
		return formatCanonicalPagesWithMetadata({
			canonicalPagesMap,
			rules: rules.map((rule) => ({
				...rule,
				createdAt: rule.createdAt,
				updatedAt: rule.updatedAt,
			})),
			contexts: contexts.map((ctx) => ({
				...ctx,
				createdAt: new Date(ctx.createdAt),
			})),
		});
	}, [canonicalPagesMap, rules, contexts]);

	const handleDelete = async ({ ruleId }: { ruleId: string }) => {
		if (!confirm("Are you sure you want to delete this rule?")) {
			return;
		}
		await deleteRule.mutateAsync({ id: ruleId });
	};

	const handleEdit = ({ ruleId }: { ruleId: string }) => {
		setEditingRuleId(ruleId);
		setRuleModalOpen(true);
	};

	const handleCreateNew = () => {
		setEditingRuleId(undefined);
		setRuleModalOpen(true);
	};

	const handleModalClose = () => {
		setRuleModalOpen(false);
		setEditingRuleId(undefined);
	};

	const handleNavigateToPage = ({ page }: { page: number }) => {
		setCurrentPage(page);
	};

	if (rulesLoading) {
		return (
			<div className="p-4 text-sm text-gray-500 dark:text-gray-400">
				Loading canonical pages...
			</div>
		);
	}

	// Check if conflicts exist (empty map means conflicts)
	const hasConflicts = canonicalPagesMap.size === 0 && totalPages > 0;

	return (
		<div className="p-4 space-y-4">
			{/* Conflict Warning */}
			{hasConflicts && (
				<div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md">
					<p className="text-sm text-red-900 dark:text-red-100 font-semibold mb-1">
						⚠️ Context Conflicts Detected
					</p>
					<p className="text-xs text-red-800 dark:text-red-200">
						Multiple page number contexts apply to some pages. Resolve conflicts
						in the Contexts section before canonical pages can be computed.
					</p>
				</div>
			)}

			{/* Canonical Pages Display */}
			{!hasConflicts && (
				<div className="space-y-2">
					<h3 className="text-sm font-semibold text-foreground">
						Canonical Pages
					</h3>
					<div className="p-3 bg-muted rounded-md">
						<CanonicalPagesDisplay
							segments={segments}
							rules={rules.map((rule) => ({
								...rule,
								createdAt: rule.createdAt,
								updatedAt: rule.updatedAt,
							}))}
							onEditRule={handleEdit}
							onDeleteRule={handleDelete}
							onNavigateToPage={handleNavigateToPage}
							isLoadingContexts={contextNumbersLoading}
						/>
					</div>
				</div>
			)}

			{/* Statistics */}
			{!hasConflicts && (
				<div className="space-y-2">
					<h3 className="text-sm font-semibold text-foreground">Statistics</h3>
					<div className="text-sm space-y-1">
						<div className="flex justify-between">
							<span className="text-muted-foreground">Total pages:</span>
							<span className="font-medium">{statistics.totalPages}</span>
						</div>
						{statistics.unaccountedPages > 0 && (
							<div className="flex justify-between text-red-600 dark:text-red-400">
								<span>Unaccounted:</span>
								<span className="font-medium">
									{statistics.unaccountedPages}
								</span>
							</div>
						)}
						{statistics.contextDerivedPages > 0 && (
							<div className="flex justify-between">
								<span className="text-muted-foreground">Context-derived:</span>
								<span className="font-medium">
									{statistics.contextDerivedPages}
								</span>
							</div>
						)}
						{statistics.userDefinedPositivePages > 0 && (
							<div className="flex justify-between">
								<span className="text-muted-foreground">User-defined:</span>
								<span className="font-medium">
									{statistics.userDefinedPositivePages}
								</span>
							</div>
						)}
						{statistics.userDefinedNegativePages > 0 && (
							<div className="flex justify-between">
								<span className="text-muted-foreground">Ignored:</span>
								<span className="font-medium">
									{statistics.userDefinedNegativePages}
								</span>
							</div>
						)}
					</div>
				</div>
			)}

			{/* Create Rule Button */}
			<div>
				<Button
					onClick={handleCreateNew}
					variant="default"
					size="sm"
					className="w-full"
					disabled={hasConflicts}
				>
					<Plus className="w-4 h-4 mr-2" />
					Create Rule
				</Button>
				{hasConflicts && (
					<p className="text-xs text-muted-foreground mt-1">
						Resolve context conflicts first
					</p>
				)}
			</div>

			{/* Rules List */}
			{rules.length > 0 && (
				<div className="space-y-2">
					<h3 className="text-sm font-semibold text-foreground">
						User-Defined Rules
					</h3>
					<div className="space-y-2">
						{rules.map((rule) => {
							const icon = rule.ruleType === "positive" ? "✅" : "🚫";
							const rangeText = `${rule.documentPageStart}-${rule.documentPageEnd}`;

							let description = "";
							if (rule.ruleType === "positive") {
								if (
									rule.numeralType === "arbitrary" &&
									rule.arbitrarySequence
								) {
									const preview = rule.arbitrarySequence.slice(0, 3).join(", ");
									description = `Define as ${preview}${rule.arbitrarySequence.length > 3 ? "..." : ""}`;
								} else if (rule.startingCanonicalPage) {
									description = `Define as ${rule.startingCanonicalPage}...`;
								}
							} else {
								description = "Ignore";
							}

							return (
								<div
									key={rule.id}
									className="p-3 bg-card border border-border rounded-md"
								>
									<div className="flex items-start justify-between gap-2">
										<div className="flex-1 min-w-0">
											<p className="text-sm font-medium">
												{icon} {rangeText}
											</p>
											<p className="text-xs text-muted-foreground mt-1">
												{description}
											</p>
											{rule.label && (
												<p className="text-xs text-muted-foreground mt-1 italic">
													{rule.label}
												</p>
											)}
										</div>
										<div className="flex gap-1 flex-shrink-0">
											<Button
												variant="ghost"
												size="xs"
												onClick={() => handleEdit({ ruleId: rule.id })}
												title="Edit rule"
											>
												<Edit className="w-3 h-3" />
											</Button>
											<Button
												variant="ghost"
												size="xs"
												onClick={() => handleDelete({ ruleId: rule.id })}
												title="Delete rule"
												className="text-destructive hover:text-destructive"
											>
												<Trash2 className="w-3 h-3" />
											</Button>
										</div>
									</div>
								</div>
							);
						})}
					</div>
				</div>
			)}

			{/* Rule Modal */}
			<CanonicalPageRuleModal
				open={ruleModalOpen}
				onClose={handleModalClose}
				projectId={projectId || ""}
				documentPageCount={totalPages}
				ruleId={editingRuleId}
			/>
		</div>
	);
};
