"use client";

import { Alert, AlertDescription } from "@pubint/yabasic/components/ui/alert";
import { Button } from "@pubint/yabasic/components/ui/button";
import { Field, FieldLabel } from "@pubint/yabasic/components/ui/field";
import { Spinner } from "@pubint/yabasic/components/ui/spinner";
import { Modal } from "@pubint/yaboujee";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { useDeleteEntry } from "@/app/_common/_hooks/use-delete-entry";
import { trpc } from "@/app/_common/_utils/trpc";
import type { IndexEntry } from "../../_types/index-entry";
import { EntryPicker } from "../entry-picker/entry-picker";

export type EntryMergeModalProps = {
	open: boolean;
	onClose: () => void;
	sourceEntry: IndexEntry;
	existingEntries: IndexEntry[];
	projectId: string;
	projectIndexTypeId: string;
	sourceEntryMentionCount?: number;
};

export const EntryMergeModal = ({
	open,
	onClose,
	sourceEntry,
	existingEntries,
	projectId,
	projectIndexTypeId,
	sourceEntryMentionCount = 0,
}: EntryMergeModalProps) => {
	const [targetEntryId, setTargetEntryId] = useState<string | null>(null);
	const [isProcessing, setIsProcessing] = useState(false);

	const deleteEntry = useDeleteEntry();
	const transferMatchers =
		trpc.indexEntry.crossReference.transferMatchers.useMutation();
	const transferMentions =
		trpc.indexEntry.crossReference.transferMentions.useMutation();

	const excludeIds = useMemo(() => {
		const getDescendants = (entryId: string): Set<string> => {
			const descendants = new Set<string>();
			const findChildren = (id: string) => {
				const children = existingEntries.filter((e) => e.parentId === id);
				for (const child of children) {
					descendants.add(child.id);
					findChildren(child.id);
				}
			};
			findChildren(entryId);
			return descendants;
		};
		const descendantIds = getDescendants(sourceEntry.id);
		return [sourceEntry.id, ...descendantIds];
	}, [existingEntries, sourceEntry.id]);

	const targetEntry = useMemo(
		() =>
			targetEntryId
				? (existingEntries.find((e) => e.id === targetEntryId) ?? null)
				: null,
		[existingEntries, targetEntryId],
	);

	const matchers = sourceEntry.metadata?.matchers ?? [];

	const handleMerge = async () => {
		if (!targetEntryId) {
			toast.error("Please select a target entry");
			return;
		}

		setIsProcessing(true);

		try {
			if (matchers.length > 0) {
				await transferMatchers.mutateAsync({
					fromEntryId: sourceEntry.id,
					toEntryId: targetEntryId,
				});
			}

			// Always transfer mentions (backend handles empty case)
			await transferMentions.mutateAsync({
				fromEntryId: sourceEntry.id,
				toEntryId: targetEntryId,
			});

			await new Promise<void>((resolve, reject) => {
				deleteEntry.mutate(
					{
						id: sourceEntry.id,
						projectId,
						projectIndexTypeId,
					},
					{
						onSuccess: () => resolve(),
						onError: (error) => reject(error),
					},
				);
			});

			toast.success(
				`Merged "${sourceEntry.label}" into "${targetEntry?.label}"`,
			);
			onClose();
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : "Unknown error";
			toast.error(`Failed to merge entries: ${errorMessage}`);
		} finally {
			setIsProcessing(false);
		}
	};

	const handleCancel = useCallback(() => {
		setTargetEntryId(null);
		onClose();
	}, [onClose]);

	return (
		<Modal
			open={open}
			onClose={handleCancel}
			title="Merge Entry"
			size="md"
			footer={
				<>
					<Button
						variant="outline"
						onClick={handleCancel}
						disabled={isProcessing}
					>
						Cancel
					</Button>
					<Button
						variant="default"
						onClick={handleMerge}
						disabled={!targetEntryId || isProcessing}
					>
						{isProcessing ? (
							<>
								<Spinner size="sm" className="mr-2" />
								Merging...
							</>
						) : (
							"Merge Entry"
						)}
					</Button>
				</>
			}
		>
			<div className="space-y-4">
				{/* <Alert>
					<AlertCircle className="h-4 w-4" />
					<AlertDescription>
						Select a target entry to merge into. All matchers and mentions from
						"{sourceEntry.label}" will be transferred, and this entry will be
						deleted. This action cannot be undone.
					</AlertDescription>
				</Alert> */}

				<Field>
					<FieldLabel htmlFor="target-entry">Target Entry</FieldLabel>
					<EntryPicker
						id="target-entry"
						entries={existingEntries}
						value={targetEntryId}
						onValueChange={setTargetEntryId}
						placeholder="Select target entry..."
						excludeIds={excludeIds}
					/>
				</Field>

				{targetEntryId && (
					<Alert>
						<AlertDescription>
							<div className="space-y-1">
								<p className="font-semibold">Preview:</p>
								<ul className="list-disc list-inside space-y-1 text-sm">
									<li>
										{
											<>
												Transfer {matchers.length} matcher
												{matchers.length !== 1 ? "s" : ""}
												{matchers.length > 0 ? ": " : ""}
												<div className="pl-8">{matchers.join(", ")}</div>
											</>
										}
									</li>
									<li>
										Transfer {sourceEntryMentionCount} mention
										{sourceEntryMentionCount !== 1 ? "s" : ""}
									</li>
									<li>Delete "{sourceEntry.label}" entry</li>
								</ul>
							</div>
						</AlertDescription>
					</Alert>
				)}
			</div>
		</Modal>
	);
};
