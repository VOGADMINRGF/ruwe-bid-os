type ProviderResult = {
  provider: string;
  raw: string;
};

function extractJson(text: string) {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {}

  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start >= 0 && end > start) {
    const sliced = trimmed.slice(start, end + 1);
    return JSON.parse(sliced);
  }
  throw new Error("No JSON found in model response");
}

export async function analyzeWithOpenAI(prompt: string) {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";
  if (!apiKey) throw new Error("OPENAI_API_KEY missing");

  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      input: prompt
    })
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`OpenAI error: ${res.status} ${txt}`);
  }

  const json = await res.json();
  const text =
    json.output_text ||
    json.output?.map((x: any) => x?.content?.map((c: any) => c?.text).join(" ")).join(" ") ||
    "";

  return {
    provider: `openai:${model}`,
    data: extractJson(text)
  };
}

export async function analyzeWithAnthropic(prompt: string) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const model = process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-latest";
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY missing");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model,
      max_tokens: 900,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    })
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Anthropic error: ${res.status} ${txt}`);
  }

  const json = await res.json();
  const text = (json.content || [])
    .map((c: any) => c?.text || "")
    .join("\n");

  return {
    provider: `anthropic:${model}`,
    data: extractJson(text)
  };
}

export async function analyzeWithAvailableProvider(prompt: string) {
  const hasOpenAI = !!process.env.OPENAI_API_KEY;
  const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;

  if (hasOpenAI) {
    try {
      return await analyzeWithOpenAI(prompt);
    } catch (err) {
      if (!hasAnthropic) throw err;
    }
  }

  if (hasAnthropic) {
    return await analyzeWithAnthropic(prompt);
  }

  throw new Error("No AI provider configured");
}
