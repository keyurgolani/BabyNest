module.exports = {
  extends: ["@babynest/eslint-config/nestjs"],
  parserOptions: {
    project: "tsconfig.json",
    tsconfigRootDir: __dirname,
    sourceType: "module",
  },
  root: true,
  ignorePatterns: ["**/*.d.ts", "**/*.js", "**/*.js.map"],
};
