import { cva, type VariantProps } from "class-variance-authority";
import { clsx } from "clsx";

const logoVariants = cva(
	"font-display font-normal tracking-tighter transition-colors duration-200",
	{
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
					"bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent",
				light: "text-white",
				dark: "text-neutral-900",
			},
		},
		defaultVariants: {
			size: "md",
			variant: "primary",
		},
	},
);

export type LogoProps = VariantProps<typeof logoVariants> & {
	className?: string;
	href?: string;
};

export const Logo = ({ size, variant, className, href }: LogoProps) => {
	const logoElement = (
		<span className={clsx(logoVariants({ size, variant }), className)}>
			IndexPDF
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
