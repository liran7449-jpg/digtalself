/**
 * AI 配置检查。
 *
 * DeepSeek 走 Anthropic 兼容接口，所以变量名还是 ANTHROPIC_ 开头。
 */

export interface AiConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
  /** 从 baseUrl 推断的服务商，用于隐私说明 */
  provider: string;
}

export function getAiConfig(): AiConfig | null {
  const baseUrl = process.env.ANTHROPIC_BASE_URL;
  const apiKey = process.env.ANTHROPIC_AUTH_TOKEN;
  const model = process.env.ANTHROPIC_MODEL;

  if (!baseUrl || !apiKey || !model) {
    return null;
  }

  // 从 URL 推断服务商
  let provider = "AI 服务";
  try {
    const host = new URL(baseUrl).hostname.toLowerCase();
    if (host.includes("deepseek")) provider = "DeepSeek";
    else if (host.includes("anthropic")) provider = "Anthropic";
    else if (host.includes("openai")) provider = "OpenAI";
  } catch {}

  return { baseUrl, apiKey, model, provider };
}
