import { ChatGroq } from "@langchain/groq";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { BodhState } from "../state";

const llm = new ChatGroq({
  model: "llama-3.3-70b-versatile", 
  temperature: 0,
});

export const architectNode = async (state: BodhState) => {
  const prompt = `You are an expert curriculum architect. 
Identify key concepts and create a structured learning outline for the following topic: 

Topic: ${state.input}

Return the structure directly in bullet points or a short outline.`;

  const response = await llm.invoke([
    new SystemMessage("You are a helpful AI architect."),
    new HumanMessage(prompt),
  ]);

  return { architectOutline: response.content as string };
};
