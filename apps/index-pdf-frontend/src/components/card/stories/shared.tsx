import type { CardProps } from "../index";

export const ExampleCardChildren = () => {
	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				gap: "16px",
				fontSize: "16px",
				fontFamily: "system-ui, sans-serif",
			}}
		>
			<h2 style={{ margin: 0, fontSize: "24px" }}>Document Preview</h2>
			<span>
				This is an example card component that can be used to display document
				information, file previews, or other content in a contained layout.
			</span>
			<a
				href="https://example.com"
				style={{ maxWidth: "max-content", color: "#0066cc" }}
			>
				View Document
			</a>
		</div>
	);
};

export const defaultArgs: Partial<CardProps> = {
	children: <ExampleCardChildren />,
	elevation: undefined,
};

export const defaultVariantProps: CardProps = {
	children: null,
};

export const withContentsProps: CardProps = {
	children: <ExampleCardChildren />,
	elevation: undefined,
};

export const withContentsAndElevationProps: CardProps = {
	children: <ExampleCardChildren />,
	elevation: "low",
};

export type ComponentRecord<T> = Record<
	string,
	{
		props: T;
	}
>;

export const cardsMap: ComponentRecord<Partial<CardProps>> = {
	Default: {
		props: defaultVariantProps,
	},
	"With Contents": {
		props: withContentsProps,
	},
	"With Contents And Elevation": {
		props: withContentsAndElevationProps,
	},
};
