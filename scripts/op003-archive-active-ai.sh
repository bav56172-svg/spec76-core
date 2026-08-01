#!/usr/bin/env bash

set -u

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT" || exit 1

mkdir -p archive/legacy/active-ai

move_if_exists() {
  source_path="$1"
  target_path="$2"

  if [ -e "$source_path" ]; then
    mkdir -p "$(dirname "$target_path")"
    git mv "$source_path" "$target_path"
    printf 'archived: %s -> %s\n' "$source_path" "$target_path"
  else
    printf 'skip: %s not found\n' "$source_path"
  fi
}

move_if_exists "app/hooks/useRealtimeAI.ts" "archive/legacy/active-ai/app-hooks/useRealtimeAI.ts"
move_if_exists "hooks/useRealtimeAI.ts" "archive/legacy/active-ai/root-hooks/useRealtimeAI.ts"
move_if_exists "hooks/useRealtimeExecutionLoop.ts" "archive/legacy/active-ai/root-hooks/useRealtimeExecutionLoop.ts"
move_if_exists "app/lib/product/launchSystem.ts" "archive/legacy/active-ai/app-lib-product/launchSystem.ts"
move_if_exists "app/projects/[id]/ai" "archive/legacy/active-ai/app-project-ai"
move_if_exists "app/projects/[id]/ai-dashboard" "archive/legacy/active-ai/app-project-ai-dashboard"
move_if_exists "app/projects/[id]/components/AgentFeedbackPanel.tsx" "archive/legacy/active-ai/app-project-components/AgentFeedbackPanel.tsx"
move_if_exists "lib/spec76" "archive/legacy/active-ai/lib-spec76"

rm -rf .next

printf '\n===== ACTIVE MVP TREE =====\n'
find app -maxdepth 4 -type f | sort

printf '\n===== GIT STATUS =====\n'
git status --short
