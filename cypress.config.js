const { defineConfig } = require("cypress");

module.exports = defineConfig({
  e2e: {
    projectId: "n7n6ng",
    setupNodeEvents(on, config) {
    },
    baseUrl: 'http://localhost:3000/api/',
    screenshotOnRunFailure: true,
    video: true
  },
});
