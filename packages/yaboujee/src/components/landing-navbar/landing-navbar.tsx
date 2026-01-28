"use client";

import { Button } from "@pubint/yabasic/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@pubint/yabasic/components/ui/dropdown-menu";
import { Menu } from "lucide-react";
import Link from "next/link";
import { Logo } from "../logo/logo";
import type { Theme } from "../theme-toggle/theme-toggle";
import { ThemeToggle } from "../theme-toggle/theme-toggle";

type LandingNavbarProps = {
	theme: Theme;
	onThemeToggle: () => void;
	showAuthLinks?: boolean;
};

export const LandingNavbar = ({
	theme,
	onThemeToggle,
	showAuthLinks = true,
}: LandingNavbarProps) => {
	return (
		<nav className="fixed top-0 w-full bg-background/80 backdrop-blur-sm border-b border-border z-50">
			<div className="px-4 sm:px-8 md:px-16 lg:px-28 py-3 sm:py-4 flex justify-between items-center">
				<Link href="/">
					<Logo variant="gradient" size="sm" className="sm:text-4xl" />
				</Link>

				{/* Desktop Navigation */}
				<div className="hidden sm:flex items-center gap-2 sm:gap-4 md:gap-6">
					{showAuthLinks && (
						<>
							<Link
								href="/login"
								className="text-sm sm:text-base text-muted-foreground hover:text-foreground transition-colors"
							>
								Sign In
							</Link>
							<Button size="sm" className="sm:h-11 sm:px-8">
								<Link href="/signup">Get Started</Link>
							</Button>
						</>
					)}
					<ThemeToggle theme={theme} onToggle={onThemeToggle} />
				</div>

				{/* Mobile Navigation */}
				<div className="flex sm:hidden items-center gap-2">
					<DropdownMenu>
						<DropdownMenuTrigger>
							<Button variant="ghost" size="icon-lg">
								<Menu className="size-6" />
								<span className="sr-only">Open menu</span>
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-48">
							{showAuthLinks && (
								<>
									<DropdownMenuItem>
										<Link href="/login" className="w-full">
											Sign In
										</Link>
									</DropdownMenuItem>
									<DropdownMenuItem>
										<Link href="/signup" className="w-full">
											Get Started
										</Link>
									</DropdownMenuItem>
									<DropdownMenuSeparator />
								</>
							)}
							<DropdownMenuItem>
								<button
									type="button"
									onClick={onThemeToggle}
									className="w-full text-left"
								>
									Toggle Theme ({theme === "light" ? "Dark" : "Light"})
								</button>
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>
		</nav>
	);
};
