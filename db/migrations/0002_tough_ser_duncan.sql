-- Step 1: Add the new column as nullable
ALTER TABLE "index_mentions" ADD COLUMN "project_index_type_id" uuid;--> statement-breakpoint

-- Step 2: Populate from entry's projectIndexTypeId (source of truth)
UPDATE "index_mentions" 
SET "project_index_type_id" = "index_entries"."project_index_type_id"
FROM "index_entries"
WHERE "index_mentions"."entry_id" = "index_entries"."id";--> statement-breakpoint

-- Step 3: Make the column NOT NULL now that it's populated
ALTER TABLE "index_mentions" ALTER COLUMN "project_index_type_id" SET NOT NULL;--> statement-breakpoint

-- Step 4: Add the foreign key constraint
ALTER TABLE "index_mentions" ADD CONSTRAINT "index_mentions_project_index_type_id_project_highlight_configs_id_fk" FOREIGN KEY ("project_index_type_id") REFERENCES "public"."project_highlight_configs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint

-- Step 5: Drop the old junction table
ALTER TABLE "index_mention_types" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP POLICY "index_mention_types_mention_access" ON "index_mention_types" CASCADE;--> statement-breakpoint
DROP TABLE "index_mention_types" CASCADE;