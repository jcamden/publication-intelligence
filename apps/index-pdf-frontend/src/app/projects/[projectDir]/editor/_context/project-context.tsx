"use client";

import { createContext, useContext } from "react";

type ProjectContextType = {
	projectId: string | undefined;
};

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

// Export for testing/storybook
export { ProjectContext };

export const ProjectProvider = ({
	projectId,
	children,
}: {
	projectId: string | undefined;
	children: React.ReactNode;
}) => {
	return (
		<ProjectContext.Provider value={{ projectId }}>
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
