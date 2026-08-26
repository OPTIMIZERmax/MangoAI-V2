import { AdapterRegistry } from "@mango/engine";
import { SparxAdapter } from "./src/SparxAdapter.js";

const registry = new AdapterRegistry();
const sparx = new SparxAdapter();

registry.register(sparx);

console.log("[Test] Initializing Sparx adapter...");

await sparx.initialize();

console.log("[Test] Sparx adapter initialized.");
console.log("[Test] Registered:", sparx.metadata);

try {
  console.log("[Test] Starting Sparx workflow...");

  const result = await registry.execute(
    "sparx",
    {
      action: "workflow-start"
    },
    {
      reportProgress: async (progress, message) => {
        console.log(`[Progress] ${progress}% - ${message}`);
      }
    }
  );

  console.log("\n========== WORKFLOW RESULT ==========\n");

  console.dir(result, {
    depth: null,
    colors: true
  });

  console.log("\n========== WORKFLOW COMPLETE ==========\n");

} catch (error) {
  console.error("\n========== WORKFLOW FAILED ==========\n");

  console.error(error);

} finally {
  console.log("[Test] Shutting down Sparx adapter...");

  await sparx.shutdown();

  console.log("[Test] Done.");
}

