import { Agent, AnyTool } from "@anvia/core";
import { getModel } from "./models.js";
import { webSearchTool } from "./tools.js";
import { lens } from "./observer.js";

const RESEARCH_PROMPT = `
You are a focused Research Agent. Your task is to perform targeted research, cite sources, and record findings.

Guidelines:
1. For user queries that require facts or lookups, always use the 'web_search' tool.
2. In all reports and responses, include full source URLs cited from the search results.
3. When requested to write or save a report, use the 'write_file' tool to write a clear, concise markdown file (e.g. 'report.md').
4. Use 'read_file' to verify the contents of the report after writing.
5. If a request is ambiguous, politely state the ambiguity and ask for clarification.
6. If no useful results are found, state clearly that no relevant information was found.
`;

export function createResearchAgent(sandboxTools: readonly AnyTool[] = []) {
  return new Agent({
    id: "research-agent",
    model: getModel(),
    instructions: RESEARCH_PROMPT,
    tools: [webSearchTool, ...sandboxTools],
    observability: {
      observers: {
        tracing: lens.observer({ captureMode: "full" }),
      },
    },
  });
}
