import { cva, type VariantProps } from "class-variance-authority";
import { clsx } from "clsx";

const logoVariants = cva("font-normal transition-colors duration-200", {
	variants: {
		size: {
			sm: "text-2xl",
			md: "text-4xl",
			lg: "text-6xl",
			xl: "text-8xl",
		},
		variant: {
			primary: "text-primary",
			gradient:
				"bg-gradient-to-r from-cyan-400 to-purple-600 bg-clip-text text-transparent",
			light: "text-white",
			dark: "text-neutral-900",
		},
	},
	defaultVariants: {
		size: "md",
		variant: "primary",
	},
});

export type LogoProps = VariantProps<typeof logoVariants> & {
	className?: string;
	href?: string;
};

export const Logo = ({ size, variant, className, href }: LogoProps) => {
	const logoElement = (
		<span className={clsx(logoVariants({ size, variant }), className)}>
			<span className="font-audiowide pr-[0.085em] -tracking-[0.09em]">
				Index
			</span>
			<span className="font-anurati -tracking-[0.2em]">PD</span>
			{/* <span className="relative inline-block"> */}
			{/* Base F */}
			<span className="font-anurati -ml-[0.1em]">F</span>
			{/* Extended top bar - F positioned closer with clip mask for SEO-friendly visual effect */}
			{/* <span
					className="absolute top-0 pt-[0.05em] font-anurati pointer-events-none text-purple-500 bg-transparent pl-[0.05em]"
					style={{
						left: "-0.15em",
						clipPath: "inset(0 0 70% 0)",
					}}
					aria-hidden="true"
				>
					F
				</span> */}
			{/* </span> */}
		</span>
	);

	if (href) {
		return (
			<a
				href={href}
				className="inline-block no-underline hover:opacity-80 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-sm"
			>
				{logoElement}
			</a>
		);
	}

	return logoElement;
};
