"use client";

import type { CanonicalPageRule, CanonicalPageSegment } from "@pubint/core";
import { Button } from "@pubint/yabasic/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@pubint/yabasic/components/ui/popover";
import { Edit, FileSymlink, Trash2 } from "lucide-react";

type CanonicalPagesDisplayProps = {
	segments: CanonicalPageSegment[];
	rules: CanonicalPageRule[];
	onEditRule: ({ ruleId }: { ruleId: string }) => void;
	onDeleteRule: ({ ruleId }: { ruleId: string }) => void;
	onNavigateToPage: ({ page }: { page: number }) => void;
	isLoadingRegions?: boolean;
};

export const CanonicalPagesDisplay = ({
	segments,
	rules,
	onEditRule,
	onDeleteRule,
	onNavigateToPage,
	isLoadingRegions = false,
}: CanonicalPagesDisplayProps) => {
	if (isLoadingRegions) {
		return (
			<div className="flex items-center justify-center py-4">
				<div className="flex items-center gap-2 text-sm text-muted-foreground">
					<div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
					<span>Extracting page numbers from regions...</span>
				</div>
			</div>
		);
	}

	return (
		<div className="flex flex-wrap gap-2">
			{segments.map((segment) => {
				// Generate unique key from segment data
				const regionKey = segment.regionIds?.join(",") || "";
				const segmentKey = `${segment.source}-${segment.documentPageRange.start}-${segment.documentPageRange.end}-${segment.ruleId || regionKey}`;

				// Get rule for rule-based segments
				const rule = segment.ruleId
					? rules.find((r) => r.id === segment.ruleId)
					: undefined;

				return (
					<Popover key={segmentKey}>
						<PopoverTrigger
							className={`px-2 py-1 rounded-md text-sm font-medium cursor-pointer hover:opacity-80 transition-opacity ${getPillClasses(segment.color)}`}
						>
							{formatSegmentLabel(segment)}
						</PopoverTrigger>
						<PopoverContent className="w-64">
							<RuleDetailsPopover
								segment={segment}
								rule={rule}
								onEdit={() =>
									segment.ruleId && onEditRule({ ruleId: segment.ruleId })
								}
								onDelete={() =>
									segment.ruleId && onDeleteRule({ ruleId: segment.ruleId })
								}
								onNavigateToPage={() =>
									onNavigateToPage({ page: segment.documentPageRange.start })
								}
							/>
						</PopoverContent>
					</Popover>
				);
			})}
		</div>
	);
};

const getPillClasses = (color: "red" | "blue" | "green" | "gray") => {
	switch (color) {
		case "red": // Unaccounted
			return "bg-red-100 dark:bg-red-900 text-red-900 dark:text-red-100";
		case "blue": // User-defined positive rules
			return "bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100";
		case "green": // Context-derived
			return "bg-green-100 dark:bg-green-900 text-green-900 dark:text-green-100";
		case "gray": // Ignored
			return "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300";
		default:
			return "";
	}
};

const formatSegmentLabel = (segment: CanonicalPageSegment) => {
	const { documentPageRange, canonicalPageRange } = segment;

	// Ignored pages: show document range only
	if (segment.source === "rule-negative") {
		return documentPageRange.start === documentPageRange.end
			? `${documentPageRange.start}`
			: `${documentPageRange.start}-${documentPageRange.end}`;
	}

	// Other segments: show canonical range
	if (canonicalPageRange.start === canonicalPageRange.end) {
		return canonicalPageRange.start;
	}
	return `${canonicalPageRange.start}-${canonicalPageRange.end}`;
};

const RuleDetailsPopover = ({
	segment,
	rule,
	onEdit,
	onDelete,
	onNavigateToPage,
}: {
	segment: CanonicalPageSegment;
	rule?: CanonicalPageRule;
	onEdit: () => void;
	onDelete: () => void;
	onNavigateToPage: () => void;
}) => {
	// Special case for unaccounted pages
	if (segment.source === "unaccounted") {
		return (
			<div className="space-y-3 p-2">
				<div className="flex items-start justify-between gap-2">
					<div className="flex-1">
						<p className="text-xs text-muted-foreground mb-1">Document pages</p>
						<p className="text-sm font-medium">
							{segment.documentPageRange.start}
							{segment.documentPageRange.end !==
								segment.documentPageRange.start &&
								`-${segment.documentPageRange.end}`}
						</p>
					</div>
					<Button
						variant="ghost"
						size="lg"
						onClick={onNavigateToPage}
						title="Go to page"
					>
						<FileSymlink />
					</Button>
				</div>
				<div>
					<p className="text-sm text-red-600 dark:text-red-400 font-medium">
						Unaccounted for document pages: assign canonical page numbers or
						ignore.
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-3 p-2">
			<div className="flex items-start justify-between gap-2">
				<div className="flex-1">
					<p className="text-xs text-muted-foreground mb-1">Document pages</p>
					<p className="text-sm font-medium">
						{segment.documentPageRange.start}
						{segment.documentPageRange.end !==
							segment.documentPageRange.start &&
							`-${segment.documentPageRange.end}`}
					</p>
				</div>
				<Button
					variant="ghost"
					size="lg"
					onClick={onNavigateToPage}
					title="Go to page"
				>
					<FileSymlink />
				</Button>
			</div>

			{segment.source === "rule-negative" ? (
				<div>
					<p className="text-xs text-muted-foreground mb-1">Rule type</p>
					<p className="text-sm font-medium">Ignored</p>
				</div>
			) : segment.source === "region" ? (
				<>
					<div>
						<p className="text-xs text-muted-foreground mb-1">
							Canonical pages
						</p>
						<p className="text-sm font-medium">
							{segment.canonicalPageRange.start}
							{segment.canonicalPageRange.end !==
								segment.canonicalPageRange.start &&
								`-${segment.canonicalPageRange.end}`}
						</p>
					</div>
					<div>
						<p className="text-xs text-muted-foreground mb-1">
							{segment.regionNames && segment.regionNames.length > 1
								? "Regions"
								: "Region"}
						</p>
						<div className="text-sm space-y-1">
							{segment.regionNames && segment.regionNames.length > 0 ? (
								segment.regionNames.map((name) => <p key={name}>{name}</p>)
							) : (
								<p>Unknown region</p>
							)}
						</div>
					</div>
				</>
			) : (
				<div>
					<p className="text-xs text-muted-foreground mb-1">Canonical pages</p>
					<p className="text-sm font-medium">
						{segment.canonicalPageRange.start}
						{segment.canonicalPageRange.end !==
							segment.canonicalPageRange.start &&
							`-${segment.canonicalPageRange.end}`}
					</p>
				</div>
			)}

			{segment.label && (
				<div>
					<p className="text-xs text-muted-foreground mb-1">Label</p>
					<p className="text-sm">{segment.label}</p>
				</div>
			)}

			{rule && (
				<div className="flex gap-2 pt-2 border-t">
					<Button variant="outline" size="xs" onClick={onEdit}>
						<Edit className="w-3 h-3 mr-1" />
						Edit
					</Button>
					<Button
						variant="outline"
						size="xs"
						onClick={onDelete}
						className="text-destructive hover:text-destructive"
					>
						<Trash2 className="w-3 h-3 mr-1" />
						Delete
					</Button>
				</div>
			)}
		</div>
	);
};
