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
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.4,
        max_tokens: 2048,
      }),
    });
    if (!r.ok) {
      const err = await r.text();
      throw new Error(`Groq error: ${err}`);
    }
    const d = await r.json();
    return d.choices[0].message.content.trim();
  };

  try {
    const tailorPrompt = `You are an expert resume writer and career coach.
Rewrite the resume below to better target the provided job description.
Rules:
- Keep ALL factual information accurate (company names, dates, degrees, titles)
- Add relevant keywords from the job description naturally where appropriate
- Strengthen action verbs and quantify achievements where possible
- Maintain the same overall structure and sections
- Return ONLY the rewritten resume text — no explanations, no commentary, no markdown headers

Resume:
${resume}

Job Description:
${jobDescription}`;

    const coverPrompt = `Write a professional, concise cover letter for this job application.
Structure:
- Paragraph 1 (2-3 sentences): Hook + specific role + how you found it
- Paragraph 2 (3-4 sentences): Your strongest 2-3 qualifications with concrete examples from the resume
- Paragraph 3 (2 sentences): Enthusiasm for the company + CTA

Use the candidate's resume for facts. Do not invent details.
Return only the cover letter text — no subject line, no date, no address headers.

Resume:
${resume}

Job Description:
${jobDescription}`;

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
