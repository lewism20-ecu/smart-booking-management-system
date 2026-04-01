const globals = require("globals");

module.exports = [
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: "script",
      globals: {
        ...globals.node,
        ...globals.es2021
      }
    },
    rules: {
      // Add rules here if you want stricter linting
    }
  }
];