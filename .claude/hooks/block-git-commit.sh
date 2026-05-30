#!/usr/bin/env bash
# PreToolUse hook: 阻止 git commit，提醒改为 git add
set -euo pipefail

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

if echo "$COMMAND" | grep -qE 'git\s+commit'; then
  echo '⚠️ 提交由用户手动触发。请改为执行 git add 暂存修改，不要执行 git commit。' >&2
  exit 2
fi

exit 0
