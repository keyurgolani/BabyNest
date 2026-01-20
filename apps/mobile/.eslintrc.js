/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: true,
  extends: ["@babynest/eslint-config/react-native"],
  parserOptions: {
    project: "./tsconfig.json",
    tsconfigRootDir: __dirname,
  },
  ignorePatterns: [
    "node_modules/",
    ".expo/",
    "dist/",
    "babel.config.js",
    "metro.config.js",
    "tailwind.config.js",
  ],
};
