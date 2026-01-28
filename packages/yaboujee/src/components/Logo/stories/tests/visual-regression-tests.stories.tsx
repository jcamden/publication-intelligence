import {
	defaultGlobals,
	visualRegressionTestConfig,
} from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/react";
import { Logo } from "../../logo";

export default {
	title: "Components/Logo/tests/Visual Regression Tests",
	component: Logo,
	tags: ["visual-regression"],
	parameters: {
		...visualRegressionTestConfig,
	},
} satisfies Meta<typeof Logo>;

export const AllVariantsComparison: StoryObj<typeof Logo> = {
	globals: {
		...defaultGlobals,
		viewport: { value: "mobile1" },
	},
	render: () => (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				gap: "32px",
				padding: "32px",
			}}
		>
			<div>
				<Logo variant="primary" size="md" />
			</div>
			<div>
				<Logo variant="gradient" size="md" />
			</div>
			<div>
				<Logo variant="dark" size="md" />
			</div>
			<div className="flex">
				<div className="bg-black">
					<Logo variant="light" size="md" />
				</div>
			</div>
		</div>
	),
};

export const AllVariantsComparisonDark: StoryObj<typeof Logo> = {
	globals: {
		...defaultGlobals,
		theme: "dark",
		viewport: { value: "mobile1" },
	},
	render: () => (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				gap: "32px",
				padding: "32px",
			}}
		>
			<div>
				<Logo variant="primary" size="md" />
			</div>
			<div>
				<Logo variant="gradient" size="md" />
			</div>
			<div>
				<Logo variant="dark" size="md" />
			</div>
			<div className="flex">
				<div className="bg-black">
					<Logo variant="light" size="md" />
				</div>
			</div>
		</div>
	),
};

export const AllSizesComparison: StoryObj<typeof Logo> = {
	globals: {
		...defaultGlobals,
		viewport: { value: "mobile2", isRotated: true },
	},
	render: () => (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				gap: "24px",
				padding: "32px",
				alignItems: "flex-start",
			}}
		>
			<Logo size="sm" variant="gradient" />
			<Logo size="md" variant="gradient" />
			<Logo size="lg" variant="gradient" />
			<Logo size="xl" variant="gradient" />
		</div>
	),
};

export const AllSizesComparisonDark: StoryObj<typeof Logo> = {
	globals: {
		...defaultGlobals,
		viewport: { value: "mobile2", isRotated: true },
		theme: "dark",
	},
	render: () => (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				gap: "24px",
				padding: "32px",
				alignItems: "flex-start",
			}}
		>
			<Logo size="sm" variant="gradient" />
			<Logo size="md" variant="gradient" />
			<Logo size="lg" variant="gradient" />
			<Logo size="xl" variant="gradient" />
		</div>
	),
};
