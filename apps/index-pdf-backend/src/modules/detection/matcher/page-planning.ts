const isPageExcluded = ({
	pageNumber,
	canonicalPageRules,
}: {
	pageNumber: number;
	canonicalPageRules: Array<{
		ruleType: "positive" | "negative";
		documentPageStart: number;
		documentPageEnd: number;
	}>;
}): boolean => {
	return canonicalPageRules.some(
		(rule) =>
			rule.ruleType === "negative" &&
			pageNumber >= rule.documentPageStart &&
			pageNumber <= rule.documentPageEnd,
	);
};

export const calculatePagesToProcess = ({
	totalPages,
	pageRangeStart,
	pageRangeEnd,
	canonicalPageRules,
}: {
	totalPages: number;
	pageRangeStart?: number | null;
	pageRangeEnd?: number | null;
	canonicalPageRules: Array<{
		ruleType: "positive" | "negative";
		documentPageStart: number;
		documentPageEnd: number;
	}>;
}): {
	pagesToProcess: number[];
	contextPagesNeeded: Set<number>;
} => {
	const startPage = pageRangeStart || 1;
	const endPage = pageRangeEnd || totalPages;

	const pagesToProcess: number[] = [];
	const contextPagesNeeded = new Set<number>();

	for (let pageNum = startPage; pageNum <= endPage; pageNum++) {
		if (isPageExcluded({ pageNumber: pageNum, canonicalPageRules })) {
			continue;
		}

		pagesToProcess.push(pageNum);

		const prevPage = pageNum - 1;
		const nextPage = pageNum + 1;

		if (
			prevPage >= 1 &&
			!isPageExcluded({ pageNumber: prevPage, canonicalPageRules })
		) {
			contextPagesNeeded.add(prevPage);
		}

		if (
			nextPage <= totalPages &&
			!isPageExcluded({ pageNumber: nextPage, canonicalPageRules })
		) {
			contextPagesNeeded.add(nextPage);
		}
	}

	return { pagesToProcess, contextPagesNeeded };
};

export { isPageExcluded };
