"use client";

import { getPageConfigSummary } from "@pubint/core";
import { Button } from "@pubint/yabasic/components/ui/button";
import { StyledButton } from "@pubint/yaboujee";
import {
	Edit,
	Eye,
	EyeOff,
	SquareDashedMousePointer,
	Trash2,
} from "lucide-react";
import { trpc } from "@/app/_common/_utils/trpc";
import { useProjectContext } from "@/app/projects/[projectDir]/editor/_context/project-context";

type ProjectContextsContentProps = {
	activeAction?: { type: string | null; indexType: string | null };
	onDrawContext?: () => void;
	onEditContext?: (contextId: string) => void;
};

export const ProjectContextsContent = ({
	activeAction,
	onDrawContext,
	onEditContext,
}: ProjectContextsContentProps) => {
	const { projectId } = useProjectContext();
	const utils = trpc.useUtils();

	// Fetch contexts for this project
	const {
		data: contexts = [],
		isLoading,
		error,
	} = trpc.context.list.useQuery(
		{ projectId: projectId || "" },
		{ enabled: !!projectId },
	);

	const deleteContext = trpc.context.delete.useMutation({
		onSuccess: () => {
			// Invalidate both project and page context queries
			utils.context.list.invalidate({ projectId: projectId || "" });
			utils.context.getForPage.invalidate();
		},
	});

	const toggleVisibility = trpc.context.update.useMutation({
		onSuccess: () => {
			// Invalidate both project and page context queries
			utils.context.list.invalidate({ projectId: projectId || "" });
			utils.context.getForPage.invalidate();
		},
	});

	const handleDelete = async ({ contextId }: { contextId: string }) => {
		if (!confirm("Are you sure you want to delete this context?")) {
			return;
		}

		await deleteContext.mutateAsync({ id: contextId });
	};

	const handleToggleVisibility = async ({
		contextId,
		visible,
	}: {
		contextId: string;
		visible: boolean;
	}) => {
		await toggleVisibility.mutateAsync({ id: contextId, visible: !visible });
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
				Error loading contexts: {error.message}
			</div>
		);
	}

	const isDrawContextActive = activeAction?.type === "draw-context";

	return (
		<div className="flex flex-col h-full">
			{/* Header */}
			<div className="p-3 border-b border-gray-200 dark:border-gray-700">
				<StyledButton
					icon={SquareDashedMousePointer}
					label="Draw Context Region"
					isActive={isDrawContextActive}
					onClick={() => {
						if (onDrawContext) {
							onDrawContext();
						}
					}}
				/>
			</div>

			{/* Context list */}
			<div className="flex-1 overflow-y-auto">
				{contexts.length === 0 ? (
					<div className="p-4 text-sm text-center text-gray-500 dark:text-gray-400">
						No contexts yet. Create one to mark regions for ignore or page
						numbers.
					</div>
				) : (
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
										<div className="text-xs text-gray-500 dark:text-gray-500">
											{getPageConfigSummary({ context })}
										</div>
									</div>

									{/* Actions */}
									<div className="flex gap-1">
										<Button
											variant="ghost"
											size="sm"
											onClick={() =>
												handleToggleVisibility({
													contextId: context.id,
													visible: context.visible,
												})
											}
											title={context.visible ? "Hide context" : "Show context"}
										>
											{context.visible ? (
												<Eye className="w-3 h-3" />
											) : (
												<EyeOff className="w-3 h-3" />
											)}
										</Button>
										<Button
											variant="ghost"
											size="sm"
											onClick={() => {
												if (onEditContext) {
													onEditContext(context.id);
												}
											}}
											title="Edit context"
										>
											<Edit className="w-3 h-3" />
										</Button>
										<Button
											variant="ghost"
											size="sm"
											onClick={() => handleDelete({ contextId: context.id })}
											title="Delete context"
										>
											<Trash2 className="w-3 h-3" />
										</Button>
									</div>
								</div>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
};
