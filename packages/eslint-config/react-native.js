/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: ["./base.js"],
  env: {
    browser: true,
    "react-native/react-native": true,
  },
  plugins: ["react", "react-native", "react-hooks"],
  settings: {
    react: {
      version: "detect",
    },
  },
  rules: {
    "react/react-in-jsx-scope": "off",
    "react/prop-types": "off",
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn",
    "react-native/no-unused-styles": "warn",
    "react-native/split-platform-components": "warn",
    "react-native/no-inline-styles": "warn",
  },
};
