import { ProjectContext } from "@/app/projects/[projectDir]/editor/_context/project-context";

type ProjectContextType = {
	projectId: string | undefined;
};

/**
 * Mock ProjectProvider for Storybook stories
 * Uses the same ProjectContext as the real ProjectProvider so useProjectContext() works correctly
 * Provides a static projectId value for testing
 */
export const MockProjectProvider = ({
	children,
	projectId,
}: {
	children: React.ReactNode;
	projectId?: string;
}) => {
	const contextValue: ProjectContextType = {
		projectId,
	};

	return (
		<ProjectContext.Provider value={contextValue}>
			{children}
		</ProjectContext.Provider>
	);
};
