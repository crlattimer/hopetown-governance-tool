import { useMemo, useState } from 'react';
import ProgressBar from './ProgressBar.jsx';
import { sections, validateStep } from './questions.js';

export default function Form({ step, setStep, answers, setAnswers, onComplete }) {
  const [errors, setErrors] = useState([]);
  const section = sections[step];
  const titles = useMemo(() => sections.map((s) => s.title), []);

  function update(id, value) {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  }

  function toggleMulti(id, option) {
    setAnswers((prev) => {
      const current = Array.isArray(prev[id]) ? prev[id] : [];
      const has = current.includes(option);
      const next = has ? current.filter((o) => o !== option) : [...current, option];
      return { ...prev, [id]: next };
    });
  }

  function next() {
    const missing = validateStep(step, answers);
    if (missing.length) {
      setErrors(missing);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setErrors([]);
    if (step < sections.length - 1) {
      setStep(step + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      onComplete();
    }
  }

  function back() {
    setErrors([]);
    if (step > 0) setStep(step - 1);
  }

  return (
    <section className="form-wrap">
      <ProgressBar step={step} total={sections.length} titles={titles} />

      <div className="card">
        <h2 className="section-title">{section.title}</h2>

        {errors.length > 0 && (
          <div className="alert">
            <strong>Please answer the required questions:</strong>
            <ul>
              {errors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          </div>
        )}

        <ol className="questions">
          {section.questions.map((q) => (
            <li key={q.id} className="question">
              <div className="q-label">
                <span className="q-num">{q.number}.</span>
                <span>
                  {q.label}
                  {q.required && <span className="q-required"> *</span>}
                </span>
              </div>

              {q.type === 'text' && (
                <input
                  type="text"
                  value={answers[q.id] || ''}
                  onChange={(e) => update(q.id, e.target.value)}
                  placeholder={q.placeholder || ''}
                />
              )}

              {q.type === 'textarea' && (
                <textarea
                  rows={3}
                  value={answers[q.id] || ''}
                  onChange={(e) => update(q.id, e.target.value)}
                  placeholder={q.placeholder || ''}
                />
              )}

              {q.type === 'single' && (
                <div className="options">
                  {q.options.map((opt) => (
                    <label key={opt} className={`opt ${answers[q.id] === opt ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        name={q.id}
                        value={opt}
                        checked={answers[q.id] === opt}
                        onChange={() => update(q.id, opt)}
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              )}

              {q.type === 'multi' && (
                <div className="options">
                  {q.options.map((opt) => {
                    const checked = Array.isArray(answers[q.id]) && answers[q.id].includes(opt);
                    return (
                      <label key={opt} className={`opt ${checked ? 'selected' : ''}`}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleMulti(q.id, opt)}
                        />
                        <span>{opt}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </li>
          ))}
        </ol>

        <div className="actions">
          <button className="btn-secondary" onClick={back} disabled={step === 0}>
            Back
          </button>
          <button className="btn-primary" onClick={next}>
            {step === sections.length - 1 ? 'Review answers' : 'Continue'}
          </button>
        </div>
      </div>
    </section>
  );
}
