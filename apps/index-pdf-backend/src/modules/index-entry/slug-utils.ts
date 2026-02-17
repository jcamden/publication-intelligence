type MinimalEntry = {
	label: string;
	parentId: string | null;
};

type SlugContext = {
	label: string;
	parentId: string | null;
	getEntryById: (id: string) => Promise<MinimalEntry | null>;
};

export const generateSlug = async ({
	label,
	parentId,
	getEntryById,
}: SlugContext): Promise<string> => {
	const basePart = label.toLowerCase().replace(/\s+/g, "-");

	if (!parentId) {
		return basePart;
	}

	// Build ancestor chain
	const parts: string[] = [];
	let currentId: string | null = parentId;

	while (currentId) {
		const ancestor = await getEntryById(currentId);
		if (!ancestor) break;

		parts.unshift(ancestor.label.toLowerCase().replace(/\s+/g, "-"));
		currentId = ancestor.parentId;
	}

	parts.push(basePart);
	return parts.join("_");
};
