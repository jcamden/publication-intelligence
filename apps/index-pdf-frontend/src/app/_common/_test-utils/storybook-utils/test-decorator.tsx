import { Provider } from "jotai";
import { useHydrateAtoms } from "jotai/utils";
import type { ReactNode } from "react";
import {
	indexEntriesAtom,
	indexTypesAtom,
	mentionsAtom,
} from "../../../projects/[projectDir]/editor/_atoms/editor-atoms";
import { mockIndexEntries } from "../../../projects/[projectDir]/editor/_mocks/index-entries";
import { mockIndexTypes } from "../../../projects/[projectDir]/editor/_mocks/index-types";

const HydrateAtoms = ({ children }: { children: ReactNode }) => {
	useHydrateAtoms([
		[indexTypesAtom, mockIndexTypes],
		[indexEntriesAtom, mockIndexEntries],
		[mentionsAtom, []],
	]);
	return <>{children}</>;
};

/**
 * Shared test decorator for editor components
 * Hydrates Jotai atoms with mock data for testing
 */
export const TestDecorator = (Story: () => ReactNode) => {
	return (
		<Provider>
			<HydrateAtoms>
				<Story />
			</HydrateAtoms>
		</Provider>
	);
};
