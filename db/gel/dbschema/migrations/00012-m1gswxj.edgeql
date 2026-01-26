CREATE MIGRATION m1gswxjg2sa66vbgzyrrh2o5zj2ij2bh4lu2xbcrogqxyubk7o4moa
    ONTO m1ppxqdesappbkmkl52qjljcdzive5b6nhf4m2dbdtjbwd4fjomwmq
{
  ALTER TYPE default::Project {
      CREATE PROPERTY can_access := (((.owner.id ?= GLOBAL default::current_user_id) OR EXISTS ((SELECT
          .collaborators
      FILTER
          (.id = GLOBAL default::current_user_id)
      ))));
  };
  ALTER TYPE default::DocumentPage {
      ALTER ACCESS POLICY project_collaborator_access RENAME TO project_access;
  };
  ALTER TYPE default::DocumentPage {
      ALTER ACCESS POLICY project_access USING (.document.project.can_access);
      DROP ACCESS POLICY project_owner_access;
  };
  ALTER TYPE default::Event {
      ALTER ACCESS POLICY project_collaborator_access RENAME TO project_access;
  };
  ALTER TYPE default::Event {
      ALTER ACCESS POLICY project_access USING (.project.can_access);
      DROP ACCESS POLICY project_owner_access;
  };
  ALTER TYPE default::ExportedIndex {
      ALTER ACCESS POLICY project_collaborator_access RENAME TO project_access;
  };
  ALTER TYPE default::ExportedIndex {
      ALTER ACCESS POLICY project_access USING (.project.can_access);
      DROP ACCESS POLICY project_owner_access;
  };
  ALTER TYPE default::IndexEntry {
      ALTER ACCESS POLICY project_collaborator_access RENAME TO project_access;
  };
  ALTER TYPE default::IndexEntry {
      ALTER ACCESS POLICY project_access USING (.project.can_access);
      DROP ACCESS POLICY project_owner_access;
  };
  ALTER TYPE default::IndexMention {
      ALTER ACCESS POLICY project_collaborator_access RENAME TO project_access;
  };
  ALTER TYPE default::IndexMention {
      ALTER ACCESS POLICY project_access USING (.document.project.can_access);
      DROP ACCESS POLICY project_owner_access;
  };
  ALTER TYPE default::IndexVariant {
      CREATE ACCESS POLICY project_access
          ALLOW ALL USING (.entry.project.can_access);
  };
  ALTER TYPE default::IndexVariant {
      DROP ACCESS POLICY project_members_read;
  };
  ALTER TYPE default::IndexVariant {
      DROP ACCESS POLICY project_members_write;
  };
  ALTER TYPE default::LLMRun {
      ALTER ACCESS POLICY document_project_access USING ((EXISTS (.document) AND .document.project.can_access));
  };
  ALTER TYPE default::SourceDocument {
      ALTER ACCESS POLICY project_collaborator_access RENAME TO project_access;
  };
  ALTER TYPE default::SourceDocument {
      ALTER ACCESS POLICY project_access USING (.project.can_access);
      DROP ACCESS POLICY project_owner_access;
  };
};
