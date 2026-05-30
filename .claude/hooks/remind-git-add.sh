#!/usr/bin/env bash
# PreToolUse hook: git add 后提醒不提交
set -euo pipefail

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

if echo "$COMMAND" | grep -qE 'git\s+add'; then
  echo '确认已暂存本次修改。不要执行 git commit，提交由用户手动触发。'
fi

exit 0
