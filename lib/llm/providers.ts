import type { LlmAdapter, LlmMessage } from "@/lib/llm/types";

const providerDefaults: Record<string, { baseUrl: string; model: string }> = {
  deepseek: { baseUrl: "https://api.deepseek.com", model: "deepseek-chat" },
  openai: { baseUrl: "https://api.openai.com/v1", model: "gpt-4o-mini" },
  qwen: { baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1", model: "qwen-plus" },
  glm: { baseUrl: "https://open.bigmodel.cn/api/paas/v4", model: "glm-4-flash" },
  kimi: { baseUrl: "https://api.moonshot.cn/v1", model: "moonshot-v1-8k" }
};

export function createLlmAdapter(): LlmAdapter | null {
  const provider = (process.env.LLM_PROVIDER || "deepseek").toLowerCase();
  const defaults = providerDefaults[provider] || providerDefaults.deepseek;
  const apiKey = process.env.LLM_API_KEY;

  if (!apiKey) return null;

  const baseUrl = (process.env.LLM_BASE_URL || defaults.baseUrl).replace(/\/$/, "");
  const model = process.env.LLM_MODEL || defaults.model;

  return {
    provider,
    model,
    async completeJson(messages: LlmMessage[]) {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model,
          temperature: 0.2,
          response_format: { type: "json_object" },
          messages
        })
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`LLM API 请求失败：${provider} 返回 ${response.status}。请检查 LLM_API_KEY、LLM_BASE_URL、LLM_MODEL 是否属于同一服务商。${text.slice(0, 180)}`);
      }

      const payload = await response.json();
      const content = payload?.choices?.[0]?.message?.content || "{}";
      try {
        return JSON.parse(content);
      } catch {
        throw new Error("LLM 返回内容不是有效 JSON，请检查模型是否支持 JSON 输出，或调整 Prompt。");
      }
    }
  };
}
