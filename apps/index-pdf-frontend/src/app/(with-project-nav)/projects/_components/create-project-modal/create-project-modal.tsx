"use client";

import { Modal } from "@pubint/yaboujee";
import { ProjectForm } from "../project-form";

export type CreateProjectModalProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess: () => void;
	existingProjects: Array<{ project_dir: string; title: string }>;
};

export const CreateProjectModal = ({
	open,
	onOpenChange,
	onSuccess,
	existingProjects,
}: CreateProjectModalProps) => {
	const handleSuccess = () => {
		onOpenChange(false);
		onSuccess();
	};

	const handleCancel = () => {
		onOpenChange(false);
	};

	const handleClose = () => {
		onOpenChange(false);
	};

	return (
		<Modal
			open={open}
			onClose={handleClose}
			title="Create New Project"
			size="4xl"
		>
			<ProjectForm
				onSuccess={handleSuccess}
				onCancel={handleCancel}
				existingProjects={existingProjects}
			/>
		</Modal>
	);
};
