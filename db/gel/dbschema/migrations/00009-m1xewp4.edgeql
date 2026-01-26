CREATE MIGRATION m1xewp4vnfhew7fulmvt6st4aqzpnpk5m7obfebjmpzqtgnq3ylekq
    ONTO m1jq7ibdddvzvfun43bzrqhxsexvwzbc5adk2emk4ktmspcxjxy63q
{
  ALTER TYPE default::LLMRun {
      ALTER ACCESS POLICY document_project_access USING ((EXISTS (.document) AND ((.document.project.owner.id ?= GLOBAL default::current_user_id) OR EXISTS ((SELECT
          .document.project.collaborators
      FILTER
          (.id = GLOBAL default::current_user_id)
      )))));
  };
};
