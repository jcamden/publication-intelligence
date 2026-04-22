"use client";

import { Button } from "@pubint/yabasic/components/ui/button";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@pubint/yabasic/components/ui/tabs";
import { Settings } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuthToken } from "@/app/_common/_hooks/use-auth-token";
import { trpc } from "@/app/_common/_trpc/client";
import { IndexPageSettingsModal } from "./_components/index-page-settings-modal";
import { ScriptureIndexContent } from "./_components/scripture-index-content";
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
	const [settingsOpen, setSettingsOpen] = useState(false);
	const [showBooksWithNoMentions, setShowBooksWithNoMentions] = useState(false);

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
		<div className="h-[calc(100vh-3.5rem-1px)] overflow-hidden bg-neutral-50 dark:bg-neutral-900 flex flex-col">
			{enabledIndexTypes.length === 0 ? (
				<div className="flex items-center justify-center h-full">
					<div className="text-center">
						<p className="text-muted-foreground">
							No index types enabled for this project.
						</p>
					</div>
				</div>
			) : (
				<div className="p-6 flex flex-col flex-1 min-h-0">
					<Tabs
						value={activeTab}
						onValueChange={setActiveTab}
						className="flex flex-col flex-1 min-h-0"
					>
						<div className="flex items-center gap-2">
							<TabsList>
								{enabledIndexTypes.map((indexType) => (
									<TabsTrigger key={indexType.id} value={indexType.indexType}>
										{indexType.displayName}
									</TabsTrigger>
								))}
							</TabsList>
							<Button
								variant="ghost"
								size="icon"
								className="ml-auto h-9 w-9 shrink-0"
								onClick={() => setSettingsOpen(true)}
								aria-label="Index settings"
							>
								<Settings className="h-4 w-4" />
							</Button>
						</div>
						{enabledIndexTypes.map((indexType) => (
							<TabsContent
								key={indexType.id}
								value={indexType.indexType}
								className="flex-1 min-h-0 overflow-hidden"
							>
								<div className="py-4 h-full">
									{indexType.indexType === "subject" &&
									projectQuery.data?.id ? (
										<SubjectIndexContent
											projectId={projectQuery.data.id}
											projectIndexTypeId={indexType.id}
										/>
									) : indexType.indexType === "scripture" &&
										projectQuery.data?.id ? (
										<ScriptureIndexContent
											projectId={projectQuery.data.id}
											projectIndexTypeId={indexType.id}
											showBooksWithNoMentions={showBooksWithNoMentions}
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
					<IndexPageSettingsModal
						open={settingsOpen}
						onClose={() => setSettingsOpen(false)}
						enabledIndexTypes={enabledIndexTypes.map((t) => t.indexType)}
						showBooksWithNoMentions={showBooksWithNoMentions}
						onShowBooksWithNoMentionsChange={setShowBooksWithNoMentions}
					/>
				</div>
			)}
		</div>
	);
}
