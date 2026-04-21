"use client";

import {
	AlertDialog,
	AlertDialogContent,
	AlertDialogFooter,
	AlertDialogTitle,
} from "@pubint/yabasic/components/ui/alert-dialog";
import { Button } from "@pubint/yabasic/components/ui/button";
import { Checkbox } from "@pubint/yabasic/components/ui/checkbox";
import { Label } from "@pubint/yabasic/components/ui/label";
import { useState } from "react";

type EntryRelationshipInfoModalProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onContinue: () => void;
};

const STORAGE_KEY = "hideEntryRelationshipInfo";

export const EntryRelationshipInfoModal = ({
	open,
	onOpenChange,
	onContinue,
}: EntryRelationshipInfoModalProps) => {
	const [dontShowAgain, setDontShowAgain] = useState(false);

	const handleContinue = () => {
		if (dontShowAgain) {
			localStorage.setItem(STORAGE_KEY, "true");
		}
		onOpenChange(false);
		onContinue();
	};

	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent className="max-w-2xl">
				<AlertDialogTitle>Understanding Entry Relationships</AlertDialogTitle>
				<div className="space-y-4 text-sm">
					<div>
						<h4 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-1">
							Delete
						</h4>
						<p className="text-neutral-600 dark:text-neutral-400">
							Permanently removes the entry and all its mentions from the index.
							This action cannot be undone.
						</p>
					</div>

					<div>
						<h4 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-1">
							Merge
						</h4>
						<p className="text-neutral-600 dark:text-neutral-400">
							Combines all matchers and mentions from one entry into another,
							then deletes the source entry. The merged entry will not appear in
							the final index.
						</p>
					</div>

					<div>
						<h4 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-1">
							See
						</h4>
						<p className="text-neutral-600 dark:text-neutral-400">
							Redirects readers to another entry. When you add a "see"
							cross-reference, the entry cannot have mentions—all mentions must
							be transferred to the target entry. Matchers are automatically
							transferred.
						</p>
					</div>

					<div>
						<h4 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-1">
							See also
						</h4>
						<p className="text-neutral-600 dark:text-neutral-400">
							Points readers to related additional information. The entry keeps
							its mentions and matchers, and also shows the cross-reference to
							related entries.
						</p>
					</div>

					<div>
						<h4 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-1">
							q.v. (quod vide - "which see")
						</h4>
						<p className="text-neutral-600 dark:text-neutral-400">
							Inline reference to related concepts. Similar to "see also" but
							used within descriptive text. The entry keeps its mentions and
							matchers.
						</p>
					</div>

					<div className="flex items-center gap-2 pt-2">
						<Checkbox
							id="dont-show-again"
							checked={dontShowAgain}
							onCheckedChange={(checked) => setDontShowAgain(checked === true)}
						/>
						<Label
							htmlFor="dont-show-again"
							className="text-sm font-normal cursor-pointer"
						>
							Don't show this again
						</Label>
					</div>
				</div>

				<AlertDialogFooter>
					<Button onClick={handleContinue} variant="default">
						Continue
					</Button>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
};

export const shouldShowEntryRelationshipInfo = (): boolean => {
	if (typeof window === "undefined") return false;
	return localStorage.getItem(STORAGE_KEY) !== "true";
};
