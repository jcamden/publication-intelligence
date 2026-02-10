"use client";

import { getPageConfigSummary } from "@pubint/core";
import { Button } from "@pubint/yabasic/components/ui/button";
import { Eye, EyeOff, X } from "lucide-react";
import { trpc } from "@/app/_common/_utils/trpc";
import { useProjectContext } from "@/app/projects/[projectDir]/editor/_context/project-context";

type PageContextsContentProps = {
	currentPage: number;
};

export const PageContextsContent = ({
	currentPage,
}: PageContextsContentProps) => {
	const { projectId } = useProjectContext();
	const utils = trpc.useUtils();

	// Fetch contexts for current page
	const {
		data: contexts = [],
		isLoading,
		error,
	} = trpc.context.getForPage.useQuery(
		{ projectId: projectId || "", pageNumber: currentPage },
		{ enabled: !!projectId && currentPage > 0 },
	);

	const updateContext = trpc.context.update.useMutation({
		onSuccess: () => {
			// Invalidate both project and page context queries
			utils.context.list.invalidate({ projectId: projectId || "" });
			utils.context.getForPage.invalidate();
		},
	});

	const toggleVisibility = async ({
		contextId,
		currentlyVisible,
	}: {
		contextId: string;
		currentlyVisible: boolean;
	}) => {
		await updateContext.mutateAsync({
			id: contextId,
			visible: !currentlyVisible,
		});
	};

	const getContextTypeLabel = (type: "ignore" | "page_number") => {
		return type === "ignore" ? "Ignore" : "Page Number";
	};

	if (isLoading) {
		return (
			<div className="p-4 text-sm text-gray-500 dark:text-gray-400">
				Loading contexts...
			</div>
		);
	}

	if (error) {
		return (
			<div className="p-4 text-sm text-red-600 dark:text-red-400">
				Error loading contexts
			</div>
		);
	}

	if (contexts.length === 0) {
		return (
			<div className="p-4 text-sm text-center text-gray-500 dark:text-gray-400">
				No contexts on this page
			</div>
		);
	}

	return (
		<div className="divide-y divide-gray-200 dark:divide-gray-700">
			{contexts.map((context) => (
				<div
					key={context.id}
					className="p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
				>
					<div className="flex items-start gap-2">
						{/* Color indicator */}
						<div
							className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
							style={{ backgroundColor: context.color }}
						/>

						{/* Content */}
						<div className="flex-1 min-w-0">
							<div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-0.5">
								{context.name}
							</div>
							<div className="text-xs text-gray-600 dark:text-gray-400 mb-0.5">
								{getContextTypeLabel(context.contextType)}
							</div>
							<div className="text-xs text-gray-500 dark:text-gray-500 mb-2">
								{getPageConfigSummary({ context })}
							</div>

							{/* Actions */}
							<div className="flex gap-2">
								<Button
									variant="ghost"
									size="sm"
									onClick={() =>
										toggleVisibility({
											contextId: context.id,
											currentlyVisible: context.visible,
										})
									}
									title={context.visible ? "Hide" : "Show"}
								>
									{context.visible ? (
										<Eye className="w-3 h-3 mr-1" />
									) : (
										<EyeOff className="w-3 h-3 mr-1" />
									)}
									{context.visible ? "Hide" : "Show"}
								</Button>
								<Button
									variant="ghost"
									size="sm"
									onClick={() => {
										// TODO: Remove this page from context's page config
										console.log("Remove page from context:", context.id);
									}}
								>
									<X className="w-3 h-3 mr-1" />
									Remove Page
								</Button>
							</div>
						</div>
					</div>
				</div>
			))}
		</div>
	);
};
