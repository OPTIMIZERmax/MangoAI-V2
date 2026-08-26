import { AdapterRegistry } from "@mango/engine";
import { SparxAdapter } from "./src/SparxAdapter.js";

const registry = new AdapterRegistry();
const sparx = new SparxAdapter();

registry.register(sparx);

let keepBrowserOpen = false;

try {
  await sparx.initialize();

  console.log("Registered:", sparx.metadata);

  const result = await registry.execute(
    "sparx",
    {
      action: "personal-practice-question-inspect"
    },
    {
      reportProgress: async (p, msg) => {
        console.log(`${p}% - ${msg}`);
      }
    }
  );

  console.log("\n=== FRESH QUESTION RESULT ===");
  console.dir(result, { depth: null });

} catch (error) {
  console.error("\n=== TEST ERROR ===");
  console.error(error);

  if (
    /authentication|authenticated|session has expired/i.test(
      error?.message ?? ""
    )
  ) {
    keepBrowserOpen = true;

    console.log("");
    console.log("==========================================");
    console.log("SPARX AUTHENTICATION REQUIRED");
    console.log("==========================================");
    console.log("The browser will remain open.");
    console.log("Complete Sparx authentication manually.");
    console.log("==========================================");
    console.log("");
  }

} finally {
  if (!keepBrowserOpen) {
    await sparx.shutdown();
  } else {
    console.log(
      "[Sparx Test] Browser left open for authentication."
    );
    console.log(
      "[Sparx Test] Close it manually when finished."
    );
  }
}