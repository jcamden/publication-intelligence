import { EventEmitter } from "node:events";

export type DetectionPhaseName = "scan" | "resolve" | "persist" | "finalize";

export type DetectionEvent =
	| {
			type: "run.status";
			status: "queued" | "running" | "completed" | "failed" | "cancelled";
			phase?: DetectionPhaseName | null;
			phaseProgress?: number | null;
	  }
	| {
			type: "phase.start";
			name: DetectionPhaseName;
	  }
	| {
			type: "phase.end";
			name: DetectionPhaseName;
	  }
	| {
			type: "page.scanned";
			pageNumber: number;
			totalPages?: number | null;
			entriesDelta?: number;
			mentionsDelta?: number;
	  }
	| {
			type: "candidate.resolved";
			index: number;
			total: number;
	  }
	| {
			type: "batch.persisted";
			count: number;
	  }
	| {
			type: "run.done";
			status: "completed" | "failed" | "cancelled";
	  };

export type DetectionRunStreamState = {
	runId: string;
	updatedAt: number;
	status?: "queued" | "running" | "completed" | "failed" | "cancelled";
	phase?: DetectionPhaseName | null;
	phaseProgress?: number | null;
	/** Pages that reported new mentions (for targeted invalidate). */
	pagesWithNewMentions: number[];
	/** Last known progressPage (best-effort). */
	progressPage?: number | null;
	totalPages?: number | null;
};

type Handler = (event: DetectionEvent) => void;

class DetectionEventBus {
	private emitter = new EventEmitter();
	private latest = new Map<string, DetectionRunStreamState>();

	getLatest(runId: string): DetectionRunStreamState | null {
		return this.latest.get(runId) ?? null;
	}

	emit(runId: string, event: DetectionEvent) {
		const now = Date.now();
		const prev =
			this.latest.get(runId) ??
			({
				runId,
				updatedAt: now,
				pagesWithNewMentions: [],
			} satisfies DetectionRunStreamState);

		const next: DetectionRunStreamState = {
			...prev,
			updatedAt: now,
		};

		if (event.type === "run.status") {
			next.status = event.status;
			if (event.phase !== undefined) next.phase = event.phase;
			if (event.phaseProgress !== undefined)
				next.phaseProgress = event.phaseProgress;
		}
		if (event.type === "phase.start") {
			next.phase = event.name;
			next.phaseProgress = 0;
		}
		if (event.type === "phase.end") {
			next.phase = event.name;
			next.phaseProgress = 1;
		}
		if (event.type === "page.scanned") {
			next.progressPage = event.pageNumber;
			if (event.totalPages !== undefined) next.totalPages = event.totalPages;
			if ((event.mentionsDelta ?? 0) > 0) {
				const set = new Set(next.pagesWithNewMentions);
				set.add(event.pageNumber);
				next.pagesWithNewMentions = Array.from(set).sort((a, b) => a - b);
			}
		}
		if (event.type === "run.done") {
			next.status = event.status;
		}

		this.latest.set(runId, next);
		this.emitter.emit(runId, event);
	}

	subscribe(runId: string, handler: Handler): () => void {
		this.emitter.on(runId, handler);
		return () => this.emitter.off(runId, handler);
	}
}

export const detectionEventBus = new DetectionEventBus();
