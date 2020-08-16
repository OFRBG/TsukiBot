module.exports = {
  env: {
    node: true
  },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: "./tsconfig.json",
    sourceType: "module"
  },
  plugins: ["@typescript-eslint", "prettier", "functional"],
  extends: [
    "eslint:recommended",
    "plugin:prettier/recommended",
    "plugin:@typescript-eslint/eslint-recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
    "plugin:functional/external-recommended",
    "plugin:functional/recommended",
    "plugin:functional/currying"
  ],
  rules: {
    "functional/no-throw-statement": 0,
    "functional/no-conditional-statement": 0,
    "functional/no-try-statement": 0,
    "functional/no-expression-statement": [
      "warn",
      { ignorePattern: ["logger.", "logError", "client.", "ServerCache."] }
    ],
    "@typescript-eslint/no-unsafe-assignment": 0,
    "@typescript-eslint/explicit-module-boundary-types": 0,
    "@typescript-eslint/no-misused-promises": [
      "error",
      { checksVoidReturn: false }
    ]
  },
  globals: {
    Atomics: "readonly",
    SharedArrayBuffer: "readonly"
  }
};
