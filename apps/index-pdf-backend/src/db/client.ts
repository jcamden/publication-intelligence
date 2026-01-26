import { createClient } from "gel";

export const createGelClient = () => {
	// Use dedicated test branch for test environment
	// Provides full isolation from production data
	const branch = process.env.NODE_ENV === "test" ? "test" : "main";

	return createClient({
		instanceName: "publication_intelligence",
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
