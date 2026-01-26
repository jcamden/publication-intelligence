CREATE MIGRATION m1lmm22a5oftvkuizi2svvfcprbh3z3tjhntwnqxi656qsqpf3gr3q
    ONTO m1iynsqqslxfcb3ffvazpfsqiknalld6r2465tkn77ojmcl27mzhwq
{
  ALTER TYPE default::User {
      CREATE CONSTRAINT std::expression ON (EXISTS (.identity)) {
          SET errmessage := 'User must have an identity';
      };
  };
};
