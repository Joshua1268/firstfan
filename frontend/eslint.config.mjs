import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/ui/**", "src/lib/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        { patterns: [{ group: ["@/features/*"], message: "ui/ and lib/ never import from features/." }] },
      ],
    },
  },
  // Last, so formatting is left to Prettier.
  prettier,
  globalIgnores([".next/**", ".next-*/**", "out/**", "build/**", "next-env.d.ts"]),
]);

export default eslintConfig;
