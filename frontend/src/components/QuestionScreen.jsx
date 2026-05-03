import { useState, useEffect, useRef } from 'react';
import { questions, likertScale } from '../data/questions';
import ProgressBar from './ProgressBar';

export default function QuestionScreen({ onComplete }) {
  const [index,    setIndex]    = useState(0);
  const [answers,  setAnswers]  = useState({});
  const [selected, setSelected] = useState(null);
  const [leaving,  setLeaving]  = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 dakika = 300 saniye
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          onComplete(answers); // Süre bittiğinde otomatik gönder
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [answers, onComplete]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const current  = questions[index];
  const isLast   = index + 1 === questions.length;
  const progress = (index / questions.length) * 100;

  const advance = (newAnswers) => {
    setLeaving(true);
    setTimeout(() => {
      if (isLast) {
        onComplete(newAnswers);
      } else {
        setAnswers(newAnswers);
        setIndex(i => i + 1);
        setSelected(null);
        setLeaving(false);
      }
    }, 220);
  };

  const handleNext = () => {
    if (selected === null || leaving) return;
    advance({ ...answers, [current.id]: selected });
  };

  const handleBack = () => {
    if (index === 0) return;
    const prevId    = questions[index - 1].id;
    const prevValue = answers[prevId] ?? null;
    setIndex(i => i - 1);
    setSelected(prevValue);
  };

  return (
    <div className="page-center">
      <div className="card question-card">
        <div className="q-header">
          <ProgressBar progress={progress} />
          <div className="q-meta">
            <span className={`q-timer ${timeLeft < 60 ? 'timer-low' : ''}`}>
              ⏱️ {formatTime(timeLeft)}
            </span>
            <span className="q-counter">{index + 1} / {questions.length}</span>
          </div>
        </div>

        <div className={`q-body ${leaving ? 'slide-out' : 'slide-in'}`}>
          <div className="q-number">Soru {index + 1}</div>
          <h2 className="q-text">{current.text}</h2>

          <div className="likert-grid">
            {likertScale.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                className={`likert-btn${selected === value ? ' selected' : ''}`}
                onClick={() => setSelected(value)}
                onDoubleClick={() => {
                  setSelected(value);
                  advance({ ...answers, [current.id]: value });
                }}
              >
                <span className="likert-num">{value}</span>
                <span className="likert-lbl">{label}</span>
              </button>
            ))}
          </div>
          <p className="click-note">💡 Hızlı ilerlemek için seçeneklere çift tıklayabilirsiniz.</p>
        </div>

        <div className="q-actions" style={{ marginTop: '6rem' }}>
          {index > 0 && (
            <button type="button" className="btn btn-ghost" onClick={handleBack}>
              ← Geri
            </button>
          )}
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleNext}
            disabled={selected === null}
          >
            {isLast ? 'Tamamla ✓' : 'İleri →'}
          </button>
        </div>
      </div>
    </div>
  );
}
