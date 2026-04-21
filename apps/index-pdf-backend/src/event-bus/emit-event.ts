import { type DomainEvent, DomainEventSchema } from "@pubint/events";
import type { AuthEvent } from "@pubint/events/auth";
import type { DbTransaction } from "../db/client";
import { db } from "../db/client";
import { logEvent } from "../logger";
import { insertEvent } from "../modules/event/event.repo";
import type { InsertEventInput } from "../modules/event/event.types";
import { eventEmitter } from "./emitter";

export type EmitContext = {
	userId?: string;
	projectId?: string;
	requestId?: string;
};

const postCommitQueues = new WeakMap<DbTransaction, DomainEvent[]>();

function domainEventToInsertInput(
	event: DomainEvent,
	context: EmitContext,
): InsertEventInput {
	const requestId = context.requestId;

	if (
		event.type === "user.created" ||
		event.type === "user.logged_in" ||
		event.type === "user.logged_out"
	) {
		const userId = context.userId;
		if (!userId) {
			throw new Error(`emitEvent(${event.type}): userId is required`);
		}
		return {
			type: event.type,
			userId,
			entityId: userId,
			entityType: null,
			metadata: event.metadata,
			requestId,
		};
	}

	if (event.type === "auth.failed_login_attempt") {
		return {
			type: event.type,
			metadata: event.metadata,
			requestId,
		};
	}

	if (event.type === "scripture_bootstrap.run_completed") {
		const { projectId, userId } = context;
		if (!projectId || !userId) {
			throw new Error(
				"emitEvent(scripture_bootstrap.run_completed): projectId and userId are required",
			);
		}
		return {
			type: event.type,
			projectId,
			userId,
			entityType: null,
			metadata: event.metadata,
			requestId,
		};
	}

	if (event.type === "scripture_index_config.updated") {
		const { projectId, userId } = context;
		if (!projectId || !userId) {
			throw new Error(
				"emitEvent(scripture_index_config.updated): projectId and userId are required",
			);
		}
		return {
			type: event.type,
			projectId,
			userId,
			entityId: event.entityId,
			entityType: null,
			metadata: event.metadata,
			requestId,
		};
	}

	const { projectId, userId } = context;
	if (!projectId || !userId) {
		throw new Error(
			`emitEvent(${event.type}): projectId and userId are required`,
		);
	}

	return {
		type: event.type,
		projectId,
		userId,
		entityType: event.entityType,
		entityId: event.entityId,
		metadata: event.metadata,
		requestId,
	};
}

function isAuthDomainEvent(event: DomainEvent): event is AuthEvent {
	return (
		event.type === "user.created" ||
		event.type === "user.logged_in" ||
		event.type === "user.logged_out" ||
		event.type === "auth.failed_login_attempt"
	);
}

async function dispatchPostCommitSubscribers(
	event: DomainEvent,
): Promise<void> {
	if (isAuthDomainEvent(event)) {
		await eventEmitter.emit(event);
	}
}

function queueForPostCommitDispatch(
	event: DomainEvent,
	tx: DbTransaction,
): void {
	const q = postCommitQueues.get(tx) ?? [];
	q.push(event);
	postCommitQueues.set(tx, q);
}

export async function flushPostCommitDispatch(
	tx: DbTransaction,
): Promise<void> {
	const q = postCommitQueues.get(tx);
	if (!q || q.length === 0) {
		postCommitQueues.delete(tx);
		return;
	}
	postCommitQueues.delete(tx);
	for (const e of q) {
		await dispatchPostCommitSubscribers(e);
	}
}

export function clearPostCommitQueue(tx: DbTransaction): void {
	postCommitQueues.delete(tx);
}

/**
 * Runs {@link db.transaction} and dispatches post-commit subscribers after a successful commit.
 * Use when calling {@link emitEvent} with `{ tx }` so fan-out runs only after commit.
 */
export async function runTransactionWithPostCommit<T>(
	fn: (tx: DbTransaction) => Promise<T>,
): Promise<T> {
	let txCapture: DbTransaction | null = null;
	try {
		const result = await db.transaction(async (tx) => {
			txCapture = tx;
			return await fn(tx);
		});
		if (txCapture) {
			await flushPostCommitDispatch(txCapture);
		}
		return result;
	} catch (e) {
		if (txCapture) {
			clearPostCommitQueue(txCapture);
		}
		throw e;
	}
}

export const emitEvent = async (
	event: DomainEvent,
	context: EmitContext,
	options?: { tx?: DbTransaction },
): Promise<void> => {
	const parsed = DomainEventSchema.parse(event);

	logEvent({
		event: parsed.type,
		context: {
			requestId: context.requestId,
			userId: context.userId,
			metadata: {
				projectId: context.projectId,
				...parsed.metadata,
			},
		},
	});

	const insertInput = domainEventToInsertInput(parsed, context);
	await insertEvent(insertInput, options);

	if (options?.tx) {
		queueForPostCommitDispatch(parsed, options.tx);
	} else {
		await dispatchPostCommitSubscribers(parsed);
	}
};
