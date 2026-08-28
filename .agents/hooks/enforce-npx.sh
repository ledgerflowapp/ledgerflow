#!/bin/bash
input_json=$(cat)

if [ -x /usr/bin/jq ]; then
  command_line=$(echo "$input_json" | /usr/bin/jq -r '.toolCall.args.CommandLine')
elif command -v jq >/dev/null 2>&1; then
  command_line=$(echo "$input_json" | jq -r '.toolCall.args.CommandLine')
else
  command_line=$(echo "$input_json" | grep -oE '"CommandLine"\s*:\s*"[^"]*"' | head -n 1 | cut -d'"' -f4)
fi

if echo "$command_line" | grep -qE '\bnpx\b'; then
  cat <<JSON_OUT
{
  "allow_tool": false,
  "deny_reason": "Do not use npx. Use pnpm instead: for local packages in node_modules, use 'pnpm exec <cmd>' (or just 'pnpm <cmd>'). For remote/one-off tools, use 'pnpm dlx <cmd>'."
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

