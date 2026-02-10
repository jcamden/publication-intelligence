import { ProjectContext } from "@/app/projects/[projectDir]/editor/_context/project-context";

type ProjectContextType = {
	projectId: string | undefined;
	documentId: string | undefined;
};

/**
 * Mock ProjectProvider for Storybook stories
 * Uses the same ProjectContext as the real ProjectProvider so useProjectContext() works correctly
 * Provides static projectId and documentId values for testing
 */
export const MockProjectProvider = ({
	children,
	projectId,
	documentId,
}: {
	children: React.ReactNode;
	projectId?: string;
	documentId?: string;
}) => {
	const contextValue: ProjectContextType = {
		projectId,
		documentId,
	};

	return (
		<ProjectContext.Provider value={contextValue}>
			{children}
		</ProjectContext.Provider>
	);
};
