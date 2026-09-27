# Research Agent with Docker Sandbox & Evals

An AI-powered autonomous research agent built with **TypeScript**, **@anvia/core**, **@anvia/sandbox**, **@tavily/core**, and **@anvia/lens**. 

The agent accepts research topics, performs real-time web searches with Tavily, summarizes findings with source citations, safely creates and verifies reports inside an isolated Docker sandbox container (`report.md`), and sends execution traces to Anvia Lens.

---

## ✨ Features

- **Autonomous Research Agent**: Orchestrated using `@anvia/core` with structured guidance for source citations, fact validation, and ambiguous input handling.
- **Web Search Tool**: Powered by `@tavily/core`, extracting up-to-date facts, snippets, and verified source URLs.
- **Isolated Docker Sandbox**: Uses `@anvia/sandbox` (`alpine:latest`) to write and read `report.md` in an ephemeral container without touching the host machine.
- **5 Automated Evaluation Test Cases**: Covers clear answers, ambiguous queries, no-result scenarios, source URL citations, and sandbox file creation verification.
- **Full Tracing & Observability**: Real-time observability with `@anvia/lens` for tracking tokens, tool executions, and step-by-step agent decisions.
- **Transient Error Resilience**: Exponential-like retry logic handling upstream `502 Bad Gateway` and `429 Rate Limit` gateway hiccups.

---

## 🏗️ Architecture

```
                    ┌─────────────────────────┐
                    │       User Query        │
                    └───────────┬─────────────┘
                                │
                                ▼
                    ┌─────────────────────────┐
                    │      Research Agent     │ ───► Anvia Lens Tracing (http://localhost)
                    └──────┬───────────┬──────┘
                           │           │
          ┌────────────────┘           └────────────────┐
          ▼                                             ▼
┌──────────────────┐                           ┌──────────────────┐
│ Web Search Tool  │                           │  Sandbox Tools   │
│ (Tavily Core)    │                           │ - write_file     │
│ - queries web    │                           │ - read_file      │
│ - returns URLs   │                           └────────┬─────────┘
└──────────────────┘                                    │
                                                        ▼
                                               ┌──────────────────┐
                                               │ report.md inside │
                                               │ Docker Sandbox   │
                                               └──────────────────┘
```

---

## 📁 Project Structure

```
.
├── src/
│   ├── models.ts       # LLM provider configuration (gateway.devscale.id)
│   ├── observer.ts     # LensClient setup for observability & tracing
│   ├── tools.ts        # Tavily search tool & Docker sandbox helper
│   ├── agent.ts        # Research agent configuration & instructions
│   ├── index.ts        # Single run demonstration script (pnpm dev)
│   └── eval.ts         # 5 Automated evaluation test cases (pnpm eval)
├── package.json        # Dependencies and execution scripts
├── tsconfig.json       # TypeScript configuration
└── README.md           # Project documentation
```

---

## ⚙️ Prerequisites

- **Node.js**: `v20.12+` or `v22+`
- **Package Manager**: `pnpm`
- **Docker Desktop**: Required to execute sandbox container tools and optional Lens dashboard.

---

## 🚀 Getting Started

### 1. Installation

```bash
pnpm install
```

### 2. Environment Setup

Create a `.env` file in the project root:

```env
OPENAI_API_KEY=your_gateway_or_openai_api_key
OPENAI_BASE_URL=https://gateway.devscale.id/v1
MODEL_ID=gpt-5.6-luna

# Web Search
TAVILY_API_KEY=your_tavily_api_key

# Observability (Optional - Anvia Lens)
ANVIA_LENS_BASE_URL=http://localhost
ANVIA_LENS_PUBLIC_KEY=your_lens_public_key
ANVIA_LENS_SECRET_KEY=your_lens_secret_key
ANVIA_LENS_MEDIA_UPLOAD_ENABLED=false
```

### 3. Ensure Docker Image is Available

```bash
docker pull alpine:latest
```

---

## 🧪 Running the Agent

### Single Demonstration Run

Runs a sample research request, searches for facts, writes `report.md` inside the sandbox, verifies its contents, flushes traces to Lens, and destroys the sandbox:

```bash
pnpm dev
```

### Run Evaluation Suite (5 Test Cases)

Runs all 5 evaluation scenarios sequentially and prints a scorecard:

```bash
pnpm eval
```

---

## 📊 Evaluation Test Suite

The 5 automated evaluation cases defined in `src/eval.ts`:

| # | Case Name | Objective / Scenario | Pass Criteria |
|---|---|---|---|
| **1** | **Clear answer** | Direct factual question ("Capital of France") | Answers accurately with "Paris" in a concise response. |
| **2** | **Ambiguous request** | Vague user intent ("Tell me about that thing with the guy") | Identifies ambiguity and politely requests clarification. |
| **3** | **No useful result** | Query for nonexistent entities | Avoids hallucination; states that no results were found. |
| **4** | **Source citation** | Query requiring verified documentation | Successfully includes valid HTTP/HTTPS source URLs. |
| **5** | **Report file created** | Research topic saved to file | Writes `report.md` inside sandbox and verifies non-empty content. |

---

## 🔍 Observability with Anvia Lens

Anvia Lens provides real-time distributed tracing for inspectable LLM completions, prompts, tool calls, and eval runs.

### 1. Start the Lens Docker Stack
Launch the self-hosted Lens stack (ClickHouse, PostgreSQL, Redis, Lens API, and Web UI):
```bash
cd ../basic-evals/lens
docker compose up -d
```

### 2. Access Dashboard & Obtain Ingestion Keys
1. Open **http://localhost** in your browser.
2. Sign in or register your workspace account.
3. In your project settings, navigate to **API Keys** / **Ingestion Keys**.
4. Generate or copy your **Public Key** (`pk-lens-...`) and **Secret Key** (`sk-lens-...`).

### 3. Configure `.env`
Add the keys to your project's `.env` file:
```env
ANVIA_LENS_BASE_URL=http://localhost
ANVIA_LENS_PUBLIC_KEY=pk-lens-your_public_key_here
ANVIA_LENS_SECRET_KEY=sk-lens-your_secret_key_here
ANVIA_LENS_MEDIA_UPLOAD_ENABLED=false
```

### 4. Run & View Traces
Run either:
```bash
pnpm dev
# or
pnpm eval
```
Traces, token usage, tool arguments (`web_search`, `write_file`, `read_file`), and execution latencies will appear live on **http://localhost** under the `research-agent` service.
