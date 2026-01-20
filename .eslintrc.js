/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: true,
  extends: ["@babynest/eslint-config/base"],
  ignorePatterns: ["apps/**", "packages/**"],
};
