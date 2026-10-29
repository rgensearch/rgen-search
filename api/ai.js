export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({
      error: "Use POST for AI requests."
    });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || "gemini-3.1-flash-lite";

  if (!apiKey) {
    return res.status(503).json({
      error: "Gemini is not configured yet. Research search remains available."
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
    explain: "Explain the topic step by step with clear headings, examples, key terms, and a detailed but easy-to-understand explanation.",
    notes: "Create detailed study notes with headings, definitions, important points, examples, and a short revision section.",
    flashcards: "Create 8 numbered study flashcards. Give a clear Question and Answer for each card.",
    quiz: "Create 8 educational multiple-choice questions with four options each. Give the correct answer and a short explanation in an answer key at the end."
  };

  const prompt = instructions[task] || instructions.explain;

  try {
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1/interactions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey
        },
        body: JSON.stringify({
          model,
          input: `You are RGen Search, a careful educational research assistant.
Explain in clear, simple language suited to the requested study level.
Use headings, examples, and enough detail to teach the topic properly.
Never invent research citations or claim you verified sources unless source data was provided.
State uncertainty honestly.

Study level: ${level}
Task: ${prompt}
Topic: ${topic}`,
          store: false
        })
      }
    );

    if (!response.ok) {
      console.error("Gemini API status:", response.status);
      return res.status(502).json({
        error: "Gemini could not complete the request. Check the API key, model access, and free-tier limits."
      });
    }

    const data = await response.json();

    const answer =
      data.output_text ||
      (Array.isArray(data.outputs)
        ? data.outputs
            .flatMap(item => item.content || [])
            .filter(item => item.type === "text")
            .map(item => item.text || "")
            .join("\n")
        : "");

    if (typeof answer !== "string" || !answer.trim()) {
      return res.status(502).json({
        error: "Gemini returned an empty answer."
      });
    }

    return res.status(200).json({
      answer: answer.slice(0, 20000),
      model
    });
  } catch (error) {
    console.error("Gemini request failed:", error.message);
    return res.status(502).json({
      error: "Unable to connect to Gemini. Please try again later."
    });
  }
}
