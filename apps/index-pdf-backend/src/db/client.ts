import { createClient } from "gel";

export const createGelClient = () => {
	return createClient({
		instanceName: "instance",
		tlsSecurity: "insecure",
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
