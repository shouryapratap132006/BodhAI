import { Annotation } from "@langchain/langgraph";

export const GraphState = Annotation.Root({
  input: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => "",
  }),
  mode: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => "balanced",
  }),
  architectOutline: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => "",
  }),
  explanation: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => "",
  }),
  steps: Annotation<string[]>({
    reducer: (x, y) => y ?? x,
    default: () => [],
  }),
  question: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => "",
  }),
});

export type BodhState = typeof GraphState.State;
