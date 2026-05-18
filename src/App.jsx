import { useEffect, useState } from 'react';
import PasswordGate from './PasswordGate.jsx';
import Form from './Form.jsx';
import Review from './Review.jsx';
import { emptyAnswers, sections } from './questions.js';

const SESSION_KEY = 'hopetown_gov_authed';

export default function App() {
  const [authed, setAuthed] = useState(false);
  const [phase, setPhase] = useState('form'); // 'form' | 'review' | 'done'
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState(emptyAnswers);

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY) === '1') setAuthed(true);
  }, []);

  function handleAuthed() {
    sessionStorage.setItem(SESSION_KEY, '1');
    setAuthed(true);
  }

  function handleStartOver() {
    setAnswers(emptyAnswers());
    setStep(0);
    setPhase('form');
  }

  if (!authed) return <PasswordGate onAuthed={handleAuthed} />;

  return (
    <div className="app">
      <header className="site-header">
        <div className="brand">
          <span className="brand-mark">HT</span>
          <div>
            <div className="brand-title">AI Governance Policy Builder</div>
            <div className="brand-sub">Hope Town · Ohio AI Leadership Summit</div>
          </div>
        </div>
      </header>

      <main className="container">
        {phase === 'form' && (
          <Form
            step={step}
            setStep={setStep}
            answers={answers}
            setAnswers={setAnswers}
            onComplete={() => setPhase('review')}
          />
        )}
        {phase === 'review' && (
          <Review
            answers={answers}
            onEdit={(idx) => {
              setStep(idx);
              setPhase('form');
            }}
            onDone={() => setPhase('done')}
            onStartOver={handleStartOver}
          />
        )}
        {phase === 'done' && (
          <section className="card success">
            <h2>Your policy is on its way</h2>
            <p>
              Your AI governance policy has been downloaded as a Word document. Review it
              carefully with your team and legal counsel before formal adoption.
            </p>
            <div className="actions">
              <button className="btn-primary" onClick={handleStartOver}>
                Start a new policy
              </button>
            </div>
          </section>
        )}
      </main>

      <footer className="site-footer">
        Generated at the Ohio AI Leadership Summit · Hope Town · hopetown.org
      </footer>
    </div>
  );
}

export { sections };
