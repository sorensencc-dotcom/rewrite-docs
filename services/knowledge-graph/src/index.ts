import { GraphStore } from "./core/graph_store/GraphStore";
import { startServer } from "./api/server";
import * as path from "path";

const port = parseInt(process.env.KG_PORT || "3107", 10);
const dbPath = process.env.KG_DB_PATH || path.join("/tmp", "knowledge-graph.db");

async function main() {
  console.log(`Initializing Knowledge Graph store at ${dbPath}`);
  const store = new GraphStore(dbPath);

  console.log(`Starting Knowledge Graph service on port ${port}`);
  await startServer(store, port);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
