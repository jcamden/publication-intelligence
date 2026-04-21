import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

// IndexEntry, IndexType, and Mentions state migrated to tRPC queries in Phase 5
// See: editor.tsx for tRPC query usage

export const currentPageAtom = atomWithStorage("pdf-current-page", 1);
export const totalPagesAtom = atom(0);
export const zoomAtom = atomWithStorage("pdf-zoom", 1.7);
export const pdfUrlAtom = atom<string | null>(null);
