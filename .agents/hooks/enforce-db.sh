#!/bin/bash
input_json=$(cat)

if [ -x /usr/bin/jq ]; then
  command_line=$(echo "$input_json" | /usr/bin/jq -r '.toolCall.args.CommandLine')
elif command -v jq >/dev/null 2>&1; then
  command_line=$(echo "$input_json" | jq -r '.toolCall.args.CommandLine')
else
  command_line=$(echo "$input_json" | grep -oE '"CommandLine"\s*:\s*"[^"]*"' | head -n 1 | cut -d'"' -f4)
fi

if echo "$command_line" | grep -qE '\bdrizzle-kit\s+(generate|migrate|push|studio|up|check)\b'; then
  cat <<JSON_OUT
{
  "allow_tool": false,
  "deny_reason": "Do not run drizzle-kit directly. Use the configured project scripts: pnpm db:generate, pnpm db:migrate, or pnpm db:push (they load required env vars)."
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
