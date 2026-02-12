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
import type { Theme } from "./theme-toggle";
import { ThemeToggle } from "./theme-toggle";

type LandingNavbarProps = {
	theme: Theme;
	onThemeToggle: () => void;
	showAuthLinks?: boolean;
	logo: React.ReactNode;
	homeLink?: React.ReactNode;
	signInLink?: React.ReactNode;
	signUpLink?: React.ReactNode;
};

export const LandingNavbar = ({
	theme,
	onThemeToggle,
	showAuthLinks = true,
	logo,
	homeLink,
	signInLink,
	signUpLink,
}: LandingNavbarProps) => {
	const defaultHomeLink = <a href="/">{logo}</a>;
	const defaultSignInLink = (
		<a
			href="/login"
			className="text-sm sm:text-base text-muted-foreground hover:text-foreground transition-colors"
		>
			Sign In
		</a>
	);
	const defaultSignUpLink = (
		<a href="/signup" className="w-full">
			Get Started
		</a>
	);

	return (
		<nav className="fixed top-0 w-full bg-background/80 backdrop-blur-sm border-b border-border z-50">
			<div className="px-4 sm:px-8 md:px-16 lg:px-28 py-3 sm:py-4 flex justify-between items-center">
				{homeLink || defaultHomeLink}

				{/* Desktop Navigation */}
				<div className="hidden sm:flex items-center gap-2 sm:gap-4 md:gap-6">
					{showAuthLinks && (
						<>
							{signInLink || defaultSignInLink}
							<Button size="sm" className="sm:h-11 sm:px-8">
								{signUpLink || defaultSignUpLink}
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
										{signInLink || defaultSignInLink}
									</DropdownMenuItem>
									<DropdownMenuItem>
										{signUpLink || defaultSignUpLink}
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
