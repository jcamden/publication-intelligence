"use client";

import {
	type Theme,
	ThemeToggle,
} from "@pubint/yabasic/components/ui/theme-toggle";
import { cn } from "@pubint/yabasic/lib/utils";
import { Logo, UserDropdown } from "@pubint/yaboujee";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export type ProjectNavbarProps = {
	userName?: string;
	userEmail?: string;
	className?: string;
	theme?: Theme;
	onThemeToggle?: () => void;
	onSignOutClick?: () => void;
	showOnlyProjectsLink?: boolean;
};

export const ProjectNavbar = ({
	userName,
	userEmail,
	className,
	theme = "light",
	onThemeToggle,
	onSignOutClick,
	showOnlyProjectsLink = false,
}: ProjectNavbarProps) => {
	const pathname = usePathname();
	const router = useRouter();

	const isProjectSpecificRoute =
		pathname.startsWith("/projects/") && pathname !== "/projects";

	const projectDir = pathname.match(/^\/projects\/([^/]+)/)?.[1];

	const navItems = [
		{
			label: "Index",
			href: projectDir ? `/projects/${projectDir}/index` : "/projects/index",
		},
		{
			label: "Editor",
			href: projectDir ? `/projects/${projectDir}/editor` : "/projects/editor",
		},
		{ label: "Projects", href: "/projects" },
	];

	const shouldShowNav = showOnlyProjectsLink || isProjectSpecificRoute;
	const itemsToShow = showOnlyProjectsLink
		? navItems.filter((item) => item.label === "Projects")
		: navItems;

	const handleSettingsClick = () => {
		router.push("/settings");
	};

	const handleSignOutClick = () => {
		if (onSignOutClick) {
			onSignOutClick();
		} else {
			router.push("/api/auth/signout");
		}
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
					{shouldShowNav && (
						<div className="flex items-center gap-1">
							{itemsToShow.map((item) => {
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
					)}
					{onThemeToggle && (
						<ThemeToggle theme={theme} onToggle={onThemeToggle} />
					)}
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
