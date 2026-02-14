import { exec } from "node:child_process";
import { existsSync } from "node:fs";
import { unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import type { BBox, TextAtom } from "@pubint/core";

const execPromise = promisify(exec);

const __dirname = fileURLToPath(new URL(".", import.meta.url));

// ============================================================================
// Types
// ============================================================================

export type Region = {
	page_number: number;
	x0: number;
	y0: number;
	x1: number;
	y1: number;
};

export type PageMemory = {
	pages: Map<number, TextAtom[]>;
};

export type PyMuPDFWord = {
	text: string;
	bbox: BBox;
	block_no: number;
	line_no: number;
	word_no: number;
};

export type PyMuPDFPage = {
	page_number: number;
	text: string;
	words: PyMuPDFWord[];
	dimensions: {
		width: number;
		height: number;
	};
};

export type PyMuPDFResult = {
	pages: PyMuPDFPage[];
};

// ============================================================================
// PyMuPDF Extraction
// ============================================================================

export const callPyMuPDFExtractor = async ({
	pdfPath,
	pages,
}: {
	pdfPath: string;
	pages?: number[];
}): Promise<PyMuPDFResult> => {
	if (!existsSync(pdfPath)) {
		throw new Error(`PDF file not found: ${pdfPath}`);
	}

	const extractorPath = join(
		__dirname,
		"../../../../../apps/index-pdf-extractor/extract_pdf.py",
	);

	if (!existsSync(extractorPath)) {
		throw new Error(`PyMuPDF extractor not found at: ${extractorPath}`);
	}

	// Use venv Python interpreter
	const venvPython = join(
		__dirname,
		"../../../../../apps/index-pdf-extractor/venv/bin/python",
	);

	if (!existsSync(venvPython)) {
		throw new Error(
			`Python venv not found at: ${venvPython}. Please run: cd apps/index-pdf-extractor && python3.11 -m venv venv && source venv/bin/activate && pip install -e .`,
		);
	}

	const tempOutputPath = join(tmpdir(), `pdf-extract-${Date.now()}.json`);

	try {
		const pagesArg =
			pages && pages.length > 0 ? `--pages ${pages.join(",")}` : "";

		const command = `"${venvPython}" "${extractorPath}" "${pdfPath}" "${tempOutputPath}" ${pagesArg}`;

		const { stderr } = await execPromise(command, {
			maxBuffer: 10 * 1024 * 1024,
		});

		if (stderr && !stderr.includes("Extraction complete")) {
			console.warn("PyMuPDF stderr:", stderr);
		}

		const outputContent = await import("node:fs/promises").then((fs) =>
			fs.readFile(tempOutputPath, "utf-8"),
		);
		const result = JSON.parse(outputContent) as PyMuPDFResult;

		await unlink(tempOutputPath);

		return result;
	} catch (error) {
		try {
			await unlink(tempOutputPath);
		} catch {
			// Ignore cleanup errors
		}

		throw new Error(
			`PyMuPDF extraction failed: ${error instanceof Error ? error.message : String(error)}`,
		);
	}
};

// ============================================================================
// Region Filtering
// ============================================================================

export const isWordInExcludeRegion = ({
	word,
	pageNumber,
	excludeRegions,
}: {
	word: PyMuPDFWord;
	pageNumber: number;
	excludeRegions: Region[];
}): boolean => {
	const pageRegions = excludeRegions.filter(
		(r) => r.page_number === pageNumber,
	);

	if (pageRegions.length === 0) {
		return false;
	}

	const wordBBox = word.bbox;

	for (const region of pageRegions) {
		const overlapX =
			Math.max(wordBBox.x0, region.x0) < Math.min(wordBBox.x1, region.x1);
		const overlapY =
			Math.max(wordBBox.y0, region.y0) < Math.min(wordBBox.y1, region.y1);

		if (overlapX && overlapY) {
			return true;
		}
	}

	return false;
};

// ============================================================================
// TextAtom Conversion
// ============================================================================

export const convertToFilteredTextAtoms = ({
	pymudfResult,
	excludeRegions,
}: {
	pymudfResult: PyMuPDFResult;
	excludeRegions: Region[];
}): Map<number, TextAtom[]> => {
	const pageMap = new Map<number, TextAtom[]>();

	for (const page of pymudfResult.pages) {
		const pageNumber = page.page_number;
		const textAtoms: TextAtom[] = [];
		let charOffset = 0;

		for (let i = 0; i < page.words.length; i++) {
			const word = page.words[i];
			const isIndexable = !isWordInExcludeRegion({
				word,
				pageNumber,
				excludeRegions,
			});

			// Convert PyMuPDF bbox (bottom-left origin) to PDF.js (top-left origin)
			const convertedBBox: BBox = {
				x0: word.bbox.x0,
				y0: page.dimensions.height - word.bbox.y1,
				x1: word.bbox.x1,
				y1: page.dimensions.height - word.bbox.y0,
			};

			const atom: TextAtom = {
				id: `atom_${pageNumber}_${i}`,
				word: word.text,
				bbox: convertedBBox,
				charStart: charOffset,
				charEnd: charOffset + word.text.length,
				pageNumber,
				sequence: i,
				isIndexable,
			};

			textAtoms.push(atom);
			charOffset += word.text.length + 1;
		}

		pageMap.set(pageNumber, textAtoms);
	}

	return pageMap;
};

// ============================================================================
// Page Extraction
// ============================================================================

export const extractPages = async ({
	pdfPath,
	pageNumbers,
	excludeRegions,
}: {
	pdfPath: string;
	pageNumbers: number[];
	excludeRegions: Region[];
}): Promise<Map<number, TextAtom[]>> => {
	const result = await callPyMuPDFExtractor({
		pdfPath,
		pages: pageNumbers,
	});

	return convertToFilteredTextAtoms({
		pymudfResult: result,
		excludeRegions,
	});
};

// ============================================================================
// Prompt Text Building
// ============================================================================

const extractTailText = ({
	atoms,
	percentage,
}: {
	atoms: TextAtom[];
	percentage: number;
}): string => {
	const indexableAtoms = atoms.filter((a) => a.isIndexable);
	const count = Math.max(1, Math.floor(indexableAtoms.length * percentage));
	return indexableAtoms
		.slice(-count)
		.map((a) => a.word)
		.join(" ");
};

const extractHeadText = ({
	atoms,
	percentage,
}: {
	atoms: TextAtom[];
	percentage: number;
}): string => {
	const indexableAtoms = atoms.filter((a) => a.isIndexable);
	const count = Math.max(1, Math.floor(indexableAtoms.length * percentage));
	return indexableAtoms
		.slice(0, count)
		.map((a) => a.word)
		.join(" ");
};

const extractFullText = ({ atoms }: { atoms: TextAtom[] }): string => {
	return atoms
		.filter((a) => a.isIndexable)
		.map((a) => a.word)
		.join(" ");
};

// Recalculate character positions for indexable atoms only
export const recalculateCharPositionsForIndexable = ({
	atoms,
}: {
	atoms: TextAtom[];
}): TextAtom[] => {
	const indexableAtoms = atoms.filter((a) => a.isIndexable);
	let charOffset = 0;

	return indexableAtoms.map((atom) => {
		const newAtom: TextAtom = {
			...atom,
			charStart: charOffset,
			charEnd: charOffset + atom.word.length,
		};
		charOffset += atom.word.length + 1; // +1 for space
		return newAtom;
	});
};

export const buildPromptText = ({
	pageMemory,
	currentPage,
}: {
	pageMemory: PageMemory;
	currentPage: number;
}): {
	previousContext: string;
	currentPage: string;
	nextContext: string;
	fullText: string;
} => {
	const prevAtoms = pageMemory.pages.get(currentPage - 1) || [];
	const currAtoms = pageMemory.pages.get(currentPage) || [];
	const nextAtoms = pageMemory.pages.get(currentPage + 1) || [];

	const previousContext = extractTailText({
		atoms: prevAtoms,
		percentage: 0.25,
	});
	const currentPageText = extractFullText({ atoms: currAtoms });
	const nextContext = extractHeadText({ atoms: nextAtoms, percentage: 0.25 });

	const fullText = [previousContext, currentPageText, nextContext]
		.filter((s) => s.length > 0)
		.join(" ");

	return {
		previousContext,
		currentPage: currentPageText,
		nextContext,
		fullText,
	};
};
