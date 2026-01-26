CREATE MIGRATION m1ppxqdesappbkmkl52qjljcdzive5b6nhf4m2dbdtjbwd4fjomwmq
    ONTO m1s3yvadom2oy5jkhq6gz43xjmwdbfvkcl7k2abr54jpn4c5sszqea
{
  ALTER TYPE default::Event {
      CREATE ACCESS POLICY deny_anonymous
          DENY ALL USING (NOT (EXISTS (GLOBAL default::current_user)));
  };
  ALTER TYPE default::IndexMention {
      CREATE ACCESS POLICY deny_anonymous
          DENY ALL USING (NOT (EXISTS (GLOBAL default::current_user)));
  };
  ALTER TYPE default::LLMRun {
      CREATE ACCESS POLICY deny_anonymous
          DENY ALL USING (NOT (EXISTS (GLOBAL default::current_user)));
  };
};
