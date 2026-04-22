import type { IndexType } from "../_types/index-type";

export const mockIndexTypes: IndexType[] = [
	{
		id: "idx-type-subject",
		name: "subject",
		label: "Subject Index",
		color: "#FCD34D", // Yellow
		ordinal: 0,
		visible: true,
	},
	{
		id: "idx-type-author",
		name: "author",
		label: "Author Index",
		color: "#93C5FD", // Blue
		ordinal: 1,
		visible: true,
	},
	{
		id: "idx-type-scripture",
		name: "scripture",
		label: "Scripture Index",
		color: "#86EFAC", // Green
		ordinal: 2,
		visible: true,
	},
	{
		id: "idx-type-region",
		name: "region",
		label: "Regions",
		color: "#FCA5A5", // Red
		ordinal: 3,
		visible: true,
	},
];
