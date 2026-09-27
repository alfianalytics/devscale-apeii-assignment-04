import { createResearchAgent } from "./agent.js";
import { setupSandboxTools } from "./tools.js";
import { lens } from "./observer.js";

interface TestCase {
  id: number;
  name: string;
  prompt: string;
  validate: (response: string, sandbox: any) => Promise<{ pass: boolean; reason: string }>;
}

const testCases: TestCase[] = [
  {
    id: 1,
    name: "Clear answer",
    prompt: "What is the capital city of France? Answer in one sentence.",
    validate: async (text) => {
      const pass = text.toLowerCase().includes("paris");
      return { pass, reason: pass ? "Contains correct answer 'Paris'" : "Did not mention Paris" };
    },
  },
  {
    id: 2,
    name: "Ambiguous request",
    prompt: "Tell me more about that thing with the guy.",
    validate: async (text) => {
      const pass = text.toLowerCase().includes("clarif") || text.toLowerCase().includes("which") || text.includes("?");
      return { pass, reason: pass ? "Agent requested clarification" : "Agent failed to handle ambiguity" };
    },
  },
  {
    id: 3,
    name: "No useful result",
    prompt: "Search for nonexistingquantumsuperdata999999xyz and report findings.",
    validate: async (text) => {
      const pass = text.toLowerCase().includes("no") || text.toLowerCase().includes("not found");
      return { pass, reason: pass ? "Agent noted lack of useful results" : "Agent hallucinated results" };
    },
  },
  {
    id: 4,
    name: "Source citation",
    prompt: "Find the latest release version of Node.js and provide the source URL.",
    validate: async (text) => {
      const urlRegex = /https?:\/\/[^\s)]+/i;
      const pass = urlRegex.test(text);
      return { pass, reason: pass ? "Contains valid source URL citation" : "Missing source URL" };
    },
  },
  {
    id: 5,
    name: "Report file created",
    prompt: "Research Vite build tool advantages, write a summary into 'report.md', and read it back.",
    validate: async (_, sandbox) => {
      try {
        const fileContent = await sandbox.runtime.readTextFile({ path: "report.md" });
        const pass = fileContent && fileContent.trim().length > 10;
        return { pass, reason: pass ? "report.md was successfully written and verified" : "File is empty" };
      } catch (err) {
        return { pass: false, reason: "report.md was not found in sandbox" };
      }
    },
  },
];

async function runEvals() {
  console.log("==========================================");
  console.log("   RUNNING 5 EVAL CASES FOR RESEARCH AGENT");
  console.log("==========================================\n");

  const { sandbox, sandboxTools } = await setupSandboxTools();
  const agent = createResearchAgent(sandboxTools);

  let passedCount = 0;

  try {
    for (const test of testCases) {
      console.log(`[Case ${test.id}] ${test.name}`);
      console.log(`Prompt: "${test.prompt}"`);

      // Retry mechanism for transient upstream gateway hiccups (e.g. 502 Bad Gateway)
      let result: any = null;
      let attempts = 0;
      const maxAttempts = 3;

      while (attempts < maxAttempts) {
        attempts++;
        try {
          result = await agent.generate({ prompt: test.prompt });
          break;
        } catch (err: any) {
          if (attempts < maxAttempts && (err?.status === 502 || err?.status === 429 || err?.message?.includes("fetch failed"))) {
            console.log(`⚠️  [Gateway ${err?.status || "error"}] Retrying attempt ${attempts + 1}/${maxAttempts} in 2s...`);
            await new Promise((r) => setTimeout(r, 2000));
          } else {
            throw err;
          }
        }
      }

      const evalResult = await test.validate(result.text, sandbox);

      if (evalResult.pass) {
        console.log(`✅ PASS: ${evalResult.reason}\n`);
        passedCount++;
      } else {
        console.log(`❌ FAIL: ${evalResult.reason}\n`);
      }
    }
  } finally {
    await sandbox.destroy();
    await lens.flush().catch(() => {});
  }

  console.log("------------------------------------------");
  console.log(`Summary: ${passedCount} / ${testCases.length} Passed`);
  console.log("==========================================");
}

runEvals().catch(console.error);
