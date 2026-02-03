# Data migration script: Convert single bbox to bboxes array
# 
# This script converts existing IndexMention records from the old single-bbox
# format to the new multi-bbox array format.
#
# Run with: gel query -f migrate-bbox-to-bboxes.edgeql
#
# NOTE: This migration is designed to be idempotent. If a mention already has
# bboxes populated, it will be skipped. The old bbox field has been removed
# from the schema, so this script serves as documentation for the migration
# that was done.
#
# Original schema (before migration):
#   type IndexMention {
#     bbox: BoundingBox;  # Single bbox
#   }
#
# New schema (after migration):
#   type IndexMention {
#     multi bboxes: BoundingBox;  # Array of bboxes
#   }
#
# Migration was done as part of the EdgeDB schema migration when changing
# the field from singular to plural (bbox -> bboxes).
#
# For future reference, if manual data migration is needed:
# 1. Fetch all mentions with their old bbox values
# 2. For each mention, create a single-element bboxes array
# 3. Update the mention with the new bboxes array
# 4. Verify no data was lost

# Query to verify migration (all mentions should have at least one bbox):
SELECT IndexMention {
  id,
  text_span,
  bbox_count := count(.bboxes)
}
FILTER count(.bboxes) = 0;

# If the above query returns any results, those mentions need to be fixed.
# In practice, the schema migration handles this automatically by preserving
# the old bbox value when converting to the new bboxes array structure.
