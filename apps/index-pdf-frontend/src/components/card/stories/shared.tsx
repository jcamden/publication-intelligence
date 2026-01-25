import type { CardProps } from "../index";

export const ExampleCardChildren = () => {
	return (
		<div className="flex flex-col gap-4 text-base font-sans">
			<h2 className="m-0 text-2xl">Document Preview</h2>
			<span>
				This is an example card component that can be used to display document
				information, file previews, or other content in a contained layout.
			</span>
			<a href="https://example.com" className="max-w-max text-blue-600">
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
