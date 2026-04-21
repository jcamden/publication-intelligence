"use client";

import { Button } from "@pubint/yabasic/components/ui/button";
import { useState } from "react";
import { useAuthToken } from "@/app/_common/_hooks/use-auth-token";
import { trpc } from "@/app/_common/_trpc/client";
import { CreateProjectModal } from "./_components/create-project-modal";
import { EditProjectModal } from "./_components/edit-project-modal";
import { ProjectList } from "./_components/project-list";

export default function ProjectsPage() {
	const { isAuthenticated } = useAuthToken();
	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
	const [projectToEdit, setProjectToEdit] = useState<string | null>(null);

	const projectsQuery = trpc.project.list.useQuery(undefined, {
		enabled: isAuthenticated,
	});

	const handleCreateSuccess = () => {
		projectsQuery.refetch();
	};

	const handleEditSuccess = () => {
		projectsQuery.refetch();
		setProjectToEdit(null);
	};

	return (
		<div className="container mx-auto p-6">
			<header className="flex justify-between items-center mb-8">
				<div>
					<h1 className="text-3xl font-bold font-merriweather">Projects</h1>
					<p className="text-muted-foreground">
						Manage your publication index projects
					</p>
				</div>
				<Button onClick={() => setIsCreateModalOpen(true)}>
					Create Project
				</Button>
			</header>

			<ProjectList
				projects={projectsQuery.data}
				isLoading={projectsQuery.isLoading}
				onSettingsClick={setProjectToEdit}
				onCreateClick={() => setIsCreateModalOpen(true)}
			/>

			<CreateProjectModal
				open={isCreateModalOpen}
				onOpenChange={setIsCreateModalOpen}
				onSuccess={handleCreateSuccess}
				existingProjects={projectsQuery.data ?? []}
			/>

			{projectToEdit && (
				<EditProjectModal
					open={!!projectToEdit}
					onOpenChange={(open) => !open && setProjectToEdit(null)}
					onSuccess={handleEditSuccess}
					projectId={projectToEdit}
					existingProjects={projectsQuery.data ?? []}
				/>
			)}
		</div>
	);
}
