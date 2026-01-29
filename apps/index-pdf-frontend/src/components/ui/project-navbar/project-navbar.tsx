"use client";

import { Logo, UserDropdown } from "@pubint/yaboujee";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export type ProjectNavbarProps = {
	userName?: string;
	userEmail?: string;
	className?: string;
};

const navItems = [
	{ label: "Editor", href: "/projects/editor" },
	{ label: "Index", href: "/projects/index" },
	{ label: "Projects", href: "/projects" },
];

export const ProjectNavbar = ({
	userName,
	userEmail,
	className,
}: ProjectNavbarProps) => {
	const pathname = usePathname();
	const router = useRouter();

	const handleSettingsClick = () => {
		router.push("/settings");
	};

	const handleSignOutClick = () => {
		router.push("/api/auth/signout");
	};

	return (
		<nav
			className={cn(
				"border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full border-b",
				className,
			)}
		>
			<div className="mx-auto flex h-14 items-center justify-between px-4">
				<Link href="/" className="flex items-center">
					<Logo variant="gradient" size="sm" />
				</Link>
				<div className="flex items-center gap-6">
					<div className="flex items-center gap-1">
						{navItems.map((item) => {
							const isActive = pathname === item.href;
							return (
								<Link
									key={item.href}
									href={item.href}
									className={cn(
										"text-muted-foreground hover:text-foreground rounded-md px-3 py-2 text-sm font-medium transition-colors",
										isActive && "bg-muted text-foreground",
									)}
								>
									{item.label}
								</Link>
							);
						})}
					</div>
					<UserDropdown
						userName={userName}
						userEmail={userEmail}
						onSettingsClick={handleSettingsClick}
						onSignOutClick={handleSignOutClick}
					/>
				</div>
			</div>
		</nav>
	);
};
