function extractJson(text: string) {
  const trimmed = (text || "").trim();
  try {
    return JSON.parse(trimmed);
  } catch {}

  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start >= 0 && end > start) {
    return JSON.parse(trimmed.slice(start, end + 1));
  }
  throw new Error("No JSON found in model response");
}

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = 30000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

export async function analyzeWithOpenAI(prompt: string) {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";
  if (!apiKey) throw new Error("OPENAI_API_KEY missing");

  console.log("[AI] OpenAI request start", { model });

  const res = await fetchWithTimeout("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      input: prompt
    })
  }, 30000);

  const txt = await res.text();
  if (!res.ok) {
    throw new Error(`OpenAI error ${res.status}: ${txt}`);
  }

  const json = JSON.parse(txt);
  const text =
    json.output_text ||
    json.output?.map((x: any) => x?.content?.map((c: any) => c?.text).join(" ")).join(" ") ||
    "";

  console.log("[AI] OpenAI request done");

  return {
    provider: `openai:${model}`,
    data: extractJson(text)
  };
}

export async function analyzeWithAnthropic(prompt: string) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const model = process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-latest";
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY missing");

  console.log("[AI] Anthropic request start", { model });

  const res = await fetchWithTimeout("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model,
      max_tokens: 900,
      messages: [{ role: "user", content: prompt }]
    })
  }, 30000);

  const txt = await res.text();
  if (!res.ok) {
    throw new Error(`Anthropic error ${res.status}: ${txt}`);
  }

  const json = JSON.parse(txt);
  const text = (json.content || []).map((c: any) => c?.text || "").join("\n");

  console.log("[AI] Anthropic request done");

  return {
    provider: `anthropic:${model}`,
    data: extractJson(text)
  };
}

export async function analyzeWithAvailableProvider(prompt: string) {
  const hasOpenAI = !!process.env.OPENAI_API_KEY;
  const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;

  console.log("[AI] Providers", {
    openai: hasOpenAI,
    anthropic: hasAnthropic
  });

  if (hasOpenAI) {
    try {
      return await analyzeWithOpenAI(prompt);
    } catch (err: any) {
      console.error("[AI] OpenAI failed:", err?.message || err);
      if (!hasAnthropic) throw err;
    }
  }

  if (hasAnthropic) {
    return await analyzeWithAnthropic(prompt);
  }

  throw new Error("No AI provider configured");
}
