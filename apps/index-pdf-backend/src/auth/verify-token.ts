import e from "@gel";
import { gel } from "../db/client";

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
}: {
	authToken: string;
}): Promise<VerifyTokenResult> => {
	try {
		const query = e.select(e.User, (user) => ({
			id: true,
			email: true,
			name: true,
			identity: {
				id: true,
			},
			filter: e.op(user.identity, "=", e.ext.auth.ClientTokenIdentity),
			limit: 1,
		}));

		const results = await query.run(
			gel.withGlobals({
				"ext::auth::client_token": authToken,
			}),
		);

		const result = results[0];

		if (!result) {
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
		console.error("Token verification failed:", error);
		return { valid: false };
	}
};
