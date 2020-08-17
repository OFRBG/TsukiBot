module.exports = {
  extends: ["../../.eslintrc.js"],
  plugins: ["functional"],
  rules: {
    "functional/no-throw-statement": 0,
    "functional/no-conditional-statement": 0,
    "functional/no-try-statement": 0,
    "functional/no-expression-statement": [
      "warn",
      { ignorePattern: ["logger.", "logError", "client.", "ServerCache."] }
    ],
    "@typescript-eslint/explicit-function-return-type": 0,
    "@typescript-eslint/explicit-module-boundary-types": 0,
    "@typescript-eslint/explicit-module-boundary-types": 0,
    "@typescript-eslint/no-explicit-any": 0,
    "@typescript-eslint/no-unsafe-assignment": 0,
    "@typescript-eslint/no-unsafe-member-access": 0,
    "@typescript-eslint/no-unsafe-return": 0,
    "@typescript-eslint/restrict-template-expressions": 0,
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
