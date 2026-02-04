CREATE MIGRATION m1k4yxdxwdq6vo2x2lt3c7z2q7m6dwq5rrxmtkpnga5o5xy6o25uta
    ONTO m17rj6shzbfsd2v4it6v3boidt26jvzlnpejt5csfofiu2kzsxnvma
{
  CREATE SCALAR TYPE default::MentionType EXTENDING enum<text, region>;
  ALTER TYPE default::IndexMention {
      CREATE REQUIRED PROPERTY mention_type: default::MentionType {
          SET default := (default::MentionType.text);
      };
  };
};
