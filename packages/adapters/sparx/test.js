import { AdapterRegistry } from "@mango/engine";
import { SparxAdapter } from "./src/SparxAdapter.js";

const registry = new AdapterRegistry();

const sparx = new SparxAdapter();

registry.register(sparx);

// IMPORTANT: initialize the adapter first
await sparx.initialize();

console.log("Registered:", sparx.metadata);

const result = await registry.execute(
  "sparx",
  { action: "test" },
  {
    reportProgress: async (p, msg) => {
      console.log(`${p}% - ${msg}`);
    }
  }
);

console.log(result);

// Clean shutdown
await sparx.shutdown();