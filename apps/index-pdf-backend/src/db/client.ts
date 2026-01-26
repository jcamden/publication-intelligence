import { createClient } from "gel";

export const createGelClient = () => {
	// TODO: Use test branch for better isolation
	// Currently using main for all environments due to auth timing issues
	// See: db/gel/reset-test-branch.sh for test branch setup
	const branch = "main"; // process.env.NODE_ENV === "test" ? "test" : "main";

	return createClient({
		instanceName: "instance",
		tlsSecurity: "insecure",
		branch,
	});
};

export const gel = createGelClient();

export const createAuthenticatedClient = ({
	authToken,
}: {
	authToken: string;
}) => {
	return gel.withGlobals({
		"ext::auth::client_token": authToken,
	});
};
