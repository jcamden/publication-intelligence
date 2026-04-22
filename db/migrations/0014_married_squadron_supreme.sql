ALTER TABLE "detection_runs" ADD COLUMN "phase" text;--> statement-breakpoint
ALTER TABLE "detection_runs" ADD COLUMN "phase_progress" numeric(6, 4);