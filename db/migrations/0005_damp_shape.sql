CREATE TABLE "scripture_bootstrap_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"project_index_type_id" uuid NOT NULL,
	"config_snapshot_hash" text NOT NULL,
	"entries_created" integer NOT NULL,
	"entries_reused" integer NOT NULL,
	"matchers_created" integer NOT NULL,
	"matchers_reused" integer NOT NULL,
	"groups_created" integer NOT NULL,
	"memberships_created" integer NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "scripture_bootstrap_runs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "scripture_bootstrap_runs" ADD CONSTRAINT "scripture_bootstrap_runs_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scripture_bootstrap_runs" ADD CONSTRAINT "scripture_bootstrap_runs_project_index_type_id_project_highlight_configs_id_fk" FOREIGN KEY ("project_index_type_id") REFERENCES "public"."project_highlight_configs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scripture_bootstrap_runs" ADD CONSTRAINT "scripture_bootstrap_runs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE POLICY "scripture_bootstrap_runs_project_access" ON "scripture_bootstrap_runs" AS PERMISSIVE FOR ALL TO "authenticated" USING (EXISTS (
				SELECT 1 FROM projects
				WHERE projects.id = "scripture_bootstrap_runs"."project_id"
			));