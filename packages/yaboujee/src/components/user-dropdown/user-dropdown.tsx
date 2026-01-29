"use client";

import { Button } from "@pubint/yabasic/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@pubint/yabasic/components/ui/dropdown-menu";
import { LogOut, Settings, User } from "lucide-react";

export type UserDropdownProps = {
	userName?: string;
	userEmail?: string;
	onSettingsClick?: () => void;
	onSignOutClick?: () => void;
	className?: string;
};

export const UserDropdown = ({
	userName = "User",
	userEmail,
	onSettingsClick,
	onSignOutClick,
	className,
}: UserDropdownProps) => {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={(props) => (
					<Button {...props} variant="ghost" size="icon" className={className}>
						<User />
						<span className="sr-only">User menu</span>
					</Button>
				)}
			/>
			<DropdownMenuContent align="end" className="w-56">
				<div className="flex flex-col space-y-1 px-2 py-1.5">
					<p className="text-sm font-medium">{userName}</p>
					{userEmail && (
						<p className="text-muted-foreground text-xs">{userEmail}</p>
					)}
				</div>
				<DropdownMenuSeparator />
				<DropdownMenuItem onClick={onSettingsClick}>
					<Settings />
					Settings
				</DropdownMenuItem>
				<DropdownMenuItem variant="destructive" onClick={onSignOutClick}>
					<LogOut />
					Sign out
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};
