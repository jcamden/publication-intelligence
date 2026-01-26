CREATE MIGRATION m1nq2rdpgtuth37tesb2qi4nbpzxcmvpesfxb64cnxmkkqfyrzl5ba
    ONTO initial
{
  CREATE EXTENSION pgcrypto VERSION '1.3';
  CREATE EXTENSION auth VERSION '1.0';
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
  };
  CREATE GLOBAL default::current_user := (std::assert_single((SELECT
      default::User
  FILTER
      (.identity = GLOBAL ext::auth::ClientTokenIdentity)
  )));
  CREATE TYPE default::Document {
      CREATE REQUIRED LINK uploaded_by: default::User;
      CREATE ACCESS POLICY owner_has_full_access
          ALLOW ALL USING ((.uploaded_by ?= GLOBAL default::current_user));
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
          ALLOW ALL USING ((.document.uploaded_by ?= GLOBAL default::current_user));
      CREATE REQUIRED PROPERTY chunk_index: std::int32;
      CREATE REQUIRED PROPERTY content: std::str;
      CREATE REQUIRED PROPERTY created_at: std::datetime {
          SET default := (std::datetime_current());
      };
      CREATE PROPERTY embedding: array<std::float32>;
  };
};
