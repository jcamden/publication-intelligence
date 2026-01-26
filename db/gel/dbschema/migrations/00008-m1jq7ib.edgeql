CREATE MIGRATION m1jq7ibdddvzvfun43bzrqhxsexvwzbc5adk2emk4ktmspcxjxy63q
    ONTO m1kzbpngj2bphgvzjui4xrpahhblsbjufy2qb4gje2cyi4ubedmfva
{
  CREATE GLOBAL default::current_user_id := (SELECT
      (GLOBAL default::current_user).id
  );
  ALTER TYPE default::Project {
      ALTER ACCESS POLICY collaborator_full_access USING (EXISTS ((SELECT
          .collaborators
      FILTER
          (.id = GLOBAL default::current_user_id)
      )));
      ALTER ACCESS POLICY owner_full_access USING ((.owner.id ?= GLOBAL default::current_user_id));
  };
  ALTER TYPE default::LLMRun {
      ALTER ACCESS POLICY creator_access USING ((.user.id ?= GLOBAL default::current_user_id));
      ALTER ACCESS POLICY document_project_access USING ((EXISTS (.document) AND ((.document.project.owner ?= GLOBAL default::current_user) OR EXISTS ((SELECT
          .document.project.collaborators
      FILTER
          (.id = GLOBAL default::current_user_id)
      )))));
  };
  ALTER TYPE default::DocumentChunk {
      ALTER ACCESS POLICY document_owner_access USING ((.document.uploaded_by.id ?= GLOBAL default::current_user_id));
  };
  ALTER TYPE default::Workspace {
      ALTER ACCESS POLICY member_full_access USING (EXISTS ((SELECT
          .members
      FILTER
          (.id = GLOBAL default::current_user_id)
      )));
      ALTER ACCESS POLICY owner_full_access USING ((.owner.id ?= GLOBAL default::current_user_id));
  };
  ALTER TYPE default::Document {
      ALTER ACCESS POLICY owner_has_full_access USING ((.uploaded_by.id ?= GLOBAL default::current_user_id));
  };
  ALTER TYPE default::DocumentPage {
      ALTER ACCESS POLICY project_collaborator_access USING (EXISTS ((SELECT
          .document.project.collaborators
      FILTER
          (.id = GLOBAL default::current_user_id)
      )));
      ALTER ACCESS POLICY project_owner_access USING ((.document.project.owner.id ?= GLOBAL default::current_user_id));
  };
  ALTER TYPE default::Event {
      ALTER ACCESS POLICY project_collaborator_access USING (EXISTS ((SELECT
          .project.collaborators
      FILTER
          (.id = GLOBAL default::current_user_id)
      )));
      ALTER ACCESS POLICY project_owner_access USING ((.project.owner.id ?= GLOBAL default::current_user_id));
  };
  ALTER TYPE default::ExportedIndex {
      ALTER ACCESS POLICY project_collaborator_access USING (EXISTS ((SELECT
          .project.collaborators
      FILTER
          (.id = GLOBAL default::current_user_id)
      )));
      ALTER ACCESS POLICY project_owner_access USING ((.project.owner.id ?= GLOBAL default::current_user_id));
  };
  ALTER TYPE default::IndexEntry {
      ALTER ACCESS POLICY project_collaborator_access USING (EXISTS ((SELECT
          .project.collaborators
      FILTER
          (.id = GLOBAL default::current_user_id)
      )));
      ALTER ACCESS POLICY project_owner_access USING ((.project.owner.id ?= GLOBAL default::current_user_id));
  };
  ALTER TYPE default::IndexMention {
      ALTER ACCESS POLICY project_collaborator_access USING (EXISTS ((SELECT
          .document.project.collaborators
      FILTER
          (.id = GLOBAL default::current_user_id)
      )));
      ALTER ACCESS POLICY project_owner_access USING ((.document.project.owner.id ?= GLOBAL default::current_user_id));
  };
  ALTER TYPE default::SourceDocument {
      ALTER ACCESS POLICY project_collaborator_access USING (EXISTS ((SELECT
          .project.collaborators
      FILTER
          (.id = GLOBAL default::current_user_id)
      )));
      ALTER ACCESS POLICY project_owner_access USING ((.project.owner.id ?= GLOBAL default::current_user_id));
  };
  ALTER TYPE default::IndexRelation {
      ALTER ACCESS POLICY project_members_read USING (((.from_entry.project.owner.id ?= GLOBAL default::current_user_id) OR EXISTS ((SELECT
          .from_entry.project.collaborators
      FILTER
          (.id = GLOBAL default::current_user_id)
      ))));
      ALTER ACCESS POLICY project_members_write USING (((.from_entry.project.owner.id ?= GLOBAL default::current_user_id) OR EXISTS ((SELECT
          .from_entry.project.collaborators
      FILTER
          (.id = GLOBAL default::current_user_id)
      ))));
  };
  ALTER TYPE default::IndexVariant {
      ALTER ACCESS POLICY project_members_read USING (((.entry.project.owner.id ?= GLOBAL default::current_user_id) OR EXISTS ((SELECT
          .entry.project.collaborators
      FILTER
          (.id = GLOBAL default::current_user_id)
      ))));
      ALTER ACCESS POLICY project_members_write USING (((.entry.project.owner.id ?= GLOBAL default::current_user_id) OR EXISTS ((SELECT
          .entry.project.collaborators
      FILTER
          (.id = GLOBAL default::current_user_id)
      ))));
  };
};
