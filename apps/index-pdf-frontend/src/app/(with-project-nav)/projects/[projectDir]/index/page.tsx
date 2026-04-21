"use client";

import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@pubint/yabasic/components/ui/tabs";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuthToken } from "@/app/_common/_hooks/use-auth-token";
import { trpc } from "@/app/_common/_trpc/client";
import { SubjectIndexContent } from "./_components/subject-index-content";

export default function IndexPage() {
	const params = useParams();
	const projectDir = params.projectDir as string;
	const { isAuthenticated } = useAuthToken();

	const projectQuery = trpc.project.getByDir.useQuery(
		{ projectDir },
		{
			enabled: isAuthenticated,
		},
	);

	const indexTypesQuery = trpc.projectHighlightConfig.list.useQuery(
		{ projectId: projectQuery.data?.id ?? "" },
		{
			enabled: !!projectQuery.data?.id,
		},
	);

	const [activeTab, setActiveTab] = useState<string>("");

	// Set the first enabled index type as the default active tab
	useEffect(() => {
		if (indexTypesQuery.data && indexTypesQuery.data.length > 0 && !activeTab) {
			setActiveTab(indexTypesQuery.data[0].indexType);
		}
	}, [indexTypesQuery.data, activeTab]);

	if (projectQuery.isLoading) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="text-center">
					<div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
					<p className="text-muted-foreground">Loading...</p>
				</div>
			</div>
		);
	}

	if (projectQuery.isError) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="text-center">
					<p className="text-destructive mb-2">Failed to load project</p>
					<p className="text-muted-foreground text-sm">
						{projectQuery.error.message}
					</p>
				</div>
			</div>
		);
	}

	const enabledIndexTypes = indexTypesQuery.data ?? [];

	return (
		<div className="h-[calc(100vh-3.5rem-1px)] overflow-hidden bg-neutral-50 dark:bg-neutral-900">
			{enabledIndexTypes.length === 0 ? (
				<div className="flex items-center justify-center h-full">
					<div className="text-center">
						<p className="text-muted-foreground">
							No index types enabled for this project.
						</p>
					</div>
				</div>
			) : (
				<div className="p-6">
					<Tabs value={activeTab} onValueChange={setActiveTab}>
						<TabsList>
							{enabledIndexTypes.map((indexType) => (
								<TabsTrigger key={indexType.id} value={indexType.indexType}>
									{indexType.displayName}
								</TabsTrigger>
							))}
						</TabsList>
						{enabledIndexTypes.map((indexType) => (
							<TabsContent key={indexType.id} value={indexType.indexType}>
								<div className="py-4">
									{indexType.indexType === "subject" &&
									projectQuery.data?.id ? (
										<SubjectIndexContent
											projectId={projectQuery.data.id}
											projectIndexTypeId={indexType.id}
										/>
									) : (
										<p className="text-muted-foreground">
											Index content will go here for {indexType.indexType}
										</p>
									)}
								</div>
							</TabsContent>
						))}
					</Tabs>
				</div>
			)}
		</div>
	);
}
