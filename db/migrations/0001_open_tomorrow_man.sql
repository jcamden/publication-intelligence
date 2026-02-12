CREATE TYPE "public"."canonical_page_rule_type" AS ENUM('positive', 'negative');--> statement-breakpoint
CREATE TYPE "public"."entity_type" AS ENUM('IndexEntry', 'IndexMention', 'SourceDocument', 'DocumentPage', 'LLMRun', 'ExportedIndex', 'Project');--> statement-breakpoint
CREATE TYPE "public"."export_format" AS ENUM('book_index', 'json', 'xml');--> statement-breakpoint
CREATE TYPE "public"."index_entry_status" AS ENUM('suggested', 'active', 'deprecated', 'merged');--> statement-breakpoint
CREATE TYPE "public"."index_type" AS ENUM('subject', 'author', 'scripture');--> statement-breakpoint
CREATE TYPE "public"."llm_run_status" AS ENUM('pending', 'running', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."mention_range_type" AS ENUM('single_page', 'page_range', 'passim');--> statement-breakpoint
CREATE TYPE "public"."mention_type" AS ENUM('text', 'region');--> statement-breakpoint
CREATE TYPE "public"."numeral_type" AS ENUM('arabic', 'roman', 'arbitrary');--> statement-breakpoint
CREATE TYPE "public"."page_config_mode" AS ENUM('this_page', 'all_pages', 'page_range', 'custom');--> statement-breakpoint
CREATE TYPE "public"."region_type" AS ENUM('exclude', 'page_number');--> statement-breakpoint
CREATE TYPE "public"."relation_type" AS ENUM('see', 'see_also', 'broader', 'narrower', 'related');--> statement-breakpoint
CREATE TYPE "public"."source_document_status" AS ENUM('uploaded', 'processing', 'processed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."variant_type" AS ENUM('alias', 'synonym', 'abbreviation', 'deprecated', 'editorial');--> statement-breakpoint
CREATE TABLE "canonical_page_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"rule_type" "canonical_page_rule_type" NOT NULL,
	"document_page_start" integer NOT NULL,
	"document_page_end" integer NOT NULL,
	"label" text,
	"numeral_type" "numeral_type",
	"starting_canonical_page" text,
	"arbitrary_sequence" text[],
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "canonical_page_rules" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "document_pages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"page_number" integer NOT NULL,
	"text_content" text,
	"metadata" json,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "document_pages" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "regions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"name" text NOT NULL,
	"region_type" "region_type" NOT NULL,
	"page_config_mode" "page_config_mode" NOT NULL,
	"page_number" integer,
	"page_range" text,
	"every_other" boolean DEFAULT false NOT NULL,
	"start_page" integer,
	"end_page" integer,
	"bbox" json,
	"color" text NOT NULL,
	"visible" boolean DEFAULT true NOT NULL,
	"except_pages" integer[],
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "regions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "source_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"title" text NOT NULL,
	"file_name" text NOT NULL,
	"file_size" bigint,
	"content_hash" text,
	"page_count" integer,
	"storage_key" text NOT NULL,
	"status" "source_document_status" DEFAULT 'uploaded' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "source_documents" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" text NOT NULL,
	"project_id" uuid,
	"user_id" uuid,
	"entity_type" "entity_type",
	"entity_id" uuid,
	"metadata" json,
	"request_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "exported_indexes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"exported_by_user_id" uuid NOT NULL,
	"format" "export_format" NOT NULL,
	"content" text NOT NULL,
	"metadata" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "exported_indexes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "project_index_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"index_type" "index_type" NOT NULL,
	"color_hue" smallint NOT NULL,
	"is_visible" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "project_index_types" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "user_index_type_addons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"index_type" "index_type" NOT NULL,
	"granted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "user_index_type_addons" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "index_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"project_index_type_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"label" text NOT NULL,
	"description" text,
	"status" "index_entry_status" DEFAULT 'active' NOT NULL,
	"revision" integer DEFAULT 1 NOT NULL,
	"parent_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "index_entries" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "index_mention_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"index_mention_id" uuid NOT NULL,
	"project_index_type_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "index_mention_types" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "index_mentions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entry_id" uuid NOT NULL,
	"document_id" uuid NOT NULL,
	"page_id" uuid,
	"page_number" integer,
	"page_number_end" integer,
	"text_span" text NOT NULL,
	"start_offset" integer,
	"end_offset" integer,
	"bboxes" json,
	"range_type" "mention_range_type" DEFAULT 'single_page' NOT NULL,
	"mention_type" "mention_type" DEFAULT 'text' NOT NULL,
	"suggested_by_llm_id" uuid,
	"note" text,
	"revision" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "index_mentions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "index_relations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"from_entry_id" uuid NOT NULL,
	"to_entry_id" uuid NOT NULL,
	"relation_type" "relation_type" NOT NULL,
	"note" text,
	"revision" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "index_relations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "index_variants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entry_id" uuid NOT NULL,
	"text" text NOT NULL,
	"variant_type" "variant_type" DEFAULT 'alias' NOT NULL,
	"revision" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "index_variants" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "llm_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"prompt_id" uuid NOT NULL,
	"document_id" uuid,
	"executed_by_user_id" uuid NOT NULL,
	"status" "llm_run_status" DEFAULT 'pending' NOT NULL,
	"input_data" json,
	"output_data" json,
	"error_message" text,
	"token_count" integer,
	"estimated_cost" bigint,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "llm_runs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "prompts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"version" integer NOT NULL,
	"template_text" text NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "prompts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"project_dir" text NOT NULL,
	"owner_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "projects" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"name" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "canonical_page_rules" ADD CONSTRAINT "canonical_page_rules_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_pages" ADD CONSTRAINT "document_pages_document_id_source_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."source_documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regions" ADD CONSTRAINT "regions_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_documents" ADD CONSTRAINT "source_documents_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exported_indexes" ADD CONSTRAINT "exported_indexes_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exported_indexes" ADD CONSTRAINT "exported_indexes_exported_by_user_id_users_id_fk" FOREIGN KEY ("exported_by_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_index_types" ADD CONSTRAINT "project_index_types_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_index_type_addons" ADD CONSTRAINT "user_index_type_addons_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "index_entries" ADD CONSTRAINT "index_entries_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "index_entries" ADD CONSTRAINT "index_entries_project_index_type_id_project_index_types_id_fk" FOREIGN KEY ("project_index_type_id") REFERENCES "public"."project_index_types"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "index_mention_types" ADD CONSTRAINT "index_mention_types_index_mention_id_index_mentions_id_fk" FOREIGN KEY ("index_mention_id") REFERENCES "public"."index_mentions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "index_mention_types" ADD CONSTRAINT "index_mention_types_project_index_type_id_project_index_types_id_fk" FOREIGN KEY ("project_index_type_id") REFERENCES "public"."project_index_types"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "index_mentions" ADD CONSTRAINT "index_mentions_entry_id_index_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."index_entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "index_mentions" ADD CONSTRAINT "index_mentions_document_id_source_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."source_documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "index_mentions" ADD CONSTRAINT "index_mentions_page_id_document_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."document_pages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "index_relations" ADD CONSTRAINT "index_relations_from_entry_id_index_entries_id_fk" FOREIGN KEY ("from_entry_id") REFERENCES "public"."index_entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "index_relations" ADD CONSTRAINT "index_relations_to_entry_id_index_entries_id_fk" FOREIGN KEY ("to_entry_id") REFERENCES "public"."index_entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "index_variants" ADD CONSTRAINT "index_variants_entry_id_index_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."index_entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "llm_runs" ADD CONSTRAINT "llm_runs_prompt_id_prompts_id_fk" FOREIGN KEY ("prompt_id") REFERENCES "public"."prompts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "llm_runs" ADD CONSTRAINT "llm_runs_document_id_source_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."source_documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "llm_runs" ADD CONSTRAINT "llm_runs_executed_by_user_id_users_id_fk" FOREIGN KEY ("executed_by_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_document_page" ON "document_pages" USING btree ("document_id","page_number");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_project_index_type" ON "project_index_types" USING btree ("project_id","index_type") WHERE "project_index_types"."deleted_at" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_user_index_type" ON "user_index_type_addons" USING btree ("user_id","index_type");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_project_index_type_slug" ON "index_entries" USING btree ("project_id","project_index_type_id","slug");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_mention_type" ON "index_mention_types" USING btree ("index_mention_id","project_index_type_id");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_from_to_type" ON "index_relations" USING btree ("from_entry_id","to_entry_id","relation_type");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_entry_text" ON "index_variants" USING btree ("entry_id","text");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_name_version" ON "prompts" USING btree ("name","version");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_owner_dir" ON "projects" USING btree ("owner_id","project_dir") WHERE "projects"."deleted_at" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_owner_title" ON "projects" USING btree ("owner_id","title") WHERE "projects"."deleted_at" IS NULL;--> statement-breakpoint
CREATE POLICY "canonical_page_rules_project_access" ON "canonical_page_rules" AS PERMISSIVE FOR ALL TO "authenticated" USING (EXISTS (
				SELECT 1 FROM projects
				WHERE projects.id = "canonical_page_rules"."project_id"
			));--> statement-breakpoint
CREATE POLICY "document_pages_document_access" ON "document_pages" AS PERMISSIVE FOR ALL TO "authenticated" USING (EXISTS (
				SELECT 1 FROM source_documents
				WHERE source_documents.id = "document_pages"."document_id"
			));--> statement-breakpoint
CREATE POLICY "regions_project_access" ON "regions" AS PERMISSIVE FOR ALL TO "authenticated" USING (EXISTS (
				SELECT 1 FROM projects
				WHERE projects.id = "regions"."project_id"
			));--> statement-breakpoint
CREATE POLICY "source_documents_project_access" ON "source_documents" AS PERMISSIVE FOR ALL TO "authenticated" USING (EXISTS (
				SELECT 1 FROM projects
				WHERE projects.id = "source_documents"."project_id"
			));--> statement-breakpoint
CREATE POLICY "events_user_or_project_access" ON "events" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((
				"events"."user_id" = auth.user_id()
				OR EXISTS (
					SELECT 1 FROM projects
					WHERE projects.id = "events"."project_id"
				)
			));--> statement-breakpoint
CREATE POLICY "exported_indexes_project_access" ON "exported_indexes" AS PERMISSIVE FOR ALL TO "authenticated" USING (EXISTS (
				SELECT 1 FROM projects
				WHERE projects.id = "exported_indexes"."project_id"
			));--> statement-breakpoint
CREATE POLICY "project_index_types_project_access" ON "project_index_types" AS PERMISSIVE FOR ALL TO "authenticated" USING (EXISTS (
				SELECT 1 FROM projects
				WHERE projects.id = "project_index_types"."project_id"
			));--> statement-breakpoint
CREATE POLICY "user_index_type_addons_own_access" ON "user_index_type_addons" AS PERMISSIVE FOR ALL TO "authenticated" USING ("user_index_type_addons"."user_id" = auth.user_id());--> statement-breakpoint
CREATE POLICY "index_entries_project_access" ON "index_entries" AS PERMISSIVE FOR ALL TO "authenticated" USING (EXISTS (
				SELECT 1 FROM projects
				WHERE projects.id = "index_entries"."project_id"
			));--> statement-breakpoint
CREATE POLICY "index_mention_types_mention_access" ON "index_mention_types" AS PERMISSIVE FOR ALL TO "authenticated" USING (EXISTS (
				SELECT 1 FROM index_mentions
				WHERE index_mentions.id = "index_mention_types"."index_mention_id"
			));--> statement-breakpoint
CREATE POLICY "index_mentions_entry_access" ON "index_mentions" AS PERMISSIVE FOR ALL TO "authenticated" USING (EXISTS (
				SELECT 1 FROM index_entries
				WHERE index_entries.id = "index_mentions"."entry_id"
			));--> statement-breakpoint
CREATE POLICY "index_relations_entry_access" ON "index_relations" AS PERMISSIVE FOR ALL TO "authenticated" USING (EXISTS (
				SELECT 1 FROM index_entries
				WHERE index_entries.id = "index_relations"."from_entry_id"
			));--> statement-breakpoint
CREATE POLICY "index_variants_entry_access" ON "index_variants" AS PERMISSIVE FOR ALL TO "authenticated" USING (EXISTS (
				SELECT 1 FROM index_entries
				WHERE index_entries.id = "index_variants"."entry_id"
			));--> statement-breakpoint
CREATE POLICY "llm_runs_user_or_document_access" ON "llm_runs" AS PERMISSIVE FOR ALL TO "authenticated" USING ((
				"llm_runs"."executed_by_user_id" = auth.user_id()
				OR EXISTS (
					SELECT 1 FROM source_documents
					WHERE source_documents.id = "llm_runs"."document_id"
				)
			));--> statement-breakpoint
CREATE POLICY "prompts_select_authenticated" ON "prompts" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "projects_owner_full_access" ON "projects" AS PERMISSIVE FOR ALL TO "authenticated" USING ("projects"."owner_id" = auth.user_id());--> statement-breakpoint
CREATE POLICY "users_select_all" ON "users" AS PERMISSIVE FOR SELECT TO public USING (TRUE);--> statement-breakpoint
CREATE POLICY "users_insert_own" ON "users" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("users"."id" = auth.user_id());--> statement-breakpoint
CREATE POLICY "users_update_own" ON "users" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ("users"."id" = auth.user_id()) WITH CHECK ("users"."id" = auth.user_id());--> statement-breakpoint
CREATE POLICY "users_delete_own" ON "users" AS PERMISSIVE FOR DELETE TO "authenticated" USING ("users"."id" = auth.user_id());