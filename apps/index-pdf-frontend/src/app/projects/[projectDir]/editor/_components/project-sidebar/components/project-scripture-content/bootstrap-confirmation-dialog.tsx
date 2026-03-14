"use client";

import { Button } from "@pubint/yabasic/components/ui/button";
import { Modal } from "@pubint/yaboujee";
import { Loader2 } from "lucide-react";

export type BootstrapConfirmationDialogProps = {
	open: boolean;
	onClose: () => void;
	onConfirm: () => void;
	isPending: boolean;
	/** Selected canon label for display */
	canonLabel: string | null;
	/** Enabled corpus names */
	enabledCorpora: string[];
	/** Count of extra books selected */
	extraBookCount: number;
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
}: BootstrapConfirmationDialogProps) => {
	const corpusLabels = enabledCorpora.map((c) => CORPUS_LABELS[c] ?? c);

	return (
		<Modal
			open={open}
			onClose={onClose}
			title="Bootstrap Scripture Data"
			size="md"
			showCloseButton={true}
			footer={
				<>
					<Button variant="outline" onClick={onClose} disabled={isPending}>
						Cancel
					</Button>
					<Button onClick={onConfirm} disabled={isPending}>
						{isPending ? (
							<>
								<Loader2 className="mr-2 size-4 animate-spin" />
								Bootstrapping...
							</>
						) : (
							"Bootstrap"
						)}
					</Button>
				</>
			}
		>
			<div className="space-y-4">
				<p className="text-sm text-muted-foreground">
					This will seed index entries and matchers based on your selection.
					Existing entries and groups will be preserved; bootstrap is additive.
				</p>
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
