CREATE MIGRATION m1p2zef32ygha7nzlw6a34avosz3opqwan7a6jdaplnqayojh62bva
    ONTO m1jhu2sl7mrnmwpo3353zcitnmqrhyszaw7mi4vjc5s3lvf3xtvmca
{
  ALTER TYPE default::Project {
      CREATE ACCESS POLICY authenticated_can_insert
          ALLOW INSERT USING (EXISTS (GLOBAL default::current_user));
      ALTER ACCESS POLICY others_no_access DENY SELECT, UPDATE, DELETE;
  };
};
