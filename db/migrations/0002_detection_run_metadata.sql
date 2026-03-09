CREATE TYPE "public"."detection_run_scope" AS ENUM('project', 'page');--> statement-breakpoint
CREATE TYPE "public"."detection_run_type" AS ENUM('llm', 'matcher');--> statement-breakpoint
ALTER TABLE "detection_runs" ALTER COLUMN "model" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "detection_runs" ALTER COLUMN "prompt_version" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "detection_runs" ALTER COLUMN "settings_hash" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "detection_runs" ADD COLUMN "run_type" "detection_run_type" DEFAULT 'llm' NOT NULL;--> statement-breakpoint
ALTER TABLE "detection_runs" ADD COLUMN "scope" "detection_run_scope";--> statement-breakpoint
ALTER TABLE "detection_runs" ADD COLUMN "page_id" uuid;--> statement-breakpoint
ALTER TABLE "detection_runs" ADD COLUMN "index_entry_group_ids" json;--> statement-breakpoint
ALTER TABLE "detection_runs" ADD COLUMN "run_all_groups" boolean;