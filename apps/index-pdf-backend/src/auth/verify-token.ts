import e from "@gel";
import { gel } from "../db/client";
import { logEvent } from "../logger";

type VerifyTokenResult = {
	valid: boolean;
	identity?: {
		id: string;
	};
	user?: {
		id: string;
		email: string;
		name: string | null;
	};
};

export const verifyGelToken = async ({
	authToken,
	requestId,
}: {
	authToken: string;
	requestId?: string;
}): Promise<VerifyTokenResult> => {
	try {
		const query = e.select(e.User, (user) => ({
			id: true,
			email: true,
			name: true,
			identity: {
				id: true,
			},
			filter: e.op(user.identity, "=", e.ext.auth.global.ClientTokenIdentity),
			limit: 1,
		}));

		const results = await query.run(
			gel.withGlobals({
				"ext::auth::client_token": authToken,
			}),
		);

		const result = results[0];

		if (!result) {
			logEvent({
				event: "auth.token_verification_failed",
				context: {
					requestId,
					metadata: { reason: "user_not_found" },
				},
			});
			return { valid: false };
		}

		return {
			valid: true,
			identity: result.identity,
			user: {
				id: result.id,
				email: result.email,
				name: result.name,
			},
		};
	} catch (error) {
		logEvent({
			event: "auth.token_verification_error",
			context: {
				requestId,
				error,
			},
		});
		return { valid: false };
	}
};
