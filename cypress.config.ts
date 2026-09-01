import { defineConfig } from "cypress";
import { registerArgosTask } from "@argos-ci/cypress/task";

export default defineConfig({
  e2e: {
    baseUrl: "http://localhost:3000",
    async setupNodeEvents(on, config) {
      registerArgosTask(on, config, {
        // Upload to Argos on CI only.
        uploadToArgos: !!process.env.CI,
      });
    },
  },
});
