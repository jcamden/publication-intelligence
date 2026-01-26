CREATE MIGRATION m1s3yvadom2oy5jkhq6gz43xjmwdbfvkcl7k2abr54jpn4c5sszqea
    ONTO m1xewp4vnfhew7fulmvt6st4aqzpnpk5m7obfebjmpzqtgnq3ylekq
{
  ALTER TYPE default::IndexEntry {
      CREATE ACCESS POLICY deny_anonymous
          DENY ALL USING (NOT (EXISTS (GLOBAL default::current_user)));
  };
  ALTER TYPE default::IndexVariant {
      CREATE ACCESS POLICY deny_anonymous
          DENY ALL USING (NOT (EXISTS (GLOBAL default::current_user)));
  };
  ALTER TYPE default::Project {
      CREATE ACCESS POLICY deny_anonymous
          DENY ALL USING (NOT (EXISTS (GLOBAL default::current_user)));
  };
  ALTER TYPE default::SourceDocument {
      CREATE ACCESS POLICY deny_anonymous
          DENY ALL USING (NOT (EXISTS (GLOBAL default::current_user)));
  };
};
