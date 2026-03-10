CREATE TYPE "public"."index_entry_group_sort_mode" AS ENUM('a_z', 'canon_book_order');--> statement-breakpoint
CREATE TABLE "index_entry_group_entries" (
	"group_id" uuid NOT NULL,
	"entry_id" uuid NOT NULL,
	"position" integer,
	CONSTRAINT "unique_index_entry_group_entries_pair" UNIQUE("group_id","entry_id")
);
--> statement-breakpoint
ALTER TABLE "index_entry_group_entries" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "index_entry_group_matchers" (
	"group_id" uuid NOT NULL,
	"matcher_id" uuid NOT NULL,
	"position" integer,
	CONSTRAINT "unique_index_entry_group_matchers_pair" UNIQUE("group_id","matcher_id")
);
--> statement-breakpoint
ALTER TABLE "index_entry_group_matchers" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "index_entry_groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"project_index_type_id" uuid NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"parser_profile_id" text,
	"sort_mode" "index_entry_group_sort_mode" DEFAULT 'a_z' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "index_entry_groups" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "index_entry_group_entries" ADD CONSTRAINT "index_entry_group_entries_group_id_index_entry_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."index_entry_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "index_entry_group_entries" ADD CONSTRAINT "index_entry_group_entries_entry_id_index_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."index_entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "index_entry_group_matchers" ADD CONSTRAINT "index_entry_group_matchers_group_id_index_entry_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."index_entry_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "index_entry_group_matchers" ADD CONSTRAINT "index_entry_group_matchers_matcher_id_index_matchers_id_fk" FOREIGN KEY ("matcher_id") REFERENCES "public"."index_matchers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "index_entry_groups" ADD CONSTRAINT "index_entry_groups_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "index_entry_groups" ADD CONSTRAINT "index_entry_groups_project_index_type_id_project_highlight_configs_id_fk" FOREIGN KEY ("project_index_type_id") REFERENCES "public"."project_highlight_configs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_index_entry_group_slug" ON "index_entry_groups" USING btree ("project_id","project_index_type_id","slug") WHERE "index_entry_groups"."deleted_at" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_index_entry_groups_project_index_type" ON "index_entry_groups" USING btree ("project_index_type_id","id");--> statement-breakpoint
CREATE POLICY "index_entry_group_entries_access" ON "index_entry_group_entries" AS PERMISSIVE FOR ALL TO "authenticated" USING (EXISTS (
				SELECT 1 FROM index_entry_groups
				WHERE index_entry_groups.id = "index_entry_group_entries"."group_id"
			));--> statement-breakpoint
CREATE POLICY "index_entry_group_matchers_access" ON "index_entry_group_matchers" AS PERMISSIVE FOR ALL TO "authenticated" USING (EXISTS (
				SELECT 1 FROM index_entry_groups
				WHERE index_entry_groups.id = "index_entry_group_matchers"."group_id"
			));--> statement-breakpoint
CREATE POLICY "index_entry_groups_project_access" ON "index_entry_groups" AS PERMISSIVE FOR ALL TO "authenticated" USING (EXISTS (
				SELECT 1 FROM projects
				WHERE projects.id = "index_entry_groups"."project_id"
			));