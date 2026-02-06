import type { Config } from "drizzle-kit";

export default {
	schema: "./apps/index-pdf-backend/src/db/schema/index.ts",
	out: "./db/migrations",
	dialect: "postgresql",
	dbCredentials: {
		url:
			process.env.DATABASE_URL ||
			"postgresql://postgres:postgres@localhost:5432/publication_intelligence",
	},
	verbose: true,
	strict: true,
	entities: {
		roles: true,
	},
} satisfies Config;
