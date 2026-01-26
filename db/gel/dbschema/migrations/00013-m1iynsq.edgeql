CREATE MIGRATION m1iynsqqslxfcb3ffvazpfsqiknalld6r2465tkn77ojmcl27mzhwq
    ONTO m1gswxjg2sa66vbgzyrrh2o5zj2ij2bh4lu2xbcrogqxyubk7o4moa
{
  ALTER TYPE default::IndexRelation {
      CREATE ACCESS POLICY project_access
          ALLOW ALL USING (.from_entry.project.can_access);
  };
  ALTER TYPE default::IndexRelation {
      DROP ACCESS POLICY project_members_read;
  };
  ALTER TYPE default::IndexRelation {
      DROP ACCESS POLICY project_members_write;
  };
};
