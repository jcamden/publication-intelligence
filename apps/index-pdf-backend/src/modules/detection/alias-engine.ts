/**
 * Shared Aho-Corasick alias engine for matcher-based detection (Phase 2).
 * - Builds normalized alias lookup + compiled automaton from alias rows.
 * - Scans normalized text, applies boundary check and longest-match-first overlap resolution.
 * - Outputs matcher-anchored match objects with normalized and original offsets.
 */

import { AhoCorasick } from "@blackglory/aho-corasick";
import type { NormalizeWithOffsetMapResult } from "@pubint/core";
import { normalize, normalizeWithOffsetMap } from "@pubint/core";
import type {
	AliasIndex,
	AliasInput,
	AliasMatchCandidate,
	AliasMeta,
	ResolvedAliasMatch,
} from "./alias-engine.types";

// ============================================================================
// Task 2.2: Alias index builder
// ============================================================================

/**
 * Build alias index from matcher alias rows.
 * Input: array of { alias, matcherId, entryId, indexType, groupId }.
 * Output: normalized alias lookup (alias -> meta[]) and compiled Aho automaton.
 */
export function buildAliasIndex(aliases: AliasInput[]): AliasIndex {
	const normalizedAliasLookup = new Map<string, AliasMeta[]>();
	const seenPatterns = new Set<string>();

	for (const { alias, matcherId, entryId, indexType, groupId } of aliases) {
		const normalized = normalize(alias);
		if (normalized.trim() === "") continue;

		const meta = { matcherId, entryId, indexType, groupId };
		const existing = normalizedAliasLookup.get(normalized);
		if (existing) {
			existing.push(meta);
		} else {
			normalizedAliasLookup.set(normalized, [meta]);
			seenPatterns.add(normalized);
		}
	}

	const patterns = Array.from(seenPatterns);
	const automaton = new AhoCorasick(patterns, { caseSensitive: false });

	return { normalizedAliasLookup, automaton };
}

// ============================================================================
// Task 2.3: Candidate collection (slide + findAll)
// ============================================================================

/**
 * Find all start indices of `pattern` in `text` (overlapping occurrences allowed).
 */
function findAllOccurrences(text: string, pattern: string): number[] {
	const indices: number[] = [];
	let pos = 0;
	while (true) {
		const i = text.indexOf(pattern, pos);
		if (i === -1) break;
		indices.push(i);
		pos = i + 1;
	}
	return indices;
}

/**
 * Collect all alias match candidates with correct normalized spans.
 * findAll() returns patterns that appear anywhere in the text, not positions,
 * so we locate each pattern's occurrences and record (start, end) per occurrence.
 */
function collectCandidates(
	normalizedText: string,
	automaton: AliasIndex["automaton"],
): AliasMatchCandidate[] {
	const candidates: AliasMatchCandidate[] = [];
	const matchedPatterns = automaton.findAll(normalizedText);
	for (const p of matchedPatterns) {
		for (const pos of findAllOccurrences(normalizedText, p)) {
			candidates.push({
				normalizedStart: pos,
				normalizedEnd: pos + p.length,
				matchedAlias: p,
			});
		}
	}
	return candidates;
}

// ============================================================================
// Boundary check: reject mid-word hits
// ============================================================================

/** Unicode-aware: letter, number, or underscore (word character). */
const isWordChar = (c: string): boolean => /[\p{L}\p{N}_]/u.test(c);

function passesBoundaryCheck(
	normalizedText: string,
	start: number,
	end: number,
): boolean {
	const before = start > 0 ? normalizedText[start - 1] : "";
	const after = end < normalizedText.length ? (normalizedText[end] ?? "") : "";
	if (before && isWordChar(before)) return false;
	if (after && isWordChar(after)) return false;
	return true;
}

// ============================================================================
// Overlap resolution: longest-match-first, then earliest start
// ============================================================================

function resolveOverlaps(
	candidates: AliasMatchCandidate[],
): AliasMatchCandidate[] {
	// Sort by length desc, then start asc (longest first, then earliest)
	const sorted = [...candidates].sort((a, b) => {
		const lenA = a.normalizedEnd - a.normalizedStart;
		const lenB = b.normalizedEnd - b.normalizedStart;
		if (lenB !== lenA) return lenB - lenA;
		return a.normalizedStart - b.normalizedStart;
	});

	const selected: AliasMatchCandidate[] = [];
	for (const c of sorted) {
		const overlaps = selected.some(
			(s) =>
				c.normalizedStart < s.normalizedEnd &&
				c.normalizedEnd > s.normalizedStart,
		);
		if (!overlaps) selected.push(c);
	}

	return selected;
}

// ============================================================================
// Expand candidates to matcher-anchored matches with original offsets
// ============================================================================

export function findAndResolveMatches(
	normalizedText: string,
	offsetMap: NormalizeWithOffsetMapResult,
	aliasIndex: AliasIndex,
): ResolvedAliasMatch[] {
	const { automaton, normalizedAliasLookup } = aliasIndex;
	const { mapNormalizedSpanToOriginalSpan } = offsetMap;

	const candidates = collectCandidates(normalizedText, automaton);
	const withBoundary = candidates.filter((c) =>
		passesBoundaryCheck(normalizedText, c.normalizedStart, c.normalizedEnd),
	);
	const resolved = resolveOverlaps(withBoundary);

	const result: ResolvedAliasMatch[] = [];
	for (const c of resolved) {
		const [originalStart, originalEnd] = mapNormalizedSpanToOriginalSpan(
			c.normalizedStart,
			c.normalizedEnd,
		);
		const metas = normalizedAliasLookup.get(c.matchedAlias) ?? [];
		for (const meta of metas) {
			result.push({
				matcherId: meta.matcherId,
				entryId: meta.entryId,
				indexType: meta.indexType,
				groupId: meta.groupId,
				normalizedStart: c.normalizedStart,
				normalizedEnd: c.normalizedEnd,
				originalStart,
				originalEnd,
				matchedAlias: c.matchedAlias,
			});
		}
	}

	// Deterministic ordering: start offset asc, then alias length desc
	result.sort((a, b) => {
		if (a.originalStart !== b.originalStart)
			return a.originalStart - b.originalStart;
		const lenA = a.originalEnd - a.originalStart;
		const lenB = b.originalEnd - b.originalStart;
		return lenB - lenA;
	});

	return result;
}

// ============================================================================
// One-shot: normalize text and run full pipeline (convenience)
// ============================================================================

/**
 * Run the full alias scan on raw text: normalize, build offset map, find and resolve matches.
 * Use this when you have raw page text and an alias index.
 */
export function scanTextWithAliasIndex(
	rawText: string,
	aliasIndex: AliasIndex,
): ResolvedAliasMatch[] {
	const { normalizedText, ...offsetMap } = normalizeWithOffsetMap(rawText);
	return findAndResolveMatches(
		normalizedText,
		{ normalizedText, ...offsetMap },
		aliasIndex,
	);
}
