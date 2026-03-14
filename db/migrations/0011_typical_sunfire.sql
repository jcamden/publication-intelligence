DROP INDEX "unique_index_entry_group_slug";--> statement-breakpoint
CREATE UNIQUE INDEX "unique_index_entry_group_name" ON "index_entry_groups" USING btree ("project_id","project_index_type_id","name") WHERE "index_entry_groups"."deleted_at" IS NULL;--> statement-breakpoint
ALTER TABLE "index_entry_groups" DROP COLUMN "slug";--> statement-breakpoint
ALTER TABLE "index_entry_groups" DROP COLUMN "parser_profile_id";--> statement-breakpoint
ALTER TABLE "index_entry_group_entries" ADD CONSTRAINT "unique_index_entry_group_entries_entry" UNIQUE("entry_id");