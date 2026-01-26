CREATE MIGRATION m17xodcldmhkje4vrno6e2a5tleyogbztotwfmrfsysqghmxcvz73q
    ONTO m1p2zef32ygha7nzlw6a34avosz3opqwan7a6jdaplnqayojh62bva
{
  ALTER TYPE default::Project {
      ALTER ACCESS POLICY others_no_access {
          DENY ALL;
          USING ((NOT ((.owner ?= GLOBAL default::current_user)) AND NOT (EXISTS ((GLOBAL default::current_user IN .collaborators)))));
      };
  };
};
