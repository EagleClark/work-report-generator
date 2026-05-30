#!/usr/bin/env bash
set -u

pass=0
fail=0

check() {
  local label="$1" expected_exit="$2" input_json="$3" script="$4"
  local actual actual_exit
  set +e
  actual=$(echo "$input_json" | "$script" 2>&1)
  actual_exit=$?
  set -e
  if [ "$actual_exit" = "$expected_exit" ]; then
    echo "  OK: $label (exit=$actual_exit)"
    pass=$((pass + 1))
  else
    echo "  FAIL: $label (expected exit=$expected_exit, got exit=$actual_exit)"
    [ -n "$actual" ] && echo "       output: $actual"
    fail=$((fail + 1))
  fi
}

echo "=== block-git-commit.sh ==="

GC="git commit"

check "$GC → block (exit 2)"     2 "{\"tool_input\":{\"command\":\"$GC -m test\"}}"        .claude/hooks/block-git-commit.sh
check "$GC --amend → block"      2 "{\"tool_input\":{\"command\":\"$GC --amend\"}}"          .claude/hooks/block-git-commit.sh
check "git status → allow"       0 '{"tool_input":{"command":"git status"}}'                 .claude/hooks/block-git-commit.sh
check "git add → allow"          0 '{"tool_input":{"command":"git add foo.ts"}}'             .claude/hooks/block-git-commit.sh
check "npm test → allow"         0 '{"tool_input":{"command":"npm run test"}}'               .claude/hooks/block-git-commit.sh

echo ""
echo "=== remind-git-add.sh ==="
check "git add → remind"         0 '{"tool_input":{"command":"git add foo.ts"}}'             .claude/hooks/remind-git-add.sh
check "git add -A → remind"      0 '{"tool_input":{"command":"git add -A"}}'                 .claude/hooks/remind-git-add.sh
check "git status → silent"      0 '{"tool_input":{"command":"git status"}}'                 .claude/hooks/remind-git-add.sh
check "npm install → silent"     0 '{"tool_input":{"command":"npm install"}}'                .claude/hooks/remind-git-add.sh

echo ""
echo "=== remind-workflow.sh ==="
check "Write tool → remind"      0 '{"tool_input":{}}'                                       .claude/hooks/remind-workflow.sh

echo ""
echo "---"
echo "Results: $pass passed, $fail failed"
if [ "$fail" -eq 0 ]; then
  echo "ALL TESTS PASSED"
else
  echo "SOME TESTS FAILED"
  exit 1
fi
