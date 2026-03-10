/**
 * Predefined parser profiles registry (Phase 3). V1 ships with scripture-biblical only.
 */

import type { ParserProfile } from "./parser-profile.types";
import { scriptureParserProfile } from "./ref-parser";

const registry = new Map<string, ParserProfile>([
	[scriptureParserProfile.id, scriptureParserProfile],
]);

export function getParserProfile(id: string): ParserProfile | undefined {
	return registry.get(id);
}

export function getParserProfileIds(): string[] {
	return Array.from(registry.keys());
}
