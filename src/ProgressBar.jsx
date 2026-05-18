export default function ProgressBar({ step, total, titles }) {
  const pct = ((step + 1) / total) * 100;
  return (
    <div className="progress">
      <div className="progress-meta">
        <span>
          Step {step + 1} of {total}
        </span>
        <span className="progress-title">{titles[step]}</span>
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <ol className="progress-steps">
        {titles.map((t, i) => (
          <li
            key={t}
            className={
              i < step ? 'done' : i === step ? 'current' : 'upcoming'
            }
          >
            <span className="dot" />
            <span className="label">{t}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
