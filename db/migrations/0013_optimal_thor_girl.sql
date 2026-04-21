CREATE POLICY "events_insert_authenticated" ON "events" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((
				"events"."user_id" = auth.user_id()
				OR EXISTS (
					SELECT 1 FROM projects
					WHERE projects.id = "events"."project_id"
				)
				OR (
					"events"."type" = 'auth.failed_login_attempt'
					AND "events"."user_id" IS NULL
					AND "events"."project_id" IS NULL
				)
			));