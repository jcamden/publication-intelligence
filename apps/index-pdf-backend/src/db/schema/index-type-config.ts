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
	icon?: string; // Optional icon identifier
};

// Only include active index types for MVP
export const INDEX_TYPE_CONFIG = {
	subject: {
		displayName: "Subject Index",
		description: "Topical index of key concepts, themes, and subjects",
		defaultColor: "#3b82f6",
	},
	author: {
		displayName: "Author Index",
		description: "Index of cited authors and their works",
		defaultColor: "#8b5cf6",
	},
	scripture: {
		displayName: "Scripture Index",
		description: "Biblical and scriptural reference index",
		defaultColor: "#10b981",
	},
} as const satisfies Partial<Record<IndexType, IndexTypeConfig>>;

/**
 * Get configuration for a specific index type
 * Returns undefined if type is not configured (for future/inactive types)
 */
export const getIndexTypeConfig = (
	type: IndexType,
): IndexTypeConfig | undefined => {
	return INDEX_TYPE_CONFIG[type as keyof typeof INDEX_TYPE_CONFIG];
};

/**
 * Get all configured index types
 */
export const getAllIndexTypes = (): Array<{
	type: IndexType;
	config: IndexTypeConfig;
}> => {
	return Object.entries(INDEX_TYPE_CONFIG).map(([type, config]) => ({
		type: type as IndexType,
		config,
	}));
};
