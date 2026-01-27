CREATE MIGRATION m1lniue47javh5b7poalqizl2f2ltkyedagcqlx46jmbnmaqrdyacq
    ONTO m1zbvrcybnwxhqal3mtx5l4gq5lnq6c5pvubzbv65easxac3uf66eq
{
  ALTER TYPE default::SourceDocument {
      CREATE REQUIRED PROPERTY storage_key: std::str {
          SET REQUIRED USING (<std::str>{});
      };
  };
};
