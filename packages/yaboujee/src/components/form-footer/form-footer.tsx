import Link from "next/link";

export type FormFooterProps = {
	text: string;
	linkText: string;
	linkHref: string;
	className?: string;
};

export const FormFooter = ({
	text,
	linkText,
	linkHref,
	className = "",
}: FormFooterProps) => {
	return (
		<div className={`text-center text-sm ${className}`}>
			<span className="text-muted-foreground">{text} </span>
			<Link
				href={linkHref}
				className="text-primary hover:underline font-medium"
			>
				{linkText}
			</Link>
		</div>
	);
};
