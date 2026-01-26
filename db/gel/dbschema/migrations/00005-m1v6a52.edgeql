CREATE MIGRATION m1v6a52mkamgei6f3o6xkm3z6cdrchyvq2wku7rhzpixqp6mgdde5q
    ONTO m17xodcldmhkje4vrno6e2a5tleyogbztotwfmrfsysqghmxcvz73q
{
  ALTER TYPE default::Project {
      DROP ACCESS POLICY others_no_access;
  };
};
