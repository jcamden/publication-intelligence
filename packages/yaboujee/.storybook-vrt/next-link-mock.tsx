import type React from "react";

type LinkProps = {
	href: string;
	children: React.ReactNode;
	className?: string;
	prefetch?: boolean;
	replace?: boolean;
	scroll?: boolean;
	shallow?: boolean;
	passHref?: boolean;
	legacyBehavior?: boolean;
};

const Link = ({ href, children, className, ...props }: LinkProps) => {
	return (
		<a href={href} className={className} {...props}>
			{children}
		</a>
	);
};

export default Link;
