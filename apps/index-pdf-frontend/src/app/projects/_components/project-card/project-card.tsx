"use client";

import { Button } from "@pubint/yabasic/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@pubint/yabasic/components/ui/card";
import { PdfThumbnail } from "@pubint/yaboujee";
import { FileIcon, Trash2Icon } from "lucide-react";
import Link from "next/link";
import { useAuthenticatedPdf } from "@/app/projects/_hooks/use-authenticated-pdf";

export type ProjectCardProps = {
	project: {
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
	};
	onDelete: () => void;
};

const formatFileSize = (bytes: number): string => {
	if (bytes === 0) return "0 Bytes";
	const k = 1024;
	const sizes = ["Bytes", "KB", "MB", "GB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${Math.round(bytes / k ** i)} ${sizes[i]}`;
};

export const ProjectCard = ({ project, onDelete }: ProjectCardProps) => {
	const fileUrl = project.source_document
		? `http://localhost:3001/source-documents/${project.source_document.id}/file`
		: null;

	const { blobUrl, isLoading } = useAuthenticatedPdf({ url: fileUrl });

	return (
		<Card className="group relative overflow-hidden transition-shadow hover:shadow-lg">
			<Button
				variant="ghost"
				size="icon-sm"
				className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
				onClick={(e) => {
					e.preventDefault();
					e.stopPropagation();
					onDelete();
				}}
				aria-label="Delete project"
			>
				<Trash2Icon className="h-4 w-4" />
			</Button>

			<Link href={`/projects/${project.project_dir}/editor`} className="block">
				<div className="aspect-[1/1.414] bg-muted overflow-hidden">
					{isLoading ? (
						<div className="flex items-center justify-center h-full">
							<div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
						</div>
					) : blobUrl ? (
						<PdfThumbnail source={blobUrl} alt={project.title} />
					) : (
						<div className="flex items-center justify-center h-full text-muted-foreground">
							<FileIcon className="h-16 w-16" />
						</div>
					)}
				</div>

				<CardHeader>
					<CardTitle className="line-clamp-1">{project.title}</CardTitle>
					{project.description && (
						<CardDescription className="line-clamp-2">
							{project.description}
						</CardDescription>
					)}
				</CardHeader>

				{project.source_document && (
					<CardContent className="text-xs text-muted-foreground space-y-1">
						<div className="flex items-center justify-between">
							<span>Pages:</span>
							<span>{project.source_document.page_count ?? "—"}</span>
						</div>
						{project.source_document.file_size && (
							<div className="flex items-center justify-between">
								<span>Size:</span>
								<span>{formatFileSize(project.source_document.file_size)}</span>
							</div>
						)}
					</CardContent>
				)}
			</Link>
		</Card>
	);
};
