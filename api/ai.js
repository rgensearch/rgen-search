
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({
      error: "Use POST for AI requests."
    });
  }

  const apiKey = process.env.AI_API_KEY;
  const baseUrl = process.env.AI_BASE_URL;
  const model = process.env.AI_MODEL;

  if (!apiKey || !baseUrl || !model) {
    return res.status(503).json({
      error: "AI is not configured yet. Research search remains available."
    });
  }

  const topic = String(req.body?.topic || "").trim().slice(0, 500);
  const level = String(req.body?.level || "beginner").slice(0, 80);
  const task = String(req.body?.task || "explain").slice(0, 40);

  if (topic.length < 2) {
    return res.status(400).json({
      error: "Please enter a topic with at least 2 characters."
    });
  }

  const instructions = {
    explain: "Explain the topic clearly, step by step, with examples and key terms.",
    notes: "Create organized study notes with headings, definitions, and examples.",
    flashcards: "Create 8 study flashcards in numbered Question and Answer format.",
    quiz: "Create 8 educational multiple-choice questions and provide an answer key at the end."
  };

  const prompt = instructions[task] || instructions.explain;

  try {
    const endpoint = baseUrl.replace(/\/+$/, "") + "/chat/completions";

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content: "You are a careful educational research assistant. Explain at the requested level. Do not invent references or claim you verified sources unless source data was provided. Clearly state uncertainty."
          },
          {
            role: "user",
            content: `Study level: ${level}\nTask: ${prompt}\nTopic: ${topic}`
          }
        ],
        temperature: 0.4
      })
    });

    if (!response.ok) {
      console.error("AI provider returned status:", response.status);
      return res.status(502).json({
        error: "The AI service could not complete the request. Please try again later."
      });
    }

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content;

    if (typeof answer !== "string" || !answer.trim()) {
      return res.status(502).json({
        error: "The AI service returned an empty answer."
      });
    }

    return res.status(200).json({
      answer: answer.slice(0, 20000),
      model
    });
  } catch (error) {
    console.error("AI request failed:", error.message);
    return res.status(502).json({
      error: "Unable to connect to the AI service. Please try again later."
    });
  }
}
