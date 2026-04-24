import { StateGraph, START, END } from "@langchain/langgraph";
import { GraphState } from "./state";
import { architectNode } from "./nodes/architect";
import { contentNode } from "./nodes/content";

const workflow = new StateGraph(GraphState)
  .addNode("architect", architectNode)
  .addNode("content", contentNode)
  .addEdge(START, "architect")
  .addEdge("architect", "content")
  .addEdge("content", END);

export const graph = workflow.compile();
