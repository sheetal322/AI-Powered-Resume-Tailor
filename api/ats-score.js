export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { resume, jobDescription } = req.body;
  if (!resume || !jobDescription) {
    return res
      .status(400)
      .json({ error: "resume and jobDescription are required" });
  }

  const prompt = `Analyze resume vs job description. Return ONLY JSON: {"score": <0-100>, "missing": [...], "present": [...]}
- "missing": 5-8 key skills from job description NOT in resume
- "present": 5-8 key skills appearing in both
Resume: ${resume}
Job: ${jobDescription}`;

  try {
    const groqRes = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-20b",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.3,
          max_tokens: 1500,
        }),
      },
    );

    if (!groqRes.ok) {
      const err = await groqRes.text();
      console.error("Groq error:", err.slice(0, 1000));

      if (groqRes.status === 429) {
        return res.status(429).json({
          error: "Rate limit exceeded. Please try again in a few seconds.",
          suggestion: "Consider upgrading your Groq plan for higher limits",
        });
      }
      return res
        .status(502)
        .json({ error: `Groq API error: ${err.slice(0, 200)}` });
    }

    const data = await groqRes.json();
    if (!data.choices?.[0]?.message?.content) {
      console.error("Empty response from model", data);
      return res.status(502).json({
        error:
          "Model returned empty response. Increase token limit or simplify input.",
        finish_reason: data.choices?.[0]?.finish_reason,
      });
    }

    const raw = data.choices[0].message.content.trim();

    // Strip markdown code fences if model wraps response
    const jsonStr = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");

    let parsed;
    try {
      parsed = JSON.parse(jsonStr);
    } catch (parseErr) {
      console.error("JSON parse error:", parseErr.message);
      return res.status(502).json({
        error: "Invalid JSON response from model: " + parseErr.message,
        sample: jsonStr.slice(0, 200),
      });
    }

    return res.status(200).json(parsed);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
