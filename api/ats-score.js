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

  const prompt = `Analyze the resume against the job description below.
Return ONLY valid JSON — no markdown, no explanation, no code blocks.
Format: {"score": <integer 0-100>, "missing": ["keyword1", ...], "present": ["keyword2", ...]}

The "missing" array should contain important skills/technologies/qualifications from the job description that are NOT in the resume.
The "present" array should contain important keywords that appear in both.
Limit each array to the 10 most important items.

Resume:
${resume}

Job Description:
${jobDescription}`;

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
          temperature: 0.1,
          max_tokens: 512,
        }),
      },
    );

    if (!groqRes.ok) {
      const err = await groqRes.text();
      console.error(
        "Groq returned non-OK status",
        groqRes.status,
        err.slice ? err.slice(0, 1000) : err,
      );
      return res.status(502).json({ error: `Groq error: ${err}` });
    }

    const data = await groqRes.json();
    const raw = data.choices[0].message.content.trim();

    // Strip markdown code fences if model wraps response
    const jsonStr = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    const parsed = JSON.parse(jsonStr);

    return res.status(200).json(parsed);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
