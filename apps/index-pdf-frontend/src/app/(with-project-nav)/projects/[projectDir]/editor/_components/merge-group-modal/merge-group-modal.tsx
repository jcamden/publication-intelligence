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
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/app/_common/_trpc/client";

export type MergeGroupModalProps = {
	open: boolean;
	onClose: () => void;
	sourceGroup: { id: string; name: string };
	groups: Array<{ id: string; name: string }>; // Excluding source
	projectId: string;
	projectIndexTypeId: string;
	onMerged?: () => void;
};

export const MergeGroupModal = ({
	open,
	onClose,
	sourceGroup,
	groups,
	projectId,
	projectIndexTypeId,
	onMerged,
}: MergeGroupModalProps) => {
	const [targetGroupId, setTargetGroupId] = useState<string | null>(null);
	const [isProcessing, setIsProcessing] = useState(false);

	const utils = trpc.useUtils();
	const targetGroup = groups.find((g) => g.id === targetGroupId);

	const mergeGroups = trpc.detection.mergeGroups.useMutation({
		onSuccess: (_, variables) => {
			const target = groups.find((g) => g.id === variables.targetGroupId);
			utils.detection.listIndexEntryGroups.invalidate({
				projectId,
				projectIndexTypeId,
			});
			utils.indexEntry.listLean.invalidate({ projectId });
			toast.success(
				`Merged "${sourceGroup.name}" into "${target?.name ?? "target"}"`,
			);
			onMerged?.();
			onClose();
		},
		onError: (error) => {
			toast.error(`Failed to merge groups: ${error.message}`);
		},
	});

	const handleMerge = useCallback(async () => {
		if (!targetGroupId) {
			toast.error("Please select a target group");
			return;
		}

		setIsProcessing(true);
		try {
			await mergeGroups.mutateAsync({
				sourceGroupId: sourceGroup.id,
				targetGroupId,
			});
		} finally {
			setIsProcessing(false);
		}
	}, [targetGroupId, sourceGroup, mergeGroups]);

	const handleCancel = useCallback(() => {
		setTargetGroupId(null);
		onClose();
	}, [onClose]);

	return (
		<Modal
			open={open}
			onClose={handleCancel}
			title="Merge Group"
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
						disabled={!targetGroupId || isProcessing}
					>
						{isProcessing ? (
							<>
								<Spinner size="sm" className="mr-2" />
								Merging...
							</>
						) : (
							"Merge Group"
						)}
					</Button>
				</>
			}
		>
			<div className="space-y-4">
				<Field>
					<FieldLabel htmlFor="target-group">Target Group</FieldLabel>
					<Select
						value={targetGroupId ?? ""}
						onValueChange={(v) => setTargetGroupId(v || null)}
					>
						<SelectTrigger id="target-group">
							<SelectValue placeholder="Select target group...">
								{targetGroup?.name}
							</SelectValue>
						</SelectTrigger>
						<SelectContent>
							{groups.map((g) => (
								<SelectItem key={g.id} value={g.id}>
									{g.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</Field>

				{targetGroupId && targetGroup && (
					<Alert>
						<AlertDescription>
							Merge &quot;{sourceGroup.name}&quot; into &quot;{targetGroup.name}
							&quot;? Entries and matchers will move to {targetGroup.name};{" "}
							{sourceGroup.name} will be deleted.
						</AlertDescription>
					</Alert>
				)}
			</div>
		</Modal>
	);
};
