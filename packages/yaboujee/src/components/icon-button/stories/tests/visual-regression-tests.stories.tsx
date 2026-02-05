import { defaultGlobals, defaultVrtMeta } from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/react";
import {
	CloseButton,
	MaximizeButton,
	PopButton,
	UnpopButton,
} from "../../index";
import {
	defaultCloseButtonArgs,
	defaultMaximizeButtonArgs,
	defaultPopButtonArgs,
	defaultUnpopButtonArgs,
} from "../shared";

const meta: Meta = {
	...defaultVrtMeta,
	title: "Components/IconButton/tests/Visual Regression Tests",
	parameters: {
		...defaultVrtMeta.parameters,
	},
};

export default meta;

const renderAllVariants = () => (
	<div
		style={{
			display: "flex",
			gap: "16px",
			padding: "20px",
			flexWrap: "wrap",
		}}
	>
		<div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
			<div style={{ fontSize: "12px", fontWeight: "bold" }}>Close</div>
			<CloseButton {...defaultCloseButtonArgs} />
			<CloseButton {...defaultCloseButtonArgs} disabled />
		</div>

		<div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
			<div style={{ fontSize: "12px", fontWeight: "bold" }}>Maximize</div>
			<MaximizeButton {...defaultMaximizeButtonArgs} isMaximized={false} />
			<MaximizeButton {...defaultMaximizeButtonArgs} isMaximized={true} />
			<MaximizeButton {...defaultMaximizeButtonArgs} disabled />
		</div>

		<div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
			<div style={{ fontSize: "12px", fontWeight: "bold" }}>Pop</div>
			<PopButton {...defaultPopButtonArgs} />
			<PopButton {...defaultPopButtonArgs} disabled />
		</div>

		<div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
			<div style={{ fontSize: "12px", fontWeight: "bold" }}>Unpop Left</div>
			<UnpopButton {...defaultUnpopButtonArgs} side="left" />
			<UnpopButton {...defaultUnpopButtonArgs} side="left" disabled />
		</div>

		<div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
			<div style={{ fontSize: "12px", fontWeight: "bold" }}>Unpop Right</div>
			<UnpopButton {...defaultUnpopButtonArgs} side="right" />
			<UnpopButton {...defaultUnpopButtonArgs} side="right" disabled />
		</div>
	</div>
);

/**
 * All button variants in default state
 */
export const AllVariants: StoryObj = {
	globals: {
		...defaultGlobals,
		viewport: { value: "mobile1", isRotated: true },
	},
	render: renderAllVariants,
};

/**
 * All button variants in dark mode
 */
export const AllVariantsDark: StoryObj = {
	globals: {
		...defaultGlobals,
		viewport: { value: "mobile1", isRotated: true },
		theme: "dark",
	},
	render: renderAllVariants,
};
