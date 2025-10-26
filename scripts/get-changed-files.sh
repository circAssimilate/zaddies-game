#!/bin/bash
#
# Get Changed Files for GitHub Actions
#
# Retrieves the list of changed files in a PR or push event
# and outputs them in a format suitable for the categorize-files script
#

set -e

# Get the base and head refs
if [ -n "$GITHUB_BASE_REF" ]; then
  # Pull request event
  BASE="origin/$GITHUB_BASE_REF"
  HEAD="HEAD"
elif [ -n "$GITHUB_EVENT_BEFORE" ] && [ "$GITHUB_EVENT_BEFORE" != "0000000000000000000000000000000000000000" ]; then
  # Push event with valid before SHA
  BASE="$GITHUB_EVENT_BEFORE"
  HEAD="$GITHUB_SHA"
else
  # Fallback: compare with main branch
  BASE="origin/main"
  HEAD="HEAD"
fi

echo "Comparing $BASE...$HEAD" >&2

# Get list of changed files
git diff --name-only "$BASE...$HEAD" || {
  echo "Error: Failed to get changed files" >&2
  exit 1
}
