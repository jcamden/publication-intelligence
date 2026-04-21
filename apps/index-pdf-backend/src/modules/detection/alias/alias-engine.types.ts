/**
 * Types for the shared Aho-Corasick alias engine (Phase 2 matcher detection).
 * Input: alias rows; output: normalized lookup + compiled automaton, then
 * matcher-anchored match objects with normalized/original offsets.
 */

export type AliasInput = {
	alias: string;
	matcherId: string;
	entryId: string;
	indexType: string;
	groupId: string;
};

export type AliasMeta = {
	matcherId: string;
	entryId: string;
	indexType: string;
	groupId: string;
	/** Original alias text (for case check: uppercase matcher rejects lowercase text) */
	originalAlias: string;
};

/** One normalized alias can map to multiple matchers (e.g. same text in different groups). */
export type NormalizedAliasLookup = Map<string, AliasMeta[]>;

export type AliasIndex = {
	normalizedAliasLookup: NormalizedAliasLookup;
	/** Compiled Aho-Corasick automaton; findAll(normalizedText) returns matched pattern strings. */
	automaton: { findAll(text: string): string[] };
};

/** Raw candidate from Aho-Corasick scan (before boundary filter and overlap resolution). */
export type AliasMatchCandidate = {
	normalizedStart: number;
	normalizedEnd: number;
	/** Normalized alias text that matched. */
	matchedAlias: string;
};

/** Matcher-anchored match after boundary check and overlap resolution. */
export type ResolvedAliasMatch = {
	matcherId: string;
	entryId: string;
	indexType: string;
	groupId: string;
	normalizedStart: number;
	normalizedEnd: number;
	originalStart: number;
	originalEnd: number;
	/** Original-text span of the match (for mention payload). */
	matchedAlias: string;
};
