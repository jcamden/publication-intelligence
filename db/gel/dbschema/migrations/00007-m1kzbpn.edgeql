CREATE MIGRATION m1kzbpngj2bphgvzjui4xrpahhblsbjufy2qb4gje2cyi4ubedmfva
    ONTO m1ngc24mznwwgzgt3ofo5pvbuqquw3luja7lcuw2dxub7pwzyordjq
{
  ALTER GLOBAL default::current_user USING (SELECT
      default::User
  FILTER
      (.identity = GLOBAL ext::auth::ClientTokenIdentity)
  );
  ALTER TYPE default::Project {
      ALTER ACCESS POLICY collaborator_full_access USING (EXISTS ((SELECT
          .collaborators
      FILTER
          (.id = (SELECT
              (GLOBAL default::current_user).id
          ))
      )));
      ALTER ACCESS POLICY owner_full_access USING ((.owner.id ?= (SELECT
          (GLOBAL default::current_user).id
      )));
  };
  ALTER TYPE default::DocumentChunk {
      ALTER ACCESS POLICY document_owner_access USING ((.document.uploaded_by.id ?= (SELECT
          (GLOBAL default::current_user).id
      )));
  };
  ALTER TYPE default::Workspace {
      ALTER ACCESS POLICY member_full_access USING (EXISTS ((SELECT
          .members
      FILTER
          (.id = (SELECT
              (GLOBAL default::current_user).id
          ))
      )));
      ALTER ACCESS POLICY owner_full_access USING ((.owner.id ?= (SELECT
          (GLOBAL default::current_user).id
      )));
  };
  ALTER TYPE default::Document {
      ALTER ACCESS POLICY owner_has_full_access USING ((.uploaded_by.id ?= (SELECT
          (GLOBAL default::current_user).id
      )));
  };
};
