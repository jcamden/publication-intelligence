"use client";

import { Button } from "@pubint/yabasic/components/ui/button";
import { Modal } from "@pubint/yaboujee";
import { Loader2 } from "lucide-react";

export type BootstrapConflictEntry = {
	slug: string;
	label: string;
	currentGroupName: string;
	newGroupName: string;
};

export type BootstrapConfirmationDialogProps = {
	open: boolean;
	onClose: () => void;
	onConfirm: (conflictResolution: "leave" | "transfer") => void;
	isPending: boolean;
	/** Selected canon label for display */
	canonLabel: string | null;
	/** Enabled corpus names */
	enabledCorpora: string[];
	/** Count of extra books selected */
	extraBookCount: number;
	/** When present, show conflict resolution UI */
	conflictingEntries?: BootstrapConflictEntry[];
};

const CORPUS_LABELS: Record<string, string> = {
	apocrypha: "Apocrypha",
	jewishWritings: "Jewish Writings",
	classicalWritings: "Classical Writings",
	christianWritings: "Christian Writings",
	deadSeaScrolls: "Dead Sea Scrolls",
};

export const BootstrapConfirmationDialog = ({
	open,
	onClose,
	onConfirm,
	isPending,
	canonLabel,
	enabledCorpora,
	extraBookCount,
	conflictingEntries = [],
}: BootstrapConfirmationDialogProps) => {
	const corpusLabels = enabledCorpora.map((c) => CORPUS_LABELS[c] ?? c);
	const hasConflicts = conflictingEntries.length > 0;

	return (
		<Modal
			open={open}
			onClose={onClose}
			title="Adding entries from books"
			size="lg"
			showCloseButton={true}
			footer={
				<>
					<Button variant="outline" onClick={onClose} disabled={isPending}>
						Cancel
					</Button>
					{hasConflicts ? (
						<>
							<Button
								variant="outline"
								onClick={() => onConfirm("leave")}
								disabled={isPending}
							>
								Leave in current groups
							</Button>
							<Button
								onClick={() => onConfirm("transfer")}
								disabled={isPending}
							>
								{isPending ? (
									<>
										<Loader2 className="mr-2 size-4 animate-spin" />
										Adding...
									</>
								) : (
									"Transfer to new group"
								)}
							</Button>
						</>
					) : (
						<Button onClick={() => onConfirm("transfer")} disabled={isPending}>
							{isPending ? (
								<>
									<Loader2 className="mr-2 size-4 animate-spin" />
									Adding entries...
								</>
							) : (
								"Add entries"
							)}
						</Button>
					)}
				</>
			}
		>
			<div className="space-y-4">
				<p className="text-sm text-muted-foreground">
					{hasConflicts
						? `${conflictingEntries.length} entries already exist in other groups. Choose how to proceed:`
						: "This will seed index entries and matchers based on your selection. Existing entries and groups will be preserved; adding entries from books is additive."}
				</p>
				{hasConflicts && (
					<div className="rounded-md border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/30 p-3 space-y-2 max-h-32 overflow-y-auto">
						<p className="text-sm font-medium text-amber-800 dark:text-amber-200">
							Conflicting entries
						</p>
						<ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1">
							{conflictingEntries.slice(0, 10).map((e) => (
								<li key={e.slug}>
									{e.label} (in {e.currentGroupName} → {e.newGroupName})
								</li>
							))}
							{conflictingEntries.length > 10 && (
								<li className="text-muted-foreground">
									...and {conflictingEntries.length - 10} more
								</li>
							)}
						</ul>
					</div>
				)}
				<dl className="space-y-2 text-sm">
					{canonLabel && (
						<div>
							<dt className="font-medium text-muted-foreground">Canon</dt>
							<dd>{canonLabel}</dd>
						</div>
					)}
					{corpusLabels.length > 0 && (
						<div>
							<dt className="font-medium text-muted-foreground">
								Additional corpora
							</dt>
							<dd>{corpusLabels.join(", ")}</dd>
						</div>
					)}
					{extraBookCount > 0 && (
						<div>
							<dt className="font-medium text-muted-foreground">Extra books</dt>
							<dd>{extraBookCount} selected</dd>
						</div>
					)}
				</dl>
			</div>
		</Modal>
	);
};
