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
import { useState } from "react";
import { toast } from "sonner";
import type { CreateCrossReferenceInput } from "@/app/_common/_utils/trpc-types";
import type { IndexEntry } from "../../../_types/index-entry";
import { getEntryDisplayLabel } from "../../../_utils/index-entry-utils";
import { EntryPicker } from "../../entry-picker/entry-picker";

type CrossReferenceCreatorProps = {
	existingEntries: IndexEntry[];
	pendingCrossReferences: Omit<CreateCrossReferenceInput, "fromEntryId">[];
	onChange: (
		crossRefs: Omit<CreateCrossReferenceInput, "fromEntryId">[],
	) => void;
};

export const CrossReferenceCreator = ({
	existingEntries,
	pendingCrossReferences,
	onChange,
}: CrossReferenceCreatorProps) => {
	const [relationType, setRelationType] = useState<"see" | "see_also" | "qv">(
		"see_also",
	);
	const [referenceMode, setReferenceMode] = useState<"entry" | "custom">(
		"entry",
	);
	const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
	const [customText, setCustomText] = useState("");
	const [note, setNote] = useState("");

	const handleRemove = (index: number) => {
		const updated = [...pendingCrossReferences];
		updated.splice(index, 1);
		onChange(updated);
	};

	const handleAdd = () => {
		if (referenceMode === "entry" && !selectedEntryId) {
			toast.error("Please select an entry");
			return;
		}

		if (referenceMode === "custom" && !customText.trim()) {
			toast.error("Please enter custom text");
			return;
		}

		const newCrossRef: Omit<CreateCrossReferenceInput, "fromEntryId"> = {
			toEntryId:
				referenceMode === "entry" && selectedEntryId
					? selectedEntryId
					: undefined,
			arbitraryValue:
				referenceMode === "custom" ? customText.trim() : undefined,
			relationType,
			note: note.trim() || undefined,
		};

		onChange([...pendingCrossReferences, newCrossRef]);
		resetForm();
	};

	const resetForm = () => {
		setSelectedEntryId(null);
		setCustomText("");
		setNote("");
		setReferenceMode("entry");
		setRelationType("see_also");
	};

	const relationTypeLabels = {
		see: "See",
		see_also: "See also",
		qv: "q.v.",
	};

	return (
		<div className="space-y-4">
			{/* Existing Cross-References */}
			{pendingCrossReferences.length > 0 && (
				<div className="space-y-2">
					<Label className="text-sm font-medium">
						Cross-References to Add ({pendingCrossReferences.length})
					</Label>
					<div className="space-y-2">
						{pendingCrossReferences.map((crossRef, index) => {
							const key = `${crossRef.toEntryId || crossRef.arbitraryValue}-${crossRef.relationType}-${index}`;
							return (
								<div
									key={key}
									className="flex items-start justify-between p-3 border rounded-lg bg-neutral-50 dark:bg-neutral-800"
								>
									<div className="flex-1">
										<div className="flex items-center gap-2 mb-1">
											<Badge variant="outline" className="text-xs">
												{relationTypeLabels[crossRef.relationType]}
											</Badge>
											<span className="text-sm font-medium">
												{crossRef.toEntryId
													? (() => {
															const targetEntry = existingEntries.find(
																(e) => e.id === crossRef.toEntryId,
															);
															return targetEntry
																? getEntryDisplayLabel({
																		entry: targetEntry,
																		entries: existingEntries,
																	})
																: "Unknown";
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
										onClick={() => handleRemove(index)}
										className="ml-2 p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded transition-colors"
										aria-label="Remove cross-reference"
									>
										<X className="w-4 h-4" />
									</button>
								</div>
							);
						})}
					</div>
				</div>
			)}

			{/* Add New Cross-Reference Form */}
			<div className="border-t pt-4">
				<Label className="text-sm font-medium mb-3 block">
					Add Cross-Reference
				</Label>

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
							entries={existingEntries}
							value={selectedEntryId}
							onValueChange={setSelectedEntryId}
							placeholder="Search entries..."
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
						placeholder="Add context or explanation..."
						rows={2}
					/>
				</div>

				<Button
					type="button"
					onClick={handleAdd}
					variant="outline"
					size="sm"
					disabled={
						(referenceMode === "entry" && !selectedEntryId) ||
						(referenceMode === "custom" && !customText.trim())
					}
				>
					Add Cross-Reference
				</Button>
			</div>
		</div>
	);
};
