export type AuthEvent =
	| UserCreatedEvent
	| UserUpdatedEvent
	| UserDeletedEvent
	| UserLoggedInEvent
	| UserLoggedOutEvent
	| FailedLoginAttemptEvent
	| UserAddedToWorkspaceEvent;

export type UserCreatedEvent = {
	type: "user.created";
	timestamp: Date;
	userId: string;
	email: string;
	name?: string;
};

export type UserUpdatedEvent = {
	type: "user.updated";
	timestamp: Date;
	userId: string;
	changes: {
		email?: string;
		name?: string;
	};
};

export type UserDeletedEvent = {
	type: "user.deleted";
	timestamp: Date;
	userId: string;
	email: string;
};

export type UserLoggedInEvent = {
	type: "user.logged_in";
	timestamp: Date;
	userId: string;
	email: string;
};

export type UserLoggedOutEvent = {
	type: "user.logged_out";
	timestamp: Date;
	userId: string;
	email: string;
};

export type FailedLoginAttemptEvent = {
	type: "auth.failed_login_attempt";
	timestamp: Date;
	email: string;
	reason: string;
};

export type UserAddedToWorkspaceEvent = {
	type: "user.added_to_workspace";
	timestamp: Date;
	userId: string;
	workspaceId: string;
	addedBy: string;
};
