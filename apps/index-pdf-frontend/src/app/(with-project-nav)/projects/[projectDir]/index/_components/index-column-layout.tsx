import type { ReactNode } from "react";

type IndexColumnLayoutProps = {
	children: ReactNode;
};

/**
 * Shared multi-column scroll container for index views.
 * Content fills the available height from the flex chain in page.tsx, then
 * overflows into additional columns that scroll horizontally.
 */
export const IndexColumnLayout = ({ children }: IndexColumnLayoutProps) => (
	<div className="h-full overflow-x-auto overflow-y-hidden font-merriweather">
		<div className="h-full columns-[20ch] gap-8" style={{ columnFill: "auto" }}>
			{children}
		</div>
	</div>
);
