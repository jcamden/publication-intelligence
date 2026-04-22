"use client";

import { useEffect, useMemo, useReducer } from "react";
import { API_URL } from "@/app/_common/_config/api";
import { useAuthToken } from "@/app/_common/_hooks/use-auth-token";

type DetectionPhaseName = "scan" | "resolve" | "persist" | "finalize";

type DetectionStreamEvent =
	| {
			type: "run.snapshot";
			runId: string;
			status: string;
			progressPage: number | null;
			totalPages: number | null;
			phase: string | null;
			phaseProgress: number | null;
	  }
	| { type: "run.stream_state"; runId: string; pagesWithNewMentions: number[] }
	| { type: "run.event"; payload: unknown };

type StreamState = {
	status: "queued" | "running" | "completed" | "failed" | "cancelled" | null;
	phase: DetectionPhaseName | null;
	phaseProgress: number | null;
	progressPage: number | null;
	totalPages: number | null;
	pagesWithNewMentions: number[];
	lastEventAt: number | null;
	error: string | null;
};

const initialState: StreamState = {
	status: null,
	phase: null,
	phaseProgress: null,
	progressPage: null,
	totalPages: null,
	pagesWithNewMentions: [],
	lastEventAt: null,
	error: null,
};

const reducer = (
	state: StreamState,
	action: DetectionStreamEvent,
): StreamState => {
	const now = Date.now();
	if (action.type === "run.snapshot") {
		return {
			...state,
			status: (action.status as StreamState["status"]) ?? state.status,
			progressPage: action.progressPage ?? state.progressPage,
			totalPages: action.totalPages ?? state.totalPages,
			phase: (action.phase as DetectionPhaseName | null) ?? state.phase,
			phaseProgress: action.phaseProgress ?? state.phaseProgress,
			lastEventAt: now,
			error: null,
		};
	}
	if (action.type === "run.stream_state") {
		return {
			...state,
			pagesWithNewMentions:
				action.pagesWithNewMentions ?? state.pagesWithNewMentions,
			lastEventAt: now,
			error: null,
		};
	}
	if (action.type === "run.event") {
		// Payload is typed in backend; we keep parsing minimal and safe here.
		const e = action.payload as Record<string, unknown> | null;
		if (!e) return { ...state, lastEventAt: now };
		if (e?.type === "run.status") {
			return {
				...state,
				status: (e.status as StreamState["status"]) ?? state.status,
				phase: (e.phase as DetectionPhaseName | null) ?? state.phase,
				phaseProgress:
					typeof e.phaseProgress === "number"
						? (e.phaseProgress as number)
						: state.phaseProgress,
				lastEventAt: now,
				error: null,
			};
		}
		if (e?.type === "phase.start") {
			return {
				...state,
				phase: (e.name as DetectionPhaseName | null) ?? state.phase,
				phaseProgress: 0,
				lastEventAt: now,
				error: null,
			};
		}
		if (e?.type === "phase.end") {
			return {
				...state,
				phase: (e.name as DetectionPhaseName | null) ?? state.phase,
				phaseProgress: 1,
				lastEventAt: now,
				error: null,
			};
		}
		if (e?.type === "page.scanned") {
			const pageNumber =
				typeof e.pageNumber === "number" ? (e.pageNumber as number) : null;
			const mentionsDelta =
				typeof e.mentionsDelta === "number" ? (e.mentionsDelta as number) : 0;
			const set = new Set(state.pagesWithNewMentions);
			if (pageNumber != null && mentionsDelta > 0) set.add(pageNumber);
			return {
				...state,
				progressPage: pageNumber ?? state.progressPage,
				totalPages:
					typeof e.totalPages === "number"
						? (e.totalPages as number)
						: state.totalPages,
				pagesWithNewMentions: Array.from(set).sort((a, b) => a - b),
				lastEventAt: now,
				error: null,
			};
		}
		if (e?.type === "run.done") {
			return {
				...state,
				status: (e.status as StreamState["status"]) ?? state.status,
				lastEventAt: now,
				error: null,
			};
		}
		return { ...state, lastEventAt: now };
	}
	return state;
};

export const useDetectionRunStream = ({ runId }: { runId: string | null }) => {
	const { authToken } = useAuthToken();
	const [state, dispatch] = useReducer(reducer, initialState);

	const url = useMemo(() => {
		if (!runId || !authToken) return null;
		const u = new URL(`${API_URL}/api/detection/runs/${runId}/stream`);
		u.searchParams.set("token", authToken);
		return u.toString();
	}, [runId, authToken]);

	useEffect(() => {
		if (!url) return;

		const es = new EventSource(url);

		es.addEventListener("run.snapshot", (evt) => {
			try {
				const data = JSON.parse((evt as MessageEvent).data);
				dispatch({ type: "run.snapshot", ...data });
			} catch {
				// ignore
			}
		});
		es.addEventListener("run.stream_state", (evt) => {
			try {
				const data = JSON.parse((evt as MessageEvent).data);
				dispatch({ type: "run.stream_state", ...data });
			} catch {
				// ignore
			}
		});
		es.addEventListener("run.event", (evt) => {
			try {
				const payload = JSON.parse((evt as MessageEvent).data);
				dispatch({ type: "run.event", payload });
			} catch {
				// ignore
			}
		});

		es.onerror = () => {
			// EventSource auto-retries; we keep a soft error marker.
			// eslint-disable-next-line react-hooks/exhaustive-deps
			// (no-op)
		};

		return () => {
			es.close();
		};
	}, [url]);

	return state;
};
