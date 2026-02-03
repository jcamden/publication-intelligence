"use client";

export type Mention = {
	id: string;
	pageNumber: number;
	text: string;
	entryLabel: string;
	entryId: string;
	indexTypes: string[];
};

export type MentionDetailsPopoverProps = {
	mention: Mention;
	onEdit: ({ mentionId }: { mentionId: string }) => void;
	onDelete: ({ mentionId }: { mentionId: string }) => void;
};

/**
 * Popover for displaying mention details with Edit/Delete actions
 *
 * Shows when clicking an existing highlight in view mode.
 * Allows user to edit the linked IndexEntry or delete the mention.
 *
 * NOTE: This is a pure content component. Positioning is handled by
 * PdfAnnotationPopover wrapper (see Task 4B pattern).
 */
export const MentionDetailsPopover = ({
	mention,
	onEdit,
	onDelete,
}: MentionDetailsPopoverProps) => {
	const truncatedText =
		mention.text.length > 100
			? `${mention.text.substring(0, 100)}...`
			: mention.text;

	return (
		<div className="space-y-3">
			<div>
				<h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
					Highlight Details
				</h3>

				<div className="space-y-2 text-sm">
					<div>
						<span className="text-neutral-600 dark:text-neutral-400">
							Text:{" "}
						</span>
						<span className="text-neutral-900 dark:text-neutral-100">
							"{truncatedText}"
						</span>
					</div>

					<div>
						<span className="text-neutral-600 dark:text-neutral-400">
							Entry:{" "}
						</span>
						<span className="text-neutral-900 dark:text-neutral-100 font-medium">
							{mention.entryLabel}
						</span>
					</div>

					<div>
						<span className="text-neutral-600 dark:text-neutral-400">
							Index Types:{" "}
						</span>
						<span className="text-neutral-900 dark:text-neutral-100 capitalize">
							{mention.indexTypes.join(", ")}
						</span>
					</div>

					<div>
						<span className="text-neutral-600 dark:text-neutral-400">
							Page:{" "}
						</span>
						<span className="text-neutral-900 dark:text-neutral-100">
							{mention.pageNumber}
						</span>
					</div>
				</div>
			</div>

			<div className="flex gap-2 justify-end pt-2 border-t border-neutral-200 dark:border-neutral-700">
				<button
					type="button"
					data-testid="edit-button"
					onClick={() => onEdit({ mentionId: mention.id })}
					className="rounded border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100 dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-700"
				>
					Edit Entry
				</button>
				<button
					type="button"
					data-testid="delete-button"
					onClick={() => onDelete({ mentionId: mention.id })}
					className="rounded bg-red-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600"
				>
					Delete
				</button>
			</div>
		</div>
	);
};
