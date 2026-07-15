export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { resume, jobDescription } = req.body;
  if (!resume || !jobDescription) {
    return res.status(400).json({ error: 'resume and jobDescription are required' });
  }

  const groqHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
  };

  const call = async (prompt) => {
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: groqHeaders,
      body: JSON.stringify({
        model: 'openai/gpt-oss-20b',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.5,
        max_tokens: 1200,
      }),
    });
    if (!r.ok) {
      const err = await r.text();
      if (r.status === 429) {
        throw new Error('Rate limit exceeded. Please try again in a few seconds.');
      }
      throw new Error(`Groq error: ${err.slice(0, 200)}`);
    }
    const d = await r.json();
    return d.choices[0].message.content.trim();
  };

  try {
    const tailorPrompt = `Rewrite this resume to match the job description. Keep facts accurate, add relevant keywords, use strong verbs. Output only the rewritten resume, no headers.
Resume: ${resume}
Job: ${jobDescription}`;

    const coverPrompt = `Write a 3-paragraph cover letter for this job. P1: Hook + role. P2: 2-3 qualifications with examples from resume. P3: Enthusiasm + CTA. Output only the letter, no headers.
Resume: ${resume}
Job: ${jobDescription}`;

    // Run both in parallel
    const [tailoredResume, coverLetter] = await Promise.all([
      call(tailorPrompt),
      call(coverPrompt),
    ]);

    return res.status(200).json({ tailoredResume, coverLetter });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
