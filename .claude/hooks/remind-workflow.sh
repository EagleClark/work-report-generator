#!/usr/bin/env bash
# PreToolUse hook: 编辑文件前提醒工作流步骤
set -euo pipefail

echo '编码前请确认已执行 brainstorming 和 TDD 步骤。建议使用项目 agent：frontend-dev / backend-dev。'

exit 0
