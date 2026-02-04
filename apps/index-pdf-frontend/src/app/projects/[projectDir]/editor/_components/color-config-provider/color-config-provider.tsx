"use client";

import { useAtomValue } from "jotai";
import { useEffect } from "react";
import { colorConfigAtom } from "../../_atoms/editor-atoms";
import { injectColorVariables } from "../../_utils/color-utils";

/**
 * Provider that injects color configuration CSS variables
 * into the document root when config changes
 */
export const ColorConfigProvider = ({
	children,
}: {
	children: React.ReactNode;
}) => {
	const colorConfig = useAtomValue(colorConfigAtom);

	useEffect(() => {
		injectColorVariables({ config: colorConfig });
	}, [colorConfig]);

	return <>{children}</>;
};
