import { useState } from 'react';
import Form from './Form.jsx';
import Review from './Review.jsx';
import { emptyAnswers, sections } from './questions.js';

export default function App() {
  const [phase, setPhase] = useState('form'); // 'form' | 'review'
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState(emptyAnswers);

  function handleStartOver() {
    setAnswers(emptyAnswers());
    setStep(0);
    setPhase('form');
  }

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
            onStartOver={handleStartOver}
          />
        )}
      </main>

      <footer className="site-footer">
        Generated at the Ohio AI Leadership Summit · Hope Town · hopetown.org
      </footer>
    </div>
  );
}

export { sections };
