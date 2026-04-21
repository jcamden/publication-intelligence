import type { DomainEvent } from "./domain-event";

/** Auth-related subset of {@link DomainEvent} (in-process subscribers / future realtime). */
export type AuthEvent = Extract<
	DomainEvent,
	{
		type:
			| "user.created"
			| "user.logged_in"
			| "user.logged_out"
			| "auth.failed_login_attempt";
	}
>;
