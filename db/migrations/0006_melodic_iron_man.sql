ALTER TABLE "index_entry_groups" ADD COLUMN "seed_source" text;--> statement-breakpoint
ALTER TABLE "index_entry_groups" ADD COLUMN "seeded_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "index_entry_groups" ADD COLUMN "seed_run_id" uuid;--> statement-breakpoint
ALTER TABLE "index_entries" ADD COLUMN "seed_source" text;--> statement-breakpoint
ALTER TABLE "index_entries" ADD COLUMN "seeded_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "index_entries" ADD COLUMN "seed_run_id" uuid;--> statement-breakpoint
ALTER TABLE "index_matchers" ADD COLUMN "seed_source" text;--> statement-breakpoint
ALTER TABLE "index_matchers" ADD COLUMN "seeded_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "index_matchers" ADD COLUMN "seed_run_id" uuid;--> statement-breakpoint
ALTER TABLE "index_entry_groups" ADD CONSTRAINT "index_entry_groups_seed_run_id_scripture_bootstrap_runs_id_fk" FOREIGN KEY ("seed_run_id") REFERENCES "public"."scripture_bootstrap_runs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "index_entries" ADD CONSTRAINT "index_entries_seed_run_id_scripture_bootstrap_runs_id_fk" FOREIGN KEY ("seed_run_id") REFERENCES "public"."scripture_bootstrap_runs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "index_matchers" ADD CONSTRAINT "index_matchers_seed_run_id_scripture_bootstrap_runs_id_fk" FOREIGN KEY ("seed_run_id") REFERENCES "public"."scripture_bootstrap_runs"("id") ON DELETE set null ON UPDATE no action;