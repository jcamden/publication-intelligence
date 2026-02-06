/**
 * Index Type Metadata Configuration
 *
 * This file defines the metadata for all available index types.
 * Since we're using an enum (fixed set of ~9 types), metadata lives
 * in application code rather than the database.
 *
 * TODO: Extract this to a shared package when creating frontend.
 */

import type { indexTypeEnum } from "./enums";

export type IndexType = (typeof indexTypeEnum.enumValues)[number];

export type IndexTypeConfig = {
	displayName: string;
	description: string;
	defaultColor: string; // Hex color
	defaultOrdinal: number;
	icon?: string; // Optional icon identifier
};

export const INDEX_TYPE_CONFIG: Record<IndexType, IndexTypeConfig> = {
	subject: {
		displayName: "Subject Index",
		description: "Topical index of key concepts, themes, and subjects",
		defaultColor: "#3b82f6",
		defaultOrdinal: 1,
	},
	author: {
		displayName: "Author Index",
		description: "Index of cited authors and their works",
		defaultColor: "#8b5cf6",
		defaultOrdinal: 2,
	},
	scripture: {
		displayName: "Scripture Index",
		description: "Biblical and scriptural reference index",
		defaultColor: "#10b981",
		defaultOrdinal: 3,
	},
	bibliography: {
		displayName: "Bibliography",
		description: "Comprehensive list of cited works",
		defaultColor: "#f59e0b",
		defaultOrdinal: 4,
	},
	person: {
		displayName: "Person Index",
		description: "Index of people, characters, and historical figures",
		defaultColor: "#ef4444",
		defaultOrdinal: 5,
	},
	place: {
		displayName: "Place Index",
		description: "Geographic locations and places",
		defaultColor: "#06b6d4",
		defaultOrdinal: 6,
	},
	concept: {
		displayName: "Concept Index",
		description: "Philosophical and theological concepts",
		defaultColor: "#f472b6",
		defaultOrdinal: 7,
	},
	organization: {
		displayName: "Organization Index",
		description: "Churches, institutions, and organizations",
		defaultColor: "#a855f7",
		defaultOrdinal: 8,
	},
	event: {
		displayName: "Event Index",
		description: "Historical events and occurrences",
		defaultColor: "#14b8a6",
		defaultOrdinal: 9,
	},
} as const;

/**
 * Get configuration for a specific index type
 */
export const getIndexTypeConfig = (type: IndexType): IndexTypeConfig => {
	return INDEX_TYPE_CONFIG[type];
};

/**
 * Get all available index types in default order
 */
export const getAllIndexTypes = (): Array<{
	type: IndexType;
	config: IndexTypeConfig;
}> => {
	return Object.entries(INDEX_TYPE_CONFIG)
		.map(([type, config]) => ({ type: type as IndexType, config }))
		.sort((a, b) => a.config.defaultOrdinal - b.config.defaultOrdinal);
};
