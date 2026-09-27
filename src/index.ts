import { createResearchAgent } from "./agent.js";
import { setupSandboxTools } from "./tools.js";
import { lens } from "./observer.js";

async function main() {
  const { sandbox, sandboxTools } = await setupSandboxTools();

  try {
    const agent = createResearchAgent(sandboxTools);
    const query = "Research the latest features in TypeScript 5.7, save a report to report.md, and include source URLs.";

    let result: any = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        result = await agent.generate({ prompt: query });
        break;
      } catch (err: any) {
        if (attempt < 3 && (err?.status === 502 || err?.status === 429 || err?.message?.includes("fetch failed"))) {
          console.log(`⚠️  [Gateway ${err?.status || "error"}] Retrying attempt ${attempt + 1}/3 in 2s...`);
          await new Promise((r) => setTimeout(r, 2000));
        } else {
          throw err;
        }
      }
    }
    console.log("Agent Response:\n", result.text);

    // Read the report directly from sandbox to verify
    const savedReport = await sandbox.runtime.readTextFile({ path: "report.md" }).catch(() => null);
    if (savedReport) {
      console.log("\n--- Verified File Content in Sandbox (report.md) ---");
      console.log(savedReport);
    }
  } finally {
    await sandbox.destroy();
    await lens.flush().catch(() => {});
  }
}

main().catch(console.error);
