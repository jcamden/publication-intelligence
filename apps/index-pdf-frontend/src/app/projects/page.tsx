"use client";

import { Button } from "@pubint/yabasic/components/ui/button";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuthToken } from "@/app/_common/_hooks/use-auth";
import { trpc } from "@/app/_common/_utils/trpc";
import { CreateProjectModal } from "./_components/create-project-modal";
import { DeleteProjectDialog } from "./_components/delete-project-dialog";
import { ProjectGrid } from "./_components/project-grid";
import { ProjectNavbar } from "./_components/project-navbar";

export default function ProjectsPage() {
	const router = useRouter();
	const {
		isAuthenticated,
		isLoading: authLoading,
		clearToken,
	} = useAuthToken();
	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
	const [projectToDelete, setProjectToDelete] = useState<string | null>(null);

	const userQuery = trpc.auth.me.useQuery(undefined, {
		enabled: isAuthenticated,
	});

	useEffect(() => {
		if (!authLoading && !isAuthenticated) {
			router.push("/login");
		}
	}, [isAuthenticated, authLoading, router]);

	const projectsQuery = trpc.project.list.useQuery(undefined, {
		enabled: isAuthenticated,
	});

	const handleCreateSuccess = () => {
		projectsQuery.refetch();
	};

	const handleDeleteSuccess = () => {
		projectsQuery.refetch();
	};

	if (authLoading) {
		return (
			<div className="container mx-auto p-6">
				<div className="flex items-center justify-center min-h-[400px]">
					<div className="text-center">
						<div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
						<p className="text-muted-foreground">Loading...</p>
					</div>
				</div>
			</div>
		);
	}

	if (!isAuthenticated) {
		return null;
	}

	const handleSignOut = () => {
		clearToken();
		router.push("/login");
	};

	return (
		<>
			<ProjectNavbar
				userName={userQuery.data?.name ?? undefined}
				userEmail={userQuery.data?.email ?? undefined}
				onSignOutClick={handleSignOut}
			/>
			<div className="container mx-auto p-6">
				<header className="flex justify-between items-center mb-8">
					<div>
						<h1 className="text-3xl font-bold">Projects</h1>
						<p className="text-muted-foreground">
							Manage your publication index projects
						</p>
					</div>
					<Button onClick={() => setIsCreateModalOpen(true)}>
						Create Project
					</Button>
				</header>

				<ProjectGrid
					projects={projectsQuery.data}
					isLoading={projectsQuery.isLoading}
					onDeleteClick={setProjectToDelete}
					onCreateClick={() => setIsCreateModalOpen(true)}
				/>

				<CreateProjectModal
					open={isCreateModalOpen}
					onOpenChange={setIsCreateModalOpen}
					onSuccess={handleCreateSuccess}
					existingProjects={projectsQuery.data ?? []}
				/>

				<DeleteProjectDialog
					projectId={projectToDelete}
					onOpenChange={(open: boolean) => !open && setProjectToDelete(null)}
					onSuccess={handleDeleteSuccess}
				/>
			</div>
		</>
	);
}
