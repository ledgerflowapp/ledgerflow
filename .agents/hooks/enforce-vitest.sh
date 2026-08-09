#!/bin/bash
input_json=$(cat)

if [ -x /usr/bin/jq ]; then
  command_line=$(echo "$input_json" | /usr/bin/jq -r '.toolCall.args.CommandLine')
elif command -v jq >/dev/null 2>&1; then
  command_line=$(echo "$input_json" | jq -r '.toolCall.args.CommandLine')
else
  command_line=$(echo "$input_json" | grep -oE '"CommandLine"\s*:\s*"[^"]*"' | head -n 1 | cut -d'"' -f4)
fi

if echo "$command_line" | grep -qE '\bvitest(\s|$)'; then
  cat <<JSON_OUT
{
  "allow_tool": false,
  "deny_reason": "Do not run vitest directly. Use the wrapper script: pnpm test (it loads the .env.test environment)."
}
JSON_OUT
  exit 0
fi

cat <<JSON_OUT
{
  "allow_tool": true
}
JSON_OUT
exit 0
