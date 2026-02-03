CREATE MIGRATION m17rj6shzbfsd2v4it6v3boidt26jvzlnpejt5csfofiu2kzsxnvma
    ONTO m1njcsjqbywmcyncftusf2ogz64mnvrdxvjfhwbwztqc6qapd7h7wa
{
  ALTER TYPE default::IndexMention {
      DROP LINK bbox;
  };
  ALTER TYPE default::IndexMention {
      CREATE MULTI LINK bboxes: default::BoundingBox;
  };
};
