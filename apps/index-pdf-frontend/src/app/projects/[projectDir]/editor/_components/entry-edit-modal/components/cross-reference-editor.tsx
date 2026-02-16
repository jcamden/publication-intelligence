"use client";

import { Badge } from "@pubint/yabasic/components/ui/badge";
import { Button } from "@pubint/yabasic/components/ui/button";
import { Input } from "@pubint/yabasic/components/ui/input";
import { Label } from "@pubint/yabasic/components/ui/label";
import {
	RadioGroup,
	RadioGroupItem,
} from "@pubint/yabasic/components/ui/radio-group";
import { SmartSelect } from "@pubint/yabasic/components/ui/smart-select";
import { Textarea } from "@pubint/yabasic/components/ui/textarea";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/app/_common/_utils/trpc";
import type { CrossReference } from "@/app/_common/_utils/trpc-types";
import type { IndexEntry } from "../../../_types/index-entry";
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
	const [referenceMode, setReferenceMode] = useState<"entry" | "custom">(
		"entry",
	);
	const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
	const [customText, setCustomText] = useState("");
	const [note, setNote] = useState("");
	const [mentionAction, setMentionAction] = useState<"transfer" | "delete">(
		"transfer",
	);

	// Auto-switch to "delete" when switching to custom mode with transfer selected
	useEffect(() => {
		if (referenceMode === "custom" && mentionAction === "transfer") {
			setMentionAction("delete");
		}
	}, [referenceMode, mentionAction]);

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
		if (referenceMode === "entry" && !selectedEntryId) {
			toast.error("Please select an entry");
			return;
		}

		if (referenceMode === "custom" && !customText.trim()) {
			toast.error("Please enter custom text");
			return;
		}

		// If creating a "see" reference with existing mentions, handle them first
		if (relationType === "see" && mentionCount > 0 && selectedEntryId) {
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

		// Create the cross-reference
		createCrossReference.mutate({
			fromEntryId: entryId,
			toEntryId:
				referenceMode === "entry" && selectedEntryId
					? selectedEntryId
					: undefined,
			arbitraryValue:
				referenceMode === "custom" ? customText.trim() : undefined,
			relationType,
			note: note.trim() || undefined,
		});
	};

	const resetForm = () => {
		setSelectedEntryId(null);
		setCustomText("");
		setNote("");
		setReferenceMode("entry");
		setRelationType("see_also");
		setMentionAction("transfer");
	};

	const relationTypeLabels = {
		see: "See",
		see_also: "See also",
		qv: "q.v.",
	};

	return (
		<div className="space-y-4">
			{/* Existing Cross-References */}
			{crossReferences.length > 0 && (
				<div>
					<Label className="text-sm font-medium mb-2">
						Existing Cross-References
					</Label>
					<div className="space-y-2">
						{crossReferences.map((crossRef) => (
							<div
								key={crossRef.id}
								className="flex items-start justify-between p-3 border rounded-lg bg-neutral-50 dark:bg-neutral-900"
							>
								<div className="flex-1">
									<div className="flex items-center gap-2 mb-1">
										<Badge variant="outline" className="text-xs">
											{relationTypeLabels[crossRef.relationType]}
										</Badge>
										<span className="text-sm font-medium">
											{crossRef.toEntry
												? (() => {
														const targetEntry = existingEntries.find(
															(e) => e.id === crossRef.toEntry?.id,
														);
														return targetEntry
															? getEntryDisplayLabel({
																	entry: targetEntry,
																	entries: existingEntries,
																})
															: crossRef.toEntry.label;
													})()
												: crossRef.arbitraryValue}
										</span>
									</div>
									{crossRef.note && (
										<p className="text-xs text-neutral-600 dark:text-neutral-400">
											{crossRef.note}
										</p>
									)}
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
						))}
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

				{/* Existing Mentions Action (for "see" type only) */}
				{relationType === "see" && mentionCount > 0 && (
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
								<RadioGroupItem
									value="transfer"
									id="mention-transfer"
									disabled={referenceMode === "custom"}
								/>
								<span
									className={`text-sm ${referenceMode === "custom" ? "text-neutral-400 dark:text-neutral-600" : ""}`}
								>
									Transfer
									{referenceMode === "entry" &&
										selectedEntryId &&
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

				{/* Reference Mode Radio */}
				<div className="mb-4">
					<RadioGroup
						value={referenceMode}
						onValueChange={(v) => setReferenceMode(v as "entry" | "custom")}
					>
						<label
							htmlFor="mode-entry"
							className="flex items-center space-x-2 cursor-pointer"
						>
							<RadioGroupItem value="entry" id="mode-entry" />
							<span className="text-sm">Reference an entry</span>
						</label>
						<label
							htmlFor="mode-custom"
							className="flex items-center space-x-2 cursor-pointer"
						>
							<RadioGroupItem value="custom" id="mode-custom" />
							<span className="text-sm">Custom text</span>
						</label>
					</RadioGroup>
				</div>

				{/* Entry Picker Mode */}
				{referenceMode === "entry" && (
					<div className="mb-4">
						<Label
							htmlFor="entry-select"
							className="text-xs text-neutral-600 dark:text-neutral-400 mb-2"
						>
							Select Entry
						</Label>
						<EntryPicker
							id="entry-select"
							entries={availableEntries}
							value={selectedEntryId}
							onValueChange={setSelectedEntryId}
							placeholder="Search entries..."
							excludeIds={[entryId]}
						/>
					</div>
				)}

				{/* Custom Text Mode */}
				{referenceMode === "custom" && (
					<div className="mb-4">
						<Label
							htmlFor="custom-text"
							className="text-xs text-neutral-600 dark:text-neutral-400 mb-2"
						>
							Custom Reference Text
						</Label>
						<Input
							id="custom-text"
							value={customText}
							onChange={(e) => setCustomText(e.target.value)}
							placeholder="Enter custom cross-reference text..."
						/>
					</div>
				)}

				{/* Note Field */}
				<div className="mb-4">
					<Label
						htmlFor="note"
						className="text-xs text-neutral-600 dark:text-neutral-400 mb-2"
					>
						Note (optional)
					</Label>
					<Textarea
						id="note"
						value={note}
						onChange={(e) => setNote(e.target.value)}
						placeholder="Additional context for this cross-reference..."
						rows={2}
					/>
				</div>

				{/* Add Button */}
				<Button
					type="button"
					onClick={handleAdd}
					disabled={
						createCrossReference.isPending || transferMentions.isPending
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
