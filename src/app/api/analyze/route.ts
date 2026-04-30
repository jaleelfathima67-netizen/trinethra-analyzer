import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

// Function to read the context files
async function getContextData() {
  try {
    const dataDir = path.join(process.cwd(), "src", "data");
    const rubricPath = path.join(dataDir, "rubric.json");
    const contextPath = path.join(dataDir, "context.md");

    const rubric = await fs.readFile(rubricPath, "utf-8");
    const context = await fs.readFile(contextPath, "utf-8");

    return { rubric, context };
  } catch (error) {
    console.error("Error reading context files:", error);
    // Return empty strings if files are not found, so it doesn't crash completely
    return { rubric: "", context: "" };
  }
}

export async function POST(request: Request) {
  try {
    const { transcript } = await request.json();

    if (!transcript) {
      return NextResponse.json(
        { error: "Transcript is required" },
        { status: 400 }
      );
    }

    const { rubric, context } = await getContextData();

    // Construct the prompt
    const systemPrompt = `You are a Senior Psychology Consultant at DeepThought evaluating a client supervisor's transcript about a Fellow.
Your goal is to produce a deep, diagnostic analysis that distinguishes between mere task execution and actual systems building.

### DOMAIN KNOWLEDGE
${context}

### SCORING RUBRIC
${rubric}

### MANDATORY ANALYSIS RULES
1. **Layer 1 vs Layer 2**: Distinguish between "Execution" (visible work/tasks) and "Systems Building" (creating SOPs, trackers, lasting value).
2. **The Survivability Test**: If the Fellow left tomorrow, would the system they built continue running? If no, it is Layer 1.
3. **The 6 vs 7 Boundary**: 
   - Score 6: Initiative WITHIN assigned scope (Reliable).
   - Score 7: Initiative OUTSIDE assigned scope / Identifying problems the supervisor didn't ask about.
4. **Bias Detection**: Look for and flag:
   - Helpfulness Bias (Fellow absorbing supervisor's tasks).
   - Presence Bias (Valuing "on the floor" time over "building trackers").
   - Dependency: Is the supervisor becoming over-reliant on the Fellow?

### TRANSCRIPT TO ANALYZE
"${transcript}"

### OUTPUT FORMAT
Output the result STRICTLY as a JSON object with this schema:
{
  "evidence": [
    {
      "quote": "exact quote",
      "type": "positive" | "negative" | "neutral",
      "dimension": "execution" | "systems_building" | "kpi_impact" | "change_management",
      "interpretation": "why this quote matters (mention biases if relevant)"
    }
  ],
  "rubricScore": number (1-10),
  "label": "Rubric Label (e.g. Reliable and Productive)",
  "justification": "One paragraph explaining the score, citing specific evidence and applying the 6 vs 7 boundary logic.",
  "kpiMapping": ["KPI Name 1", "KPI Name 2"],
  "gapAnalysis": ["What was NOT mentioned in the transcript? Check: Driving Execution, Systems Building, KPI Impact, Change Management"],
  "suggestedQuestions": ["3-5 follow-up questions targeting the specific gaps identified."]
}

Return ONLY the JSON. No markdown, no commentary.`;

    const MAX_RETRIES = 2;
    let lastError = null;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 600000); // 10 minute timeout

        const promptWithInstruction = attempt === 0 
          ? systemPrompt 
          : `${systemPrompt}\n\nIMPORTANT: Your previous response was not valid JSON. Please ensure your response is STRICTLY valid JSON with no markdown formatting.`;

        const ollamaResponse = await fetch("http://localhost:11434/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "phi3:latest",
            prompt: promptWithInstruction,
            stream: false,
            format: "json",
            options: {
              temperature: 0.1, // Guardrail: Lower temperature for less hallucination
              top_p: 0.9
            }
          }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (!ollamaResponse.ok) {
          throw new Error(`Ollama API error: ${ollamaResponse.statusText}`);
        }

        const data = await ollamaResponse.json();
        let resultJSON = data.response;

        // Robust JSON extraction
        const jsonMatch = resultJSON.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          resultJSON = jsonMatch[0];
        }

        const parsedResult = JSON.parse(resultJSON);

        // Guardrail: Structural validation
        if (typeof parsedResult.rubricScore !== "number" || !Array.isArray(parsedResult.evidence)) {
          throw new Error("Missing required fields in JSON");
        }

        return NextResponse.json(parsedResult);
      } catch (error: any) {
        console.error(`Attempt ${attempt + 1} failed:`, error.message);
        lastError = error;
      }
    }

    // Fallback logic if all retries fail
    console.error("All JSON parsing attempts failed. Using fallback.");
    return NextResponse.json({
      evidence: [],
      rubricScore: 0,
      label: "Analysis Error",
      justification: "The AI failed to produce a correctly structured response after multiple attempts. The analysis could not be completed.",
      kpiMapping: [],
      gapAnalysis: ["System could not parse AI output."],
      suggestedQuestions: []
    });

  } catch (error: any) {
    console.error("Error in analyze route:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process transcript" },
      { status: 500 }
    );
  }
}
