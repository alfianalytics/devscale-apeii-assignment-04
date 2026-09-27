import { createTool } from "@anvia/core";
import { DockerSandboxClient, createDockerSandboxTools } from "@anvia/sandbox";
import { tavily } from "@tavily/core";
import z from "zod";
import "dotenv/config";

// Initialize Tavily client
const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY });

/**
 * 1. Web Search Tool (powered by Tavily)
 * Returns structured search results including title, snippet/content, and URL.
 */
export const webSearchTool = createTool({
  name: "web_search",
  description: "Search the web for up-to-date facts, documentation, or information. Returns title, snippet/content, and source URL.",
  inputSchema: z.object({
    query: z.string().describe("Search query to execute"),
  }),
  execute: async ({ query }) => {
    console.log(`[Tool: web_search] Querying Tavily: "${query}"`);
    try {
      const response = await tvly.search(query, {
        maxResults: 5,
      });

      if (!response.results || response.results.length === 0) {
        return "No useful results found for this query.";
      }

      return response.results.map((result) => ({
        title: result.title,
        content: result.content,
        url: result.url,
      }));
    } catch (error: any) {
      console.error("[Tool: web_search] Tavily Error:", error?.message || error);
      return `Failed to fetch search results: ${error?.message || String(error)}`;
    }
  },
});

/**
 * 2. Sandbox Setup Helper
 * Creates an ephemeral container and exposes write_file and read_file tools.
 */
export async function setupSandboxTools() {
  const sandboxClient = new DockerSandboxClient();
  const image = "alpine:latest";

  // Ensure image is pulled locally (as shown in Day 10 Slide 3)
  await sandboxClient.pullImage({ image });

  // Creates an ephemeral Docker sandbox container
  const sandbox = await sandboxClient.createSandbox({
    image,
    workspace: { type: "ephemeral" },
    network: { mode: "none" }, // Isolated filesystem execution
  });

  // Pick only the required file tools: write_file and read_file
  const sandboxTools = createDockerSandboxTools({
    sandbox: sandbox.runtime,
    tools: ["write_file", "read_file"],
  });

  return { sandbox, sandboxTools };
}
