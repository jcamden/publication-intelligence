import { Provider } from "jotai";
import type { ReactNode } from "react";

/**
 * Shared test decorator for editor components
 * Provides Jotai Provider context for atoms that still need it
 *
 * Note: IndexEntry, IndexType, and Mention data are now fetched via tRPC queries,
 * not stored in atoms. Stories should pass data as props to components.
 */
export const TestDecorator = (Story: () => ReactNode) => {
	return (
		<Provider>
			<Story />
		</Provider>
	);
};
