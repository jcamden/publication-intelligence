"use client";

import { StyledButton, StyledTextButton } from "@pubint/yaboujee";
import { BookOpen, FolderOpen, Plus, ScanSearch, Settings } from "lucide-react";

export type IndexEntryToolbarProps = {
	onCreateEntry: () => void;
	/** When provided, shows "Add Entries From Books" button to the left of Create Entry. */
	onAddEntriesFromBooks?: () => void;
	onCreateGroup?: () => void;
	onMatcherDetection?: () => void;
	onSettings: () => void;
	/** When false, Create Group button is hidden. Default true. */
	groupsEnabled?: boolean;
	/** When null/undefined, Matcher Detection button is hidden. */
	showMatcherDetection?: boolean;
	/** When false, Detect mentions button is disabled. Default true. */
	hasEntriesWithMatchers?: boolean;
};

export const IndexEntryToolbar = ({
	onCreateEntry,
	onAddEntriesFromBooks,
	onCreateGroup,
	onMatcherDetection,
	onSettings,
	groupsEnabled = true,
	showMatcherDetection = false,
	hasEntriesWithMatchers = true,
}: IndexEntryToolbarProps) => {
	const detectDisabled = !hasEntriesWithMatchers;

	const detectButton = showMatcherDetection && onMatcherDetection && (
		<StyledTextButton
			icon={ScanSearch}
			onClick={onMatcherDetection}
			disabled={detectDisabled}
			// tooltip="Detect mentions"
			disabledTooltip="Create an entry with matchers in order to run detection."
			className="!shadow-none"
		>
			Detect mentions
		</StyledTextButton>
	);

	return (
		<div className="flex items-center justify-between">
			<div className="flex items-center gap-2">
				{onAddEntriesFromBooks && (
					<StyledButton
						icon={BookOpen}
						label="Add Entries From Books"
						tooltip="Add Entries From Books"
						isActive={false}
						onClick={onAddEntriesFromBooks}
						className="!shadow-none"
					/>
				)}
				<StyledButton
					icon={Plus}
					label="Create Entry"
					tooltip="Create Entry"
					isActive={false}
					onClick={onCreateEntry}
					className="!shadow-none"
				/>
				{groupsEnabled && onCreateGroup && (
					<StyledButton
						icon={FolderOpen}
						label="Create Group"
						tooltip="Create Group"
						isActive={false}
						onClick={onCreateGroup}
						className="!shadow-none"
					/>
				)}
			</div>
			{detectButton}
			<StyledButton
				icon={Settings}
				label="Settings"
				tooltip="Settings"
				isActive={false}
				onClick={onSettings}
				className="!shadow-none"
			/>
		</div>
	);
};
