#!/usr/bin/env bash
# PreToolUse hook: 编码前提醒根据任务类型选择对应工作流
set -euo pipefail

echo '编码前请确认已按任务类型选择对应流程（rules/workflow.md）：小Bug修复/重构/需求开发。建议使用项目 agent：frontend-dev / backend-dev。'

exit 0
