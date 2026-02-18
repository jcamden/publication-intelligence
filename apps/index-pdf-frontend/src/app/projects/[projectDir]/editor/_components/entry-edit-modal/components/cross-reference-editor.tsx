"use client";

import { Button } from "@pubint/yabasic/components/ui/button";
import { Input } from "@pubint/yabasic/components/ui/input";
import { Label } from "@pubint/yabasic/components/ui/label";
import {
	RadioGroup,
	RadioGroupItem,
} from "@pubint/yabasic/components/ui/radio-group";
import { SmartSelect } from "@pubint/yabasic/components/ui/smart-select";
import { X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/app/_common/_utils/trpc";
import type { CrossReference } from "@/app/_common/_utils/trpc-types";
import type { IndexEntry } from "../../../_types/index-entry";
import {
	formatSingleCrossReferenceLabel,
	getDirectiveForSingleRef,
} from "../../../_utils/cross-reference-utils";
import { getEntryDisplayLabel } from "../../../_utils/index-entry-utils";
import { EntryPicker } from "../../entry-picker/entry-picker";

type CrossReferenceEditorProps = {
	entryId: string;
	crossReferences: CrossReference[];
	existingEntries: IndexEntry[];
	mentionCount: number;
	projectId: string;
	onUpdate: () => void;
};

export const CrossReferenceEditor = ({
	entryId,
	crossReferences,
	existingEntries,
	mentionCount,
	projectId,
	onUpdate,
}: CrossReferenceEditorProps) => {
	const [relationType, setRelationType] = useState<"see" | "see_also" | "qv">(
		"see_also",
	);
	const [targetMode, setTargetMode] = useState<"entry" | "arbitrary">("entry");
	const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
	const [arbitraryText, setArbitraryText] = useState("");
	const [mentionAction, setMentionAction] = useState<"transfer" | "delete">(
		"transfer",
	);

	const deleteCrossReference =
		trpc.indexEntry.crossReference.delete.useMutation({
			onSuccess: () => {
				toast.success("Cross-reference deleted");
				onUpdate();
			},
			onError: (error) => {
				toast.error(`Failed to delete cross-reference: ${error.message}`);
			},
		});

	const createCrossReference =
		trpc.indexEntry.crossReference.create.useMutation({
			onSuccess: () => {
				toast.success("Cross-reference created");
				resetForm();
				onUpdate();
			},
			onError: (error) => {
				toast.error(`Failed to create cross-reference: ${error.message}`);
			},
		});

	const transferMentions =
		trpc.indexEntry.crossReference.transferMentions.useMutation();

	const deleteAllMentions = trpc.indexMention.deleteAllByEntry.useMutation();

	const availableEntries = existingEntries.filter((e) => e.id !== entryId);

	const handleDelete = (crossRefId: string) => {
		deleteCrossReference.mutate({ id: crossRefId });
	};

	const handleAdd = async () => {
		if (targetMode === "entry") {
			if (!selectedEntryId) {
				toast.error("Please select an entry");
				return;
			}

			if (relationType === "see" && mentionCount > 0) {
				if (mentionAction === "transfer") {
					await transferMentions.mutateAsync({
						fromEntryId: entryId,
						toEntryId: selectedEntryId,
					});
				} else {
					await deleteAllMentions.mutateAsync({
						entryId,
						projectId,
					});
				}
			}

			createCrossReference.mutate({
				fromEntryId: entryId,
				toEntryId: selectedEntryId,
				relationType,
			});
		} else {
			const value = arbitraryText.trim();
			if (!value) {
				toast.error("Please enter the cross-reference text");
				return;
			}
			createCrossReference.mutate({
				fromEntryId: entryId,
				arbitraryValue: value,
				relationType,
			});
		}
	};

	const resetForm = () => {
		setSelectedEntryId(null);
		setArbitraryText("");
		setRelationType("see_also");
		setTargetMode("entry");
		setMentionAction("transfer");
	};

	const canAdd =
		targetMode === "entry" ? !!selectedEntryId : !!arbitraryText.trim();

	return (
		<div className="space-y-4">
			{/* Existing Cross-References */}
			{crossReferences.length > 0 && (
				<div>
					<Label className="text-sm font-medium mb-2">
						Existing Cross-References
					</Label>
					<div className="space-y-2">
						{crossReferences.map((crossRef) => {
							const label = formatSingleCrossReferenceLabel({
								ref: crossRef,
								allEntries: existingEntries,
							});
							const directive = getDirectiveForSingleRef({
								ref: crossRef,
								allEntries: existingEntries,
							});
							const afterDirective =
								label.length > directive.length
									? label.slice(directive.length)
									: "";
							return (
								<div
									key={crossRef.id}
									className="flex items-start justify-between p-3 border rounded-lg bg-neutral-50 dark:bg-neutral-900"
								>
									<div className="flex-1">
										<p className="text-sm font-medium">
											<em>{directive}</em>
											{afterDirective}
										</p>
									</div>
									<button
										type="button"
										onClick={() => handleDelete(crossRef.id)}
										className="ml-2 p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded transition-colors"
										aria-label="Delete cross-reference"
										disabled={deleteCrossReference.isPending}
									>
										<X className="w-4 h-4" />
									</button>
								</div>
							);
						})}
					</div>
				</div>
			)}

			{/* Add New Cross-Reference */}
			<div className="border-t pt-4">
				<Label className="text-sm font-medium mb-3">Add Cross-Reference</Label>

				{/* Type Selector */}
				<div className="mb-4">
					<Label
						htmlFor="relation-type"
						className="text-xs text-neutral-600 dark:text-neutral-400 mb-2"
					>
						Type
					</Label>
					<SmartSelect
						id="relation-type"
						value={relationType}
						onValueChange={(v) =>
							setRelationType(v as "see" | "see_also" | "qv")
						}
						items={[
							{ value: "see", label: "See" },
							{ value: "see_also", label: "See also" },
							{ value: "qv", label: "q.v." },
						]}
					/>
				</div>

				{/* Existing Mentions Action (for "see" type with entry target only) */}
				{relationType === "see" &&
					targetMode === "entry" &&
					mentionCount > 0 && (
						<div className="mb-4">
							<Label className="text-xs text-neutral-600 dark:text-neutral-400 mb-2">
								Existing Mentions ({mentionCount})
							</Label>
							<RadioGroup
								value={mentionAction}
								onValueChange={(v) =>
									setMentionAction(v as "transfer" | "delete")
								}
							>
								<label
									htmlFor="mention-transfer"
									className="flex items-center space-x-2 cursor-pointer"
								>
									<RadioGroupItem value="transfer" id="mention-transfer" />
									<span className="text-sm">
										Transfer
										{selectedEntryId &&
											(() => {
												const targetEntry = existingEntries.find(
													(e) => e.id === selectedEntryId,
												);
												if (!targetEntry) return null;
												return (
													<span className="text-neutral-500 dark:text-neutral-400">
														{" "}
														to{" "}
														{getEntryDisplayLabel({
															entry: targetEntry,
															entries: existingEntries,
														})}
													</span>
												);
											})()}
									</span>
								</label>
								<label
									htmlFor="mention-delete"
									className="flex items-center space-x-2 cursor-pointer"
								>
									<RadioGroupItem value="delete" id="mention-delete" />
									<span className="text-sm">Delete</span>
								</label>
							</RadioGroup>
						</div>
					)}

				<div className="mb-4">
					<Label className="text-xs text-neutral-600 dark:text-neutral-400 mb-2">
						Target
					</Label>
					<RadioGroup
						value={targetMode}
						onValueChange={(v) => setTargetMode(v as "entry" | "arbitrary")}
						className="flex gap-4 mb-2"
					>
						<label
							htmlFor="target-entry"
							className="flex items-center gap-2 cursor-pointer"
						>
							<RadioGroupItem value="entry" id="target-entry" />
							<span className="text-sm">Index entry</span>
						</label>
						<label
							htmlFor="target-arbitrary"
							className="flex items-center gap-2 cursor-pointer"
						>
							<RadioGroupItem value="arbitrary" id="target-arbitrary" />
							<span className="text-sm">
								Arbitrary text (e.g. Notes sections)
							</span>
						</label>
					</RadioGroup>
					{targetMode === "entry" ? (
						<EntryPicker
							id="entry-select"
							entries={availableEntries}
							value={selectedEntryId}
							onValueChange={setSelectedEntryId}
							placeholder="Search entries..."
							excludeIds={[entryId]}
						/>
					) : (
						<Input
							id="arbitrary-value"
							value={arbitraryText}
							onChange={(e) => setArbitraryText(e.target.value)}
							placeholder="e.g. Notes sections"
						/>
					)}
				</div>

				{/* Add Button */}
				<Button
					type="button"
					onClick={handleAdd}
					disabled={
						!canAdd ||
						createCrossReference.isPending ||
						transferMentions.isPending
					}
				>
					{createCrossReference.isPending || transferMentions.isPending
						? "Adding..."
						: "Add Cross-Reference"}
				</Button>
			</div>
		</div>
	);
};
