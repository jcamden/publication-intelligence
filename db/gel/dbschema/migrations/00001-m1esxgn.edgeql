CREATE MIGRATION m1esxgnfhijgnzwhkghqy2nds4vfi54hwi4nddm3amypt566snaqfq
    ONTO initial
{
  CREATE EXTENSION pgcrypto VERSION '1.3';
  CREATE EXTENSION auth VERSION '1.0';
  CREATE SCALAR TYPE default::EntityType EXTENDING enum<IndexEntry, IndexMention, SourceDocument, DocumentPage, LLMRun, ExportedIndex, Project>;
  CREATE SCALAR TYPE default::ExportFormat EXTENDING enum<book_index, json, xml>;
  CREATE SCALAR TYPE default::IndexEntryStatus EXTENDING enum<suggested, active, deprecated, merged>;
  CREATE SCALAR TYPE default::LLMRunStatus EXTENDING enum<pending, running, completed, failed>;
  CREATE SCALAR TYPE default::MentionRangeType EXTENDING enum<single_page, page_range, passim>;
  CREATE SCALAR TYPE default::RelationType EXTENDING enum<see, see_also, broader, narrower, related>;
  CREATE SCALAR TYPE default::SourceDocumentStatus EXTENDING enum<uploaded, processing, processed, failed>;
  CREATE SCALAR TYPE default::VariantType EXTENDING enum<alias, synonym, abbreviation, deprecated, editorial>;
  CREATE FUTURE no_linkful_computed_splats;
  CREATE TYPE default::User {
      CREATE REQUIRED LINK identity: ext::auth::Identity {
          CREATE CONSTRAINT std::exclusive;
      };
      CREATE REQUIRED PROPERTY created_at: std::datetime {
          SET default := (std::datetime_current());
      };
      CREATE REQUIRED PROPERTY email: std::str {
          CREATE CONSTRAINT std::exclusive;
      };
      CREATE PROPERTY name: std::str;
      CREATE PROPERTY updated_at: std::datetime;
      CREATE CONSTRAINT std::expression ON (EXISTS (.identity)) {
          SET errmessage := 'User must have an identity';
      };
  };
  CREATE GLOBAL default::current_user := (SELECT
      default::User
  FILTER
      (.identity = GLOBAL ext::auth::ClientTokenIdentity)
  );
  CREATE GLOBAL default::current_user_id := (SELECT
      (GLOBAL default::current_user).id
  );
  CREATE TYPE default::Project {
      CREATE ACCESS POLICY authenticated_can_insert
          ALLOW INSERT USING (EXISTS (GLOBAL default::current_user));
      CREATE MULTI LINK collaborators: default::User;
      CREATE ACCESS POLICY collaborator_full_access
          ALLOW ALL USING (EXISTS ((SELECT
              .collaborators
          FILTER
              (.id = GLOBAL default::current_user_id)
          )));
      CREATE ACCESS POLICY deny_anonymous
          DENY ALL USING (NOT (EXISTS (GLOBAL default::current_user)));
      CREATE REQUIRED LINK owner: default::User {
          ON TARGET DELETE DELETE SOURCE;
      };
      CREATE PROPERTY can_access := (((.owner.id ?= GLOBAL default::current_user_id) OR EXISTS ((SELECT
          .collaborators
      FILTER
          (.id = GLOBAL default::current_user_id)
      ))));
      CREATE ACCESS POLICY owner_full_access
          ALLOW ALL USING ((.owner.id ?= GLOBAL default::current_user_id));
      CREATE REQUIRED PROPERTY created_at: std::datetime {
          SET default := (std::datetime_current());
      };
      CREATE PROPERTY deleted_at: std::datetime;
      CREATE PROPERTY is_deleted := (EXISTS (.deleted_at));
      CREATE PROPERTY description: std::str;
      CREATE REQUIRED PROPERTY title: std::str;
      CREATE PROPERTY updated_at: std::datetime;
  };
  CREATE TYPE default::LLMRun {
      CREATE LINK user: default::User;
      CREATE ACCESS POLICY creator_access
          ALLOW ALL USING ((.user.id ?= GLOBAL default::current_user_id));
      CREATE ACCESS POLICY deny_anonymous
          DENY ALL USING (NOT (EXISTS (GLOBAL default::current_user)));
      CREATE PROPERTY completed_at: std::datetime;
      CREATE PROPERTY cost_usd: std::float32;
      CREATE REQUIRED PROPERTY created_at: std::datetime {
          SET default := (std::datetime_current());
      };
      CREATE PROPERTY error_message: std::str;
      CREATE PROPERTY input_tokens: std::int32;
      CREATE REQUIRED PROPERTY model_name: std::str;
      CREATE PROPERTY output_tokens: std::int32;
      CREATE REQUIRED PROPERTY status: default::LLMRunStatus {
          SET default := (default::LLMRunStatus.pending);
      };
  };
  CREATE TYPE default::Event {
      CREATE ACCESS POLICY deny_anonymous
          DENY ALL USING (NOT (EXISTS (GLOBAL default::current_user)));
      CREATE REQUIRED LINK project: default::Project {
          ON TARGET DELETE DELETE SOURCE;
      };
      CREATE ACCESS POLICY project_access
          ALLOW ALL USING (.project.can_access);
      CREATE LINK actor: default::User;
      CREATE REQUIRED PROPERTY action: std::str;
      CREATE REQUIRED PROPERTY created_at: std::datetime {
          SET default := (std::datetime_current());
      };
      CREATE PROPERTY entity_id: std::uuid;
      CREATE REQUIRED PROPERTY entity_type: default::EntityType;
      CREATE PROPERTY metadata: std::json;
  };
  CREATE TYPE default::BoundingBox {
      CREATE REQUIRED PROPERTY height: std::float32;
      CREATE PROPERTY rotation: std::float32;
      CREATE REQUIRED PROPERTY width: std::float32;
      CREATE REQUIRED PROPERTY x: std::float32;
      CREATE REQUIRED PROPERTY y: std::float32;
  };
  CREATE TYPE default::IndexEntry {
      CREATE ACCESS POLICY deny_anonymous
          DENY ALL USING (NOT (EXISTS (GLOBAL default::current_user)));
      CREATE REQUIRED LINK project: default::Project {
          ON TARGET DELETE DELETE SOURCE;
      };
      CREATE ACCESS POLICY project_access
          ALLOW ALL USING (.project.can_access);
      CREATE REQUIRED PROPERTY slug: std::str;
      CREATE CONSTRAINT std::exclusive ON ((.project, .slug));
      CREATE LINK parent: default::IndexEntry {
          ON TARGET DELETE ALLOW;
      };
      CREATE MULTI LINK children := (.<parent[IS default::IndexEntry]);
      CREATE PROPERTY deleted_at: std::datetime;
      CREATE PROPERTY child_count := (std::count(.children FILTER
          NOT (EXISTS (.deleted_at))
      ));
      CREATE PROPERTY is_top_level := (NOT (EXISTS (.parent)));
      CREATE REQUIRED PROPERTY created_at: std::datetime {
          SET default := (std::datetime_current());
      };
      CREATE PROPERTY is_deleted := (EXISTS (.deleted_at));
      CREATE PROPERTY description: std::str;
      CREATE REQUIRED PROPERTY label: std::str;
      CREATE REQUIRED PROPERTY revision: std::int32 {
          SET default := 1;
      };
      CREATE REQUIRED PROPERTY status: default::IndexEntryStatus {
          SET default := (default::IndexEntryStatus.active);
      };
      CREATE PROPERTY updated_at: std::datetime;
  };
  CREATE TYPE default::IndexMention {
      CREATE ACCESS POLICY deny_anonymous
          DENY ALL USING (NOT (EXISTS (GLOBAL default::current_user)));
      CREATE LINK bbox: default::BoundingBox;
      CREATE REQUIRED LINK entry: default::IndexEntry {
          ON TARGET DELETE DELETE SOURCE;
      };
      CREATE PROPERTY deleted_at: std::datetime;
      CREATE PROPERTY end_offset: std::int32;
      CREATE PROPERTY start_offset: std::int32;
      CREATE CONSTRAINT std::expression ON (((NOT (EXISTS (.start_offset)) OR NOT (EXISTS (.end_offset))) OR (.end_offset > .start_offset))) {
          SET errmessage := 'end_offset must be greater than start_offset';
      };
      CREATE REQUIRED PROPERTY page_number: std::int32;
      CREATE PROPERTY page_number_end: std::int32;
      CREATE CONSTRAINT std::expression ON ((NOT (EXISTS (.page_number_end)) OR (.page_number_end > .page_number))) {
          SET errmessage := 'page_number_end must be greater than page_number';
      };
      CREATE LINK suggested_by_llm: default::LLMRun;
      CREATE REQUIRED PROPERTY created_at: std::datetime {
          SET default := (std::datetime_current());
      };
      CREATE PROPERTY is_deleted := (EXISTS (.deleted_at));
      CREATE REQUIRED PROPERTY range_type: default::MentionRangeType {
          SET default := (default::MentionRangeType.single_page);
      };
      CREATE REQUIRED PROPERTY text_span: std::str;
  };
  CREATE TYPE default::IndexVariant {
      CREATE ACCESS POLICY deny_anonymous
          DENY ALL USING (NOT (EXISTS (GLOBAL default::current_user)));
      CREATE REQUIRED LINK entry: default::IndexEntry {
          ON TARGET DELETE DELETE SOURCE;
      };
      CREATE ACCESS POLICY project_access
          ALLOW ALL USING (.entry.project.can_access);
      CREATE REQUIRED PROPERTY text: std::str;
      CREATE CONSTRAINT std::exclusive ON ((.entry, .text));
      CREATE REQUIRED PROPERTY created_at: std::datetime {
          SET default := (std::datetime_current());
      };
      CREATE REQUIRED PROPERTY revision: std::int32 {
          SET default := 1;
      };
      CREATE PROPERTY updated_at: std::datetime;
      CREATE REQUIRED PROPERTY variant_type: default::VariantType {
          SET default := (default::VariantType.alias);
      };
  };
  CREATE TYPE default::SourceDocument {
      CREATE ACCESS POLICY deny_anonymous
          DENY ALL USING (NOT (EXISTS (GLOBAL default::current_user)));
      CREATE REQUIRED LINK project: default::Project {
          ON TARGET DELETE DELETE SOURCE;
      };
      CREATE ACCESS POLICY project_access
          ALLOW ALL USING (.project.can_access);
      CREATE PROPERTY deleted_at: std::datetime;
      CREATE PROPERTY content_hash: std::str;
      CREATE REQUIRED PROPERTY created_at: std::datetime {
          SET default := (std::datetime_current());
      };
      CREATE PROPERTY is_deleted := (EXISTS (.deleted_at));
      CREATE REQUIRED PROPERTY file_name: std::str;
      CREATE PROPERTY file_size: std::int64;
      CREATE PROPERTY page_count: std::int32;
      CREATE PROPERTY processed_at: std::datetime;
      CREATE REQUIRED PROPERTY status: default::SourceDocumentStatus {
          SET default := (default::SourceDocumentStatus.uploaded);
      };
      CREATE REQUIRED PROPERTY title: std::str;
  };
  CREATE TYPE default::Document {
      CREATE REQUIRED LINK uploaded_by: default::User;
      CREATE ACCESS POLICY owner_has_full_access
          ALLOW ALL USING ((.uploaded_by.id ?= GLOBAL default::current_user_id));
      CREATE ACCESS POLICY others_read_only
          ALLOW SELECT ;
      CREATE PROPERTY content_hash: std::str;
      CREATE PROPERTY file_size: std::int64;
      CREATE REQUIRED PROPERTY filename: std::str;
      CREATE PROPERTY indexed_at: std::datetime;
      CREATE PROPERTY mime_type: std::str;
      CREATE REQUIRED PROPERTY original_filename: std::str;
      CREATE REQUIRED PROPERTY uploaded_at: std::datetime {
          SET default := (std::datetime_current());
      };
  };
  CREATE TYPE default::DocumentChunk {
      CREATE REQUIRED LINK document: default::Document;
      CREATE ACCESS POLICY document_owner_access
          ALLOW ALL USING ((.document.uploaded_by.id ?= GLOBAL default::current_user_id));
      CREATE REQUIRED PROPERTY chunk_index: std::int32;
      CREATE REQUIRED PROPERTY content: std::str;
      CREATE REQUIRED PROPERTY created_at: std::datetime {
          SET default := (std::datetime_current());
      };
      CREATE PROPERTY embedding: array<std::float32>;
  };
  ALTER TYPE default::LLMRun {
      CREATE LINK document: default::SourceDocument;
      CREATE ACCESS POLICY document_project_access
          ALLOW SELECT USING ((EXISTS (.document) AND .document.project.can_access));
  };
  CREATE TYPE default::Workspace {
      CREATE MULTI LINK members: default::User;
      CREATE ACCESS POLICY member_full_access
          ALLOW ALL USING (EXISTS ((SELECT
              .members
          FILTER
              (.id = GLOBAL default::current_user_id)
          )));
      CREATE REQUIRED LINK owner: default::User {
          ON TARGET DELETE DELETE SOURCE;
      };
      CREATE ACCESS POLICY owner_full_access
          ALLOW ALL USING ((.owner.id ?= GLOBAL default::current_user_id));
      CREATE ACCESS POLICY others_no_access
          DENY ALL ;
      CREATE REQUIRED PROPERTY created_at: std::datetime {
          SET default := (std::datetime_current());
      };
      CREATE PROPERTY description: std::str;
      CREATE REQUIRED PROPERTY name: std::str;
      CREATE PROPERTY updated_at: std::datetime;
  };
  CREATE TYPE default::DocumentPage {
      CREATE REQUIRED LINK document: default::SourceDocument {
          ON TARGET DELETE DELETE SOURCE;
      };
      CREATE ACCESS POLICY project_access
          ALLOW ALL USING (.document.project.can_access);
      CREATE REQUIRED PROPERTY page_number: std::int32;
      CREATE CONSTRAINT std::exclusive ON ((.document, .page_number));
      CREATE REQUIRED PROPERTY created_at: std::datetime {
          SET default := (std::datetime_current());
      };
      CREATE PROPERTY metadata: std::json;
      CREATE PROPERTY text_content: std::str;
  };
  CREATE TYPE default::ExportedIndex {
      CREATE REQUIRED LINK project: default::Project {
          ON TARGET DELETE DELETE SOURCE;
      };
      CREATE ACCESS POLICY project_access
          ALLOW ALL USING (.project.can_access);
      CREATE LINK created_by: default::User;
      CREATE REQUIRED PROPERTY content: std::str;
      CREATE REQUIRED PROPERTY created_at: std::datetime {
          SET default := (std::datetime_current());
      };
      CREATE REQUIRED PROPERTY format: default::ExportFormat;
      CREATE PROPERTY metadata: std::json;
  };
  ALTER TYPE default::IndexMention {
      CREATE REQUIRED LINK document: default::SourceDocument {
          ON TARGET DELETE DELETE SOURCE;
      };
      CREATE ACCESS POLICY project_access
          ALLOW ALL USING (.document.project.can_access);
      CREATE LINK page: default::DocumentPage {
          ON TARGET DELETE DELETE SOURCE;
      };
  };
  CREATE TYPE default::IndexRelation {
      CREATE REQUIRED LINK from_entry: default::IndexEntry {
          ON TARGET DELETE DELETE SOURCE;
      };
      CREATE ACCESS POLICY project_access
          ALLOW ALL USING (.from_entry.project.can_access);
      CREATE REQUIRED LINK to_entry: default::IndexEntry {
          ON TARGET DELETE DELETE SOURCE;
      };
      CREATE CONSTRAINT std::expression ON ((.from_entry != .to_entry)) {
          SET errmessage := 'IndexRelation cannot reference itself (from_entry = to_entry)';
      };
      CREATE REQUIRED PROPERTY relation_type: default::RelationType;
      CREATE CONSTRAINT std::exclusive ON ((.from_entry, .to_entry, .relation_type));
      CREATE REQUIRED PROPERTY created_at: std::datetime {
          SET default := (std::datetime_current());
      };
      CREATE PROPERTY note: std::str;
      CREATE REQUIRED PROPERTY revision: std::int32 {
          SET default := 1;
      };
      CREATE PROPERTY updated_at: std::datetime;
  };
  ALTER TYPE default::SourceDocument {
      CREATE MULTI LINK pages := (.<document[IS default::DocumentPage]);
      CREATE MULTI LINK mentions := (.<document[IS default::IndexMention]);
      CREATE MULTI LINK llm_runs := (.<document[IS default::LLMRun]);
  };
  ALTER TYPE default::DocumentPage {
      CREATE MULTI LINK mentions := (.<page[IS default::IndexMention]);
  };
  ALTER TYPE default::Project {
      CREATE MULTI LINK events := (.<project[IS default::Event]);
      CREATE MULTI LINK exported_indices := (.<project[IS default::ExportedIndex]);
      CREATE MULTI LINK index_entries := (.<project[IS default::IndexEntry]);
      CREATE PROPERTY entry_count := (std::count(.index_entries FILTER
          NOT (EXISTS (.deleted_at))
      ));
      CREATE MULTI LINK source_documents := (.<project[IS default::SourceDocument]);
      CREATE PROPERTY document_count := (std::count(.source_documents FILTER
          NOT (EXISTS (.deleted_at))
      ));
      CREATE LINK workspace: default::Workspace {
          ON TARGET DELETE DELETE SOURCE;
      };
  };
  ALTER TYPE default::IndexEntry {
      CREATE MULTI LINK mentions := (.<entry[IS default::IndexMention]);
      CREATE PROPERTY mention_count := (std::count(.mentions FILTER
          NOT (EXISTS (.deleted_at))
      ));
  };
  CREATE TYPE default::Prompt {
      CREATE ACCESS POLICY all_users_read
          ALLOW SELECT ;
      CREATE ACCESS POLICY owner_write
          ALLOW UPDATE, DELETE, INSERT ;
      CREATE REQUIRED PROPERTY name: std::str {
          CREATE CONSTRAINT std::exclusive;
      };
      CREATE REQUIRED PROPERTY version: std::str;
      CREATE CONSTRAINT std::exclusive ON ((.name, .version));
      CREATE REQUIRED PROPERTY created_at: std::datetime {
          SET default := (std::datetime_current());
      };
      CREATE PROPERTY description: std::str;
      CREATE REQUIRED PROPERTY template: std::str;
  };
  ALTER TYPE default::LLMRun {
      CREATE LINK prompt: default::Prompt;
  };
  ALTER TYPE default::Prompt {
      CREATE MULTI LINK llm_runs := (.<prompt[IS default::LLMRun]);
  };
  ALTER TYPE default::Workspace {
      CREATE MULTI LINK projects := (.<workspace[IS default::Project]);
  };
  CREATE PERMISSION default::app_access;
};
