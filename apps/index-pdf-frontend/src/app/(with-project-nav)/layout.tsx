import type { ReactNode } from "react";
import { ProjectNavLayout } from "./_components/project-nav-layout";

export default function WithProjectNavLayout({
	children,
}: {
	children: ReactNode;
}) {
	return <ProjectNavLayout>{children}</ProjectNavLayout>;
}
