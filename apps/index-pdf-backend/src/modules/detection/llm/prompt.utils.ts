// ============================================================================
// Prompt Building
// ============================================================================

export const buildDetectionPrompt = ({
	pageTexts,
	indexType,
	primaryPageNumber,
}: {
	pageTexts: {
		previous: string;
		current: string;
		next: string;
	};
	indexType: string;
	primaryPageNumber: number;
}): string => {
	const contextInfo = [
		pageTexts.previous &&
			`**Previous page context (last 25%):**\n${pageTexts.previous}`,
		`**Current page (page ${primaryPageNumber}, FULL TEXT):**\n${pageTexts.current}`,
		pageTexts.next && `**Next page context (first 25%):**\n${pageTexts.next}`,
	]
		.filter(Boolean)
		.join("\n\n---\n\n");

	const typeSpecificGuidance = getIndexTypeGuidance({ indexType });

	return `# Index Creation Task - ${indexType.toUpperCase()}

You are analyzing page ${primaryPageNumber} of an academic publication. Your task is to create a ${indexType} index for this page.

**IMPORTANT:** Context from adjacent pages is provided for reference only. You should ONLY create index entries and mentions for text that appears on **page ${primaryPageNumber}** (the "Current page" section below).

${contextInfo}

---

${typeSpecificGuidance}

---

**Response Requirements:**
- Create entries for significant ${indexType} items found on page ${primaryPageNumber}
- For each entry, identify ALL mentions of it on page ${primaryPageNumber}
- Each mention must have a textSpan that matches the EXACT text from the current page
- Return ONLY valid JSON following the schema in your system instructions`;
};

// ============================================================================
// Index Type Specific Guidance
// ============================================================================

const getIndexTypeGuidance = ({ indexType }: { indexType: string }): string => {
	switch (indexType) {
		case "subject":
			return `Include ALL things like proper nouns (Yahweh, Moses, Ahab, etc.), key concepts, technical terms, methods and disciplines, and any other salient topics.
			However, EXCLUDE references to scripture (e.g. Lev., Leviticus etc.) and EXCLUDE names of authors.
			Use concise nouns (e.g., for the phrase "being sold into debt" use "debt-slavery").
			For compound concepts, keep them together (e.g., "antichretic pledge" as one term).
			Be **thorough and comprehensive**: include EVERY name and important concept`;

		// 			`# Subject Index Guidelines

		// A subject index captures **concepts, topics, terms, and ideas** that readers would want to look up.

		// Include things like:
		// - Key concepts
		// - Technical terms
		// - Methods and disciplines
		// - Important topics (like money-lending, foreigner, business, etc.)
		// - Comparative themes
		// - Scholarly concepts

		// Exclude:
		// - Books of scripture
		// - Names of authors

		// **Approach:**
		// - Be **thorough and comprehensive**: (approximately 1/100 words should be indexed)
		// - Include both explicit terms AND implicit concepts being discussed
		// - Index concepts even if only discussed, not just when explicitly named
		// - Use clear, canonical terminology (e.g., "debt slavery" not "being sold into debt")
		// - For compound concepts, keep them together (e.g., "antichretic pledge" as one term)

		// **Quality over quantity:**
		// - Skip truly generic terms (e.g., "text", "author", "book" without context)
		// - Skip one-off descriptive phrases that aren't conceptual
		// - Focus on terms a scholar would want to find in an index`;

		case "author":
			return `# Author Index Guidelines

An author index captures **people mentioned, cited, or referenced** in scholarly work.

**Include:**
- **Modern scholars:** Jacob Milgrom, Bruce Wells, Sara Japhet, Bernard Levinson
- **Full names when available:** prefer "Jacob Milgrom" over just "Milgrom"
- **All citations:** even brief mentions like "Milgrom claims" or "see Wells"
- **Multiple forms:** Capture all variations (J. Milgrom, Jacob Milgrom, Milgrom)

**Exclude:**
- Biblical figures (those belong in scripture index if relevant)
- Generic references without names ("the author", "scholars suggest")
- Publishers or institutions (unless they are the actual authors)

**Guidelines:**
- Use the **most complete name form** for the entry label (e.g., "Bernard M. Levinson")
- Create ONE entry per person with all their mentions
- Be exhaustive - capture every author mention on the page
- Include footnote citations
- Typical academic page: 5-15 author mentions`;

		case "scripture":
			return `# Scripture Index Guidelines

A scripture index captures **biblical and religious text references**.

**Include:**
- **Specific verses:** Lev 25:35, Exod 21:2-6, Gen 1:1
- **Verse ranges:** Lev 25:47-50, vv. 39a-39b
- **Chapter references:** Leviticus 25, Exodus 21
- **Book references:** Leviticus, Exodus, Genesis
- **Abbreviated forms:** Lev, Exod, Gen, Ps, Deut
- **Parenthetical references:** (25:47), [24]
- **Comparative references:** "Lev 25:35–38 and 25:39–46"

**Entry label format:**
- For specific verses: Use **full book name** with verse (e.g., "Leviticus 25:35" not "Lev 25:35")
- For chapters: "Leviticus 25"
- For books: "Leviticus"
- This ensures consistent grouping in the index

**Mention textSpan format:**
- Use the **exact text as it appears** (e.g., "Lev 25:35", "Exod 21:2–6")
- Include surrounding punctuation if part of the reference

**Guidelines:**
- Be **exhaustive** - capture every scripture reference, no matter how brief
- Include references in footnotes and parenthetical asides
- Group compound references (e.g., "Lev 25:47, 48, 50" = 3 separate entries, 3 mentions)
- Typical academic page: 10-50 scripture references`;

		default:
			return `# ${indexType.charAt(0).toUpperCase() + indexType.slice(1)} Index Guidelines

Identify significant terms and concepts related to ${indexType}.`;
	}
};
