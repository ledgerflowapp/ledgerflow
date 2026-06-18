import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import pluginQuery from "@tanstack/eslint-plugin-query";
const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  ...pluginQuery.configs["flat/recommended"],
  {
    rules: {
      "no-restricted-syntax": [
        "warn",
        {
          selector: "BinaryExpression[operator='*']",
          message: "Avoid raw multiplication for currency. Use currency.ts utilities."
        },
        {
          selector: "BinaryExpression[operator='/']",
          message: "Avoid raw division for currency. Use currency.ts utilities."
        }
      ]
    }
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
