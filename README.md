# Trinethra Analyzer

An AI-assisted tool designed to help DeepThought psychology interns process and evaluate supervisor transcripts efficiently. Built for the DeepThought Software Developer recruitment assignment.

## Setup Instructions

### Prerequisites
- [Node.js](https://nodejs.org/en/) installed (v18+ recommended)
- [Ollama](https://ollama.com) installed and running locally

### 1. Model Setup
Pull the required LLM model via Ollama:
```bash
ollama pull llama3.2
```
Ensure Ollama is running in the background (usually starts automatically, or run `ollama serve`).

### 2. Application Setup
Install dependencies and start the Next.js development server:
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

## Model Selection

I chose **phi3** (via `phi3:latest`) because it strikes an excellent balance between speed and reasoning capability. As a smaller model, it runs extremely fast on local machines without requiring heavy GPU resources, while still being highly competent at following strict JSON output instructions and reasoning about the context provided in the prompt.

## Architecture Overview

The application is built using **Next.js (App Router)** and **Tailwind CSS**.
- **Frontend**: A single-page React UI (`src/app/page.tsx`) where the intern pastes the transcript. It handles the loading states and visually parses the resulting JSON.
- **Backend**: A Next.js API route (`src/app/api/analyze/route.ts`) that securely reads the local context files (`rubric.json`, `context.md`), constructs a system prompt, and makes an HTTP POST request to the local Ollama instance (`http://localhost:11434/api/generate`). 
- The backend parses Ollama's response and returns clean JSON to the frontend for rendering.

## Design Challenges Tackled

### Challenge 1: One Prompt or Many?
I opted for a **Single Comprehensive Prompt**. While multiple prompts might theoretically isolate tasks, passing the transcript sequentially for 5 different tasks is too slow for a local LLM, potentially defeating the goal of reducing a 45-minute process to under 10 minutes. To compensate, I used a Senior Consultant "Persona" and strict structural constraints in the prompt to ensure depth.

### Challenge 2: Structured Output Reliability (Guardrails against AI Hallucination)
To ensure the LLM returns consistent structured JSON and to minimize hallucinations, I implemented several guardrails in the backend:
1. **Low Temperature:** Set the generation temperature to `0.1` to make the output more deterministic and factual.
2. **Retry Mechanism:** If the AI hallucinates the format or skips required JSON fields, the backend automatically catches the parsing error and retries the request (up to 2 times), explicitly reminding the model to return STRICT JSON.
3. **Graceful Fallback:** If all retries fail, it falls back to a structural default, alerting the user to an analysis error rather than breaking the application.

### Challenge 4: Showing Uncertainty
I designed the UI to explicitly frame the output as a **"Draft AI Analysis"**. I added a prominent status tag instructing the user that this is for review. The "Interpretation" fields for each piece of evidence provide the "why" behind the AI's logic, helping the intern spot hallucinations or misinterpretations.

### Challenge 5: Gap Detection
The prompt includes a dedicated section for "Gap Analysis" that forces the LLM to verify the absence of the 4 core dimensions (Driving Execution, Systems Building, KPI Impact, Change Management). This "reasoning about absence" is reinforced by the follow-up questions section.

## Future Improvements

1. **Side-by-Side View & Quote Highlighting**: Add a split-pane layout where the transcript is on the left and the analysis is on the right.
2. **Editable Output Forms**: Render analysis into editable form fields so the intern can modify the draft before finalizing.
3. **Advanced Schema Validation**: Use a library like `Zod` in the backend for deeper structural validation of every field in the LLM output.
