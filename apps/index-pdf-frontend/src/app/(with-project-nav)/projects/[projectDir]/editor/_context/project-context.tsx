"use client";

import { createContext, useContext } from "react";

type ProjectContextType = {
	projectId: string | undefined;
	documentId: string | undefined;
};

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

// Export for testing/storybook
export { ProjectContext };

export const ProjectProvider = ({
	projectId,
	documentId,
	children,
}: {
	projectId: string | undefined;
	documentId: string | undefined;
	children: React.ReactNode;
}) => {
	return (
		<ProjectContext.Provider value={{ projectId, documentId }}>
			{children}
		</ProjectContext.Provider>
	);
};

export const useProjectContext = () => {
	const context = useContext(ProjectContext);
	if (!context) {
		throw new Error("useProjectContext must be used within ProjectProvider");
	}
	return context;
};
