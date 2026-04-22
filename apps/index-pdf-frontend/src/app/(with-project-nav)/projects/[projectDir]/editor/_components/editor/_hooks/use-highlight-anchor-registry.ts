import { useCallback, useMemo, useRef } from "react";

/**
 * Small in-memory registry mapping highlight id → DOM node.
 *
 * Before: click-on-highlight did a full `document.querySelector` lookup to
 * find the anchor element for the popover. With thousands of highlights
 * rendered, this scan + React update caused perceptible (seconds-scale) lag.
 *
 * After: each highlight registers its anchor via ref callback; the click
 * handler resolves the anchor in O(1) with no DOM traversal.
 */
export const useHighlightAnchorRegistry = () => {
	const registry = useRef(new Map<string, HTMLElement>());

	const register = useCallback((id: string, el: HTMLElement | null) => {
		if (el) {
			registry.current.set(id, el);
		} else {
			registry.current.delete(id);
		}
	}, []);

	const getAnchor = useCallback((id: string): HTMLElement | null => {
		return registry.current.get(id) ?? null;
	}, []);

	return useMemo(() => ({ register, getAnchor }), [register, getAnchor]);
};
