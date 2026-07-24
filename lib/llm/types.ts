export type LlmMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type LlmAdapter = {
  provider: string;
  model: string;
  completeJson(messages: LlmMessage[]): Promise<unknown>;
};
