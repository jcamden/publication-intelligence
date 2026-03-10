CREATE TABLE "scripture_index_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"project_index_type_id" uuid NOT NULL,
	"selected_canon" text,
	"include_apocrypha" boolean DEFAULT false NOT NULL,
	"include_jewish_writings" boolean DEFAULT false NOT NULL,
	"include_classical_writings" boolean DEFAULT false NOT NULL,
	"include_christian_writings" boolean DEFAULT false NOT NULL,
	"include_dead_sea_scrolls" boolean DEFAULT false NOT NULL,
	"extra_book_keys" json DEFAULT '[]'::json,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "scripture_index_configs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "scripture_index_configs" ADD CONSTRAINT "scripture_index_configs_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scripture_index_configs" ADD CONSTRAINT "scripture_index_configs_project_index_type_id_project_highlight_configs_id_fk" FOREIGN KEY ("project_index_type_id") REFERENCES "public"."project_highlight_configs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_scripture_index_config_project_index_type" ON "scripture_index_configs" USING btree ("project_id","project_index_type_id");--> statement-breakpoint
CREATE POLICY "scripture_index_configs_project_access" ON "scripture_index_configs" AS PERMISSIVE FOR ALL TO "authenticated" USING (EXISTS (
				SELECT 1 FROM projects
				WHERE projects.id = "scripture_index_configs"."project_id"
			));