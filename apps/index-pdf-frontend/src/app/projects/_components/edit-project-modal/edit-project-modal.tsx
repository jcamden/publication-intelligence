"use client";

import { Button } from "@pubint/yabasic/components/ui/button";
import { Modal } from "@pubint/yaboujee";
import { useState } from "react";
import { trpc } from "@/app/_common/_utils/trpc";
import { DeleteProjectDialog } from "../delete-project-dialog";
import { ProjectForm } from "../project-form";

export type EditProjectModalProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess: () => void;
	projectId: string;
	existingProjects: Array<{ project_dir: string; title: string }>;
};

export const EditProjectModal = ({
	open,
	onOpenChange,
	onSuccess,
	projectId,
	existingProjects,
}: EditProjectModalProps) => {
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);

	// Fetch project data
	const projectQuery = trpc.project.getById.useQuery(
		{ id: projectId },
		{ enabled: open && !!projectId },
	);

	// Fetch enabled index types
	const indexTypesQuery = trpc.projectIndexType.list.useQuery(
		{ projectId },
		{ enabled: open && !!projectId },
	);

	const handleSuccess = () => {
		onOpenChange(false);
		onSuccess();
	};

	const handleCancel = () => {
		onOpenChange(false);
	};

	const handleDeleteSuccess = () => {
		setShowDeleteDialog(false);
		onOpenChange(false);
		onSuccess();
	};

	if (!projectQuery.data || !indexTypesQuery.data) {
		return (
			<Modal
				open={open}
				onClose={() => onOpenChange(false)}
				title="Edit Project"
				size="2xl"
			>
				<div className="flex items-center justify-center p-8">
					<div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
				</div>
			</Modal>
		);
	}

	const initialData = {
		title: projectQuery.data.title,
		description: projectQuery.data.description,
		project_dir: projectQuery.data.project_dir,
		selectedIndexTypes: indexTypesQuery.data.map((it) => it.indexType),
		sourceDocument: projectQuery.data.source_document,
	};

	return (
		<>
			<Modal
				open={open}
				onClose={() => onOpenChange(false)}
				title="Edit Project"
				size="2xl"
			>
				<ProjectForm
					mode="edit"
					projectId={projectId}
					initialData={initialData}
					onSuccess={handleSuccess}
					onCancel={handleCancel}
					existingProjects={existingProjects}
					renderDeleteButton={() => (
						<Button
							type="button"
							variant="destructive"
							onClick={() => setShowDeleteDialog(true)}
						>
							Delete Project
						</Button>
					)}
				/>
			</Modal>

			<DeleteProjectDialog
				projectId={showDeleteDialog ? projectId : null}
				onOpenChange={(open) => setShowDeleteDialog(open)}
				onSuccess={handleDeleteSuccess}
			/>
		</>
	);
};
