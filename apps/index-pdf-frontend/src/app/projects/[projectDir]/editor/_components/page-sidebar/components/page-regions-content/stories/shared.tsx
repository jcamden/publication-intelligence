import type { Decorator } from "@storybook/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider as JotaiProvider } from "jotai";
import { useHydrateAtoms } from "jotai/utils";
import {
	pdfUrlAtom,
	totalPagesAtom,
} from "@/app/projects/[projectDir]/editor/_atoms/editor-atoms";
import { ProjectContext } from "@/app/projects/[projectDir]/editor/_context/project-context";

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			retry: false,
			staleTime: Number.POSITIVE_INFINITY,
		},
	},
});

const HydrateAtoms = ({ children }: { children: React.ReactNode }) => {
	useHydrateAtoms([
		[pdfUrlAtom, undefined],
		[totalPagesAtom, 0],
		// biome-ignore lint/suspicious/noExplicitAny: useHydrateAtoms has complex type requirements
	] as any);
	return <>{children}</>;
};

export const withMockedDependencies: Decorator = (Story) => {
	return (
		<QueryClientProvider client={queryClient}>
			<ProjectContext.Provider
				value={{ projectId: "test-project-id", documentId: "test-document-id" }}
			>
				<JotaiProvider>
					<HydrateAtoms>
						<Story />
					</HydrateAtoms>
				</JotaiProvider>
			</ProjectContext.Provider>
		</QueryClientProvider>
	);
};
