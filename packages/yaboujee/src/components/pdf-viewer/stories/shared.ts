import type { PdfViewerProps } from "../pdf-viewer";

export const defaultArgs: Pick<PdfViewerProps, "url" | "scale"> = {
	url: "/sample.pdf",
	scale: 1.25,
};
