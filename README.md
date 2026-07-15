# Resume Tailor

An AI-powered resume tailoring tool that analyzes your resume against a job description, rewrites it to better match the role, scores your ATS compatibility, and generates a cover letter — all for free.

## Features

- **ATS Score** — analyzes keyword match between your resume and the job description
- **Tailored Resume** — rewrites your resume to align with the role while keeping all facts accurate
- **Side-by-side Diff** — highlights exactly what changed between original and tailored versions
- **Cover Letter** — generates a professional, concise cover letter based on your resume and the job
- **PDF Download** — exports the tailored resume as a clean, professionally formatted PDF

## Tech Stack

- **Frontend** — React 19, Vite, Tailwind CSS
- **AI** — Groq API (GPT-OSS-20B)
- **Deployment** — Vercel (serverless API routes)

## Getting Started

### Prerequisites

- Node.js 18+
- A [Groq API key](https://console.groq.com)

### Installation

```bash
git clone https://github.com/your-username/resume-tailor.git
cd resume-tailor
npm install
```

### Environment Variables

Create a `.env` file in the root:

```env
GROQ_API_KEY=your_groq_api_key_here
```

### Run Locally

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

## Deployment

Deploy to Vercel with one command:

```bash
npm run deploy
```

Add `GROQ_API_KEY` to your Vercel project's environment variables before deploying.

## How It Works

1. Paste your resume and the job description
2. Click **Analyze & Tailor Resume**
3. Review the ATS score, diff view, and tailored resume
4. Download the tailored resume as a PDF or copy the cover letter
