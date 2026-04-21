import { atomWithStorage } from "jotai/utils";

export const mentionCreationShowPageSublocationAtom = atomWithStorage(
	"editor-mention-creation-show-page-sublocation",
	false,
);

export const pdfSectionVisibleAtom = atomWithStorage(
	"pdf-section-visible",
	true,
);
export const pdfSectionLastWidthAtom = atomWithStorage(
	"pdf-section-last-width",
	50,
);

export const MIN_SIDEBAR_WIDTH = 18.75;
export const MIN_PDF_WIDTH = 15;
export const PDF_RESTORE_MARGIN = 3;
