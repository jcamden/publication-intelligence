"use client";

import { Alert, AlertDescription } from "@pubint/yabasic/components/ui/alert";
import { Button } from "@pubint/yabasic/components/ui/button";
import { Field, FieldLabel } from "@pubint/yabasic/components/ui/field";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@pubint/yabasic/components/ui/select";
import { Spinner } from "@pubint/yabasic/components/ui/spinner";
import { Modal } from "@pubint/yaboujee";
import { AlertCircle } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { useDeleteEntry } from "@/app/_common/_hooks/use-delete-entry";
import { trpc } from "@/app/_common/_utils/trpc";
import type { IndexEntry } from "../../_types/index-entry";
import { getEntryDisplayLabel } from "../../_utils/index-entry-utils";

export type EntryMergeModalProps = {
	open: boolean;
	onClose: () => void;
	sourceEntry: IndexEntry;
	existingEntries: IndexEntry[];
	projectId: string;
	projectIndexTypeId: string;
};

export const EntryMergeModal = ({
	open,
	onClose,
	sourceEntry,
	existingEntries,
	projectId,
	projectIndexTypeId,
}: EntryMergeModalProps) => {
	const [targetEntryId, setTargetEntryId] = useState<string | null>(null);
	const [isProcessing, setIsProcessing] = useState(false);

	const deleteEntry = useDeleteEntry();
	const transferMatchers =
		trpc.indexEntry.crossReference.transferMatchers.useMutation();
	const transferMentions =
		trpc.indexEntry.crossReference.transferMentions.useMutation();

	const availableTargets = useMemo(() => {
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
		return existingEntries.filter(
			(e) => e.id !== sourceEntry.id && !descendantIds.has(e.id),
		);
	}, [existingEntries, sourceEntry.id]);

	const targetEntry = useMemo(
		() => availableTargets.find((e) => e.id === targetEntryId),
		[availableTargets, targetEntryId],
	);

	const matcherCount = sourceEntry.metadata?.matchers?.length || 0;

	const handleMerge = async () => {
		if (!targetEntryId) {
			toast.error("Please select a target entry");
			return;
		}

		setIsProcessing(true);

		try {
			if (matcherCount > 0) {
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
				<Alert>
					<AlertCircle className="h-4 w-4" />
					<AlertDescription>
						Select a target entry to merge into. All matchers and mentions from
						"{sourceEntry.label}" will be transferred, and this entry will be
						deleted. This action cannot be undone.
					</AlertDescription>
				</Alert>

				<Field>
					<FieldLabel htmlFor="target-entry">Target Entry</FieldLabel>
					<Select
						value={targetEntryId ?? ""}
						onValueChange={(value) => setTargetEntryId(value || null)}
					>
						<SelectTrigger id="target-entry" className="w-full">
							<SelectValue placeholder="Select target entry..." />
						</SelectTrigger>
						<SelectContent>
							{availableTargets.map((entry) => (
								<SelectItem key={entry.id} value={entry.id}>
									{getEntryDisplayLabel({
										entry,
										entries: existingEntries,
									})}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</Field>

				{targetEntryId && (
					<Alert>
						<AlertDescription>
							<div className="space-y-1">
								<p className="font-semibold">Preview:</p>
								<ul className="list-disc list-inside space-y-1 text-sm">
									<li>
										{matcherCount} matcher{matcherCount !== 1 ? "s" : ""} will
										be transferred
									</li>
									<li>All mentions will be transferred</li>
									<li>"{sourceEntry.label}" will be deleted</li>
								</ul>
							</div>
						</AlertDescription>
					</Alert>
				)}
			</div>
		</Modal>
	);
};
