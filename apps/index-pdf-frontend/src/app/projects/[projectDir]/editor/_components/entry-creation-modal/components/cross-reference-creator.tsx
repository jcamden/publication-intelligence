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
import type { CreateCrossReferenceInput } from "@/app/_common/_utils/trpc-types";
import type { IndexEntry } from "../../../_types/index-entry";
import {
	formatSingleCrossReferenceLabel,
	getDirectiveForSingleRef,
} from "../../../_utils/cross-reference-utils";
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
	const [targetMode, setTargetMode] = useState<"entry" | "arbitrary">("entry");
	const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
	const [arbitraryText, setArbitraryText] = useState("");

	const handleRemove = (index: number) => {
		const updated = [...pendingCrossReferences];
		updated.splice(index, 1);
		onChange(updated);
	};

	const handleAdd = () => {
		if (targetMode === "entry") {
			if (!selectedEntryId) {
				toast.error("Please select an entry");
				return;
			}
			onChange([
				...pendingCrossReferences,
				{
					toEntryId: selectedEntryId ?? undefined,
					relationType,
				},
			]);
		} else {
			const value = arbitraryText.trim();
			if (!value) {
				toast.error("Please enter the cross-reference text");
				return;
			}
			onChange([
				...pendingCrossReferences,
				{
					arbitraryValue: value,
					relationType,
				},
			]);
		}
		resetForm();
	};

	const resetForm = () => {
		setSelectedEntryId(null);
		setArbitraryText("");
		setRelationType("see_also");
		setTargetMode("entry");
	};

	const canAdd =
		targetMode === "entry" ? !!selectedEntryId : !!arbitraryText.trim();

	return (
		<div className="space-y-4">
			{pendingCrossReferences.length > 0 && (
				<div className="space-y-2">
					<Label className="text-sm font-medium">
						Cross-References to Add ({pendingCrossReferences.length})
					</Label>
					<div className="space-y-2">
						{pendingCrossReferences.map((crossRef, index) => {
							const key = `${crossRef.toEntryId ?? crossRef.arbitraryValue ?? ""}-${crossRef.relationType}-${index}`;
							const refForLabel = {
								...crossRef,
								toEntryId: crossRef.toEntryId ?? null,
							};
							const label = formatSingleCrossReferenceLabel({
								ref: refForLabel,
								allEntries: existingEntries,
							});
							const directive = getDirectiveForSingleRef({
								ref: refForLabel,
								allEntries: existingEntries,
							});
							const afterDirective =
								label.length > directive.length
									? label.slice(directive.length)
									: "";
							return (
								<div
									key={key}
									className="flex items-start justify-between p-3 border rounded-lg bg-neutral-50 dark:bg-neutral-800"
								>
									<div className="flex-1">
										<p className="text-sm font-medium">
											<em>{directive}</em>
											{afterDirective}
										</p>
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

			<div className="border-t pt-4">
				<Label className="text-sm font-medium mb-3 block">
					Add Cross-Reference
				</Label>

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
							<span className="text-sm">Arbitrary value</span>
						</label>
					</RadioGroup>
					{targetMode === "entry" ? (
						<EntryPicker
							id="entry-select"
							entries={existingEntries}
							value={selectedEntryId}
							onValueChange={setSelectedEntryId}
							placeholder="Search entries..."
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

				<Button
					type="button"
					onClick={handleAdd}
					variant="outline"
					size="sm"
					disabled={!canAdd}
				>
					Add Cross-Reference
				</Button>
			</div>
		</div>
	);
};
