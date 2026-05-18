import { useState } from 'react';
import { sections } from './questions.js';

function formatAnswer(q, val) {
  if (q.type === 'multi') {
    if (!Array.isArray(val) || val.length === 0) return '—';
    return val.join(', ');
  }
  if (!val || String(val).trim() === '') return '—';
  return String(val);
}

function safeFilename(name) {
  const cleaned = (name || 'Organization').trim().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
  return `${cleaned || 'Organization'}-AI-Governance-Policy.docx`;
}

export default function Review({ answers, onEdit, onDone, onStartOver }) {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  async function generate() {
    setError('');
    setGenerating(true);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      });
      if (!res.ok) {
        let msg = 'Something went wrong generating your policy. Please try again.';
        try {
          const data = await res.json();
          if (data && data.error) msg = data.error;
        } catch {
          /* ignore */
        }
        throw new Error(msg);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = safeFilename(answers.org_name);
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      onDone();
    } catch (e) {
      setError(e.message || 'Unable to generate policy. Please try again.');
    } finally {
      setGenerating(false);
    }
  }

  return (
    <section className="review-wrap">
      <div className="card">
        <h2>Review your answers</h2>
        <p className="muted">
          Look over your responses before generating your policy. You can edit any section.
        </p>

        {sections.map((section, idx) => (
          <div key={section.title} className="review-section">
            <div className="review-section-head">
              <h3>{section.title}</h3>
              <button className="btn-link" onClick={() => onEdit(idx)} disabled={generating}>
                Edit
              </button>
            </div>
            <dl className="review-list">
              {section.questions.map((q) => (
                <div key={q.id} className="review-row">
                  <dt>
                    <span className="q-num">{q.number}.</span> {q.label}
                  </dt>
                  <dd>{formatAnswer(q, answers[q.id])}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}

        {error && <div className="alert error">{error}</div>}

        {generating && (
          <div className="loading">
            <div className="spinner" />
            <div>Building your governance plan… this takes about 20 seconds</div>
          </div>
        )}

        <div className="actions">
          <button className="btn-secondary" onClick={onStartOver} disabled={generating}>
            Start over
          </button>
          <button className="btn-primary" onClick={generate} disabled={generating}>
            {generating ? 'Generating…' : 'Generate my policy'}
          </button>
        </div>
      </div>
    </section>
  );
}
