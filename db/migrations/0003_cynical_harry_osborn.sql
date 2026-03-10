CREATE TABLE "detection_matcher_page_coverage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"project_index_type_id" uuid NOT NULL,
	"document_id" uuid NOT NULL,
	"page_number" integer NOT NULL,
	"matcher_id" uuid NOT NULL,
	"last_detection_run_id" uuid,
	"covered_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "detection_matcher_page_coverage" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "detection_matcher_page_coverage" ADD CONSTRAINT "detection_matcher_page_coverage_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "detection_matcher_page_coverage" ADD CONSTRAINT "detection_matcher_page_coverage_project_index_type_id_project_highlight_configs_id_fk" FOREIGN KEY ("project_index_type_id") REFERENCES "public"."project_highlight_configs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "detection_matcher_page_coverage" ADD CONSTRAINT "detection_matcher_page_coverage_document_id_source_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."source_documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "detection_matcher_page_coverage" ADD CONSTRAINT "detection_matcher_page_coverage_matcher_id_index_matchers_id_fk" FOREIGN KEY ("matcher_id") REFERENCES "public"."index_matchers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "detection_matcher_page_coverage" ADD CONSTRAINT "detection_matcher_page_coverage_last_detection_run_id_detection_runs_id_fk" FOREIGN KEY ("last_detection_run_id") REFERENCES "public"."detection_runs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "detection_matcher_page_coverage_project_type_doc_page_matcher_key" ON "detection_matcher_page_coverage" USING btree ("project_index_type_id","document_id","page_number","matcher_id");--> statement-breakpoint
CREATE INDEX "detection_matcher_page_coverage_run_scope_idx" ON "detection_matcher_page_coverage" USING btree ("project_id","project_index_type_id","document_id","page_number");--> statement-breakpoint
CREATE INDEX "detection_matcher_page_coverage_matcher_page_idx" ON "detection_matcher_page_coverage" USING btree ("matcher_id","document_id","page_number");--> statement-breakpoint
CREATE POLICY "detection_matcher_page_coverage_project_access" ON "detection_matcher_page_coverage" AS PERMISSIVE FOR ALL TO "authenticated" USING (EXISTS (
				SELECT 1 FROM projects
				WHERE projects.id = "detection_matcher_page_coverage"."project_id"
			));