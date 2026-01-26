import type { AuthEvent } from "@pubint/events/auth";
import { logger } from "../logger";

type EventHandler<T> = (event: T) => void | Promise<void>;

type EventEmitter = {
	on: <T extends AuthEvent>(
		eventType: T["type"],
		handler: EventHandler<T>,
	) => void;
	emit: <T extends AuthEvent>(event: T) => Promise<void>;
};

const createEventEmitter = (): EventEmitter => {
	const handlers = new Map<string, EventHandler<AuthEvent>[]>();

	const on = <T extends AuthEvent>(
		eventType: T["type"],
		handler: EventHandler<T>,
	): void => {
		const existingHandlers = handlers.get(eventType) ?? [];
		handlers.set(eventType, [
			...existingHandlers,
			handler as EventHandler<AuthEvent>,
		]);
	};

	const emit = async <T extends AuthEvent>(event: T): Promise<void> => {
		logger.debug({
			event: "domain.event_emitted",
			metadata: {
				eventType: event.type,
				eventData: event,
			},
		});

		const eventHandlers = handlers.get(event.type) ?? [];
		await Promise.all(eventHandlers.map((handler) => handler(event)));
	};

	return { on, emit };
};

export const eventEmitter = createEventEmitter();
