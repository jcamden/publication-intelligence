"use client";

import { Button } from "@pubint/yabasic/components/ui/button";
import { PlusIcon } from "lucide-react";
import { ProjectCard } from "./_components/project-card";

export type ProjectListProps = {
	projects?: Array<{
		id: string;
		title: string;
		description: string | null;
		project_dir: string;
		source_document?: {
			id: string;
			title: string;
			file_name: string;
			file_size: number | null;
			page_count: number | null;
			storage_key: string;
		} | null;
	}>;
	isLoading?: boolean;
	onDeleteClick: (projectId: string) => void;
	onCreateClick?: () => void;
};

const LoadingSkeleton = () => (
	<div className="flex flex-col gap-4">
		{Array.from({ length: 8 }, (_, i) => `skeleton-${i}`).map((key) => (
			<div
				key={key}
				className="rounded-lg border border-input overflow-hidden animate-pulse flex flex-row items-start gap-4 p-4"
			>
				<div className="w-24 h-32 bg-muted rounded flex-shrink-0" />
				<div className="flex-1 space-y-3 py-2">
					<div className="h-5 bg-muted rounded" />
					<div className="h-4 bg-muted rounded w-2/3" />
					<div className="h-3 bg-muted rounded w-1/3" />
				</div>
			</div>
		))}
	</div>
);

const EmptyState = ({ onCreateClick }: { onCreateClick?: () => void }) => (
	<div className="flex flex-col items-center justify-center py-16 text-center">
		<div className="rounded-full bg-muted p-6 mb-4">
			<PlusIcon className="h-12 w-12 text-muted-foreground" />
		</div>
		<h3 className="text-lg font-semibold mb-2">No projects yet</h3>
		<p className="text-muted-foreground mb-6 max-w-md">
			Get started by creating your first project. Upload a PDF document and
			begin indexing.
		</p>
		{onCreateClick && (
			<Button onClick={onCreateClick}>Create Your First Project</Button>
		)}
	</div>
);

export const ProjectList = ({
	projects,
	isLoading,
	onDeleteClick,
	onCreateClick,
}: ProjectListProps) => {
	if (isLoading) {
		return <LoadingSkeleton />;
	}

	if (!projects || projects.length === 0) {
		return <EmptyState onCreateClick={onCreateClick} />;
	}

	return (
		<div className="flex flex-col gap-4">
			{projects.map((project) => (
				<ProjectCard
					key={project.id}
					project={project}
					onDelete={() => onDeleteClick(project.id)}
				/>
			))}
		</div>
	);
};
