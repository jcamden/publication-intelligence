"use client";

import { Card } from "@pubint/yabasic/components/ui/card";
import { cn } from "@pubint/yabasic/lib/utils";
import type { ReactNode } from "react";
import { Rnd } from "react-rnd";
import { useHasScrollbars } from "./use-has-scrollbars";
import { WindowFrame } from "./window-frame";
import { WindowTopBar } from "./window-top-bar";

export type WindowProps = {
	id: string;
	title: string;
	children: ReactNode;
	zIndex: number;
	isMaximized: boolean;
	sidebarCollapsed: boolean;
	position: { x: number; y: number }; // in rem
	size: { width: number; height: number }; // in rem
	onUnpop: () => void;
	onMaximize: () => void;
	onPositionChange: (position: { x: number; y: number }) => void;
	onSizeChange: (size: { width: number; height: number }) => void;
	onResizeStop?: (data: {
		position: { x: number; y: number };
		size: { width: number; height: number };
	}) => void;
	onFocus: () => void;
};

export const Window = ({
	id: _id,
	title,
	children,
	zIndex,
	isMaximized,
	sidebarCollapsed,
	position,
	size,
	onUnpop,
	onMaximize,
	onPositionChange,
	onSizeChange,
	onResizeStop,
	onFocus,
}: WindowProps) => {
	const {
		hasHorizontalScrollbar,
		hasVerticalScrollbar,
		ref,
		setUpdatingScrollbars,
	} = useHasScrollbars();

	const remToPx = ({ rem }: { rem: number }) => rem * 16;
	const pxToRem = ({ px }: { px: number }) => px / 16;

	return (
		<Rnd
			size={{
				width: remToPx({ rem: size.width }),
				height: remToPx({ rem: size.height }),
			}}
			position={{
				x: remToPx({ rem: position.x }),
				y: remToPx({ rem: position.y }),
			}}
			onMouseDown={onFocus}
			onResizeStart={onFocus}
			onDragStop={(_e, d) => {
				onPositionChange({
					x: pxToRem({ px: d.x }),
					y: pxToRem({ px: d.y }),
				});
			}}
			onResizeStop={(_e, _direction, refElement, _delta, position) => {
				const newSize = {
					width: pxToRem({ px: Number.parseInt(refElement.style.width, 10) }),
					height: pxToRem({ px: Number.parseInt(refElement.style.height, 10) }),
				};
				const newPosition = {
					x: pxToRem({ px: position.x }),
					y: pxToRem({ px: position.y }),
				};

				if (onResizeStop) {
					onResizeStop({ position: newPosition, size: newSize });
				} else {
					onSizeChange(newSize);
					onPositionChange(newPosition);
				}
				setUpdatingScrollbars(true);
			}}
			dragHandleClassName="drag-handle"
			style={{
				zIndex,
			}}
			disableDragging={isMaximized}
			enableResizing={!isMaximized}
		>
			<Card className="overflow-hidden p-0 h-full flex flex-col">
				<WindowTopBar
					title={title}
					isMaximized={isMaximized}
					sidebarCollapsed={sidebarCollapsed}
					onUnpop={onUnpop}
					onMaximize={onMaximize}
				/>
				<div
					ref={ref}
					className={cn("flex h-full overflow-scroll scrollbar", {
						"overflow-y-hidden": !hasVerticalScrollbar,
						"overflow-x-hidden": !hasHorizontalScrollbar,
					})}
				>
					<WindowFrame edge="left" />
					<div className="flex flex-col h-full flex-1">
						<div className="flex-1 p-4">{children}</div>
						<WindowFrame
							edge={hasHorizontalScrollbar ? "bottomWithScrollbar" : "bottom"}
						/>
					</div>
					<WindowFrame
						edge={hasVerticalScrollbar ? "rightWithScrollbar" : "right"}
					/>
				</div>
			</Card>
		</Rnd>
	);
};
