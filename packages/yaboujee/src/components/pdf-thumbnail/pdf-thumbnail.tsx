"use client";

import { FileIcon } from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";
import { useEffect, useRef, useState } from "react";

if (typeof window !== "undefined" && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
	pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
}

type LoadingState = "idle" | "loading" | "success" | "error";

export type PdfThumbnailProps = {
	source: string | File;
	alt: string;
	aspectRatio?: "a4" | "letter" | "square";
	className?: string;
	onLoadPdf?: ({ numPages }: { numPages: number }) => void;
};

const ASPECT_RATIOS = {
	a4: Math.SQRT2,
	letter: 1.294,
	square: 1,
};

export const PdfThumbnail = ({
	source,
	alt,
	aspectRatio = "a4",
	className = "",
	onLoadPdf,
}: PdfThumbnailProps) => {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [loadingState, setLoadingState] = useState<LoadingState>("idle");
	const [imageUrl, setImageUrl] = useState<string | null>(null);

	useEffect(() => {
		let isCancelled = false;
		let objectUrl: string | null = null;

		const loadThumbnail = async () => {
			if (!canvasRef.current) return;

			setLoadingState("loading");

			try {
				let pdfUrl: string;

				if (typeof source === "string") {
					pdfUrl = source;
				} else {
					objectUrl = URL.createObjectURL(source);
					pdfUrl = objectUrl;
				}

				const loadingTask = pdfjsLib.getDocument(pdfUrl);
				const pdf = await loadingTask.promise;

				if (isCancelled) {
					await pdf.destroy();
					return;
				}

				// Notify parent component of page count
				if (onLoadPdf) {
					onLoadPdf({ numPages: pdf.numPages });
				}

				const page = await pdf.getPage(1);

				if (isCancelled) {
					await pdf.destroy();
					return;
				}

				const canvas = canvasRef.current;
				if (!canvas) {
					await pdf.destroy();
					return;
				}

				const context = canvas.getContext("2d");
				if (!context) {
					await pdf.destroy();
					return;
				}

				const viewport = page.getViewport({ scale: 1 });
				const targetWidth = 300;
				const scale = targetWidth / viewport.width;
				const scaledViewport = page.getViewport({ scale });

				canvas.width = scaledViewport.width;
				canvas.height = scaledViewport.height;

				await page.render({
					canvasContext: context,
					viewport: scaledViewport,
				}).promise;

				if (!isCancelled && canvas) {
					const dataUrl = canvas.toDataURL("image/png");
					setImageUrl(dataUrl);
					setLoadingState("success");
				}

				await pdf.destroy();
			} catch (error) {
				if (!isCancelled) {
					console.error("Error loading PDF thumbnail:", error);
					setLoadingState("error");
				}
			}
		};

		loadThumbnail();

		return () => {
			isCancelled = true;
			if (objectUrl) {
				URL.revokeObjectURL(objectUrl);
			}
		};
	}, [source, onLoadPdf]);

	const ratio = ASPECT_RATIOS[aspectRatio];

	return (
		<div
			className={`relative rounded-lg overflow-hidden shadow-md ${className}`}
		>
			<div
				className="relative bg-muted"
				style={{ paddingBottom: `${ratio * 100}%` }}
			>
				{loadingState === "loading" && (
					<div className="absolute inset-0 flex items-center justify-center">
						<div
							data-testid="pdf-thumbnail-loading-spinner"
							className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"
						/>
					</div>
				)}

				{loadingState === "error" && (
					<div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
						<FileIcon className="h-12 w-12 mb-2" />
						<p className="text-xs">Failed to load thumbnail</p>
					</div>
				)}

				{loadingState === "success" && imageUrl && (
					// biome-ignore lint/performance/noImgElement: Using data URL from canvas, not suitable for Next.js Image
					<img
						src={imageUrl}
						alt={alt}
						className="absolute inset-0 h-full w-full object-cover"
					/>
				)}

				<canvas ref={canvasRef} className="hidden" />
			</div>
		</div>
	);
};
