import { AdapterRegistry } from "@mango/engine";
import { SparxAdapter } from "./src/SparxAdapter.js";

const registry = new AdapterRegistry();

const sparx = new SparxAdapter();

registry.register(sparx);

await sparx.initialize();

const result = await registry.execute(
  "sparx",
  {
 action: "login",
 school: "Beal High School",
 method: "microsoft"
},
  {
    reportProgress: async (p, msg) => {
      console.log(`${p}% - ${msg}`);
    }
  }
);

console.log(result);

await sparx.shutdown();