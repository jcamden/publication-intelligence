CREATE TYPE "public"."canonical_page_rule_type" AS ENUM('positive', 'negative');--> statement-breakpoint
CREATE TYPE "public"."numeral_type" AS ENUM('arabic', 'roman', 'arbitrary');--> statement-breakpoint
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
ALTER TABLE "canonical_page_rules" ADD CONSTRAINT "canonical_page_rules_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE POLICY "canonical_page_rules_project_access" ON "canonical_page_rules" AS PERMISSIVE FOR ALL TO "authenticated" USING (EXISTS (
				SELECT 1 FROM projects
				WHERE projects.id = "canonical_page_rules"."project_id"
			));