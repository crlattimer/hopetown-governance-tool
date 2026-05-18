import { useState } from 'react';

export default function PasswordGate({ onAuthed }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        onAuthed();
      } else {
        setError('Incorrect password. Please try again.');
      }
    } catch {
      setError('Unable to verify password. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="gate-wrap">
      <div className="gate-card">
        <div className="brand-mark gate-mark">HT</div>
        <h1>AI Governance Policy Builder</h1>
        <p className="gate-sub">
          A Hope Town tool for nonprofits, government, and mission-driven organizations to
          build their first AI governance policy.
        </p>
        <form onSubmit={submit} className="gate-form">
          <label htmlFor="pw">Access password</label>
          <input
            id="pw"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            autoComplete="current-password"
            disabled={submitting}
          />
          {error && <div className="gate-error">{error}</div>}
          <button type="submit" className="btn-primary" disabled={submitting || !password}>
            {submitting ? 'Checking…' : 'Continue'}
          </button>
        </form>
        <div className="gate-footer">
          Generated at the Ohio AI Leadership Summit · Hope Town · hopetown.org
        </div>
      </div>
    </div>
  );
}
