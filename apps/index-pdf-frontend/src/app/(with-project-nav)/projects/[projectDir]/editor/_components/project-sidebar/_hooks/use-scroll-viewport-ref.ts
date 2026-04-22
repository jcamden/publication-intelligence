import { useCallback, useRef } from "react";

export const useScrollViewportRef = () => {
	const scrollViewportRef = useRef<HTMLDivElement | null>(null);

	const setScrollViewportRef = useCallback((el: HTMLDivElement | null) => {
		scrollViewportRef.current = el;
	}, []);

	return { scrollViewportRef, setScrollViewportRef };
};
