import { Provider } from "jotai";
import { useHydrateAtoms } from "jotai/utils";
import type { ReactNode } from "react";
import {
	indexEntriesAtom,
	indexTypesAtom,
	mentionsAtom,
} from "../../../_atoms/editor-atoms";
import { mockIndexEntries } from "../../../_mocks/index-entries";
import { mockIndexTypes } from "../../../_mocks/index-types";

const HydrateAtoms = ({ children }: { children: ReactNode }) => {
	useHydrateAtoms([
		[indexTypesAtom, mockIndexTypes],
		[indexEntriesAtom, mockIndexEntries],
		[mentionsAtom, []],
	]);
	return <>{children}</>;
};

export const TestDecorator = (Story: () => ReactNode) => {
	return (
		<Provider>
			<HydrateAtoms>
				<Story />
			</HydrateAtoms>
		</Provider>
	);
};
