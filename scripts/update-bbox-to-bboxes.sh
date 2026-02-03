#!/bin/bash

# Script to update bbox: to bboxes: [ in test files
# This helps with the multi-line highlight refactor

# Find all .stories.tsx and .test.ts files and update bbox references
find packages/yaboujee apps/index-pdf-frontend -type f \( -name "*.stories.tsx" -o -name "*.test.ts" -o -name "*.test.tsx" \) -print0 | while IFS= read -r -d '' file; do
  # Check if file contains bbox: pattern
  if grep -q 'bbox: {' "$file"; then
    echo "Updating $file"
    # Use perl for more complex regex replacement
    perl -i -pe 's/bbox: \{/bboxes: [{/g' "$file"
    perl -i -pe 's/\},(\s*label:)/}], $1/g' "$file"
    perl -i -pe 's/\},(\s*text:)/}], $1/g' "$file"
    perl -i -pe 's/\},(\s*\})/}], $1/g' "$file"
  fi
done

echo "Update complete! Please review changes and run tests."
