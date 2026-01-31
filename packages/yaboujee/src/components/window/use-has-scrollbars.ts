import { useEffect, useRef, useState } from "react";

const getHasVerticalScrollbar = ({ element }: { element: HTMLDivElement }) =>
	element.scrollHeight > element.getBoundingClientRect().height;

const getHasHorizontalScrollbar = ({ element }: { element: HTMLDivElement }) =>
	element.scrollWidth > element.getBoundingClientRect().width;

export const useHasScrollbars = () => {
	const [hasVerticalScrollbar, setHasVerticalScrollbar] = useState(false);
	const [hasHorizontalScrollbar, setHasHorizontalScrollbar] = useState(false);
	const [updatingScrollbars, setUpdatingScrollbars] = useState(true);

	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!updatingScrollbars) return;

		const { current } = ref;
		if (current) {
			setHasVerticalScrollbar(getHasVerticalScrollbar({ element: current }));
			setHasHorizontalScrollbar(
				getHasHorizontalScrollbar({ element: current }),
			);
		}
		setUpdatingScrollbars(false);
	}, [updatingScrollbars]);

	return {
		hasVerticalScrollbar,
		hasHorizontalScrollbar,
		ref,
		setUpdatingScrollbars,
	};
};
