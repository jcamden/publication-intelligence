"use client";

import { Button } from "@pubint/yabasic/components/ui/button";
import { Field, FieldLabel } from "@pubint/yabasic/components/ui/field";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@pubint/yabasic/components/ui/select";
import { Modal } from "@pubint/yaboujee";
import { useState } from "react";
import { useBulkUpdateIndexTypes } from "@/app/_common/_hooks/use-bulk-update-index-types";

export type BulkIndexAsModalProps = {
	open: boolean;
	onClose: () => void;
	selectedMentionIds: string[];
	projectId: string;
	documentId: string;
	projectIndexTypes: Array<{
		id: string;
		indexType: string;
		colorHue: number;
	}>;
};

export const BulkIndexAsModal = ({
	open,
	onClose,
	selectedMentionIds,
	projectId,
	documentId,
	projectIndexTypes,
}: BulkIndexAsModalProps) => {
	const [selectedIndexTypeIds, setSelectedIndexTypeIds] = useState<string[]>(
		[],
	);
	const [operation, setOperation] = useState<"add" | "replace" | "remove">(
		"add",
	);

	const updateIndexTypes = useBulkUpdateIndexTypes({ projectId, documentId });

	const handleSubmit = () => {
		updateIndexTypes.mutate(
			{
				mentionIds: selectedMentionIds,
				projectIndexTypeIds: selectedIndexTypeIds,
				operation,
			},
			{
				onSuccess: () => {
					// Reset state and close
					setSelectedIndexTypeIds([]);
					setOperation("add");
					onClose();
				},
			},
		);
	};

	const handleCancel = () => {
		// Reset state and close
		setSelectedIndexTypeIds([]);
		setOperation("add");
		onClose();
	};

	const toggleIndexType = (id: string) => {
		setSelectedIndexTypeIds((prev) =>
			prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
		);
	};

	return (
		<Modal
			open={open}
			onClose={handleCancel}
			title="Update Index Types"
			size="md"
			footer={
				<>
					<Button variant="outline" onClick={handleCancel}>
						Cancel
					</Button>
					<Button
						variant="default"
						onClick={handleSubmit}
						disabled={
							selectedIndexTypeIds.length === 0 || updateIndexTypes.isPending
						}
					>
						{updateIndexTypes.isPending ? "Updating..." : "Update"}
					</Button>
				</>
			}
		>
			<div className="space-y-4">
				<p className="text-sm text-muted-foreground">
					{selectedMentionIds.length} mention(s) selected
				</p>

				{/* Operation selector */}
				<Field>
					<FieldLabel htmlFor="operation">Operation</FieldLabel>
					<Select
						value={operation}
						onValueChange={(value) => {
							if (
								value === "add" ||
								value === "replace" ||
								value === "remove"
							) {
								setOperation(value);
							}
						}}
					>
						<SelectTrigger id="operation" className="w-full">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="add">Add to existing types</SelectItem>
							<SelectItem value="replace">Replace all types</SelectItem>
							<SelectItem value="remove">Remove types</SelectItem>
						</SelectContent>
					</Select>
					<p className="text-xs text-muted-foreground mt-1">
						{operation === "add" &&
							"Mentions will belong to both old and new types"}
						{operation === "replace" &&
							"Mentions will only belong to the selected types"}
						{operation === "remove" && "Remove selected types from mentions"}
					</p>
				</Field>

				{/* Index types multi-select */}
				<Field>
					<FieldLabel>Index Types</FieldLabel>
					<div className="space-y-2 max-h-64 overflow-y-auto border border-input rounded-md p-2">
						{projectIndexTypes.length === 0 ? (
							<p className="text-sm text-muted-foreground text-center py-2">
								No index types available
							</p>
						) : (
							projectIndexTypes.map((type) => (
								<label
									key={type.id}
									className="flex items-center gap-2 cursor-pointer hover:bg-accent p-2 rounded-sm"
								>
									<input
										type="checkbox"
										checked={selectedIndexTypeIds.includes(type.id)}
										onChange={() => toggleIndexType(type.id)}
										className="size-4"
									/>
									<div className="flex items-center gap-2 flex-1">
										<div
											className="size-3 rounded-full"
											style={{
												backgroundColor: `oklch(60% 0.15 ${type.colorHue})`,
											}}
										/>
										<span className="text-sm capitalize">{type.indexType}</span>
									</div>
								</label>
							))
						)}
					</div>
				</Field>
			</div>
		</Modal>
	);
};
