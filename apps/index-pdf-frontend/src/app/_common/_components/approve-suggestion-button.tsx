"use client";

import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@pubint/yabasic/components/ui/tooltip";
import { Bot, BotOff } from "lucide-react";
import { cloneElement, useId, useState } from "react";

type ApproveSuggestionButtonProps = {
	onClick: (e: React.MouseEvent) => void;
	disabled: boolean;
	size?: "sm" | "md";
};

const GradientIcon = ({ children }: { children: React.ReactElement }) => {
	const uniqueId = useId();
	const gradientId = `bot-gradient-${uniqueId}`;

	return (
		<>
			<svg
				width={20}
				height={20}
				className="w-5 h-5 dark:hidden"
				role="img"
				aria-label="AI suggestion"
			>
				<defs>
					<linearGradient
						id={`${gradientId}-light`}
						x1="0%"
						y1="0%"
						x2="100%"
						y2="100%"
					>
						<stop offset="0%" stopColor="#93c5fd" />
						<stop offset="100%" stopColor="#d8b4fe" />
					</linearGradient>
				</defs>
				{cloneElement(children, {
					fill: `url(#${gradientId}-light)`,
					stroke: "#5d5391",
				} as React.SVGProps<SVGElement>)}
			</svg>
			<svg
				width={20}
				height={20}
				className="w-5 h-5 hidden dark:block"
				role="img"
				aria-label="AI suggestion"
			>
				<defs>
					<linearGradient
						id={`${gradientId}-dark`}
						x1="0%"
						y1="0%"
						x2="100%"
						y2="100%"
					>
						<stop offset="0%" stopColor="#3b82f6" />
						<stop offset="100%" stopColor="#9333ea" />
					</linearGradient>
				</defs>
				{cloneElement(children, {
					fill: `url(#${gradientId}-dark)`,
					stroke: "#c0b5f5",
				} as React.SVGProps<SVGElement>)}
			</svg>
		</>
	);
};

export const ApproveSuggestionButton = ({
	onClick,
	disabled,
	size = "md",
}: ApproveSuggestionButtonProps) => {
	const [isHovered, setIsHovered] = useState(false);
	const sizeClasses = size === "sm" ? "h-7 w-7" : "h-8 w-8";

	return (
		<Tooltip delay={500}>
			<TooltipTrigger
				render={
					<div>
						<button
							type="button"
							onClick={onClick}
							disabled={disabled}
							onMouseEnter={() => setIsHovered(true)}
							onMouseLeave={() => setIsHovered(false)}
							className={`${sizeClasses} flex-shrink-0 flex items-center justify-center hover:bg-green-100 rounded dark:hover:bg-green-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
						>
							{isHovered ? (
								<BotOff className="w-5 h-5 text-green-600 dark:text-green-400" />
							) : (
								<GradientIcon>
									<Bot width={20} height={20} />
								</GradientIcon>
							)}
						</button>
					</div>
				}
			/>
			<TooltipContent>Approve Suggestion</TooltipContent>
		</Tooltip>
	);
};
