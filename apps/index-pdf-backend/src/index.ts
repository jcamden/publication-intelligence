import { startServer } from "./server";

const main = async () => {
	console.log("Publication Intelligence Backend");
	await startServer();
};

main().catch(console.error);
