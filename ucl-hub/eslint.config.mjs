import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import firebaseRules from "@firebase/eslint-plugin-security-rules";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  // Firebase Security Rules: parsed with Firebase's own grammar, so syntax errors fail `npm run lint`.
  { files: ["**/*.rules"], ...firebaseRules.configs["flat/recommended"] },
  {
    files: ["**/*.{ts,tsx,mts,js,mjs}"],
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "@typescript-eslint/consistent-type-imports": ["warn", { prefer: "type-imports" }],
    },
  },
  globalIgnores([".next/**", "node_modules/**", "coverage/**", "next-env.d.ts", ".emulator-data/**"]),
]);
