import { useEffect, useRef, useState } from 'react';
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

// Wait between retries when the server returns 429 (rate limited).
// User-spec: try again after 5s, then 15s, then 30s before giving up.
const RETRY_DELAYS_MS = [5000, 15000, 30000];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function Review({ answers, onEdit, onStartOver }) {
  // 'review' (default) | 'generating' | 'rate-limit-wait' | 'ready' | 'error'
  const [phase, setPhase] = useState('review');
  const [error, setError] = useState('');
  const [elapsedSec, setElapsedSec] = useState(0);
  const [downloadName, setDownloadName] = useState('');
  const [downloadUrl, setDownloadUrl] = useState('');
  const elapsedTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current);
      // Don't revoke the object URL while the user may still tap Download.
    };
  }, []);

  function startElapsedTimer() {
    setElapsedSec(0);
    if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current);
    const start = Date.now();
    elapsedTimerRef.current = setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - start) / 1000));
    }, 1000);
  }

  function stopElapsedTimer() {
    if (elapsedTimerRef.current) {
      clearInterval(elapsedTimerRef.current);
      elapsedTimerRef.current = null;
    }
  }

  async function generate() {
    setError('');
    setPhase('generating');
    startElapsedTimer();

    try {
      let res;
      let attempt = 0;

      while (true) {
        try {
          res = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ answers }),
          });
        } catch {
          throw new Error(
            "We couldn't reach the server. Please check your connection and try again.",
          );
        }

        if (res.status === 429 && attempt < RETRY_DELAYS_MS.length) {
          setPhase('rate-limit-wait');
          stopElapsedTimer();
          await sleep(RETRY_DELAYS_MS[attempt]);
          attempt += 1;
          setPhase('generating');
          startElapsedTimer();
          continue;
        }

        break;
      }

      if (!res.ok) {
        let msg =
          res.status === 429
            ? "We're still seeing heavy traffic. Please try again in a few minutes."
            : 'Something went wrong generating your policy. Please try again.';
        try {
          const data = await res.json();
          if (data && data.error) msg = data.error;
        } catch {
          /* keep default message */
        }
        throw new Error(msg);
      }

      const blob = await res.blob();
      const filename = safeFilename(answers.org_name);
      const url = URL.createObjectURL(blob);

      stopElapsedTimer();
      setDownloadName(filename);
      setDownloadUrl(url);
      setPhase('ready');
    } catch (e) {
      stopElapsedTimer();
      setError(e.message || 'Unable to generate policy. Please try again.');
      setPhase('error');
    }
  }

  function loadingMessage() {
    if (elapsedSec >= 45) {
      return 'Still working on your plan — almost there...';
    }
    return "Generating your custom governance plan... This usually takes 15-30 seconds. Please don't close this window.";
  }

  if (phase === 'ready') {
    return (
      <section className="review-wrap">
        <div className="card success">
          <h2>Your plan is ready</h2>
          <p>
            Tap the button below to download your AI governance policy as a Word document.
          </p>
          <div className="actions actions-stack">
            <a
              className="btn-primary btn-block"
              href={downloadUrl}
              download={downloadName}
            >
              Download Your Governance Plan
            </a>
          </div>
          <p className="ios-hint">
            If the file opens in your browser instead of downloading, tap the share icon
            and choose &ldquo;Save to Files.&rdquo;
          </p>
          <p className="muted">
            Review your plan carefully with your team and legal counsel before formal
            adoption.
          </p>
          <div className="actions actions-stack">
            <button className="btn-secondary btn-block" onClick={onStartOver}>
              Start a new policy
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (phase === 'generating' || phase === 'rate-limit-wait') {
    return (
      <section className="review-wrap">
        <div className="card loading-card" role="status" aria-live="polite">
          <div className="spinner-large" aria-hidden="true" />
          <p className="loading-text">
            {phase === 'rate-limit-wait'
              ? "We're getting a lot of traffic right now. Your plan will be ready in about a minute — please wait."
              : loadingMessage()}
          </p>
        </div>
      </section>
    );
  }

  if (phase === 'error') {
    return (
      <section className="review-wrap">
        <div className="card">
          <h2>Something went wrong</h2>
          <div className="alert error">
            {error || "We couldn't generate your policy."}
          </div>
          <div className="actions">
            <button
              className="btn-secondary"
              onClick={() => {
                setError('');
                setPhase('review');
              }}
            >
              Back to review
            </button>
            <button className="btn-primary" onClick={generate}>
              Try Again
            </button>
          </div>
        </div>
      </section>
    );
  }

  // phase === 'review'
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
              <button className="btn-link" onClick={() => onEdit(idx)}>
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

        <div className="actions">
          <button className="btn-secondary" onClick={onStartOver}>
            Start over
          </button>
          <button className="btn-primary" onClick={generate}>
            Generate my policy
          </button>
        </div>
      </div>
    </section>
  );
}
