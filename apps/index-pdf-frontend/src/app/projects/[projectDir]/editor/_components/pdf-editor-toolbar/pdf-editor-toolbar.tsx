"use client";

import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@pubint/yabasic/components/ui/select";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@pubint/yabasic/components/ui/tooltip";
import { PdfViewerToolbar, StyledButton } from "@pubint/yaboujee";
import type { LucideIcon } from "lucide-react";
import {
	Ban,
	BookOpen,
	FileDigit,
	SquareDashedMousePointer,
	Tags,
	TextSelect,
	User,
} from "lucide-react";

export type PdfEditorToolbarProps = {
	// PDF Viewer Toolbar props (pass-through)
	currentPage: number;
	totalPages: number;
	zoom: number;
	onPageChange: ({ page }: { page: number }) => void;
	onZoomChange: ({ zoom }: { zoom: number }) => void;
	pdfVisible: boolean;
	onPdfVisibilityToggle: () => void;
	showPdfToggle: boolean;
	// Editor-specific props
	activeAction: {
		type: "select-text" | "draw-region" | null;
		indexType: string | null;
	};
	selectedType: string;
	onSelectText: () => void;
	onDrawRegion: () => void;
	onTypeChange: (type: string) => void;
	enabledIndexTypes: string[];
};

type RegionTypeOption = {
	value: string;
	label: string;
	icon: LucideIcon;
};

const REGION_TYPE_OPTIONS: RegionTypeOption[] = [
	{ value: "page_number", label: "Page Number", icon: FileDigit },
	{ value: "exclude", label: "Exclude", icon: Ban },
];

const INDEX_TYPE_CONFIG: Record<string, { label: string; icon: LucideIcon }> = {
	subject: { label: "Subject", icon: Tags },
	author: { label: "Author", icon: User },
	scripture: { label: "Scripture", icon: BookOpen },
};

/**
 * PDF Editor Toolbar Component
 *
 * Combines the PDF viewer controls with editor-specific tools:
 * - Select Text button
 * - Draw Region button
 * - Type selector multiselect (Page Number, Exclude, Subject, etc.)
 *
 * Positioned in the center section of the top bar, adjacent to the PDF viewer toolbar.
 */
export const PdfEditorToolbar = ({
	currentPage,
	totalPages,
	zoom,
	onPageChange,
	onZoomChange,
	pdfVisible,
	onPdfVisibilityToggle,
	showPdfToggle,
	activeAction,
	selectedType,
	onSelectText,
	onDrawRegion,
	onTypeChange,
	enabledIndexTypes,
}: PdfEditorToolbarProps) => {
	// Determine if selected type is a region type (exclude or page_number)
	const isRegionType =
		selectedType === "exclude" || selectedType === "page_number";

	// Build options list: region types + enabled index types
	const allOptions: RegionTypeOption[] = [
		...REGION_TYPE_OPTIONS,
		...enabledIndexTypes.map((type) => ({
			value: type,
			label: INDEX_TYPE_CONFIG[type]?.label || type,
			icon: INDEX_TYPE_CONFIG[type]?.icon || Tags,
		})),
	];

	// Get the selected option's icon for display
	const selectedOption = allOptions.find((opt) => opt.value === selectedType);
	const SelectedIcon = selectedOption?.icon;

	return (
		<div className="flex items-center gap-6">
			<PdfViewerToolbar
				currentPage={currentPage}
				totalPages={totalPages}
				zoom={zoom}
				onPageChange={onPageChange}
				onZoomChange={onZoomChange}
				pdfVisible={pdfVisible}
				onPdfVisibilityToggle={onPdfVisibilityToggle}
				showPdfToggle={showPdfToggle}
			/>
			<div className="h-6 w-px bg-neutral-200 dark:bg-neutral-700" />
			<div className="flex items-center gap-2">
				<Tooltip>
					<TooltipTrigger>
						<Select
							value={selectedType}
							onValueChange={(value) => {
								if (typeof value === "string") {
									onTypeChange(value);
								}
							}}
						>
							<SelectTrigger size="lg" className="w-fit min-w-[40px]">
								<SelectValue>
									{SelectedIcon && <SelectedIcon className="h-4 w-4" />}
								</SelectValue>
							</SelectTrigger>
							<SelectContent>
								{allOptions.map((option) => {
									// Disable region types when Select Text is active
									const isRegionOption =
										option.value === "exclude" ||
										option.value === "page_number";
									const isDisabled =
										activeAction.type === "select-text" && isRegionOption;
									const OptionIcon = option.icon;

									return (
										<SelectItem
											key={option.value}
											value={option.value}
											disabled={isDisabled}
										>
											<OptionIcon className="h-4 w-4" />
											{option.label}
										</SelectItem>
									);
								})}
							</SelectContent>
						</Select>
					</TooltipTrigger>
					<TooltipContent>Tool Mode</TooltipContent>
				</Tooltip>
				<StyledButton
					icon={TextSelect}
					label="Select Text"
					isActive={activeAction.type === "select-text"}
					onClick={() => {
						// Don't allow selecting text mode when a region type is selected
						if (!isRegionType) {
							onSelectText();
						}
					}}
					className={isRegionType ? "opacity-50 cursor-not-allowed" : ""}
				/>
				<StyledButton
					icon={SquareDashedMousePointer}
					label="Draw Region"
					isActive={activeAction.type === "draw-region"}
					onClick={onDrawRegion}
				/>
			</div>
		</div>
	);
};
