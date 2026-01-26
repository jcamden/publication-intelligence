// Load environment variables from .env file (must be first)

import { resolve } from "node:path";
import { config } from "dotenv";

config({ path: resolve(import.meta.dirname, "../../.env") });

import { logger } from "./logger";
import { startServer } from "./server";

const main = async () => {
	await startServer();
};

main().catch((error) => {
	logger.error({
		event: "server.startup_failed",
		error: {
			message: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined,
		},
	});
	process.exit(1);
});
