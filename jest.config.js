export default {
  testEnvironment: "node",

  transform: {},

  moduleNameMapper: {
    "^@mango/engine$": "<rootDir>/packages/mango-engine/index.js"
  },

  testPathIgnorePatterns: [
    "/node_modules/",
    "packages/adapters/sparx/test.js"
  ]
};