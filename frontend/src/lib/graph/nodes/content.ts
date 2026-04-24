import { ChatGroq } from "@langchain/groq";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { BodhState } from "../state";

const llm = new ChatGroq({
  model: "llama-3.3-70b-versatile",
  temperature: 0.2,
});

export const contentNode = async (state: BodhState) => {
  const prompt = `You are an expert AI tutor. Your task is to generate learning content based on the user's preferred learning style.

### Topic:
${state.input}

### Learning Mode:
${state.mode}

### Outline from Architect:
${state.architectOutline}

### Instructions:
Adapt your explanation based on the mode:
- If mode = "beginner": Explain in very simple terms, use analogies and real-life examples, avoid jargon.
- If mode = "balanced": Mix intuition with moderate technical depth, keep explanation clear but slightly deeper.
- If mode = "advanced": Provide technical depth, include detailed reasoning, assume prior knowledge.

### Output Format:
Return your response STRICTLY as a JSON object with the following schema, and NOTHING else. Do not use Markdown JSON wrappers if possible, just return the raw JSON text.
{
  "explanation": "...",
  "steps": ["...", "..."],
  "question": "..."
}`;

  const response = await llm.invoke([
    new SystemMessage("You are an AI tutor that strictly returns JSON."),
    new HumanMessage(prompt),
  ]);

  try {
      const contentStr = response.content as string;
      // Extract generic JSON block if wrapped
      let jsonStr = contentStr;
      const jsonMatch = contentStr.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (jsonMatch) {
          jsonStr = jsonMatch[1];
      }
      
      const parsed = JSON.parse(jsonStr.trim());
      return {
          explanation: parsed.explanation || "",
          steps: parsed.steps || [],
          question: parsed.question || ""
      };
  } catch (e) {
      console.error("Failed to parse JSON from content agent", response.content);
      return {
          explanation: response.content as string,
          steps: [],
          question: "Failed to parse question from response."
      };
  }
};
