export type IndexType = {
	id: string;
	name: string; // 'subject', 'author', 'scripture', 'context'
	label: string; // 'Subject Index', 'Author Index', etc.
	color: string; // Hex color, user-customizable
	ordinal: number; // For default color assignment and display order
	visible: boolean; // Can be hidden by user
};

export const DEFAULT_COLORS = ["#FCD34D", "#93C5FD", "#86EFAC", "#FCA5A5"]; // Yellow, Blue, Green, Red

export const assignDefaultColor = ({
	ordinal,
}: {
	ordinal: number;
}): string => {
	if (ordinal < DEFAULT_COLORS.length) {
		return DEFAULT_COLORS[ordinal];
	}
	// Generate color for additional index types using golden angle distribution
	const hue = (ordinal * 137) % 360;
	return `hsl(${hue}, 70%, 50%)`;
};
