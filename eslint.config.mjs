import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // Ignore generated and build folders
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "src/generated/prisma/**", // 👈 ignore Prisma-generated files
    ],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    files: ["src/generated/prisma/**/*"],
    rules: {
      "@typescript-eslint/no-require-imports": "off", // disable require() warning
      "@typescript-eslint/no-unused-vars": "off",     // disable unused var warnings
    },
  },
];

export default eslintConfig;
