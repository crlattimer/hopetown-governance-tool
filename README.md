# Hope Town · AI Governance Policy Builder

A single-repo web app that asks an organization 25 questions about their AI use and generates a tailored AI governance policy as a downloadable Word document.

Built for the Ohio AI Leadership Summit by Hope Town.

## How it works

1. Visitor enters a shared access password on the landing page.
2. A 5-step form (25 questions) collects organization details, current AI use, intended use, risk/compliance context, and policy intent.
3. A review screen summarizes the answers.
4. Clicking **Generate** posts the answers to `/api/generate`, which calls the Anthropic API, parses the JSON response, builds a `.docx` with the `docx` npm package, and streams it back as a download.

## Stack

- **Frontend:** React (Vite), plain CSS, no UI library
- **Backend:** Vercel serverless functions in `/api`
- **AI:** `@anthropic-ai/sdk`, model `claude-sonnet-4-20250514`
- **Docx:** `docx` npm package

## Project structure

```
.
├── api/
│   ├── auth.js          # Validates the shared access password
│   └── generate.js      # Calls Anthropic, builds the .docx
├── src/
│   ├── App.jsx          # Top-level state machine
│   ├── PasswordGate.jsx # Landing-page password screen
│   ├── Form.jsx         # 5-step multi-step form
│   ├── ProgressBar.jsx  # Step indicator
│   ├── Review.jsx       # Summary + Generate button
│   ├── questions.js     # 25-question schema
│   ├── styles.css       # Teal + dark theme
│   └── main.jsx
├── index.html
├── vite.config.js
├── vercel.json
└── package.json
```

## Required environment variables

Set both of these in **Vercel → Settings → Environment Variables**:

| Name                | Purpose                                                       |
| ------------------- | ------------------------------------------------------------- |
| `ANTHROPIC_API_KEY` | Your Anthropic API key. Used by `/api/generate`.              |
| `ACCESS_PASSWORD`   | Shared password that gates the landing page.                  |

Locally, copy `.env.example` to `.env` and fill in the values if you want to test the serverless functions via `vercel dev`.

## Local development

```bash
npm install
npm run dev
```

This runs the Vite dev server. To exercise the `/api` functions locally, use the Vercel CLI:

```bash
npm i -g vercel
vercel dev
```

## Deploy to Vercel

1. Push this repo to GitHub.
2. In Vercel, import the repo as a new project (auto-detected as Vite).
3. Add `ANTHROPIC_API_KEY` and `ACCESS_PASSWORD` under Environment Variables.
4. Deploy.

## WordPress embed

The app is configured to be embedded in an iframe — `vercel.json` sets `Content-Security-Policy: frame-ancestors *` and the app does **not** set `X-Frame-Options`. Drop it into a WordPress page with:

```html
<iframe
  src="https://your-vercel-app.vercel.app/"
  width="100%"
  height="900"
  style="border: 0;"
  allow="clipboard-write"
></iframe>
```

To restrict embedding to your own domain, narrow the `frame-ancestors` directive in `vercel.json`.

## Notes

- The password is checked server-side. A successful check sets a `sessionStorage` flag so the form is not re-prompted within the same browser session.
- The Generate button disables on click and shows a 20-second loading state. On API failure, the button re-enables with a friendly error message.
- The downloaded file is named `<Organization>-AI-Governance-Policy.docx`.
- The document is US Letter, 1-inch margins, Arial, with a footer reading: _Generated at the Ohio AI Leadership Summit · Hope Town · hopetown.org_.
