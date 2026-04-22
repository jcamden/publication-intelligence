"use client";

import { Checkbox } from "@pubint/yabasic/components/ui/checkbox";
import { Modal } from "@pubint/yaboujee";

type IndexPageSettingsModalProps = {
	open: boolean;
	onClose: () => void;
	enabledIndexTypes: string[];
	showBooksWithNoMentions: boolean;
	onShowBooksWithNoMentionsChange: (value: boolean) => void;
};

export const IndexPageSettingsModal = ({
	open,
	onClose,
	enabledIndexTypes,
	showBooksWithNoMentions,
	onShowBooksWithNoMentionsChange,
}: IndexPageSettingsModalProps) => {
	const hasScripture = enabledIndexTypes.includes("scripture");

	return (
		<Modal
			open={open}
			onClose={onClose}
			title="Index settings"
			size="sm"
			showCloseButton
		>
			<div className="space-y-6">
				{hasScripture && (
					<section className="space-y-3">
						<h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
							Scripture index
						</h3>
						<label
							htmlFor="show-books-no-mentions"
							className="flex items-center gap-2 cursor-pointer"
						>
							<Checkbox
								id="show-books-no-mentions"
								checked={showBooksWithNoMentions}
								onCheckedChange={(checked) =>
									onShowBooksWithNoMentionsChange(checked === true)
								}
							/>
							<span className="text-sm text-neutral-900 dark:text-neutral-100">
								Display books with no mentions
							</span>
						</label>
					</section>
				)}
			</div>
		</Modal>
	);
};
